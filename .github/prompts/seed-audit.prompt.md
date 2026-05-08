---
description: "Audit RaceTrack seed file schemas. Use before season updates or when validating seed-file structure and data consistency."
name: "Seed Audit"
argument-hint: "Optional series to focus on, otherwise audit all seed files"
agent: "racetrack-pipeline"
---

Follow the full repo workflow in [./../../.claude/commands/seed-audit.md](./../../.claude/commands/seed-audit.md).

Run the audit, fix structural issues in scope, and rebuild affected derived data when needed.

Agentic execution requirements:
- Use `bd` for task tracking for bulk audit or remediation work.
- Fix straightforward schema issues during the audit when the correction is local and well supported.
- Rebuild only the affected derived data first, then widen validation if needed.
- Before finishing a coding session, run the relevant quality gates and update the `bd` issue state.