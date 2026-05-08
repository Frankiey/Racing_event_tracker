#!/usr/bin/env python3

import argparse
import json
import re
import sys
from pathlib import Path

WRITE_OR_EXECUTE_TOOLS = {"apply_patch", "create_file", "run_in_terminal"}
BD_PATTERN = re.compile(r"\bbd\s+(ready|show|update|close|create)\b")


def transcript_has_bd_context(transcript_path: str | None) -> bool:
    if not transcript_path:
        return False

    path = Path(transcript_path)
    if not path.exists():
        return False

    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False

    return bool(BD_PATTERN.search(text))


def command_has_bd_context(tool_input: dict) -> bool:
    command = tool_input.get("command", "")
    return bool(BD_PATTERN.search(command))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", required=True)
    args = parser.parse_args()

    payload = json.load(sys.stdin)
    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input", {})

    if tool_name not in WRITE_OR_EXECUTE_TOOLS:
        print("{}")
        return 0

    if command_has_bd_context(tool_input):
        print("{}")
        return 0

    if transcript_has_bd_context(payload.get("transcript_path")):
        print("{}")
        return 0

    print(
        json.dumps(
            {
                "systemMessage": (
                    f"{args.agent}: establish `bd` context before editing files or "
                    "running terminal commands."
                ),
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": (
                        "Run or reference `bd ready`, `bd show <id>`, or `bd update <id> --claim` first."
                    ),
                    "additionalContext": (
                        "This repo requires `bd` for day-to-day task tracking. If this work maps to an issue, "
                        "establish or reference that issue before proceeding with edit or terminal tools."
                    ),
                },
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())