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

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - `npm test`, `npm run validate:data`, `npm run build`
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

---

## Project Overview

RaceTrack is a **static motorsport event tracker**. It aggregates race calendars, session schedules, standings, and broadcast info across F1, F2, F3, Formula E, IndyCar, NASCAR, MotoGP, Moto2, Moto3, WEC/endurance, IMSA, DTM, NLS, WSBK, Super Formula, and IOMTT into a single dashboard.

**Tech stack:**
- Frontend: Astro (static-first, island architecture) + Tailwind CSS v4
- Data pipeline: Python (managed with `uv`) — separate process from the website
- Data: JSON files in `data/` — medallion architecture (bronze → silver → gold)
- Hosting: GitHub Pages via GitHub Actions
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
    share-card.ts       — Canvas-based share image generation
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
  bronze/         — Raw API responses (cached, do NOT commit)
  silver/         — Cleaned/normalized per-series JSON
  gold/           — calendar.json, upcoming.json, broadcasts.json
  seed/           — Manual JSON for series without APIs
public/           — Static assets (logos, flags, images)
.claude/commands/ — Claude Code skill files (slash commands)
```

## Series Identifiers

`f1` `f2` `f3` `fe` `indycar` `nascar` `motogp` `moto2` `moto3` `wec` `imsa` `dtm` `nls` `wsbk` `superformula` `iomtt`

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

## Commands

```bash
# Frontend
npm run dev                                    # local Astro dev server
npm run build                                  # production build
npm run preview                                # preview production build

# Quality gates — run before every commit
npm test                                       # Astro check + smoke tests + pipeline unit tests
npm run validate:data                          # validate seed, silver, and gold JSON
npm run build                                  # must succeed before pushing

# Data pipeline
npm run fetch-data                             # run full Python pipeline
uv run python -m pipeline --series f1,motogp  # fetch specific series
uv run python -m pipeline --bronze-only        # fetch raw data only (no transforms)

# Rebuild gold from all silver files
uv run python3 -c "
from pipeline.transforms.gold import build_calendar, build_upcoming
import pathlib, json
SILVER_DIR = pathlib.Path('data/silver')
events = []
for f in SILVER_DIR.glob('*.json'):
    events += json.loads(f.read_text())
build_calendar(events)
build_upcoming(events)
"
```

## Key Conventions

- All times stored in UTC — converted to local time in the browser via `data-local-time` attribute
- `countryCode` must be ISO **alpha-2** (2 letters) — alpha-3 silently returns empty flag emoji
- `upcoming.json` is sorted chronologically by `dateStart` — always sort before applying caps
- Favorites stored in `localStorage['rt-favs']` as JSON array of event IDs
- Cross-component events: `rt-open-event` opens the modal; `rt-favs-changed` syncs fav UI
- Session durations live in `src/lib/sessions.ts` — use `getSessionDurationMinutes()`, don't redefine

## DO / DON'T

**DO:**
- Use `style=` for series colors (e.g. `style="background: #e10600"`)
- Use `data-local-time` attribute on `<time>` elements for UTC → local conversion
- Run `npm run validate:data` after any change to `data/seed/*.json`
- Rebuild gold after editing seed or silver files
- Use `bd` for all task tracking
- Commit `data/gold/` and `data/silver/` — they are the source of truth for the frontend
- Use ISO 8601 UTC for all session times (`2026-05-10T13:00:00Z`)

**DON'T:**
- Don't add a backend, database, or auth
- Don't use dynamic Tailwind class names like `bg-[#hex]` — they don't work in Tailwind v4
- Don't use alpha-3 country codes — `countryFlag()` silently ignores them
- Don't hardcode timezone offsets — use `Intl` / browser APIs
- Don't add framework islands — vanilla `<script>` tags only
- Don't commit `data/bronze/` — it's a local cache
- Don't skip quality gates before pushing
- Don't over-abstract or add features beyond what was asked
- Don't use `npm` to manage Python deps — use `uv`

## Data Pipeline Overview

The pipeline uses a **medallion architecture**:

1. **Bronze** (`data/bronze/`) — raw API responses, cached locally, never committed
2. **Silver** (`data/silver/`) — cleaned and normalized per-series JSON, committed
3. **Gold** (`data/gold/`) — merged `calendar.json` and `upcoming.json`, committed

Series with stable free APIs (F1, MotoGP, NASCAR) are fetched automatically. Series without APIs use manually curated **seed files** in `data/seed/` which feed directly into silver transforms.

When editing seed data, always rebuild:
```bash
uv run python -m pipeline --series <id>
npm run validate:data
```

## Agent Workflows (Slash Commands)

| Task | Skill | When |
|------|-------|------|
| Upgrade npm + Python deps | `/update-deps` | Monthly |
| Check race dates vs reality | `/verify-dates` | Weekly |
| Audit seed file schemas | `/seed-audit` | Before season updates |
| Full season data refresh | `/season-update` | Start of season / mid-season |
| Add a new series | `/add-series` | On demand |
| Debug pipeline issues | `/pipeline-debug` | On demand |

Run skills via Claude Code: type `/verify-dates`, `/seed-audit`, etc. in the prompt.
