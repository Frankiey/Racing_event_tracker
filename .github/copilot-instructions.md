# Copilot Instructions — RaceTrack

## Task Tracking

This project uses **bd (beads)** for issue tracking — do NOT use markdown TODO lists or GitHub issues for day-to-day tasks.

```bash
bd prime              # Show workflow details
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
bd remember           # Store persistent tracker notes
```

**Session close protocol** — before finishing a session:
1. File issues for remaining work (`bd create`)
2. Run quality gates (`npm test`, `npm run validate:data`, `npm run build`)
3. Update or close the relevant issue (`bd update`, `bd close <id>`)

---

## Project Overview

RaceTrack is a **static motorsport event tracker**: race calendars, session schedules, standings, and broadcast info for 17 series (F1 through IOMTT) in one dashboard.

- Frontend: Astro (static-first) + Tailwind CSS v4, dark mode default
- Data pipeline: Python managed with `uv` (never pip, never npm for Python deps)
- Data: JSON in `data/` — medallion architecture (bronze → silver → gold)
- Hosting: GitHub Pages via GitHub Actions
- **No backend, no database, no auth** — don't add them; don't over-abstract or add features beyond what was asked

## Directory Map

```
src/pages/        — index, calendar, watchlist, status (kiosk), recap, passport, series/[id], widget/[series]
src/components/   — EventCard, EventModal, Countdown, SeriesBadge, SeriesFilter, Nav, LocalTime, WeekendTimeline
src/layouts/      — Layout.astro (HTML shell + Nav + EventModal)
src/lib/          — series.ts, client-utils.ts, ics.ts, sessions.ts, time.ts, types.ts, and friends
pipeline/         — Python fetchers (bronze) + transforms (silver/gold), config.py, run.py
data/             — bronze/ (local cache, not committed), silver/, gold/, seed/ (manual JSON for non-API series)
public/           — static assets
.github/skills/   — shared agent skills (auto-discovered; .claude/skills symlinks here)
.github/prompts/  — Copilot workspace prompts mirroring .claude/commands/
.github/agents/   — Copilot specialists (frontend, pipeline, maintenance, router)
.github/hooks/    — Copilot custom-agent guard and validation hooks
```

## Domain Knowledge (Skills)

Domain knowledge lives in `.github/skills/` and loads automatically when relevant — do not duplicate it here:

- `astro-frontend-conventions` — Tailwind v4 gotchas, vanilla-script pattern, event bus, time rendering
- `medallion-data-pipeline` — bronze/silver/gold flow, rebuild commands, debugging order
- `seed-data-schema` — seed JSON schema, canonical series IDs, UTC time rules
- `add-new-series` — end-to-end checklist for new championships

## Commands

```bash
npm run dev              # local dev server
npm run build            # production build (quality gate)
npm test                 # Astro check + smoke tests + pipeline unit tests (quality gate)
npm run validate:data    # validate seed/silver/gold JSON (quality gate)
npm run typecheck        # Astro typecheck only
npm run fetch-data       # full Python pipeline
uv run python -m pipeline --series f1,motogp   # specific series
```

## Shared AI Workflows

| Task | Command | When |
|------|---------|------|
| Upgrade npm + Python deps | `/update-deps` | Monthly |
| Check race dates vs reality | `/verify-dates` | Weekly |
| Audit seed file schemas | `/seed-audit` | Before season updates |
| Full season data refresh | `/season-update` | Start of season / mid-season |
| Add a new series | `/add-series` | On demand |
| Debug pipeline issues | `/pipeline-debug` | On demand |
| Scaffold a new component | `/new-component` | On demand |
| Show the shared workflow map | `/ai-workflows` | Route to the right workflow |

For the shared workflow index and layer model, see `docs/ai-workflows.md`.
