"""Seed data loader for series without public APIs."""

from pipeline.config import SEED_DIR
from pipeline.utils import read_json


def load(series_id: str) -> list:
    """Load manually curated seed data for a series.

    Seed files are already in silver-layer format.
    """
    path = SEED_DIR / f"{series_id}.json"
    if not path.exists():
        print(f"[{series_id.upper()}] No seed file at {path} — skipping")
        return []

    data = read_json(path)
    print(f"[{series_id.upper()}] Loaded {len(data)} events from seed data")
    return data
