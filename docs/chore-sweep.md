# Chore Sweep Runbook

Use this when the user says some version of "do all chores" or asks for a maintenance sweep.

## Goal

Run a focused maintenance pass across dependencies, documentation, code quality, and data quality without drifting into open-ended refactors.

## Required Tracking

Track the sweep in `bd` with one parent chore and child chores for:
- dependency refresh
- documentation refresh
- code quality fixes
- data correctness audit
- follow-up / pressing attentions

If `bd` or terminal execution is unavailable, do not fake completion. Record the exact pending `bd` commands and blocked quality gates in the handoff.

## Suggested Subagent Split

Create one read-only subagent per area:
1. dependency audit
2. docs audit
3. code audit
4. data audit

Each report should return concrete files, suspected defects, blockers, and the smallest useful next edit.

## Pathfinder Method

1. Start from the most concrete anchor in each area.
2. Form one falsifiable local hypothesis.
3. Make the smallest grounded edit that tests that hypothesis.
4. Validate immediately before widening scope.
5. Prefer fixing root causes over patching symptoms.

## Sweep Order

1. Dependencies
- Read `package.json`, `pyproject.toml`, repo memory notes, and any prior work notes.
- Update only versions with evidence of compatibility.
- Note blockers such as TypeScript / Astro peer constraints.

2. Documentation
- Check `README.md`, `docs/architecture.md`, `docs/data-sources/`, `worknotes.md`, and agent instructions.
- Remove stale claims before adding new prose.
- Keep project structure and feature lists aligned with the current tree.

3. Code
- Prioritize live correctness bugs or missing validations over style churn.
- Re-check old review documents before acting; do not assume older findings are still live.
- Add or tighten tests for any bug fix that can regress.

4. Data
- Verify seed and transformed data against session timestamps, date envelopes, and country metadata conventions.
- Fix source-of-truth files first.
- Regenerate derived data after source fixes.

## Required Validation

When terminal execution works, run:
- `npm test`
- `npm run validate:data`
- `npm run build`

If data files changed, rerun the pipeline before `npm run validate:data` when needed.

## Close-Out

Before finishing:
- close completed `bd` items
- file `bd` follow-ups for anything deferred
- update `worknotes.md` with pressing attentions
- document any blocked commands or skipped validations clearly
