---
description: "Refresh RaceTrack season data end-to-end. Use at season rollover or for large calendar reshuffles across multiple series."
name: "Season Update"
argument-hint: "Season year or scope of the refresh"
agent: "racetrack-pipeline"
---

Follow the full repo workflow in [./../../.agents/skills/season-update/SKILL.md](./../../.agents/skills/season-update/SKILL.md).

Handle the refresh in the prescribed order: audit, update source data, rebuild derived data, run quality gates, and summarize risks or follow-up work.

Agentic execution requirements:
- Use `bd` for task tracking and break out follow-up issues when the season refresh uncovers deferred work.
- Execute the full refresh workflow in order instead of stopping at recommendations when the user is asking for the update.
- Validate each major stage before moving on to the next one.
- Before finishing a coding session, run `npm test`, `npm run validate:data`, `npm run build`, and update the `bd` issue state.