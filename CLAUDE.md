Use 'bd' for task tracking

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. 
**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items

4. **Verify** - All changes staged and verified
5. **Hand off** - Provide context for next session

<!-- END BEADS INTEGRATION -->


# RaceTrack — Claude Instructions

## Project Overview
RaceTrack is a static motorsport event tracker. It aggregates race calendars, session schedules, standings, and broadcast info across F1, F2, F3, Formula E, IndyCar, NASCAR, MotoGP, WEC/endurance, and more into a single dashboard.

## Tech Stack
- **Frontend:** Astro (static-first, island architecture) + Tailwind CSS v4
- **Data pipeline:** Python (managed with uv) — separate process from the website
- **Data:** JSON files in `data/` — medallion architecture (bronze → silver → gold)
- **Hosting:** GitHub Pages via GitHub Actions
- **No backend, no database, no auth**

## Project Structure
```
src/
  pages/
    index.astro         — Dashboard: next 20 events, countdown hero, series stats
    calendar.astro      — Full 2026 calendar, grouped by month, jump-to-today
    watchlist.astro     — User's saved/favorited events (localStorage)
    status.astro        — Kiosk view (bare, auto-refresh)
    series/[id].astro   — Per-series page: progress bar, schedule, next race
  components/
    EventCard.astro     — Card with flag, sessions, fav button, opens modal on click
    EventModal.astro    — Global detail modal (rt-open-event CustomEvent)
    Countdown.astro     — Live countdown timer (days:hrs:min:sec)
    SeriesBadge.astro   — Colored pill badge (F1, MotoGP, etc.)
    SeriesFilter.astro  — Toggle filter buttons by series
    Nav.astro           — Sticky nav with Series dropdown + Watchlist heart
    LocalTime.astro     — UTC → local time hydration (use data-local-time attr)
  layouts/
    Layout.astro        — HTML shell + Nav + EventModal
  lib/
    series.ts           — SERIES metadata map + SERIES_LIST + getSeriesMeta()
    time.ts             — formatDateRange, getRaceSession, isPlaceholderTime,
                          countryFlag (alpha-2→emoji), isPastEvent
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
  gold/           — calendar.json, upcoming.json
  seed/           — Manual JSON for series without APIs (FE, IndyCar, WEC, F2, F3)
public/           — Static assets (logos, flags, images)
```

## Key Conventions
- All times stored in UTC, converted to local time in the browser via `data-local-time` attribute
- Data files are JSON, committed to the repo
- Series identifiers: `f1`, `f2`, `f3`, `fe`, `indycar`, `nascar`, `motogp`, `wec`
- Keep components small and focused — interactivity via vanilla `<script>` tags, not framework islands
- Prefer static generation over client-side fetching
- Dark mode is the default theme
- **Tailwind v4**: dynamic class names like `bg-[#hex]` do NOT work at runtime — always use `style=` for series colors
- **Country flags**: `countryFlag()` only handles alpha-2 codes (2 letters). Alpha-3 silently returns empty string
- **Favorites**: stored in `localStorage['rt-favs']` as a JSON array of event IDs; use `rt-favs-changed` CustomEvent to sync UI across components
- **Cross-component events**: `rt-open-event` (detail: event object) opens the modal; `rt-favs-changed` triggers fav UI sync

## Commands
- `npm run dev` — local Astro dev server with hot reload
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run fetch-data` — run Python data pipeline (`uv run python -m pipeline`)
- `uv run python -m pipeline --series f1,motogp` — fetch specific series only
- `uv run python -m pipeline --bronze-only` — fetch raw data without transforms

## Data Pipeline
Python scripts in `pipeline/` fetch from APIs (Jolpica/OpenF1 for F1, Pulselive for MotoGP, NASCAR CDN for NASCAR), normalize into the medallion layers, and write JSON to `data/`. Series without APIs (FE, IndyCar, WEC, F2, F3) use manually curated seed files in `data/seed/`. A GitHub Action runs this nightly and commits updated data.

## Data Sources
| Series | Source | Type |
|--------|--------|------|
| F1 | Jolpica API + OpenF1 | API (free, no auth) |
| MotoGP | Pulselive API | API (free, no auth) |
| NASCAR | NASCAR CDN | API (free, no auth) |
| F2, F3, FE, IndyCar, WEC | `data/seed/*.json` | Manual seed data |

## When Making Changes
- Check `docs/architecture.md` for system design decisions
- Check `worknotes.md` for current status and open questions
- Run `bd ready` to find tracked open issues before starting new work
- Keep the `/status` route minimal — it targets small screens and kiosk displays
- `upcoming.json` is sorted by series, NOT by date — always sort by `dateStart` before applying per-series caps
- `data/gold/broadcasts.json` does not exist yet — it's a planned feature (see bd issue Racing_event_tracker-com)
- When adding a new page, also add it to `Nav.astro` and update this CLAUDE.md structure section
