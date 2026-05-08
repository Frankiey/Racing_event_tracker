---
description: "Scaffold a new Astro component for RaceTrack. Use when creating a new component or UI slice that should follow repo conventions."
name: "New Component"
argument-hint: "Describe the component and where it should be used"
agent: "agent"
---

Follow the full repo workflow in [./../../.claude/commands/new-component.md](./../../.claude/commands/new-component.md).

Create the component requested by the user and wire it into the appropriate page or layout.

Key constraints to keep in mind while working:
- Use `bd` for task tracking.
- Vanilla `<script>` only, no framework islands.
- Use `LocalTime` for UTC-to-local rendering.
- Use `style=` for dynamic colors.
- Follow existing cross-component event patterns such as `rt-open-event` and `rt-favs-changed`.

Agentic execution requirements:
- Check for an existing relevant `bd` issue before starting new work, and claim or update it when appropriate.
- Implement the component, wire it up, and validate it instead of stopping at a scaffold outline unless the user asks for planning only.
- Prefer focused validation on the touched slice before broad test runs.
- Before finishing a coding session, run the relevant quality gates and update the `bd` issue state.