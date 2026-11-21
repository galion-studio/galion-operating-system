#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Checkout of one commit. Sourced by the WSL steps. Not run directly.
# A full checkout is required: the desktop and voice installers build
# workspaces, so a sparse tree is not enough.

galion_pin_checkout() {
  local dir=$1 url=$2 sha=$3
  local have
  mkdir -p -- "$dir"
  if [ ! -d "$dir/.git" ]; then
    git init "$dir"
    git -C "$dir" remote add origin "$url"
  fi
  have=$(git -C "$dir" rev-parse HEAD 2>/dev/null || true)
  if [ "$have" = "$sha" ]; then
    printf 'checkout: %s already at %s\n' "$dir" "$sha"
    return 0
  fi
  git -C "$dir" fetch --depth 1 origin "$sha"
  git -C "$dir" checkout --detach --force FETCH_HEAD
  have=$(git -C "$dir" rev-parse HEAD)
  if [ "$have" != "$sha" ]; then
    printf 'error: %s is %s, wanted %s\n' "$dir" "$have" "$sha" >&2
    return 1
  fi
  printf 'checkout: %s at %s\n' "$dir" "$sha"
}
