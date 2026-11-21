#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Obsidian desktop in this install is openmind-desktop from
# obsidian-open-mind. W3's installer is scripts/install-wsl-ubuntu.sh
# at the pinned commit. It does not install the proprietary Obsidian.md
# application, and this file does not copy that repository's licence.
#
# W3 starts the listener with --listen. Plain --listen dials
# 127.0.0.1:8091. This repository's desktop entry uses --listen --stack off.
# This step does not patch W3's launcher.

set -euo pipefail

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/../pins.env"

DRY=0

usage() {
  cat <<'EOF'
usage: install-obsidian-wslg.sh [--dry-run]

Checks out the pinned obsidian-open-mind commit under /opt/galion/src
and runs scripts/install-wsl-ubuntu.sh. --dry-run writes nothing.
That installer refuses a checkout on /mnt/<letter>.
EOF
}

while [ "$#" -gt 0 ]; do
  case $1 in
    --dry-run) DRY=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      printf 'refused: unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
  shift
done

: "${GALION_OBSIDIAN_URL:?}"
: "${GALION_OBSIDIAN_SHA:?}"

if [ "$DRY" -eq 1 ]; then
  cat <<EOF
dry-run: obsidian desktop is openmind-desktop
dry-run: pin ${GALION_OBSIDIAN_SHA}
dry-run: checkout ${GALION_OBSIDIAN_URL}
dry-run: checkout path /opt/galion/src/obsidian-open-mind
dry-run: their installer refuses a checkout on /mnt
dry-run: run scripts/install-wsl-ubuntu.sh
dry-run: CARGO_HOME=/opt/galion/cargo
dry-run: RUSTUP_HOME=/opt/galion/rustup
dry-run: their launcher uses --listen and dials 127.0.0.1:8091
dry-run: this repository's desktop entry uses --listen --stack off
dry-run: does not install the Obsidian.md application
dry-run: does not copy a year-3000 licence into galion-operating-system
EOF
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  printf 'refused: obsidian install needs root\n' >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$SCRIPT_DIR/git-pin.sh"

src=/opt/galion/src/obsidian-open-mind
if [ -x /usr/bin/openmind-desktop ] && [ -f /etc/galion/obsidian-wslg.stamp ]; then
  stamp=$(cat /etc/galion/obsidian-wslg.stamp)
  if [ "$stamp" = "$GALION_OBSIDIAN_SHA" ]; then
    printf 'unchanged openmind-desktop %s\n' "$stamp"
    exit 0
  fi
fi

galion_pin_checkout "$src" "$GALION_OBSIDIAN_URL" "$GALION_OBSIDIAN_SHA"
if [ ! -f "$src/scripts/install-wsl-ubuntu.sh" ]; then
  printf 'refused: %s has no scripts/install-wsl-ubuntu.sh\n' "$GALION_OBSIDIAN_SHA" >&2
  exit 1
fi

export CARGO_HOME=/opt/galion/cargo
export RUSTUP_HOME=/opt/galion/rustup
unset CARGO_TARGET_DIR || true
export PATH="/opt/galion/cargo/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin"
bash "$src/scripts/install-wsl-ubuntu.sh"
printf '%s\n' "$GALION_OBSIDIAN_SHA" >/etc/galion/obsidian-wslg.stamp
printf 'installed openmind-desktop %s\n' "$GALION_OBSIDIAN_SHA"
