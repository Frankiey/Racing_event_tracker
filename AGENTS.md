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

**When ending a work session**, complete the steps below.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - `npm test`, `npm run validate:data`, `npm run build`
3. **Update issue status** - Close finished work or leave the issue in progress with current context
4. **Verify** - Ensure the touched files are staged or otherwise ready for the next step in your workflow
5. **Hand off** - Provide context for the next session
<!-- END BEADS INTEGRATION -->

---

# RaceTrack — Agent Instructions

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
.claude/commands/ — Claude slash-command workflows; Copilot mirrors in .github/prompts/, agents in .github/agents/
```

## Domain Knowledge (Skills)

Domain knowledge lives in `.github/skills/` and loads automatically when relevant — do not duplicate it here:

- `astro-frontend-conventions` — Tailwind v4 gotchas, vanilla-script pattern, event bus, time rendering
- `medallion-data-pipeline` — bronze/silver/gold flow, rebuild commands, debugging order
- `seed-data-schema` — seed JSON schema, canonical series IDs, UTC time rules
- `add-new-series` — end-to-end checklist for new championships

## Commands

```bash
# Frontend
npm run dev              # local dev server
npm run preview          # preview production build
npm run typecheck        # Astro typecheck only
npm run test:smoke       # frontend smoke tests only

# Quality gates — run before every handoff with code changes
npm test                 # Astro check + smoke tests + pipeline unit tests
npm run validate:data    # validate seed, silver, and gold JSON
npm run build            # must succeed before pushing

# Data pipeline
npm run fetch-data                             # full pipeline
uv run python -m pipeline --series f1,motogp   # specific series
uv run python -m pipeline --bronze-only        # raw fetch only
```

## Key Reference Docs

- `docs/architecture.md` — system design, event schema, data-flow paths
- `docs/product-vision.md` — product intent and covered series
- `docs/feature-ideas.md` — feature brainstorm with complexity ratings
- `docs/data-sources/` — per-series API research
- `docs/ai-workflows.md` — Claude/Copilot workflow map and layer model

## Agent Workflows (Slash Commands)

| Task | Command | When |
|------|---------|------|
| Upgrade npm + Python deps | `/update-deps` | Monthly |
| Check race dates vs reality | `/verify-dates` | Weekly |
| Audit seed file schemas | `/seed-audit` | Before season updates |
| Full season data refresh | `/season-update` | Start of season / mid-season |
| Add a new series | `/add-series` | On demand |
| Debug pipeline issues | `/pipeline-debug` | On demand |
| Scaffold a new component | `/new-component` | On demand |

Claude Code reads `.claude/commands/`; Copilot mirrors live in `.github/prompts/` with specialists in `.github/agents/` and hooks in `.github/hooks/`.
