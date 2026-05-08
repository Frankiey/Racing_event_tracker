---
description: "Diagnose and fix a RaceTrack data pipeline issue. Use when data is missing, malformed, stale, or not rendering in the UI."
name: "Pipeline Debug"
argument-hint: "Describe the symptom and affected series"
agent: "agent"
---

Follow the full repo workflow in [./../../.claude/commands/pipeline-debug.md](./../../.claude/commands/pipeline-debug.md).

Work through the problem from bronze to silver to gold, make the needed fix, and validate it with the narrowest relevant checks.

Agentic execution requirements:
- Use `bd` for task tracking and update the relevant issue when the debugging work maps to tracked work.
- Follow the data flow until the root cause is fixed rather than stopping at diagnosis when a fix is feasible.
- Run the narrowest discriminating validation immediately after the first substantive fix.
- Before finishing a coding session, run the relevant quality gates and update the `bd` issue state.