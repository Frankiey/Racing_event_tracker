---
name: medallion-data-pipeline
description: >-
  RaceTrack Python data pipeline: bronze → silver → gold medallion flow,
  rebuild and validation commands. USE FOR: anything under pipeline/ or
  data/bronze, data/silver, data/gold — fixing fetchers, debugging
  missing/stale events, rebuilding gold, wiring a series into the pipeline.
  DO NOT USE FOR: editing data/seed/*.json (seed-data-schema skill),
  frontend work, npm chores. INVOKES: seed-data-schema when the fix belongs
  in a seed file.
---

# Medallion Data Pipeline

Python, managed with **uv** (never pip). Details: `docs/architecture.md`.

## Layers

1. **Bronze** (`data/bronze/`) — raw API responses, local cache, never committed.
2. **Silver** (`data/silver/`) — normalized per-series JSON, committed; built by `pipeline/transforms/` from bronze or seed files (`data/seed/`).
3. **Gold** (`data/gold/`) — merged `calendar.json` / `upcoming.json` / `broadcasts.json`; what the frontend reads; built by `transforms/gold.py`.

API-backed: F1, MotoGP, NASCAR, WSBK (seed fallback); everything else seed-only.

## Commands

```bash
npm run fetch-data                             # full pipeline
uv run python -m pipeline --series f1,motogp   # specific series
npm run validate:data
```

Rebuild gold from all silver after any silver edit:

```bash
uv run python3 -c "import pathlib,json
from pipeline.transforms.gold import build_calendar, build_upcoming
e=[x for f in pathlib.Path('data/silver').glob('*.json') for x in json.loads(f.read_text())]
build_calendar(e); build_upcoming(e)"
```

## Debugging order

Work bronze → silver → gold unless the failing layer is obvious. Rebuild the affected series first. Fix at the controlling layer; never hand-edit gold. Run `npm run validate:data` after.

Quirks: Moto2/Moto3 race ≈ MotoGP+2h/+4h; WSBK fetch failure → seed fallback; sort `upcoming.json` by `dateStart` yourself.
