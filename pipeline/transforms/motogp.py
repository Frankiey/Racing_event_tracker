"""MotoGP bronze → silver transform."""

from pipeline.config import SEASON_YEAR

from .common import build_circuit, build_event, build_mapped_sessions, build_single_session, derive_event_dates

# Map Pulselive session type codes to display names
_SESSION_TYPES = {
    "FP": "FP",
    "PR": "Practice",
    "Q": "Q",
    "SPR": "Sprint",
    "RAC": "Race",
    "WUP": "Warm Up",
}

_CALENDAR_OVERRIDES_2026 = {
    "GRAND PRIX OF QATAR": {
        "date_start": "2026-11-06",
        "date_end": "2026-11-08",
        "sessions": [
            {"type": "FP1", "startTimeUTC": "2026-11-06T15:45:00Z"},
            {"type": "Practice", "startTimeUTC": "2026-11-06T20:00:00Z"},
            {"type": "FP2", "startTimeUTC": "2026-11-07T15:00:00Z"},
            {"type": "Q1", "startTimeUTC": "2026-11-07T15:40:00Z"},
            {"type": "Q2", "startTimeUTC": "2026-11-07T16:05:00Z"},
            {"type": "Sprint", "startTimeUTC": "2026-11-07T20:00:00Z"},
            {"type": "Warm Up", "startTimeUTC": "2026-11-08T15:40:00Z"},
            {"type": "Race", "startTimeUTC": "2026-11-08T20:00:00Z"},
        ],
    },
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
            sessions = build_single_session(race_time)

        circuit = event.get("circuit") or {}
        country = event.get("country") or {}

        date_start, date_end = derive_event_dates(
            sessions,
            event.get("date_start", ""),
            event.get("date_end", ""),
        )

        override = _get_calendar_override(year, event.get("name", ""))
        if override:
            sessions = override["sessions"]
            date_start = override["date_start"]
            date_end = override["date_end"]

        events.append(
            build_event(
                series_id="motogp",
                year=year,
                round_number=idx,
                event_name=event.get("name") or event.get("short_name") or f"Round {idx}",
                circuit=build_circuit(
                    name=circuit.get("name", ""),
                    city=(circuit.get("place") or "").strip(),
                    country=circuit.get("nation", ""),
                    country_code=country.get("iso", ""),
                    lat=circuit.get("lat"),
                    lng=circuit.get("lng"),
                ),
                sessions=sessions,
                date_start=date_start,
                date_end=date_end,
            )
        )

    return events


def _build_sessions(raw_sessions: list) -> list[dict]:
    """Convert Pulselive session objects to silver session format."""
    return build_mapped_sessions(raw_sessions, _SESSION_TYPES, number_repeats=True)


def _get_calendar_override(year: int, event_name: str) -> dict | None:
    if year != 2026:
        return None
    return _CALENDAR_OVERRIDES_2026.get(event_name)


