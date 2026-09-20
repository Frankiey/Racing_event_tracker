"""Data quality validation for silver, gold, and seed JSON files."""

import re
import sys
from datetime import date
from pathlib import Path

from pipeline.config import SILVER_DIR, GOLD_DIR, SEED_DIR, SERIES_IDS
from pipeline.transforms.common import local_date_from_utc

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
PLACEHOLDER_RE = re.compile(r"^1900-")
ALPHA2_RE = re.compile(r"^[A-Z]{2}$")


def validate_event(event: dict, path: str, idx: int) -> list[str]:
    """Validate a single event dict. Returns list of error/warning strings."""
    errors: list[str] = []
    prefix = f"{path}[{idx}]"

    # Required top-level fields
    for field in ("id", "seriesId", "eventName", "dateStart", "dateEnd", "sessions"):
        if field not in event:
            errors.append(f"ERROR {prefix}: missing required field '{field}'")

    # seriesId must be known
    sid = event.get("seriesId")
    if sid and sid not in SERIES_IDS:
        errors.append(f"ERROR {prefix}: unknown seriesId '{sid}'")

    # Date format
    for field in ("dateStart", "dateEnd"):
        val = event.get(field, "")
        if val and not DATE_RE.match(val):
            errors.append(f"ERROR {prefix}: invalid date format '{val}' in {field}")

    # dateStart <= dateEnd
    ds, de = event.get("dateStart", ""), event.get("dateEnd", "")
    if ds and de and ds > de:
        errors.append(f"ERROR {prefix}: dateStart '{ds}' > dateEnd '{de}'")

    # Circuit
    circuit = event.get("circuit")
    if circuit:
        for field in ("name", "country"):
            if not circuit.get(field):
                errors.append(f"ERROR {prefix}: circuit missing '{field}'")
        cc = circuit.get("countryCode", "")
        if not cc:
            errors.append(f"WARN  {prefix}: circuit missing 'countryCode'")
        elif not ALPHA2_RE.match(cc):
            if len(cc) == 3:
                errors.append(f"WARN  {prefix}: countryCode '{cc}' is alpha-3, expected alpha-2")
            else:
                errors.append(f"WARN  {prefix}: countryCode '{cc}' is not alpha-2")

    # Sessions
    sessions = event.get("sessions", [])
    circuit_country_code = (circuit or {}).get("countryCode", "")
    if not isinstance(sessions, list):
        errors.append(f"ERROR {prefix}: 'sessions' is not a list")
    else:
        # Two conventions currently coexist for dateStart/dateEnd: the older
        # raw-UTC-date-of-session convention (still used by seed data and
        # NASCAR) and the newer circuit-local-date convention (used by
        # F1/MotoGP-family/WSBK since the Phillip Island date-range bug —
        # a UTC timestamp's calendar date can differ from the circuit's local
        # calendar date near midnight). Accept either so this stays a real
        # self-consistency check without false-flagging not-yet-migrated data.
        real_session_dates_utc: list[str] = []
        real_session_dates_local: list[str] = []
        for si, sess in enumerate(sessions):
            if not sess.get("type"):
                errors.append(f"ERROR {prefix}.sessions[{si}]: missing 'type'")
            stime = sess.get("startTimeUTC", "")
            if not stime:
                errors.append(f"ERROR {prefix}.sessions[{si}]: missing 'startTimeUTC'")
            elif PLACEHOLDER_RE.match(stime):
                pass  # placeholder times are expected for TBD sessions
            elif not ISO_RE.match(stime):
                errors.append(f"ERROR {prefix}.sessions[{si}]: invalid time format '{stime}'")
            else:
                real_session_dates_utc.append(stime[:10])
                real_session_dates_local.append(local_date_from_utc(stime, circuit_country_code))

        if real_session_dates_utc:
            valid_starts = {min(real_session_dates_utc), min(real_session_dates_local)}
            valid_ends = {max(real_session_dates_utc), max(real_session_dates_local)}
            earliest_session_date = min(real_session_dates_local)
            latest_session_date = max(real_session_dates_local)
            if ds and ds not in valid_starts:
                errors.append(
                    f"ERROR {prefix}: dateStart '{ds}' does not match earliest session date '{earliest_session_date}'"
                )
            if de and de not in valid_ends:
                errors.append(
                    f"ERROR {prefix}: dateEnd '{de}' does not match latest session date '{latest_session_date}'"
                )

    return errors


def validate_series_calendar(events: list, name: str) -> list[str]:
    """Cross-round checks within one series.

    validate_event() only ever sees a single round, so a whole calendar of copied
    session times passes it clean — which is exactly how F2/F3 shipped rounds whose
    start times were a template rather than the published schedule, wrong by up to
    2h45m. These checks look across rounds instead.

    ponytail: seed files only. Hand-maintained data is where this rot happens; the
    API-backed series were verified correct to the minute. Widen to silver if an
    upstream feed ever starts repeating itself.
    """
    errors: list[str] = []

    by_series: dict[str, list[dict]] = {}
    for event in events:
        if isinstance(event, dict) and event.get("seriesId"):
            by_series.setdefault(event["seriesId"], []).append(event)

    for sid, rounds in by_series.items():
        prefix = f"{name}[{sid}]"

        # Round numbers should be unique and contiguous from 1.
        numbers = [e.get("round") for e in rounds if isinstance(e.get("round"), int)]
        duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
        if duplicates:
            errors.append(f"ERROR {prefix}: duplicate round numbers {duplicates}")
        if numbers and sorted(numbers) != list(range(1, len(numbers) + 1)):
            missing = sorted(set(range(1, max(numbers) + 1)) - set(numbers))
            errors.append(
                f"ERROR {prefix}: round numbers are not contiguous 1..{len(numbers)}"
                + (f", missing {missing}" if missing else "")
            )

        # Rounds should run in date order.
        dated = [(e.get("dateStart"), e.get("round")) for e in rounds if e.get("dateStart")]
        if dated != sorted(dated) and sorted(dated, key=lambda d: d[0]) != dated:
            errors.append(f"ERROR {prefix}: rounds are not ordered by dateStart")

        # Identical session patterns across rounds = a copied template. Compare the
        # clock time and the day offset from dateStart, not the absolute date, so the
        # signature survives being pasted onto a different weekend.
        patterns: dict[tuple, list[int]] = {}
        for event in rounds:
            sessions = event.get("sessions")
            ds = event.get("dateStart")
            if not isinstance(sessions, list) or len(sessions) < 2 or not ds:
                continue
            times = [s.get("startTimeUTC", "") for s in sessions]
            if any(not ISO_RE.match(t) or PLACEHOLDER_RE.match(t) for t in times):
                continue
            start = date.fromisoformat(ds)
            signature = tuple(
                (s.get("type"), (date.fromisoformat(t[:10]) - start).days, t[11:16])
                for s, t in zip(sessions, times)
            )
            patterns.setdefault(signature, []).append(event.get("round"))

        for signature, shared in patterns.items():
            if len(shared) < 2:
                continue
            slots = " ".join(f"{typ}+{off}d@{hhmm}" for typ, off, hhmm in signature)
            # WARN, never ERROR. Repeated times were how the F2/F3 template was spotted,
            # but they are not proof of one: F1's European support-race slots really are
            # standardised, so F3 rounds 3/4/7 share a signature with every value
            # independently verified, and moto2 repeats across 15 API-sourced rounds.
            # This is a smell worth printing, not a gate — the actual guarantee comes
            # from checking a round against its published timetable.
            errors.append(
                f"WARN  {prefix}: rounds {sorted(shared)} share identical session times"
                f" ({slots}) — verify against the published timetable; identical slots"
                f" are normal for standardised support-race weekends"
            )

    return errors


def validate_file(filepath: Path) -> list[str]:
    """Validate a single JSON file containing an event array or gold envelope."""
    import json

    errors: list[str] = []
    name = filepath.name

    try:
        data = json.loads(filepath.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"ERROR {name}: invalid JSON — {e}"]

    # Gold files have envelope
    if isinstance(data, dict) and "events" in data:
        events = data["events"]
        if not isinstance(events, list):
            return [f"ERROR {name}: 'events' is not a list"]
        event_count = data.get("eventCount")
        if event_count is not None and event_count != len(events):
            errors.append(
                f"ERROR {name}: eventCount '{event_count}' does not match actual event total '{len(events)}'"
            )
    elif isinstance(data, list):
        events = data
    else:
        return [f"ERROR {name}: expected list or envelope object"]

    for i, event in enumerate(events):
        errors.extend(validate_event(event, name, i))

    if filepath.parent.name == "seed":
        errors.extend(validate_series_calendar(events, name))

    return errors


def run_validation() -> int:
    """Run validation across all data files. Returns exit code (0=ok, 1=errors)."""
    all_errors: list[str] = []

    dirs = [
        ("seed", SEED_DIR),
        ("silver", SILVER_DIR),
        ("gold", GOLD_DIR),
    ]

    for label, dirpath in dirs:
        if not dirpath.exists():
            continue
        # broadcasts.json is a channel config, not an event list — skip it
        files = sorted(f for f in dirpath.glob("*.json") if f.name != "broadcasts.json")
        if not files:
            continue
        print(f"\n  [{label.upper()}] Validating {len(files)} files...")
        for f in files:
            errs = validate_file(f)
            if errs:
                all_errors.extend(errs)
            else:
                print(f"    ✓ {f.name}")

    if all_errors:
        print(f"\n  Found {len(all_errors)} issues:\n")
        for e in all_errors:
            print(f"    {e}")
        # Only fail on actual errors, not warnings
        hard_errors = [e for e in all_errors if e.startswith("ERROR")]
        if hard_errors:
            print(f"\n  ✗ {len(hard_errors)} errors, {len(all_errors) - len(hard_errors)} warnings")
            return 1
        else:
            print(f"\n  ⚠ {len(all_errors)} warnings (no hard errors)")
            return 0
    else:
        print("\n  ✓ All files valid")
        return 0


if __name__ == "__main__":
    sys.exit(run_validation())
