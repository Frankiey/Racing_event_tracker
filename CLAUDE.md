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
2. **Run quality gates** (if code changed) - `npm test`, `npm run validate:data`, `npm run build`
3. **Update issue status** - Close finished work, update in-progress items

4. **Verify** - All changes staged and verified
5. **Hand off** - Provide context for next session
<!-- END BEADS INTEGRATION -->

# RaceTrack — Claude Instructions

## Project Overview

RaceTrack is a **static motorsport event tracker**: race calendars, session schedules, standings, and broadcast info for 17 series (F1 through IOMTT) in one dashboard.

- Frontend: Astro (static-first) + Tailwind CSS v4, dark mode default
- Data pipeline: Python managed with `uv` — separate process from the website
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
data/             — bronze/ (local cache), silver/, gold/, seed/ (manual JSON for non-API series)
public/           — static assets
.github/skills/   — shared agent skills (auto-discovered; .claude/skills symlinks here)
.claude/commands/ — Claude slash-command workflows; Copilot mirrors in .github/prompts/, agents in .github/agents/
```

## Domain Knowledge (Skills)

Domain knowledge lives in `.github/skills/` and loads automatically when relevant:

- `astro-frontend-conventions` — Tailwind v4 gotchas, vanilla-script pattern, event bus, time rendering
- `medallion-data-pipeline` — bronze/silver/gold flow, rebuild commands, debugging order
- `seed-data-schema` — seed JSON schema, series IDs, UTC time rules
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

## File Search Tips

- When using Glob, always scope to a subdirectory (`src/`, `docs/`, `data/`, `pipeline/`) — never glob from the project root with `**` patterns (matches thousands of `node_modules` files)
- `pattern: "*.md", path: project_root` finds only root-level files (safe)

## Key Reference Docs

- `docs/architecture.md` — system design, event schema, data-flow paths
- `docs/product-vision.md` — product intent and covered series
- `docs/feature-ideas.md` — feature brainstorm with complexity ratings
- `docs/data-sources/` — per-series API research
- `docs/ai-workflows.md` — Claude/Copilot workflow map and layer model
- `worknotes.md` — current status and open questions

When adding a new page, also add it to `Nav.astro` and update the Directory Map above.
