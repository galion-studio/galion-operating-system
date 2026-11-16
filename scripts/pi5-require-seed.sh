#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Print the path of galion-os-pi5-seed-<sha>.tar.gz.
# This does not invent a second seed. It uses PI5_SEED_TARBALL, a tarball
# already in the tree, or the packager named by .github/workflows/pi-seed.yml
# (otherwise packaging/pi-seed.sh). The seed change owns that packager.
#
# Tests point PI5_REPO_ROOT at a temporary tree.

set -eu

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

if [ -n "${PI5_REPO_ROOT:-}" ]; then
  ROOT=$PI5_REPO_ROOT
else
  ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
fi
cd "$ROOT"

if [ -n "${PI5_SEED_TARBALL:-}" ]; then
  [ -f "$PI5_SEED_TARBALL" ] || die "PI5_SEED_TARBALL is not a file"
  CDPATH='' cd -- "$(dirname "$PI5_SEED_TARBALL")"
  printf '%s\n' "$(pwd)/$(basename "$PI5_SEED_TARBALL")"
  exit 0
fi

newest_tarball() {
  found=$(mktemp)
  find "$ROOT" -name 'galion-os-pi5-seed-*.tar.gz' -type f \
    -not -path '*/.git/*' >"$found"
  best=
  best_m=0
  while read -r path; do
    [ -n "$path" ] || continue
    m=$(stat -c %Y "$path")
    if [ -z "$best" ] || [ "$m" -ge "$best_m" ]; then
      best=$path
      best_m=$m
    fi
  done <"$found"
  rm -f "$found"
  [ -n "$best" ] || return 1
  printf '%s\n' "$best"
}

existing=$(newest_tarball || true)
if [ -n "$existing" ]; then
  printf '%s\n' "$existing"
  exit 0
fi

packager=
workflow=$ROOT/.github/workflows/pi-seed.yml
if [ -f "$workflow" ]; then
  packager=$(sed -n 's/.*\(packaging\/[A-Za-z0-9_.-]*\.sh\).*/\1/p' "$workflow" | head -n 1)
fi
if [ -z "$packager" ] && [ -f "$ROOT/packaging/pi-seed.sh" ]; then
  packager=packaging/pi-seed.sh
fi
if [ -z "$packager" ]; then
  die "no galion-os-pi5-seed tarball and no pi-seed packager on this tree"
fi
[ -f "$ROOT/$packager" ] || die "pi-seed packager is missing: $packager"

if command -v rustc >/dev/null 2>&1; then
  sysroot=$(rustc --print sysroot)
  lld=$(find "$sysroot" -type f -name rust-lld | head -n 1 || true)
  if [ -n "$lld" ]; then
    PATH=$(dirname "$lld"):$PATH
    export PATH
    export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
    export CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
  fi
fi

mkdir -p "$ROOT/pi5-boot-logs"
printf 'pi5-require-seed: running %s\n' "$packager" >&2
sh "$ROOT/$packager" >"$ROOT/pi5-boot-logs/pi5-pack.log" 2>&1 || {
  cat "$ROOT/pi5-boot-logs/pi5-pack.log" >&2
  die "pi-seed packager failed"
}
cat "$ROOT/pi5-boot-logs/pi5-pack.log" >&2

packed=$(newest_tarball || true)
[ -n "$packed" ] || die "pi-seed packager did not write galion-os-pi5-seed-*.tar.gz"
printf '%s\n' "$packed"
