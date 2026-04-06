# Architecture — RaceTrack

## System Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  External APIs   │     │  Data Pipeline   │     │  Static Site │
│  (F1, MotoGP,   │────▸│  (pipeline/)     │────▸│  (Astro)     │
│   NASCAR, etc.)  │     └────────┬─────────┘     └──────────────┘
└──────────────────┘              │
                                  │
┌──────────────────┐              │
│  Seed Files      │              │
│  (data/seed/)   │──────────────┘
│  Manual JSON for │
│  API-less series │
└──────────────────┘

                    ┌─────────────────────┐
                    │  data/              │
                    │  ├── bronze/        │  Raw API responses (cached)
                    │  ├── silver/        │  Normalized per-series
                    │  ├── gold/          │  Merged & display-ready
                    │  └── seed/          │  Manual data (skips bronze)
                    └─────────────────────┘
```

---

## Data Flow — Two Paths

There are two routes data can take through the pipeline, depending on whether the series has a public API.

### Path A — API-backed series (F1, MotoGP, NASCAR, WSBK)

```
External API  →  data/bronze/  →  data/silver/  →  data/gold/
               (raw cache)      (normalized)      (merged)
```

1. **Fetcher** (`pipeline/fetchers/<series>.py`) calls the API and writes raw JSON to `data/bronze/`
2. **Transform** (`pipeline/transforms/<series>.py`) normalizes to the common event schema and writes to `data/silver/<series>.json`
3. **Gold build** merges all silver files into `calendar.json` and `upcoming.json`
4. **Validation** checks seed, silver, and gold JSON during normal pipeline runs

### Path B — Seed series (F2, F3, Formula E, IndyCar, WEC, Moto2, Moto3, IMSA, DTM, NLS, Super Formula, IOMTT)

```
data/seed/<series>.json  →  data/silver/  →  data/gold/
  (already normalized)      (copied as-is)    (merged)
```

1. **Seed file** (`data/seed/<series>.json`) is manually curated, already in silver-layer format
2. **Seed loader** (`pipeline/fetchers/seed.py`) reads it directly — there is no bronze step
3. The events are written to `data/silver/<series>.json` and merged into gold like any other series

**Key point:** Seed files ARE the silver layer. They must conform to the common event schema exactly.

---

## Medallion Layers

### Bronze Layer (`data/bronze/`)
- Raw API responses cached as JSON
- One file per source per fetch (e.g. `f1-2026-schedule.json`)
- Preserves original schema — no transformation
- Purpose: cache, audit trail, avoid hammering APIs
- **Only exists for API-backed series** — seed series have no bronze

### Silver Layer (`data/silver/`)
- Normalized to a common event schema (see schema below)
- One file per series (e.g. `f1.json`, `motogp.json`, `f2.json`)
- All series end up here regardless of path A or B
- Common fields: `id`, `seriesId`, `eventName`, `circuit`, `sessions[]`, `dateStart`

### Gold Layer (`data/gold/`)
- `calendar.json` — all events from all series, sorted chronologically
- `upcoming.json` — future events only, sorted by next session time
- Built by `pipeline/transforms/gold.py` from all silver files combined
- Ready for direct consumption by Astro pages — no further processing needed

### Seed Layer (`data/seed/`)
- Manually curated JSON for series that have no usable public API
- Files must match the silver schema exactly (they are copied straight to silver)
- Current seed series: `f2`, `f3`, `fe`, `indycar`, `wec`, `moto2`, `moto3`, `imsa`, `dtm`, `nls`, `superformula`, `iomtt`
- Update these files manually each season or when schedules change

---

## Common Event Schema (Silver & Seed format)

```typescript
interface RaceEvent {
  id: string;           // Unique: "<seriesId>-<year>-r<round>" e.g. "f1-2026-r05"
  seriesId: string;     // Matches SERIES_IDS in config.py e.g. "f1", "motogp"
  eventName: string;    // e.g. "Monaco Grand Prix"
  round: number;
  dateStart: string;    // ISO 8601 date of first session e.g. "2026-05-21"
  dateEnd: string;      // ISO 8601 date of last session e.g. "2026-05-25"
  circuit: {
    name: string;
    city: string;
    country: string;
    countryCode: string;  // ISO 3166-1 alpha-2 ONLY (2 letters). Alpha-3 breaks flags.
    lat: number | null;
    lng: number | null;
  };
  sessions: Session[];
}

interface Session {
  type: string;           // "FP1", "FP2", "FP3", "Qualifying", "Sprint", "Race", etc.
  startTimeUTC: string;   // ISO 8601 UTC e.g. "2026-05-21T11:30:00Z"
}
```

**Gotchas:**
- `countryCode` must be alpha-2. `countryFlag()` in `src/lib/time.ts` silently returns `""` for alpha-3 codes.
- `startTimeUTC` must end in `Z` (or `+00:00`). The gold layer normalizes these but silver should be clean.
- NASCAR CDN sometimes returns `1900-01-01T00:00:00Z` for missing qualifying times — the UI filters these out via `isPlaceholderTime()`.

---

## Adding a New Data Source

### Option 1 — New API-backed series

1. Add the series ID to `SERIES_IDS` in `pipeline/config.py`
2. Add the API base URL to `pipeline/config.py`
3. Create `pipeline/fetchers/<series>.py` with a `fetch() -> list` function that writes to `data/bronze/` and returns raw data
4. Create `pipeline/transforms/<series>.py` with a `transform(data) -> list[RaceEvent]` function
5. Register both in `API_SERIES` dict in `pipeline/run.py`
6. Add series metadata to `src/lib/series.ts` (color, label, short name)
7. Run `uv run python -m pipeline --series <id>` to test

### Option 2 — New seed series (no API)

1. Add the series ID to `SERIES_IDS` in `pipeline/config.py`
2. Add the series ID to `SEED_SERIES` list in `pipeline/run.py`
3. Create `data/seed/<series>.json` following the silver schema above
4. Add series metadata to `src/lib/series.ts` (color, label, short name)
5. Run `uv run python -m pipeline --series <id>` to test

### After adding any series
- Add a route to `src/pages/series/[id].astro` (auto-handled if using dynamic route)
- Verify the series badge renders correctly in `SeriesBadge.astro`
- Add series to the Nav dropdown in `Nav.astro` if not auto-populated
- Update `CLAUDE.md` and this file

---

## Pipeline Entry Point (`pipeline/run.py`)

```
run_pipeline()
  ├── For each API series: fetch() → transform() → write silver
  ├── For each seed series: load_seed() → write silver
  └── build_calendar() + build_upcoming() → write gold
```

CLI:
```bash
uv run python -m pipeline                        # all series, all layers
uv run python -m pipeline --series f1,motogp     # specific series only
uv run python -m pipeline --bronze-only          # fetch only, skip transforms
```

---

## Page Architecture

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Dashboard — next events across all series, countdown hero, season stats, clash detector | `gold/upcoming.json` + `gold/calendar.json` |
| `/calendar` | Full season calendar, grouped by month, jump-to-today, series heatmap | `gold/calendar.json` |
| `/series/[id]` | Per-series page: progress bar, schedule, next race callout, ICS export | `gold/calendar.json` |
| `/watchlist` | User's saved/favorited events (localStorage, no server), ICS export | `gold/calendar.json` + localStorage |
| `/status` | Minimal kiosk/small-screen view, auto-refresh | `gold/upcoming.json` |
| `/recap` | "What Did I Miss?" — past 7 days events with spoiler-free toggle | `gold/calendar.json` |
| `/widget/[series]` | Embeddable countdown widget per series, minimalist design | `gold/calendar.json` |
| `/passport` | Circuit passport / collector view | `gold/calendar.json` |

---

## Current Data Sources

Full research notes, API endpoints, and decision rationale for each series live in [`docs/data-sources/`](data-sources/_index.md). The table below is a summary — see individual files for details.

| Series | Path | Source | API / Seed | Research |
|--------|------|--------|------------|----------|
| F1 | `pipeline/fetchers/f1.py` | Jolpica API + OpenF1 | API | [f1.md](data-sources/f1.md) |
| MotoGP | `pipeline/fetchers/motogp.py` | Pulselive API | API | [motogp.md](data-sources/motogp.md) |
| NASCAR | `pipeline/fetchers/nascar.py` | NASCAR CDN | API | [nascar.md](data-sources/nascar.md) |
| WSBK | `pipeline/fetchers/wsbk.py` | WorldSBK Pulselive API (seed fallback) | API + Seed | [wsbk.md](data-sources/wsbk.md) |
| F2 | `data/seed/f2.json` | Manual | Seed | [f2-f3.md](data-sources/f2-f3.md) |
| F3 | `data/seed/f3.json` | Manual | Seed | [f2-f3.md](data-sources/f2-f3.md) |
| Formula E | `data/seed/fe.json` | Manual (no free API) | Seed | [fe.md](data-sources/fe.md) |
| IndyCar | `data/seed/indycar.json` | Manual (no free API) | Seed | [indycar.md](data-sources/indycar.md) |
| WEC | `data/seed/wec.json` | Manual (no free API) | Seed | [wec.md](data-sources/wec.md) |
| Moto2 | `data/seed/moto2.json` | Manual (MotoGP − 2h offset) | Seed | [moto2-moto3.md](data-sources/moto2-moto3.md) |
| Moto3 | `data/seed/moto3.json` | Manual (MotoGP − 4h offset) | Seed | [moto2-moto3.md](data-sources/moto2-moto3.md) |
| IMSA | `data/seed/imsa.json` | Manual | Seed | [imsa.md](data-sources/imsa.md) |
| DTM | `data/seed/dtm.json` | Manual | Seed | [dtm.md](data-sources/dtm.md) |
| NLS | `data/seed/nls.json` | Manual (official schedule) | Seed | [nls.md](data-sources/nls.md) |
| Super Formula | `data/seed/superformula.json` | Manual | Seed | [superformula.md](data-sources/superformula.md) |
| IOMTT | `data/seed/iomtt.json` | Manual | Seed | n/a |

**Candidate series** (researched but not yet integrated): BTCC, Australian Supercars — see [`docs/data-sources/candidates/`](data-sources/candidates/).

---

## Deployment

1. **GitHub Action (cron, nightly)** runs `npm run fetch-data` (`uv run python -m pipeline`)
2. Pipeline fetches APIs → writes bronze → transforms to silver → merges to gold
3. Action commits updated `data/` files to `main`
4. Push triggers the build action: `npm run build` → deploy to GitHub Pages
5. Site is fully static — no runtime server, no database

---

## Design Decisions

- **Static-first:** No server, no database. All data pre-built at deploy time. GitHub Pages hosting.
- **Medallion data:** Separating raw/clean/enriched makes it easy to debug transforms, add series, and re-run partial pipelines without re-fetching.
- **Seed layer:** Avoids blocking the frontend on API availability. Enables full calendar coverage for series like WEC/IndyCar where no reliable free API exists.
- **Astro:** Minimal JS shipped to client. Vanilla `<script>` tags for interactivity — no framework islands overhead.
- **Dark mode default:** Primary use case is ambient displays and kiosk mode.
- **UTC storage:** All times stored in UTC, converted client-side via `data-local-time` attribute. No server-side timezone logic.
- **Tailwind v4:** Dynamic class names like `bg-[#hex]` do not work at runtime — always use `style=` for series colors.
