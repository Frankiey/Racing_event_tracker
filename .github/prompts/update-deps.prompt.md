---
description: "Upgrade RaceTrack npm and Python dependencies. Use when refreshing package versions and validating the repo after dependency changes."
name: "Update Dependencies"
argument-hint: "Optional scope or constraints for the dependency update"
agent: "agent"
---

Follow the full repo workflow in [./../../.claude/commands/update-deps.md](./../../.claude/commands/update-deps.md).

Report major version bumps and stop if validation fails instead of pushing through blindly.

Agentic execution requirements:
- Use `bd` for task tracking and attach the dependency work to an issue before making broad version changes.
- Perform the upgrade directly in the repo when the user asks for it instead of returning a manual checklist.
- Treat failing validation as a blocker to resolve or clearly report, not something to defer silently.
- Before finishing a coding session, run `npm test`, `npm run validate:data`, `npm run build`, and update the `bd` issue state.