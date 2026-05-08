---
description: "Verify RaceTrack event dates against likely reality. Use when checking for stale schedules, wrong dates, placeholder times, or inconsistent statuses."
name: "Verify Dates"
argument-hint: "Optional series or date range to focus on"
agent: "racetrack-pipeline"
---

Follow the full repo workflow in [./../../.claude/commands/verify-dates.md](./../../.claude/commands/verify-dates.md).

Audit the relevant seed and gold data, fix clear issues when appropriate, and summarize findings in priority order.

Agentic execution requirements:
- Use `bd` for task tracking when the verification work is part of a tracked maintenance task.
- Fix clear, local data issues directly when the evidence is strong instead of only listing them.
- Validate the affected series rebuild after each concrete data fix.
- Before finishing a coding session, run the relevant quality gates and update the `bd` issue state.