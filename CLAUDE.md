Use 'bd' for task tracking

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:1105d646 -->
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

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
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
