#!/usr/bin/env python3
"""
RaceTrack data pipeline.

Bronze: fetch raw data from APIs → data/bronze/
Silver: normalize to common schema → data/silver/
Gold:   merge & enrich for display → data/gold/

Usage:
    python -m pipeline.run
    python -m pipeline.run --bronze-only
    python -m pipeline.run --series f1,motogp
"""

import argparse
import sys

from pipeline.config import SILVER_DIR, GOLD_DIR, SEASON_YEAR, SERIES_IDS
from pipeline.utils import read_json, write_json
from pipeline.circuits import enrich_circuit
from pipeline.validate import run_validation

# Fetchers (bronze)
from pipeline.fetchers import f1 as f1_fetcher
from pipeline.fetchers import motogp as motogp_fetcher
from pipeline.fetchers import nascar as nascar_fetcher
from pipeline.fetchers import wsbk as wsbk_fetcher
from pipeline.fetchers.seed import load as load_seed

# Transforms (silver)
from pipeline.transforms import f1 as f1_transform
from pipeline.transforms import motogp as motogp_transform
from pipeline.transforms import nascar as nascar_transform
from pipeline.transforms import wsbk as wsbk_transform

# Gold
from pipeline.transforms.gold import build_calendar, build_upcoming

# Series that have API fetchers
API_SERIES = {
    "f1":    (f1_fetcher.fetch,    f1_transform.transform),
    "motogp": (motogp_fetcher.fetch, motogp_transform.transform),
    "nascar": (nascar_fetcher.fetch, nascar_transform.transform),
    "wsbk":  (wsbk_fetcher.fetch,  wsbk_transform.transform),
}

# Series loaded from seed files (no API)
SEED_SERIES = ["f2", "f3", "fe", "indycar", "wec", "moto2", "moto3",
               "imsa", "dtm", "nls", "superformula", "iomtt"]


def validate_series_configuration() -> None:
    configured = set(API_SERIES) | set(SEED_SERIES)
    expected = set(SERIES_IDS)
    if configured != expected:
        missing = sorted(expected - configured)
        extra = sorted(configured - expected)
        details: list[str] = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if extra:
            details.append(f"extra: {', '.join(extra)}")
        raise ValueError(f"Series configuration mismatch ({'; '.join(details)})")


def run_pipeline(series_filter: list[str] | None = None, bronze_only: bool = False):
    validate_series_configuration()

    year = SEASON_YEAR
    all_silver: list[dict] = []
    failed_series: list[str] = []

    print(f"=== RaceTrack Pipeline — {year} season ===\n")

    # --- Bronze + Silver for API series ---
    for series_id, (fetch_fn, transform_fn) in API_SERIES.items():
        if series_filter and series_id not in series_filter:
            continue

        try:
            bronze_data = fetch_fn()
            if bronze_only:
                continue

            silver_events = transform_fn(bronze_data)
            for ev in silver_events:
                enrich_circuit(ev.get("circuit", {}))
            write_json(SILVER_DIR / f"{series_id}.json", silver_events)
            all_silver.extend(silver_events)
            print(f"  [{series_id.upper()}] {len(silver_events)} events\n")

        except Exception as e:
            print(f"  [{series_id.upper()}] ERROR: {e}\n")
            failed_series.append(series_id)

    if bronze_only:
        print("Bronze-only mode — stopping before silver/gold.")
        return True

    # --- Seed series (already silver format) ---
    for series_id in SEED_SERIES:
        if series_filter and series_id not in series_filter:
            continue

        seed_events = load_seed(series_id)
        if seed_events:
            for ev in seed_events:
                enrich_circuit(ev.get("circuit", {}))
            write_json(SILVER_DIR / f"{series_id}.json", seed_events)
            all_silver.extend(seed_events)

    # --- Gold layer ---
    # Always build gold from ALL silver files on disk, not just what was
    # processed this run. This ensures a partial run (--series f1) does not
    # silently overwrite gold with incomplete data.
    print("\n[GOLD] Reading all silver files...")
    all_silver_merged = []
    for silver_file in sorted(SILVER_DIR.glob("*.json")):
        try:
            events = read_json(silver_file)
            all_silver_merged.extend(events)
            print(f"  {silver_file.stem}: {len(events)} events")
        except Exception as e:
            print(f"  WARNING: could not read {silver_file.name}: {e}")

    print(f"\n[GOLD] Building merged layers from {len(all_silver_merged)} total events...")
    sources = [f.stem for f in sorted(SILVER_DIR.glob("*.json"))]
    calendar = build_calendar(all_silver_merged, sources=sources)
    upcoming = build_upcoming(all_silver_merged, sources=sources)

    write_json(GOLD_DIR / "calendar.json", calendar)
    write_json(GOLD_DIR / "upcoming.json", upcoming)

    print(f"\nDone! {len(calendar)} total events, {len(upcoming)} upcoming.")

    print("\n[VALIDATE] Checking seed, silver, and gold data...")
    validation_exit_code = run_validation()
    if validation_exit_code != 0:
        return False

    if failed_series:
        print(f"\nWARNING: {len(failed_series)} series failed: {', '.join(failed_series)}")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="RaceTrack data pipeline")
    parser.add_argument(
        "--series",
        type=str,
        help="Comma-separated series to fetch (e.g. f1,motogp)",
    )
    parser.add_argument(
        "--bronze-only",
        action="store_true",
        help="Only fetch bronze layer, skip transforms",
    )
    args = parser.parse_args()

    series_filter = args.series.split(",") if args.series else None
    success = run_pipeline(series_filter=series_filter, bronze_only=args.bronze_only)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
