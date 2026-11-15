#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# The packaging dry run and the galion-init desktop plan describe one boot.
# This script prints nothing of its own except the result. It does not build an image.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

if [ "$#" -ne 0 ]; then
  printf 'refused: this check takes no arguments and does not build an image.\n'
  exit 2
fi

dry=$(sh packaging/dry-run.sh)
init=$(sh galion-init/prototype.sh desktop)

fail=0
say() {
  printf '%s\n' "$1"
}

need() {
  label=$1
  text=$2
  needle=$3
  if ! printf '%s\n' "$text" | grep -F -q -- "$needle"; then
    say "error: $label missing: $needle"
    fail=1
  fi
}

need "dry run" "$dry" "init: galion-init"
need "dry run" "$dry" "init_status: planned"
need "dry run" "$dry" "base: ubuntu-26.04"
need "dry run" "$dry" "port 18181"
need "dry run" "$dry" "PORT 8787"
need "dry run" "$dry" "432 Hz tone is planned and is not played"
need "dry run" "$dry" "while the console and research are alive"
need "dry run" "$dry" "off-desktop-image"
need "init" "$init" "profile desktop"
need "init" "$init" "phase loopback"
need "init" "$init" "tone planned 432 samples 0"
need "init" "$init" "port 18181"
need "init" "$init" "port 8787"
need "init" "$init" "path /one"
need "init" "$init" "handoff current while the console and research are alive"
need "init" "$init" "galion-voiced absent"
need "init" "$init" "runtime print-only"

if printf '%s\n%s\n' "$dry" "$init" | grep -E -q '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+'; then
  say "error: a dotted address appeared in the shared story"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  say "result: one story check failed"
  exit 1
fi
say "result: one desktop boot. galion-init planned, console port 18181, research port 8787, handoff /one, tone not played."
