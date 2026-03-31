"""Gold layer — merge all silver data into display-ready JSON."""

from datetime import datetime, timezone

from pipeline.config import SEASON_YEAR


def build_calendar(all_events: list[dict], sources: list[str] | None = None) -> dict:
    """Merge all silver events into a single sorted calendar with metadata envelope."""
    events = sorted(all_events, key=_sort_key)
    return _envelope(events, sources)


def build_upcoming(all_events: list[dict], limit: int = 30, sources: list[str] | None = None) -> dict:
    """Filter to upcoming events only, sorted by next session, with metadata envelope."""
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
    return _envelope(upcoming[:limit], sources)


def _envelope(events: list[dict], sources: list[str] | None = None) -> dict:
    """Wrap events list in a metadata envelope."""
    return {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "season": SEASON_YEAR,
        "eventCount": len(events),
        "sources": sorted(sources) if sources else [],
        "events": events,
    }


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
