---
name: seed-data-schema
description: >-
  Schema and editing rules for RaceTrack's manually curated seed JSON files.
  USE FOR: editing files under data/seed/, adding or correcting events,
  sessions, circuits, dates, or times for any seed-based series (F2, F3, FE,
  IndyCar, WEC, Moto2, Moto3, IMSA, DTM, GT World, NLS, WSBK fallback, Super
  Formula, IOMTT). DO NOT USE FOR: live-API fetcher changes under pipeline/
  (see medallion-data-pipeline skill), frontend work.
---

# Seed Data Schema

Seed files in `data/seed/<seriesId>.json` are the source of truth for series without free APIs. They use the same event schema as silver — canonical definition in `docs/architecture.md` ("Common Event Schema").

## Canonical series IDs

`f1` `f2` `f3` `fe` `indycar` `nascar` `motogp` `moto2` `moto3` `wec` `imsa` `dtm` `gtworld` `nls` `wsbk` `superformula` `iomtt`

## Event schema (required fields)

```jsonc
{
  "id": "dtm-2026-r01",          // globally unique across ALL seed files
  "seriesId": "dtm",
  "eventName": "...",
  "round": 1,                     // sequential per series, no gaps
  "circuit": {
    "name": "...", "city": "...", "country": "...",
    "countryCode": "de"           // ISO alpha-2 ONLY — alpha-3 renders an empty flag
  },
  "sessions": [
    { "type": "race", "startTimeUTC": "2026-05-10T13:00:00Z", "endTimeUTC": "..." }
  ],
  "dateStart": "2026-05-08",      // matches first session date
  "dateEnd": "2026-05-10",        // matches last session date
  "status": "upcoming"            // upcoming | live | completed | cancelled
}
```

## Time rules

- All session times are **ISO 8601 UTC** (`...Z`). The browser converts to local; never store local times.
- Unconfirmed session time → use placeholder `T00:00:00Z` (detected by `isPlaceholderTime()` in `src/lib/time.ts`).
- Moto2/Moto3 approximations: race ≈ MotoGP−2h and MotoGP−4h respectively.

## After every seed edit

```bash
uv run python -m pipeline --series <id>   # rebuild silver from seed
npm run validate:data                     # must pass
```

Then rebuild gold (see the medallion-data-pipeline skill for the rebuild snippet). Commit `data/seed/`, `data/silver/`, `data/gold/` — not `data/bronze/`.

Before bulk edits, run the `/seed-audit` workflow to establish a clean baseline.
