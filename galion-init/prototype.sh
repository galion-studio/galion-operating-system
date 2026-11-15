#!/bin/sh
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2026 Galion Labs
# Dry-run boot plan. Does not become PID 1, open a socket, play a tone,
# or write a Silence file.

set -eu

if [ "$$" -eq 1 ]; then
  echo "galion-init: refusing to run as PID 1. This prototype does not replace the host init." >&2
  exit 2
fi

if [ "${1:-}" = "--execute" ]; then
  echo "galion-init: refusing --execute. This prototype does not replace the host init." >&2
  exit 2
fi

voice() {
  cat <<'EOF'
profile voice
phase mount-filesystems
phase network
phase clock
phase alsa
phase supervise
service galion-voiced user galion binary absent
fb0 optional
display-server none
tone none
handoff none
runtime print-only
EOF
}

desktop() {
  cat <<'EOF'
profile desktop
phase mount-filesystems
phase loopback
phase clock
phase tone-hook
tone planned 432 samples 0
silence-file none
phase supervise
service openmind-desktop user galion listen none port 18181
service galion-research user galion port 8787 workdir /opt/galion/research/current
handoff desktop-console to research at /one
GALION_ONE_URL http on the IPv4 loopback interface, port 18181, path /one
galion-voiced absent
galion-one absent
runtime print-only
EOF
}

case "${1:-}" in
  voice) voice ;;
  desktop) desktop ;;
  "")
    voice
    printf '\n'
    desktop
    ;;
  *)
    echo "galion-init: unknown argument" >&2
    exit 2
    ;;
esac
