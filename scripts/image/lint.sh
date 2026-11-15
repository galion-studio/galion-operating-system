#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Syntax-check the image scripts. CI sets REQUIRE_SHELLCHECK=1.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dir="$ROOT/scripts/image"

shopt -s nullglob
scripts=("$dir"/*.sh)
shopt -u nullglob

if [[ "${#scripts[@]}" -eq 0 ]]; then
  printf 'error: no scripts in %s\n' "$dir" >&2
  exit 1
fi

for script in "${scripts[@]}"; do
  bash -n "$script"
  printf 'bash -n %s\n' "${script#"$ROOT"/}"
done

if ! command -v shellcheck >/dev/null 2>&1; then
  if [[ "${REQUIRE_SHELLCHECK:-}" == "1" ]]; then
    printf 'error: shellcheck is required and was not found\n' >&2
    exit 1
  fi
  printf 'shellcheck not installed; bash -n only\n'
  exit 0
fi

shellcheck --version
shellcheck "${scripts[@]}"
printf 'shellcheck ok (%s scripts)\n' "${#scripts[@]}"
