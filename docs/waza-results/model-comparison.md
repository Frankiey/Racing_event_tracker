# Model comparison — add-new-series flagship suite

Executor: `copilot-sdk` (real models) · waza 0.38.0 · 1 trial/task · 2026-07-15
Suite: `evals/add-new-series/` (5 tasks: happy path, 3 traps, 1 anti-trigger)

| Task | claude-sonnet-4.6 | gemini-3.5-flash | gpt-5.4-mini |
|------|------|------|------|
| Happy path — add fgt seed series | ✅ | ❌ | ✅ |
| Anti-trigger — component typo fix | ✅ | ❌ | ✅ |
| Trap — alpha-3 country codes | ❌ | ✅ | ❌ |
| Trap — dynamic Tailwind class | ❌ | ❌ | ❌ |
| Trap — unannounced session times | ❌ | ✅ | ❌ |
| **Pass rate** | **40%** | **40%** | **40%** |

## What the failures actually were

Reading the transcripts matters — the uniform 40% hides three different stories:

**Genuine trap catches (the evals working as designed):**
- *Placeholder times* — both claude-sonnet-4.6 and gpt-5.4-mini used `null` /
  omitted times for TBA sessions instead of the repo's `T00:00:00Z` placeholder
  convention. Exactly the bug the trap encodes.
- *Alpha-2 case* — claude-sonnet-4.6 converted alpha-3 → alpha-2 but used
  uppercase `NL`/`GB`; the repo convention (and grader) is lowercase.
- *Gemini's happy path* — 57 tool calls (budget 50) and a session timeout while
  exploring `bd` and skill files instead of doing the task; its anti-trigger run
  also timed out mid-exploration.

**Grader artifacts (eval-design lessons):**
- *Dynamic Tailwind* — claude-sonnet-4.6 and gemini both **warned against**
  `bg-[#00c2a8]` / `bg-[${...}]` and recommended inline `style`, i.e. gave the
  correct answer — but `not_contains` can't tell mention from use, so quoting
  the anti-pattern trips the grader. gpt-5.4-mini's failure was real (it never
  mentioned the style mechanism).
- Text graders only see the final chat message; a model that silently writes a
  correct file but summarizes tersely can "fail" a `contains` check. Use
  `file`/`diff` graders for file-shaped assertions in the next iteration.

## Operational warning: workspace escape

The copilot-sdk executor's agents **escaped the temp workspace and edited this
actual repository** during the run: created `data/seed/fgt.json` +
`data/silver/fgt.json`, registered `fgt` in `pipeline/config.py`,
`pipeline/run.py`, `src/lib/series.ts`, `src/lib/ics.ts`, and rebuilt
`data/gold/*.json` (7 fictional events in the published calendar). All changes
were reverted immediately. Until this is understood/prevented, **run
real-executor evals from a detached copy of the suite in a scratch directory
and audit `git status` afterwards** — or in a container. The mock-executor CI
path is unaffected (no tools are executed).
