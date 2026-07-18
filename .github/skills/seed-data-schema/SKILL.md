---
name: seed-data-schema
description: >-
  Schema and editing rules for RaceTrack's manually curated seed JSON files.
  USE FOR: editing files under data/seed/, adding or correcting events,
  sessions, circuits, dates, or times for any seed-based series — all except
  API-backed F1, MotoGP, NASCAR. DO NOT
  USE FOR: live-API fetcher changes under pipeline/ (medallion-data-pipeline
  skill), frontend work. INVOKES: medallion-data-pipeline for silver/gold
  rebuilds.
---

# Seed Data Schema

Seed files (`data/seed/<seriesId>.json`) are the source of truth for series without free APIs; same schema as silver (`docs/architecture.md`). `seriesId`: canonical lowercase id from `src/lib/series.ts`.

## Required fields

```jsonc
{
  "id": "dtm-2026-r01",      // unique across ALL seed files
  "seriesId": "dtm",
  "eventName": "...",
  "round": 1,                // sequential, no gaps
  "circuit": { "name", "city", "country",
    "countryCode": "de" },   // alpha-2 ONLY — alpha-3 = empty flag
  "sessions": [{ "type": "race", "startTimeUTC": "2026-05-10T13:00:00Z", "endTimeUTC": "…" }],
  "dateStart": "2026-05-08", // = first session date
  "dateEnd": "2026-05-10",   // = last session date
  "status": "upcoming"       // | live | completed | cancelled
}
```

## Time rules

- **ISO 8601 UTC** (`...Z`) only; browser localizes — never store local times.
- Unconfirmed → `T00:00:00Z` placeholder (`isPlaceholderTime()`); never invent times.
- Moto2/Moto3 race ≈ MotoGP−2h / −4h.

## After every edit

```bash
uv run python -m pipeline --series <id>
npm run validate:data
```

Rebuild gold (snippet in medallion-data-pipeline). Commit seed/silver/gold, never bronze. Bulk edits: `/seed-audit` first.
