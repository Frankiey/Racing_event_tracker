"""MotoGP bronze layer — fetch from Pulselive API."""

from pipeline.config import MOTOGP_BASE, BRONZE_DIR, SEASON_YEAR
from pipeline.utils import fetch_json, write_json


def _get_season_uuid(year: int) -> str:
    """Find the UUID for a given MotoGP season."""
    seasons = fetch_json(f"{MOTOGP_BASE}/results/seasons")
    for s in seasons:
        if s.get("year") == year:
            return s["id"]
    raise ValueError(f"MotoGP season {year} not found")


def fetch() -> list:
    """Fetch MotoGP calendar and write to bronze layer."""
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

    write_json(BRONZE_DIR / f"motogp-{year}.json", all_events)
    return all_events
