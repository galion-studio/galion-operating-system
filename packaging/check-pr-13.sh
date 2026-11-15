#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Re-check draft #13 against main. This script does not merge, push, or edit #13.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

for arg in "$@"; do
  case $arg in
    --merge|--execute|--push)
      printf 'refused: this script does not merge pull request 13. The owner merges it.\n'
      exit 2
      ;;
    *)
      printf 'refused: unknown argument: %s\n' "$arg"
      exit 2
      ;;
  esac
done

MAIN_REF=origin/main
PR_REF=origin/cursor/os-packaging-plan-3946
PR_HEAD=3adee77f86c3dfb8cd32f9070ad045f018e9b046
PR_BASE=b9517e92815dd72196b435613ad9130abaa68336
MERGE14=bf222991d1c4f9f88f205cb621288d44211baa46
fail=0

say() {
  printf '%s\n' "$1"
}

say "pr-13 merge readiness"
say "merge command: not run"
main_sha=$(git rev-parse "$MAIN_REF")
pr_sha=$(git rev-parse "$PR_REF")
say "main: $main_sha"
say "pr13: $pr_sha"
if [ "$pr_sha" != "$PR_HEAD" ]; then
  say "error: #13 head moved from $PR_HEAD"
  fail=1
else
  say "pr13 head matches 3adee77f86c3dfb8cd32f9070ad045f018e9b046"
fi

for f in docs/PACKAGING.md docs/PACKAGING-DECISIONS.md NOTICE docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md; do
  if git cat-file -e "$MAIN_REF:$f" 2>/dev/null; then
    say "PRESENT on main: $f"
    fail=1
  else
    say "absent on main: $f"
  fi
  if git cat-file -e "$PR_REF:$f" 2>/dev/null; then
    say "present on #13: $f"
  else
    say "ABSENT on #13: $f"
    fail=1
  fi
done

notice=$(git show "$PR_REF:NOTICE")
say "NOTICE on #13: $notice"
if [ "$notice" != "The licence is LICENSE." ]; then
  say "error: NOTICE on #13 is not the one-line pointer"
  fail=1
fi

if git merge-base --is-ancestor "$MERGE14" "$PR_REF"; then
  say "bf222991d1c4f9f88f205cb621288d44211baa46 is on the #13 branch"
else
  say "error: #14 merge commit is not on the #13 branch"
  fail=1
fi
if git merge-base --is-ancestor "$MERGE14" "$MAIN_REF"; then
  say "error: #14 merge commit is on main"
  fail=1
else
  say "bf222991d1c4f9f88f205cb621288d44211baa46 is not on main"
fi

say "files on #13 since $PR_BASE:"
diff_names=$(git diff --name-only "$PR_BASE" "$PR_REF")
printf '%s\n' "$diff_names" | while IFS= read -r line; do
  [ -n "$line" ] || continue
  say "  $line"
done
expected=$(printf '%s\n' \
  NOTICE \
  docs/PACKAGING-DECISIONS.md \
  docs/PACKAGING.md \
  docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md)
if [ "$diff_names" != "$expected" ]; then
  say "error: #13 file list is not the four documentation files"
  fail=1
else
  say "#13 diff is the four documentation files. No workflow, image, or price file."
fi

for id in "D1" "D2" "D3" "D4" "D5"; do
  if git grep -q "^### ${id}\\. " "$PR_REF" -- docs/PACKAGING.md; then
    say "heading present: $id"
  else
    say "heading missing: $id"
    fail=1
  fi
done

expected_license=$(printf '%s\n' \
  "G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network" \
  "Developed and distributed by Galion Labs" \
  "Perpetual Open MIT License" \
  "Copyright © 2026 Galion Labs. All rights reserved.")
actual_license=$(git show "$MAIN_REF:LICENSE" | head -n 4)
if [ "$actual_license" = "$expected_license" ]; then
  say "LICENSE header on main matches the four Galion Labs lines"
else
  say "error: LICENSE header on main changed"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  say "result: readiness check failed"
  exit 1
fi
say "result: readiness check passed. The owner merges #13. This script did not."
