"""NASCAR bronze layer — fetch from NASCAR CDN."""

from pipeline.config import NASCAR_CDN, BRONZE_DIR, SEASON_YEAR
from pipeline.utils import fetch_json, write_json


def fetch() -> list:
    """Fetch NASCAR race list and write to bronze layer."""
    year = SEASON_YEAR
    print(f"[NASCAR] Fetching {year} season...")

    data = fetch_json(f"{NASCAR_CDN}/{year}/race_list_basic.json")

    write_json(BRONZE_DIR / f"nascar-{year}.json", data)
    return data
