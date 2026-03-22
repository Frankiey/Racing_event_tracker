"""Gold layer — merge all silver data into display-ready JSON."""

from datetime import datetime, timezone


def build_calendar(all_events: list[dict]) -> list[dict]:
    """Merge all silver events into a single sorted calendar."""
    return sorted(all_events, key=_sort_key)


def build_upcoming(all_events: list[dict], limit: int = 30) -> list[dict]:
    """Filter to upcoming events only, sorted by next session."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    upcoming = []
    for event in all_events:
        sessions = event.get("sessions", [])
        if not sessions:
            continue

        # Event is upcoming if its last session hasn't passed yet
        last_session_time = max(_normalize_time(s.get("startTimeUTC", "")) for s in sessions)
        if last_session_time >= now:
            upcoming.append(event)

    upcoming.sort(key=_sort_key)
    return upcoming


def _normalize_time(t: str) -> str:
    """Normalize time strings to comparable format YYYY-MM-DDTHH:MM:SSZ."""
    # Handle +00:00 suffix
    t = t.replace("+00:00", "Z")
    # Ensure Z suffix for naive datetimes
    if t and not t.endswith("Z"):
        t += "Z"
    return t


def _sort_key(event: dict) -> str:
    """Sort key: earliest session time, falling back to dateStart."""
    sessions = event.get("sessions", [])
    if sessions:
        return min(_normalize_time(s.get("startTimeUTC", "")) for s in sessions)
    return event.get("dateStart", "9999")
