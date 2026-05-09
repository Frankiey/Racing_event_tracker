"""Moto2 and Moto3 bronze layer — fetch from MotoGP Pulselive API."""

from pipeline.config import BRONZE_DIR, MOTOGP_BASE, SEASON_YEAR
from pipeline.utils import fetch_json, write_json


_CATEGORY_IDS = {
    "moto2": "549640b8-fd9c-4245-acfd-60e4bc38b25c",
    "moto3": "954f7e65-2ef2-4423-b949-4961cc603e45",
}


def _get_season_uuid(year: int) -> str:
    seasons = fetch_json(f"{MOTOGP_BASE}/results/seasons")
    for season in seasons:
        if season.get("year") == year:
            return season["id"]
    raise ValueError(f"MotoGP season {year} not found")


def _fetch_events(season_uuid: str) -> list:
    upcoming = fetch_json(f"{MOTOGP_BASE}/results/events?seasonUuid={season_uuid}&isFinished=false")
    finished = fetch_json(f"{MOTOGP_BASE}/results/events?seasonUuid={season_uuid}&isFinished=true")
    return (finished or []) + (upcoming or [])


def _fetch_sessions(event_id: str, category_uuid: str) -> list:
    try:
        sessions = fetch_json(
            f"{MOTOGP_BASE}/results/sessions"
            f"?eventUuid={event_id}&categoryUuid={category_uuid}"
        )
        return sessions or []
    except Exception:
        return []


def fetch(series_id: str) -> list:
    """Fetch Moto2 or Moto3 calendar and session schedules."""
    if series_id not in _CATEGORY_IDS:
        raise ValueError(f"Unsupported support series '{series_id}'")

    year = SEASON_YEAR
    print(f"[{series_id.upper()}] Fetching {year} season...")

    season_uuid = _get_season_uuid(year)
    all_events = _fetch_events(season_uuid)

    race_events = [event for event in all_events if not event.get("test")]
    print(f"  Fetching sessions for {len(race_events)} events...")
    for event in race_events:
        event["_sessions"] = _fetch_sessions(event["id"], _CATEGORY_IDS[series_id])

    write_json(BRONZE_DIR / f"{series_id}-{year}.json", race_events)
    return race_events