# AI Workflows

RaceTrack supports shared AI workflows for both Claude Code and GitHub Copilot.

## How It Fits Together

- Claude Code source workflows live in `.claude/commands/`.
- GitHub Copilot workspace prompts live in `.github/prompts/`.
- GitHub Copilot custom specialists live in `.github/agents/`.
- `bd` is the required issue tracker for both assistants. Do not use markdown TODO lists or GitHub issues for day-to-day task tracking.

## Agentic-First Rules

- Start from tracked work when possible: check `bd ready`, inspect the relevant issue, and claim or update it.
- Prefer doing the work end-to-end in the repo when the user is asking for execution, not just advice.
- Validate the touched slice as soon as possible after the first substantive change.
- Before ending a coding session with file changes, run `npm test`, `npm run validate:data`, and `npm run build` unless the task scope clearly does not require all of them.
- Close or update the relevant `bd` issue before handoff.

## Shared Slash Commands

| Command | Claude source | Copilot prompt | Purpose |
|---------|---------------|----------------|---------|
| `/add-series` | `.claude/commands/add-series.md` | `.github/prompts/add-series.prompt.md` | Add a new series end-to-end |
| `/new-component` | `.claude/commands/new-component.md` | `.github/prompts/new-component.prompt.md` | Create a new Astro component |
| `/pipeline-debug` | `.claude/commands/pipeline-debug.md` | `.github/prompts/pipeline-debug.prompt.md` | Diagnose and fix pipeline issues |
| `/seed-audit` | `.claude/commands/seed-audit.md` | `.github/prompts/seed-audit.prompt.md` | Audit seed data structure |
| `/season-update` | `.claude/commands/season-update.md` | `.github/prompts/season-update.prompt.md` | Refresh season data |
| `/update-deps` | `.claude/commands/update-deps.md` | `.github/prompts/update-deps.prompt.md` | Upgrade npm and Python dependencies |
| `/verify-dates` | `.claude/commands/verify-dates.md` | `.github/prompts/verify-dates.prompt.md` | Cross-check race dates |
| `/ai-workflows` | n/a | `.github/prompts/ai-workflows.prompt.md` | Explain and route to the right workflow |

## Copilot Specialists

| Agent | File | Focus |
|-------|------|-------|
| `racetrack-pipeline` | `.github/agents/racetrack-pipeline.agent.md` | Bronze/silver/gold data work, audits, calendar maintenance |
| `racetrack-frontend` | `.github/agents/racetrack-frontend.agent.md` | Astro UI, components, pages, client-side conventions |
| `racetrack-maintenance` | `.github/agents/racetrack-maintenance.agent.md` | Dependency upgrades, maintenance, quality gates |
| `racetrack-workflow-router` | `.github/agents/racetrack-workflow-router.agent.md` | Workflow selection and delegation |

## Choosing a Workflow

- Use `/add-series` for new championship support, metadata wiring, and pipeline integration.
- Use `/new-component` for UI additions that should follow Astro and project conventions.
- Use `/pipeline-debug` when data is missing, stale, malformed, or rendering incorrectly.
- Use `/seed-audit` before bulk edits to manual seed files.
- Use `/season-update` for broad calendar refreshes or season rollover work.
- Use `/update-deps` for coordinated npm and Python dependency upgrades.
- Use `/verify-dates` to sanity-check upcoming schedules and statuses.

## bd Quick Reference

```bash
bd ready
bd show <id>
bd update <id> --claim
bd close <id>
```

If new follow-up work appears during execution, file it in `bd` before finishing the session.