#!/usr/bin/env python3

import json
import os
import re
import subprocess
import sys
from pathlib import Path

WRITE_TOOLS = {"apply_patch", "create_file"}
SKIP_TERMINAL_PATTERN = re.compile(r"npm\s+run\s+(validate:data|test:pipeline)|uv\s+run\s+python\s+-m\s+pipeline")


def normalize_path(path_value: str, cwd: str) -> str:
    path = Path(path_value)
    if path.is_absolute():
        try:
            return os.path.relpath(path, cwd)
        except ValueError:
            return str(path)
    return str(path)


def extract_paths(payload: dict) -> list[str]:
    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input", {})
    cwd = payload.get("cwd", ".")

    if tool_name == "create_file":
        file_path = tool_input.get("filePath")
        return [normalize_path(file_path, cwd)] if file_path else []

    if tool_name == "apply_patch":
        patch = tool_input.get("input", "")
        matches = re.findall(r"\*\*\* (?:Add|Update|Delete) File: (.+)", patch)
        return [normalize_path(match.strip(), cwd) for match in matches]

    return []


def run_command(command: list[str], cwd: str) -> tuple[int, str]:
    result = subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    output = "\n".join(part for part in [result.stdout.strip(), result.stderr.strip()] if part)
    return result.returncode, "\n".join(output.splitlines()[-20:])


def main() -> int:
    payload = json.load(sys.stdin)
    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input", {})
    cwd = payload.get("cwd", ".")

    if tool_name == "run_in_terminal":
        command = tool_input.get("command", "")
        if SKIP_TERMINAL_PATTERN.search(command):
            print("{}")
            return 0

    if tool_name not in WRITE_TOOLS:
        print("{}")
        return 0

    paths = extract_paths(payload)
    commands: list[list[str]] = []

    if any(path.startswith("data/") for path in paths):
        commands.append(["npm", "run", "validate:data"])
    if any(path.startswith("pipeline/") for path in paths):
        commands.append(["npm", "run", "test:pipeline"])

    if not commands:
        print("{}")
        return 0

    summaries: list[str] = []
    for command in commands:
        return_code, output = run_command(command, cwd)
        summary = f"$ {' '.join(command)}\n{output}".strip()
        summaries.append(summary)
        if return_code != 0:
            print(
                json.dumps(
                    {
                        "decision": "block",
                        "reason": "Automatic pipeline validation failed after a write operation.",
                        "hookSpecificOutput": {
                            "hookEventName": "PostToolUse",
                            "additionalContext": summary,
                        },
                    }
                )
            )
            return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": "Automatic pipeline validation passed:\n" + "\n\n".join(summaries),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())