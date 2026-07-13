---
name: medallion-data-pipeline
description: >-
  RaceTrack Python data pipeline: bronze → silver → gold medallion flow,
  fetchers vs transforms, rebuild and validation commands. USE FOR: anything
  under pipeline/ or data/bronze, data/silver, data/gold — fixing fetchers,
  debugging missing/stale/malformed events, rebuilding gold, wiring a series
  into the pipeline. DO NOT USE FOR: editing data/seed/*.json content (see
  seed-data-schema skill), frontend/UI work, npm dependency chores.
---

# Medallion Data Pipeline

Python, managed with **uv** (never pip, never npm for Python deps). Layer definitions and event schema: `docs/architecture.md` ("Medallion Layers", "Common Event Schema").

## Layers

1. **Bronze** (`data/bronze/`) — raw API responses, local cache, **never committed**, never a source of truth.
2. **Silver** (`data/silver/`) — normalized per-series JSON, committed.
3. **Gold** (`data/gold/`) — merged `calendar.json`, `upcoming.json`, and `broadcasts.json` (per-series broadcast/streaming channels for NL, US, UK), committed. This is what the frontend reads.

Seed files (`data/seed/`) feed directly into silver transforms for series without free APIs. API-backed: F1 (Jolpica + OpenF1), MotoGP (Pulselive), NASCAR (CDN), WSBK (JWT-gated Pulselive, seed fallback). Everything else is seed-only.

## Code layout

- `pipeline/fetchers/` — bronze-layer API fetch scripts (one per API series)
- `pipeline/transforms/` — silver + gold transforms; `transforms/gold.py` has `build_calendar()` / `build_upcoming()`
- `pipeline/config.py` — series list, paths, API URLs, `SEASON_YEAR`
- `pipeline/run.py` — entrypoint; registers fetchers/transforms
- `pipeline/utils.py` — HTTP client, JSON read/write helpers

## Commands

```bash
npm run fetch-data                             # full pipeline
uv run python -m pipeline --series f1,motogp   # specific series only
uv run python -m pipeline --bronze-only        # raw fetch, no transforms
npm run validate:data                          # validate seed, silver, gold JSON
npm run test:pipeline                          # Python unit tests
```

Rebuild gold from all existing silver files (needed after editing any silver, and for Moto2/Moto3 after a MotoGP update):

```bash
uv run python3 -c "
from pipeline.transforms.gold import build_calendar, build_upcoming
import pathlib, json
events = []
for f in pathlib.Path('data/silver').glob('*.json'):
    events += json.loads(f.read_text())
build_calendar(events)
build_upcoming(events)
print('Gold rebuilt')
"
```

## Debugging order

Work bronze → silver → gold unless the failing layer is obvious. Rebuild only the affected series first, then widen. Prefer local, schema-preserving fixes at the controlling layer over refactors. Always run `npm run validate:data` after data changes.

Known quirks:
- Moto2/Moto3 race times approximate MotoGP+2h and MotoGP+4h.
- If the WSBK JWT-gated fetch fails, fall back to `data/seed/wsbk.json`.
- `upcoming.json` consumers must sort by `dateStart` themselves.
