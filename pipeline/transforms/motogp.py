"""MotoGP bronze → silver transform."""

from datetime import datetime
from pipeline.config import SEASON_YEAR


def transform(bronze_events: list) -> list[dict]:
    """Transform Pulselive API events into silver-layer format."""
    year = SEASON_YEAR
    events = []

    # Filter out test events
    race_events = [e for e in (bronze_events or []) if not e.get("test")]

    for idx, event in enumerate(race_events, start=1):
        sessions = []

        # Use date_end as race day (Sunday), date_start as weekend start (Friday)
        race_time = event.get("date_end") or event.get("date_start")
        if race_time:
            sessions.append({
                "type": "Race",
                "startTimeUTC": _to_iso(race_time),
            })

        circuit = event.get("circuit") or {}
        country = event.get("country") or {}

        events.append({
            "id": f"motogp-{year}-r{idx:02d}",
            "seriesId": "motogp",
            "eventName": event.get("name") or event.get("short_name") or f"Round {idx}",
            "round": idx,
            "circuit": {
                "name": circuit.get("name", ""),
                "city": circuit.get("place", ""),
                "country": circuit.get("nation", ""),
                "countryCode": country.get("iso", ""),
                "lat": circuit.get("lat"),
                "lng": circuit.get("lng"),
            },
            "sessions": sessions,
            "dateStart": _to_date(event.get("date_start", "")),
            "dateEnd": _to_date(event.get("date_end", "")),
        })

    return events


def _to_iso(dt_str: str) -> str:
    """Parse various date formats to ISO 8601 UTC."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except (ValueError, AttributeError):
        return dt_str


def _to_date(dt_str: str) -> str:
    """Extract date portion from a datetime string."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, AttributeError):
        return dt_str
