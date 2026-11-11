# Skills: harness-specific extras

Skills in `.agents/skills/` use spec-only frontmatter (`name`, `description`). Claude-only or Codex-only keys
removed from `SKILL.md` are recorded here; Codex settings go in `<skill>/agents/openai.yaml`.

| skill | key | value |
|---|---|---|
| _(none)_ | — | No skill had harness-specific keys at migration time. `beads` keeps its Codex `agents/openai.yaml`. |

`.claude/commands/add-series.md` stays a Claude-only command (thin duplicate of the `add-new-series` skill).
