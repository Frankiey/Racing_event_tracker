---
name: add-new-series
description: >-
  End-to-end checklist for adding a new motorsport series to RaceTrack:
  metadata, data source (seed or fetcher), pipeline wiring, UI verification.
  USE FOR: requests like "add series X", "support championship Y", "track the
  Z calendar" — any new racing series or championship. DO NOT USE FOR: fixing
  data in an existing series (seed-data-schema / medallion-data-pipeline
  skills) or standalone UI components.
---

# Add a New Series

Full source-selection guidance: `docs/architecture.md` ("Adding a New Data Source") and `docs/data-sources/`.

## Checklist

1. **Pick the data path.** Free, unauthenticated API exists → fetcher path. Otherwise → seed path (the common case; see existing files in `pipeline/fetchers/` and `data/seed/` for patterns).

2. **Register metadata** in `src/lib/series.ts`: add an entry to the `SERIES` map (`id`, `name`, `shortName`, `color` hex, `textColor`) and append the id to `SERIES_LIST`. Use a lowercase id consistent with the existing canonical ids.

3. **Create the data.**
   - *Seed path:* `data/seed/<id>.json` following the seed-data-schema skill (event/circuit/session required fields, alpha-2 country codes, UTC times, globally unique ids).
   - *API path:* `pipeline/fetchers/<id>.py` (bronze) + `pipeline/transforms/<id>.py` (silver), following an existing fetcher.

4. **Wire the pipeline:** add the id to the series list in `pipeline/config.py`; import/register fetcher and transform in `pipeline/run.py`.

5. **Build:** `uv run python -m pipeline --series <id>`, verify `data/silver/<id>.json`, confirm the events land in `data/gold/calendar.json`.

6. **Verify the UI** (`npm run dev`):
   - [ ] Series badge renders with correct color on EventCard
   - [ ] Events appear on `/` and `/calendar`
   - [ ] `/series/<id>` page loads
   - [ ] Event modal shows sessions with correct local times
   - [ ] No empty flags (empty flag = countryCode not alpha-2)

7. **Quality gates:** `npm run validate:data`, `npm test`, `npm run build`.

8. **Track it:** `bd create --title="Add <Series> series" --type=feature --priority=2` and claim it before starting.

Also update the Data Sources table in the always-on instruction files (CLAUDE.md / AGENTS.md / copilot-instructions.md) and, if broadcast info is known, `data/gold/broadcasts.json`.
