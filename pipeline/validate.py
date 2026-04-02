"""Data quality validation for silver, gold, and seed JSON files."""

import re
import sys
from pathlib import Path

from pipeline.config import SILVER_DIR, GOLD_DIR, SEED_DIR, SERIES_IDS

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
    if not isinstance(sessions, list):
        errors.append(f"ERROR {prefix}: 'sessions' is not a list")
    else:
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
    elif isinstance(data, list):
        events = data
    else:
        return [f"ERROR {name}: expected list or envelope object"]

    for i, event in enumerate(events):
        errors.extend(validate_event(event, name, i))

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
