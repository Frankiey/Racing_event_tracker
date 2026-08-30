#!/usr/bin/env bash
#
# Program grader for the seed-data-schema eval (waza `type: program`).
#
# Purpose: grade tasks by shelling out to RaceTrack's REAL data validators
# (`npm run validate:data` -> pipeline/validate.py, and
# `uv run python -m pipeline.verify_dates`) instead of re-encoding "is this
# seed edit valid" as a second, hand-maintained set of eval-YAML assertions.
#
# waza contract (docs/graders/program.md): agent output arrives on stdin,
# the post-execution workspace directory is $WAZA_WORKSPACE_DIR, exit 0 is
# pass / nonzero is fail, and stdout becomes the grader's feedback message.
#
# --- Why this can't just `cd "$WAZA_WORKSPACE_DIR" && npm run validate:data` ---
#
# $WAZA_WORKSPACE_DIR is an ISOLATED COPY containing only this task's
# fixture file(s) (e.g. fgt-broken-seed.json) -- it is not a checkout of
# the RaceTrack repo. There is no package.json, no pipeline/ package, no
# real data/seed tree in there, so the real validator commands cannot run
# *inside* it at all. This script instead:
#
#   1. Resolves the real project checkout relative to ITS OWN path on
#      disk (three levels up from evals/seed-data-schema/graders/), not
#      relative to CWD or to $WAZA_WORKSPACE_DIR.
#   2. Sanity-checks that the workspace fixture(s) the agent was supposed
#      to operate on are actually present and parse as JSON.
#   3. Runs the two real validators against the project checkout and
#      gates on their exit codes / output.
#
# --- What this proves under `mock` (Track A, this repo today) vs real ---
#
# The `mock` executor never runs a real model, so nothing ever gets
# edited into $WAZA_WORKSPACE_DIR by an agent. This script therefore
# CANNOT prove "the agent's fix passes validation" under mock -- there is
# no agent fix to check. What it DOES prove under mock:
#   - the workspace plumbing is wired correctly (fixture materialized,
#     readable, valid JSON),
#   - the wrapper script itself runs end-to-end from an arbitrary CWD,
#   - the real validator commands are invocable and currently pass
#     against the project's actual data (a regression tripwire: if
#     someone breaks validate:data or verify_dates, this grader fails
#     even under mock).
#
# Once a real model executor is wired up (Track B), point step 2/3 at the
# agent's *edited* copy of the seed file inside a real workspace checkout
# (e.g. by running the fixture through the real validator functions
# directly) and this same script becomes a genuine "did the fix pass"
# gate. Tracked as follow-up, not implemented here (Track A is mock-only).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKSPACE="${WAZA_WORKSPACE_DIR:-}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# Agent output is on stdin per the program grader contract; we don't need
# its content (the real validators are the grading mechanism), but drain
# it so the calling process doesn't block on a full pipe.
cat >/dev/null || true

[ -n "$WORKSPACE" ] || fail "WAZA_WORKSPACE_DIR is not set"
[ -d "$WORKSPACE" ] || fail "WAZA_WORKSPACE_DIR '$WORKSPACE' does not exist"
[ -f "$REPO_ROOT/package.json" ] || fail "resolved REPO_ROOT '$REPO_ROOT' doesn't look like the RaceTrack repo (no package.json)"

echo "== workspace fixture check (WAZA_WORKSPACE_DIR=$WORKSPACE) =="
shopt -s nullglob
fixtures=("$WORKSPACE"/*.json)
shopt -u nullglob
[ "${#fixtures[@]}" -gt 0 ] || fail "no .json fixture found in workspace"
for f in "${fixtures[@]}"; do
  python3 -c "import json, sys; json.load(open(sys.argv[1]))" "$f" \
    || fail "workspace fixture '$f' is not valid JSON"
  echo "  ok: $(basename "$f") is present and parses as JSON"
done

echo "== real validator: npm run validate:data (repo: $REPO_ROOT) =="
if ! ( cd "$REPO_ROOT" && npm run --silent validate:data ); then
  fail "npm run validate:data failed against the project's real seed/silver/gold data"
fi

echo "== real validator: uv run python -m pipeline.verify_dates (repo: $REPO_ROOT) =="
issues_json="$(mktemp)"
trap 'rm -f "$issues_json"' EXIT
if ! ( cd "$REPO_ROOT" && uv run python -m pipeline.verify_dates ) >"$issues_json"; then
  fail "pipeline.verify_dates failed to run"
fi
python3 -c "
import json, sys
issues = json.load(open(sys.argv[1]))
print(f'  verify_dates reported {len(issues)} issue(s) on real project data')
" "$issues_json"

echo "PASS: workspace fixture is inspectable and both real validators ran cleanly"
