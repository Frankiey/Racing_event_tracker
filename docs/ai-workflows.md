# AI Workflows

RaceTrack supports shared AI workflows for both Claude Code and GitHub Copilot.

## How It Fits Together

- Claude Code source workflows live in `.claude/commands/`.
- GitHub Copilot workspace prompts live in `.github/prompts/`.
- GitHub Copilot custom specialists live in `.github/agents/`.
- GitHub Copilot custom-agent hook scripts live in `.github/hooks/`.
- `bd` is the required issue tracker for both assistants. Do not use markdown TODO lists or GitHub issues for day-to-day task tracking.

## Agentic-First Rules

- Start from tracked work when possible: check `bd ready`, inspect the relevant issue, and claim or update it.
- Use `bd prime` when you need the full workflow reference, and `bd remember` for persistent tracker notes.
- Prefer doing the work end-to-end in the repo when the user is asking for execution, not just advice.
- Validate the touched slice as soon as possible after the first substantive change.
- Before ending a coding session with file changes, file any follow-up work in `bd`, run `npm test`, `npm run validate:data`, and `npm run build` unless the task scope clearly does not require all of them, then update or close the relevant `bd` issue before handoff.

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

## Copilot Hooks

- Agent-specific hook command scripts live in `.github/hooks/`.
- `racetrack-pipeline` and `racetrack-maintenance` use agent-scoped hooks to inject `bd` context at session start, ask for confirmation when edit or terminal work starts without `bd` context, and run narrow automatic validation after relevant writes.
- Enable `chat.useCustomAgentHooks` in VS Code so custom-agent hooks run.
- Keep hook scripts small and auditable; they run shell commands with the same permissions as VS Code.

| Hook file | Purpose |
|-----------|---------|
| `.github/hooks/agent_session_context.py` | Pull issue/session context into matching agents at startup |
| `.github/hooks/agent_bd_guard.py` | Guard edit and terminal actions when no `bd` context is attached |
| `.github/hooks/pipeline_post_tool_validate.py` | Run narrow post-edit validation for pipeline-focused work |
| `.github/hooks/maintenance_post_tool_validate.py` | Run narrow post-edit validation for maintenance work |

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
bd prime
bd ready
bd show <id>
bd update <id> --claim
bd close <id>
bd remember
```

If new follow-up work appears during execution, file it in `bd` before finishing the session.