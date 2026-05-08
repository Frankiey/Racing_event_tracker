#!/usr/bin/env python3

import json
import os
import re
import subprocess
import sys
from pathlib import Path

WRITE_TOOLS = {"apply_patch", "create_file"}
NPM_UPDATE_PATTERN = re.compile(r"npm\s+(install|update)|npm-check-updates")
UV_UPDATE_PATTERN = re.compile(r"\buv\s+(lock|sync|add)\b")
SKIP_TERMINAL_PATTERN = re.compile(r"npm\s+test|npm\s+run\s+test:pipeline")
JS_FILES = {"package.json", "package-lock.json"}
PY_FILES = {"pyproject.toml", "uv.lock"}


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
        timeout=180,
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
        command_text = tool_input.get("command", "")
        if SKIP_TERMINAL_PATTERN.search(command_text):
            print("{}")
            return 0
        js_changed = bool(NPM_UPDATE_PATTERN.search(command_text))
        py_changed = bool(UV_UPDATE_PATTERN.search(command_text))
    elif tool_name in WRITE_TOOLS:
        paths = {Path(path).name for path in extract_paths(payload)}
        js_changed = bool(paths & JS_FILES)
        py_changed = bool(paths & PY_FILES)
    else:
        print("{}")
        return 0

    commands: list[list[str]] = []
    if js_changed:
        commands.append(["npm", "test"])
    if py_changed:
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
                        "reason": "Automatic maintenance validation failed after a dependency change.",
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
                    "additionalContext": "Automatic maintenance validation passed:\n" + "\n\n".join(summaries),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())