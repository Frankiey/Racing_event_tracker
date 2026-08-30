# waza results

Artifacts backing the skill-eval story (see the internal eval plan and blog outline —
draft planning docs, not part of this public directory). Produced with
[microsoft/waza](https://github.com/microsoft/waza) **0.38.0**.

| Path | What it is |
|------|------------|
| `baseline/` | Raw `waza check` + `waza tokens count` output for all 4 skills **before** the compliance pass (all Medium-High, all over the 500-token limit) |
| `after/` | Same commands **after** the pass (all High, all under budget) |
| `agent-constraint/router-green.txt` | Workflow-router agent eval passing 3/3 with an explicit `tool_constraint` grader |
| `agent-constraint/router-violation-demo.txt` | The violation case: tool-usage policy mismatch → run fails, exit code 1 |
| `model-comparison.md` | Flagship `add-new-series` suite run on real models via the copilot-sdk executor |

Reproduce locally:

```bash
waza check                                        # compliance, all skills
waza run                                          # all 4 skill suites (mock)
waza run evals/racetrack-workflow-router/eval.yaml  # agent eval (mock)
```
