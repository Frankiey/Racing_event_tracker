---
description: "Show the shared AI workflows available in this repo and explain how Claude Code, GitHub Copilot, and bd fit together. Use when onboarding or choosing the right workflow."
name: "AI Workflows"
argument-hint: "Optional task you want help choosing a workflow for"
agent: "racetrack-workflow-router"
---

Use [./../../docs/ai-workflows.md](./../../docs/ai-workflows.md) as the source of truth.

Help the user choose the right workflow for the task, explain the matching slash command, and call out the `bd` issue-tracking expectations.

Agentic execution requirements:
- Recommend the smallest workflow that matches the task.
- Prefer doing the work in-chat when the user is already asking to execute it.
- Remind the agent to use `bd` instead of ad hoc TODO tracking.