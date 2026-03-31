"""MotoGP bronze layer — fetch from Pulselive API."""

from pipeline.config import MOTOGP_BASE, BRONZE_DIR, SEASON_YEAR
from pipeline.utils import fetch_json, write_json

# MotoGP category UUID — consistent across events/seasons
MOTOGP_CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942"


def _get_season_uuid(year: int) -> str:
    """Find the UUID for a given MotoGP season."""
    seasons = fetch_json(f"{MOTOGP_BASE}/results/seasons")
    for s in seasons:
        if s.get("year") == year:
            return s["id"]
    raise ValueError(f"MotoGP season {year} not found")


def _fetch_sessions(event_id: str) -> list:
    """Fetch MotoGP session schedule for an event."""
    try:
        sessions = fetch_json(
            f"{MOTOGP_BASE}/results/sessions"
            f"?eventUuid={event_id}&categoryUuid={MOTOGP_CATEGORY_UUID}"
        )
        return sessions or []
    except Exception:
        return []


def fetch() -> list:
    """Fetch MotoGP calendar and session schedules, write to bronze layer."""
    year = SEASON_YEAR
    print(f"[MotoGP] Fetching {year} season...")

    season_uuid = _get_season_uuid(year)
    upcoming = fetch_json(
        f"{MOTOGP_BASE}/results/events?seasonUuid={season_uuid}&isFinished=false"
    )
    finished = fetch_json(
        f"{MOTOGP_BASE}/results/events?seasonUuid={season_uuid}&isFinished=true"
    )
    all_events = (finished or []) + (upcoming or [])

    # Fetch session schedules for each non-test event
    race_events = [e for e in all_events if not e.get("test")]
    print(f"  Fetching sessions for {len(race_events)} events...")
    for event in race_events:
        event["_sessions"] = _fetch_sessions(event["id"])

    write_json(BRONZE_DIR / f"motogp-{year}.json", all_events)
    return all_events
