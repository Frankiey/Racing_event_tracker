#!/usr/bin/env bash
# Lint .agents/skills against the Agent Skills spec basics.
set -u
cd "$(dirname "$0")/.."
rc=0
for f in .agents/skills/*/SKILL.md; do
  dir=$(basename "$(dirname "$f")")
  fm=$(awk 'NR==1&&/^---$/{f=1;next} f&&/^---$/{exit} f' "$f")
  name=$(printf '%s\n' "$fm" | sed -n 's/^name:[[:space:]]*//p' | head -1 | tr -d "\"'")
  # description may be inline, quoted, or a >- / | block
  desc=$(printf '%s\n' "$fm" | awk '/^description:/{sub(/^description:[[:space:]]*/,"");print;f=1;next} f&&/^[^ ]/{exit} f{sub(/^[[:space:]]+/,"");print}')
  desc=${desc#>-}; desc=${desc#|}
  err() { echo "FAIL $f: $1"; rc=1; }
  [ "$name" = "$dir" ] || err "name '$name' != folder '$dir'"
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ && ${#name} -le 64 ]] || err "bad name '$name'"
  n=$(printf '%s' "$desc" | tr '\n' ' ' | wc -c | tr -d ' ')
  [ "$n" -ge 1 ] && [ "$n" -le 1024 ] || err "description length $n not in 1..1024"
  [ "$(wc -l < "$f")" -lt 500 ] || err "over 500 lines"
done
[ -L .claude/skills ] || { echo "FAIL .claude/skills is not a symlink"; rc=1; }
[ $rc -eq 0 ] && echo "skills OK"
exit $rc
