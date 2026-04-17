# Copilot Instructions — RaceTrack

## Task Tracking

This project uses **bd (beads)** for issue tracking — do NOT use markdown TODO lists or GitHub issues for day-to-day tasks.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

**Session close protocol** — before finishing a session:
1. File issues for remaining work (`bd create`)
2. Run quality gates (`npm test`, `npm run validate:data`, `npm run build`)
3. Close finished issues (`bd close <id>`)
---

## Project Overview

RaceTrack is a static motorsport event tracker. It aggregates race calendars, session schedules, standings, and broadcast info across F1, F2, F3, Formula E, IndyCar, NASCAR, MotoGP, WEC/endurance, and more into a single dashboard.

**Tech stack:**
- Frontend: Astro (static-first, island architecture) + Tailwind CSS v4
- Data pipeline: Python (managed with uv) — separate process from the website
- Data: JSON files in `data/` — medallion architecture (bronze → silver → gold)
- Hosting: GitHub Pages via GitHub Actions
- No backend, no database, no auth

## Project Structure

```
src/
  pages/
    index.astro         — Dashboard: next 20 events, countdown hero, series stats, clash detector
    calendar.astro      — Full 2026 calendar, grouped by month, jump-to-today, series heatmap
    watchlist.astro     — User's saved/favorited events (localStorage), ICS export
    status.astro        — Kiosk view (bare, auto-refresh)
    recap.astro         — Past 7 days recap with spoiler-free toggle
    passport.astro      — Globe-based circuit passport / season travel view
    series/[id].astro   — Per-series page: progress bar, schedule, next race, ICS export
    widget/[series].astro — Embeddable countdown widget per series
  components/
    EventCard.astro     — Card with flag, sessions, fav button, opens modal on click
    EventModal.astro    — Global detail modal (rt-open-event CustomEvent)
    Countdown.astro     — Live countdown timer (days:hrs:min:sec)
    SeriesBadge.astro   — Colored pill badge (F1, MotoGP, etc.)
    SeriesFilter.astro  — Toggle filter buttons by series
    Nav.astro           — Sticky nav with Series dropdown + Watchlist heart
    LocalTime.astro     — UTC → local time hydration (use data-local-time attr)
    WeekendTimeline.astro — Session timeline used inside the event modal
  layouts/
    Layout.astro        — HTML shell + Nav + EventModal
  lib/
    series.ts           — SERIES metadata map + SERIES_LIST + getSeriesMeta()
    series-client.ts    — Browser-safe series metadata (derived from series.ts)
    client-utils.ts     — Shared client-side utilities: countryFlag, escapeHtml,
                          formatLocalTime, formatDateRange, isPastEvent,
                          readFavorites, toggleFavorite, safeJsonParse,
                          isSessionLive, getLiveSession, sleepVerdict
    ics.ts              — ICS calendar file generation (client-side .ics export)
    sessions.ts         — Canonical session labels, abbreviations, and durations
    share-card.ts       — Social/share image generation for calendar selections
    time.ts             — Server-side helpers: formatDateRange, getRaceSession,
                          isPlaceholderTime, countryFlag, isPastEvent
    types.ts            — Shared frontend event/session TypeScript types
    world-data.ts       — World map helpers for the passport page
  styles/
    global.css          — Tailwind v4 import + racing stripe, modal, fav animations
pipeline/
  fetchers/       — Bronze layer: API fetch scripts (Python)
  transforms/     — Silver + gold layer transforms (Python)
  config.py       — Shared config (paths, API URLs, season year)
  utils.py        — HTTP client, JSON read/write helpers
  run.py          — Main pipeline entrypoint
data/
  bronze/         — Raw API responses (cached)
  silver/         — Cleaned/normalized per-series JSON
  gold/           — calendar.json, upcoming.json, broadcasts.json
  seed/           — Manual JSON for series without APIs or stable free feeds (F2, F3, FE, IndyCar, WEC, Moto2, Moto3, IMSA, DTM, NLS, Super Formula, IOMTT; WSBK fallback)
public/           — Static assets (logos, flags, images)
```

## Key Conventions

- All times stored in UTC, converted to local time in the browser via `data-local-time` attribute
- Data files are JSON, committed to the repo
- Series identifiers: `f1`, `f2`, `f3`, `fe`, `indycar`, `nascar`, `motogp`, `moto2`, `moto3`, `wec`, `imsa`, `dtm`, `nls`, `wsbk`, `superformula`, `iomtt`
- Keep components small and focused — interactivity via vanilla `<script>` tags, not framework islands
- Prefer static generation over client-side fetching
- Dark mode is the default theme
- **Tailwind v4**: dynamic class names like `bg-[#hex]` do NOT work at runtime — always use `style=` for series colors
- **Country flags**: `countryFlag()` only handles alpha-2 codes (2 letters). Alpha-3 silently returns empty string
- **Favorites**: stored in `localStorage['rt-favs']` as a JSON array of event IDs; use `rt-favs-changed` CustomEvent to sync UI across components
- **Cross-component events**: `rt-open-event` (detail: event object) opens the modal; `rt-favs-changed` triggers fav UI sync
- `upcoming.json` is sorted chronologically by `dateStart`

## Commands

```bash
npm run dev                                    # local Astro dev server with hot reload
npm run build                                  # production build
npm run preview                                # preview production build locally
npm run fetch-data                             # run Python data pipeline
uv run python -m pipeline --series f1,motogp  # fetch specific series only
uv run python -m pipeline --bronze-only        # fetch raw data without transforms
```

## Data Sources

| Series | Source | Type |
|--------|--------|------|
| F1 | Jolpica API + OpenF1 | API (free, no auth) |
| MotoGP | Pulselive API | API (free, no auth) |
| NASCAR | NASCAR CDN | API (free, no auth) |
| WSBK | WorldSBK Pulselive API (seed fallback) | API + seed fallback |
| F2, F3, FE, IndyCar, WEC, Moto2, Moto3, IMSA, DTM, NLS, Super Formula, IOMTT | `data/seed/*.json` | Manual seed data |

## Don't

- Don't add a backend or database
- Don't over-abstract — keep it simple and direct
- Don't use heavy client-side frameworks — vanilla JS or Astro islands only
- Don't hardcode timezone offsets — always use `Intl`/browser APIs
- Don't use dynamic Tailwind class names like `bg-[#hex]` — use `style=` instead
- Don't add features, refactor, or "improve" code beyond what was asked
