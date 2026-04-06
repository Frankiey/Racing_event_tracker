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


