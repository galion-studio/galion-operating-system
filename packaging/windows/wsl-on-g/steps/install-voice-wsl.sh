#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Voice step. Calls galion-one-voice
# voice-stack/linux-package/wsl/install.sh at the pinned commit.
# The unit listens on 127.0.0.1:7881. GALION_SAMANTHA_REF is unset.
# This step does not download a voice clone or a reference WAV.
# Public Vosk, Piper, and Silero files are fetched by that installer.

set -euo pipefail

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/../pins.env"

DRY=0

usage() {
  cat <<'EOF'
usage: install-voice-wsl.sh [--dry-run]

Checks out the pinned galion-one-voice commit under /mnt/g/galion/src
and runs voice-stack/linux-package/wsl/install.sh as the current user.
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

: "${GALION_VOICE_URL:?}"
: "${GALION_VOICE_SHA:?}"

if [ "$DRY" -eq 1 ]; then
  cat <<EOF
dry-run: voice package ${GALION_VOICE_SHA}
dry-run: checkout ${GALION_VOICE_URL}
dry-run: checkout path /mnt/g/galion/src/galion-one-voice
dry-run: run voice-stack/linux-package/wsl/install.sh
dry-run: CARGO_HOME=/opt/galion/cargo
dry-run: RUSTUP_HOME=/opt/galion/rustup
dry-run: GALION_SAMANTHA_WS=127.0.0.1:7881
dry-run: one-dot stays 127.0.0.1:7878
dry-run: nerve stays 127.0.0.1:8670
dry-run: Hermes stays 127.0.0.1:8642
dry-run: GALION_SAMANTHA_REF=unset
dry-run: no voice clone, no reference WAV
dry-run: the horbm crate is not cloned
EOF
  exit 0
fi

if [ "$(id -u)" -eq 0 ]; then
  printf 'refused: voice install runs as galion, not root\n' >&2
  exit 1
fi
if [ ! -d /mnt/g/galion ] || [ ! -w /mnt/g/galion ]; then
  printf 'refused: /mnt/g/galion is not writable\n' >&2
  exit 1
fi

unset GALION_SAMANTHA_REF || true
if [ -n "${GALION_SAMANTHA_REF+x}" ]; then
  printf 'refused: GALION_SAMANTHA_REF is still set\n' >&2
  exit 1
fi
printf 'GALION_SAMANTHA_REF=unset\n'

# shellcheck disable=SC1091
. "$SCRIPT_DIR/git-pin.sh"

src=/mnt/g/galion/src/galion-one-voice
stamp=${HOME:?}/.local/share/galion/voice-wsl.stamp
installer=$src/voice-stack/linux-package/wsl/install.sh

if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$GALION_VOICE_SHA" ] && [ -f "$HOME/.config/systemd/user/galion-one-voice.service" ]; then
  printf 'unchanged galion-one-voice %s\n' "$GALION_VOICE_SHA"
  exit 0
fi

galion_pin_checkout "$src" "$GALION_VOICE_URL" "$GALION_VOICE_SHA"
if [ ! -f "$installer" ]; then
  printf 'refused: %s has no voice-stack/linux-package/wsl/install.sh\n' "$GALION_VOICE_SHA" >&2
  exit 1
fi

export CARGO_HOME=/opt/galion/cargo
export RUSTUP_HOME=/opt/galion/rustup
unset CARGO_TARGET_DIR || true
export PATH="/opt/galion/cargo/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin"
bash "$installer"

mkdir -p -- "$(dirname -- "$stamp")"
printf '%s\n' "$GALION_VOICE_SHA" >"$stamp"
chmod 0600 "$stamp"
printf 'installed galion-one-voice %s\n' "$GALION_VOICE_SHA"
