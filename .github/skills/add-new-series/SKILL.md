---
name: add-new-series
description: >-
  End-to-end checklist for adding a new motorsport series to RaceTrack:
  metadata, data source (seed or fetcher), pipeline wiring, UI verification.
  USE FOR: requests like "add series X", "support championship Y", "track the
  Z calendar" — any new racing series or championship. DO NOT USE FOR: fixing
  data in an existing series or standalone UI components. INVOKES:
  seed-data-schema and medallion-data-pipeline for the data steps.
---

# Add a New Series

Source-selection guidance: `docs/architecture.md` ("Adding a New Data Source") and `docs/data-sources/`.

## Checklist

1. **Pick the data path.** Free unauthenticated API → fetcher path; otherwise seed path (the common case). Follow existing patterns in `pipeline/fetchers/` and `data/seed/`.
2. **Register metadata** in `src/lib/series.ts`: `SERIES` map entry (`id`, `name`, `shortName`, `color` hex, `textColor`); append the lowercase id to `SERIES_LIST`.
3. **Create the data.** Seed: `data/seed/<id>.json` per the seed-data-schema skill (alpha-2 country codes, UTC times, globally unique ids). API: `pipeline/fetchers/<id>.py` + `pipeline/transforms/<id>.py`.
4. **Wire the pipeline:** add the id in `pipeline/config.py`; register in `pipeline/run.py`.
5. **Build:** `uv run python -m pipeline --series <id>`; verify `data/silver/<id>.json` and events in `data/gold/calendar.json`.
6. **Verify the UI** (`npm run dev`): badge color on EventCard; events on `/` and `/calendar`; `/series/<id>` loads; modal shows local session times; no empty flags (= countryCode not alpha-2).
7. **Quality gates:** `npm run validate:data`, `npm test`, `npm run build`.
8. **Track it** in bd: create + claim a feature issue before starting.

Also update the Data Sources table in CLAUDE.md / AGENTS.md / copilot-instructions.md and, if known, `data/gold/broadcasts.json`.
