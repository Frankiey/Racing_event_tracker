# Architecture — RaceTrack

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  External    │     │  Data        │     │  Static      │
│  APIs        │────▸│  Pipeline    │────▸│  Site        │
│  (F1, MotoGP │     │  (scripts/)  │     │  (Astro)     │
│   WEC, etc.) │     └──────┬───────┘     └──────────────┘
└─────────────┘            │
                    ┌──────▼───────┐
                    │  data/       │
                    │  bronze/     │  Raw cached responses
                    │  silver/     │  Normalized per-series
                    │  gold/       │  Merged & enriched
                    └──────────────┘
```

## Data Flow — Medallion Architecture

### Bronze Layer (`data/bronze/`)
- Raw API responses cached as JSON
- One file per source per fetch (e.g. `f1-2026-schedule.json`)
- Preserves original schema — no transformation
- Purpose: cache, audit trail, avoid re-fetching

### Silver Layer (`data/silver/`)
- Normalized to a common event schema
- One file per series (e.g. `f1.json`, `motogp.json`)
- Common fields: `seriesId`, `eventName`, `circuit`, `country`, `sessions[]`, `dates`
- Sessions have: `type` (FP1, Qualifying, Race, etc.), `startTimeUTC`, `endTimeUTC`

### Gold Layer (`data/gold/`)
- Merged cross-series calendar (`calendar.json`)
- Enriched with broadcast info (`broadcasts.json`)
- Pre-computed "this weekend" data (`upcoming.json`)
- Ready for direct consumption by Astro pages

## Common Event Schema (Silver/Gold)

```typescript
interface RaceEvent {
  id: string;                    // e.g. "f1-2026-r05"
  seriesId: string;              // e.g. "f1"
  eventName: string;             // e.g. "Monaco Grand Prix"
  round: number;
  circuit: {
    name: string;
    city: string;
    country: string;
    countryCode: string;         // ISO 3166-1 alpha-2
    lat: number;
    lng: number;
  };
  sessions: Session[];
  status: 'upcoming' | 'live' | 'completed';
}

interface Session {
  type: string;                  // FP1, FP2, FP3, Qualifying, Sprint, Race
  startTimeUTC: string;          // ISO 8601
  endTimeUTC: string;
  status: 'upcoming' | 'live' | 'completed';
}
```

## Page Architecture

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Dashboard — next events across all series | `gold/upcoming.json` |
| `/calendar` | Full season calendar, filterable by series | `gold/calendar.json` |
| `/series/[id]` | Per-series page with standings + schedule | `silver/[id].json` |
| `/status` | Minimal kiosk/small-screen view | `gold/upcoming.json` |
| `/where-to-watch` | Broadcast info by region | `gold/broadcasts.json` |

## Data Sources

| Series | Primary Source | Fallback |
|--------|---------------|----------|
| F1 | Jolpica API (Ergast successor) | OpenF1 API |
| F2, F3 | FIA calendar / manual JSON | — |
| Formula E | Manual JSON | TheSportsDB |
| MotoGP | MotoGP API / scrape | TheSportsDB |
| IndyCar | Manual JSON | TheSportsDB |
| NASCAR | Manual JSON | TheSportsDB |
| WEC / Endurance | FIA WEC calendar / manual | — |

## Deployment

1. **GitHub Action (cron)** runs `npm run fetch-data` nightly
2. Pipeline fetches APIs → writes bronze → transforms silver → merges gold
3. Action commits updated `data/` to `main`
4. Push triggers build action: `npm run build` → deploy to GitHub Pages
5. Site is fully static — no runtime server

## Design Decisions

- **Static-first**: No server, no database. All data pre-built at deploy time.
- **Medallion data**: Separating raw/clean/enriched data makes it easy to debug, iterate on transforms, and add new series.
- **Astro**: Minimal JS shipped to client. Islands for interactive bits (countdown timers, timezone selector).
- **Dark mode default**: Target use case includes ambient displays and kiosk mode.
- **UTC storage**: All times in UTC, converted client-side. No server-side timezone logic.
