"""Static date/freshness checks across silver and seed JSON.

Distinct from pipeline/validate.py (schema validation used by `npm run
validate:data`): this targets the kinds of drift that schema validation
can't see — stale dateEnd, placeholder times that should have been filled
in by now, out-of-order sessions, non-sequential rounds. Outputs a JSON
list of issues, consumed by the weekly date-verify workflow (which files
a GitHub issue when non-empty) and by the /verify-dates skill.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import SEED_DIR, SILVER_DIR

PLACEHOLDER_PREFIX = "1900-"


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def check_events(events: list[dict], source: str, today: str | None = None) -> list[dict]:
    """Check one series' event list. Returns a list of issue dicts."""
    today = today or _today()
    issues: list[dict] = []

    def add(event_id, kind, detail):
        issues.append({"file": source, "eventId": event_id, "type": kind, "detail": detail})

    # (round, dateStart) pairs, in file order, for the round-sequencing checks below
    round_dates: list[tuple[int, str]] = []

    for event in events:
        eid = event.get("id", "?")
        ds, de = event.get("dateStart", ""), event.get("dateEnd", "")
        sessions = event.get("sessions") or []
        times = [s.get("startTimeUTC", "") for s in sessions if s.get("startTimeUTC")]

        real_dates = [t[:10] for t in times if not t.startswith(PLACEHOLDER_PREFIX)]
        if real_dates:
            if ds and ds != min(real_dates):
                add(eid, "envelope_mismatch", f"dateStart '{ds}' != earliest session date '{min(real_dates)}'")
            if de and de != max(real_dates):
                add(eid, "envelope_mismatch", f"dateEnd '{de}' != latest session date '{max(real_dates)}'")

        # Silver/seed files hold the whole season, so past rounds legitimately
        # have a past dateEnd — only flag placeholders on rounds still ahead of us.
        if de and de >= today:
            for s in sessions:
                if s.get("startTimeUTC", "").startswith(PLACEHOLDER_PREFIX):
                    add(eid, "placeholder_time", f"session '{s.get('type')}' still placeholder on an upcoming event (dateEnd {de})")

        cc = (event.get("circuit") or {}).get("countryCode", "")
        if cc and len(cc) != 2:
            add(eid, "bad_country_code", f"countryCode '{cc}' is not alpha-2")

        if times != sorted(times):
            add(eid, "sessions_out_of_order", "sessions are not sorted by startTimeUTC")

        rnd = event.get("round")
        if isinstance(rnd, int) and ds:
            round_dates.append((rnd, ds))

    if round_dates:
        rounds = [r for r, _ in round_dates]
        expected = list(range(1, len(rounds) + 1))
        if sorted(rounds) != expected:
            issues.append({
                "file": source,
                "eventId": None,
                "type": "non_sequential_rounds",
                "detail": f"round numbers {sorted(rounds)} are not sequential 1..{len(rounds)}",
            })
        # Rounds should also run chronologically — round N+1 shouldn't start before round N.
        by_round = sorted(round_dates)
        for (r1, d1), (r2, d2) in zip(by_round, by_round[1:]):
            if d2 < d1:
                issues.append({
                    "file": source,
                    "eventId": None,
                    "type": "rounds_out_of_chronological_order",
                    "detail": f"round {r2} starts '{d2}', before round {r1} which starts '{d1}'",
                })

    return issues


def run() -> list[dict]:
    """Check all silver and seed files. Returns a flat list of issue dicts."""
    all_issues: list[dict] = []
    today = _today()
    for dirpath in (SILVER_DIR, SEED_DIR):
        if not dirpath.exists():
            continue
        for f in sorted(dirpath.glob("*.json")):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                all_issues.append({"file": f.name, "eventId": None, "type": "invalid_json", "detail": str(e)})
                continue
            events = data if isinstance(data, list) else data.get("events", [])
            all_issues.extend(check_events(events, f.name, today))
    return all_issues


def main() -> int:
    issues = run()
    print(json.dumps(issues, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
