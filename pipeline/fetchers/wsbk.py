"""WorldSBK bronze layer — fetch from WorldSBK API (Pulselive infrastructure).

WorldSBK uses a Pulselive-based API similar to MotoGP.
API base: https://api.worldsbk.com/sbk/v1

If the API is unavailable, the fetcher falls back to loading seed data
so the pipeline degrades gracefully.
"""

from pipeline.config import WSBK_BASE, BRONZE_DIR, SEASON_YEAR, SEED_DIR
from pipeline.utils import fetch_json, write_json, read_json


def _get_season_uuid(year: int) -> str:
    """Find the UUID for a given WSBK season."""
    seasons = fetch_json(f"{WSBK_BASE}/results/seasons")
    for s in seasons:
        if s.get("year") == year:
            return s["id"]
    raise ValueError(f"WSBK season {year} not found in API response")


def fetch() -> list:
    """Fetch WSBK calendar and write to bronze layer.

    Falls back to seed data if the API is unavailable.
    """
    year = SEASON_YEAR
    print(f"[WSBK] Fetching {year} season via API...")

    try:
        season_uuid = _get_season_uuid(year)
        upcoming = fetch_json(
            f"{WSBK_BASE}/results/events?seasonUuid={season_uuid}&isFinished=false"
        )
        finished = fetch_json(
            f"{WSBK_BASE}/results/events?seasonUuid={season_uuid}&isFinished=true"
        )
        all_events = (finished or []) + (upcoming or [])

        if not all_events:
            raise ValueError("API returned empty event list")

        write_json(BRONZE_DIR / f"wsbk-{year}.json", all_events)
        print(f"[WSBK] Fetched {len(all_events)} events from API")
        return all_events

    except Exception as e:
        print(f"[WSBK] API unavailable ({e}), falling back to seed data")
        seed_path = SEED_DIR / "wsbk.json"
        if seed_path.exists():
            data = read_json(seed_path)
            print(f"[WSBK] Loaded {len(data)} events from seed")
            return data
        print("[WSBK] No seed file found — skipping")
        return []
