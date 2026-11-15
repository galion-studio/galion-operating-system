#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Record that pull request 13 is on main. This script does not merge, push, or edit a branch.

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
MERGE13=09540d5a0b07e9399791d2d3d86c717c54802371
MERGE14=bf222991d1c4f9f88f205cb621288d44211baa46
fail=0

say() {
  printf '%s\n' "$1"
}

say "pr-13 landed"
say "merge command: not run"
main_sha=$(git rev-parse "$MAIN_REF")
say "main: $main_sha"

if git merge-base --is-ancestor "$MERGE13" "$MAIN_REF"; then
  say "09540d5a0b07e9399791d2d3d86c717c54802371 is on main"
else
  say "error: pull request 13 merge commit is not on main"
  fail=1
fi

if git merge-base --is-ancestor "$MERGE14" "$MAIN_REF"; then
  say "bf222991d1c4f9f88f205cb621288d44211baa46 is on main because pull request 13 merged"
else
  say "error: pull request 14 merge commit is not on main"
  fail=1
fi

for f in docs/PACKAGING.md docs/PACKAGING-DECISIONS.md NOTICE docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md; do
  if git cat-file -e "$MAIN_REF:$f" 2>/dev/null; then
    say "present on main: $f"
  else
    say "ABSENT on main: $f"
    fail=1
  fi
done

notice=$(git show "$MAIN_REF:NOTICE")
say "NOTICE on main: $notice"
if [ "$notice" != "The licence is LICENSE." ]; then
  say "error: NOTICE on main is not the one-line pointer"
  fail=1
fi

for id in "D1" "D2" "D3" "D4" "D5"; do
  if git grep -q "^### ${id}\\. " "$MAIN_REF" -- docs/PACKAGING.md; then
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
  say "result: landed check failed"
  exit 1
fi
say "result: pull request 13 is on main. This script did not merge it."
