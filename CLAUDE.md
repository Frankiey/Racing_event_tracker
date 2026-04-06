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
RaceTrack is a static motorsport event tracker. It aggregates race calendars, session schedules, standings, and broadcast info across F1, F2, F3, Formula E, IndyCar, NASCAR, MotoGP, Moto2, Moto3, WEC/endurance, IMSA, DTM, NLS, WSBK, Super Formula, and IOMTT into a single dashboard.

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
    WeekendTimeline.astro — Timeline view for session scheduling in EventModal
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
    sessions.ts         — Session abbreviations, labels, and duration helpers
    share-card.ts       — Canvas-based share image generation for calendar/date picks
    time.ts             — Server-side helpers: formatDateRange, getRaceSession,
                          isPlaceholderTime, countryFlag, isPastEvent
    types.ts            — Shared frontend event/session TypeScript types
    world-data.ts       — World map support for the passport globe view
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
  seed/           — Manual JSON for series without APIs (FE, IndyCar, WEC, F2, F3)
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

## Commands
- `npm run dev` — local Astro dev server with hot reload
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run fetch-data` — run Python data pipeline (`uv run python -m pipeline`)
- `uv run python -m pipeline --series f1,motogp` — fetch specific series only
- `uv run python -m pipeline --bronze-only` — fetch raw data without transforms

## Data Pipeline
Python scripts in `pipeline/` fetch from APIs (Jolpica/OpenF1 for F1, Pulselive for MotoGP and WSBK, NASCAR CDN for NASCAR), normalize into the medallion layers, and write JSON to `data/`. Series without stable free public APIs (FE, IndyCar, WEC, F2, F3, Moto2, Moto3, IMSA, DTM, NLS, Super Formula, IOMTT) use manually curated seed files in `data/seed/`, while WSBK keeps a seed fallback. A GitHub Action runs this nightly and commits updated data.

## Data Sources
| Series | Source | Type |
|--------|--------|------|
| F1 | Jolpica API + OpenF1 | API (free, no auth) |
| MotoGP | Pulselive API | API (free, no auth) |
| NASCAR | NASCAR CDN | API (free, no auth) |
| WSBK | WorldSBK Pulselive API | API (JWT-gated, seed fallback) |
| F2, F3, FE, IndyCar, WEC | `data/seed/*.json` | Manual seed data |
| Moto2, Moto3 | `data/seed/*.json` | Manual seed data |
| IMSA, DTM, NLS, Super Formula, IOMTT | `data/seed/*.json` | Manual seed data |

## Slash Commands
- `.claude/commands/add-series.md` — guide for adding a new series end to end
- `.claude/commands/pipeline-debug.md` — pipeline debugging workflow
- `.claude/commands/new-component.md` — scaffold a new Astro component following repo conventions

## File Search Tips
- When using Glob, always scope to a specific subdirectory (`src/`, `docs/`, `data/`, `pipeline/`) — never glob from the project root with `**` patterns, as it will match thousands of `node_modules` files
- `pattern: "*.md", path: project_root` finds only root-level files (safe)
- `pattern: "**/*.md", path: "docs/"` finds all docs (safe)
- `pattern: "**/*.md", path: project_root` — avoid this

## When Making Changes
- Check `docs/architecture.md` for system design decisions
- Check `worknotes.md` for current status and open questions
- Run `bd ready` to find tracked open issues before starting new work
- Keep the `/status` route minimal — it targets small screens and kiosk displays
- `upcoming.json` is sorted chronologically by `dateStart`
- `data/gold/broadcasts.json` contains per-series broadcast/streaming channels for NL, US, UK regions
- When adding a new page, also add it to `Nav.astro` and update this CLAUDE.md structure section
