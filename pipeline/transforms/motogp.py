"""MotoGP bronze → silver transform."""

from pipeline.config import SEASON_YEAR
from pipeline.utils import to_iso as _to_iso, to_date as _to_date

# Map Pulselive session type codes to display names
_SESSION_TYPES = {
    "FP": "FP",
    "PR": "Practice",
    "Q": "Q",
    "SPR": "Sprint",
    "RAC": "Race",
    "WUP": "Warm Up",
}


def transform(bronze_events: list) -> list[dict]:
    """Transform Pulselive API events into silver-layer format."""
    year = SEASON_YEAR
    events = []

    # Filter out test events
    race_events = [e for e in (bronze_events or []) if not e.get("test")]

    for idx, event in enumerate(race_events, start=1):
        # Use real session data if available (from _sessions key added by fetcher)
        raw_sessions = event.get("_sessions", [])
        if raw_sessions:
            sessions = _build_sessions(raw_sessions)
        else:
            # Fallback: single Race session from event dates
            race_time = event.get("date_end") or event.get("date_start")
            sessions = []
            if race_time:
                sessions.append({
                    "type": "Race",
                    "startTimeUTC": _to_iso(race_time),
                })

        circuit = event.get("circuit") or {}
        country = event.get("country") or {}

        # Derive dateStart/dateEnd from session times — the Pulselive API's event-level
        # date_start/date_end can be unreliable (e.g., sessions returned for the wrong
        # calendar slot). Session timestamps are always more accurate.
        session_dates = [
            s["startTimeUTC"][:10]
            for s in sessions
            if s.get("startTimeUTC") and not s["startTimeUTC"].startswith("1900-")
        ]
        date_start = min(session_dates) if session_dates else _to_date(event.get("date_start", ""))
        date_end = max(session_dates) if session_dates else _to_date(event.get("date_end", ""))

        events.append({
            "id": f"motogp-{year}-r{idx:02d}",
            "seriesId": "motogp",
            "eventName": event.get("name") or event.get("short_name") or f"Round {idx}",
            "round": idx,
            "circuit": {
                "name": circuit.get("name", ""),
                "city": (circuit.get("place") or "").strip(),
                "country": circuit.get("nation", ""),
                "countryCode": country.get("iso", ""),
                "lat": circuit.get("lat"),
                "lng": circuit.get("lng"),
            },
            "sessions": sessions,
            "dateStart": date_start,
            "dateEnd": date_end,
        })

    return events


def _build_sessions(raw_sessions: list) -> list[dict]:
    """Convert Pulselive session objects to silver session format."""
    sessions = []
    # Count occurrences per type to decide whether to add numbers
    type_counts: dict[str, int] = {}
    for s in raw_sessions:
        stype = s.get("type", "")
        label = _SESSION_TYPES.get(stype, stype)
        type_counts[label] = type_counts.get(label, 0) + 1

    type_counters: dict[str, int] = {}
    for s in raw_sessions:
        stype = s.get("type", "")
        label = _SESSION_TYPES.get(stype, stype)
        date_str = s.get("date", "")

        if not date_str:
            continue

        # Number sessions that appear multiple times (FP1/FP2, Q1/Q2)
        if type_counts.get(label, 0) > 1:
            num = type_counters.get(label, 0) + 1
            type_counters[label] = num
            label = f"{label}{num}"

        sessions.append({
            "type": label,
            "startTimeUTC": _to_iso(date_str),
        })

    return sessions


