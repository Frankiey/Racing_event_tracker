#!/usr/bin/env python3

import argparse
import json
import subprocess
import sys


def run_bd_ready(cwd: str) -> str:
    try:
        result = subprocess.run(
            ["bd", "ready"],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except FileNotFoundError:
        return "`bd` is not available in PATH for this session."
    except Exception as exc:  # pragma: no cover - defensive hook path
        return f"Unable to query `bd ready`: {exc}"

    output = (result.stdout or result.stderr).strip()
    if not output:
        return "`bd ready` returned no items."

    return "\n".join(output.splitlines()[:8])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", required=True)
    args = parser.parse_args()

    payload = json.load(sys.stdin)
    cwd = payload.get("cwd", ".")
    snapshot = run_bd_ready(cwd)
    context = (
        f"{args.agent}: start from `bd` tracked work when possible. "
        "Before edits or terminal work, prefer `bd ready`, `bd show <id>`, and "
        "`bd update <id> --claim` when the task maps to an issue.\n"
        "Current `bd ready` snapshot:\n"
        f"{snapshot}"
    )

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": context,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())