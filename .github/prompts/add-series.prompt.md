---
description: "Add a new motorsport series to RaceTrack end-to-end. Use when adding a new series, wiring pipeline support, or creating seed data."
name: "Add Series"
argument-hint: "Series name and ID, for example: GT World Challenge, id: gtworld"
agent: "agent"
---

Follow the full repo workflow in [./../../.claude/commands/add-series.md](./../../.claude/commands/add-series.md).

Apply that workflow to the user's requested series and complete the implementation in this repository.

Key constraints to keep in mind while working:
- Use `bd` for task tracking.
- Keep `countryCode` values ISO alpha-2.
- Store all event times in UTC.
- Use `style=` for dynamic series colors instead of dynamic Tailwind classes.

Agentic execution requirements:
- Start by checking `bd ready` or the user-provided issue context, then claim or update the relevant issue when appropriate.
- Do the work end-to-end instead of stopping at advice when the user is asking for implementation.
- Prefer the narrowest validating command after each substantive change.
- Before finishing a coding session, run the relevant quality gates and update the `bd` issue state.