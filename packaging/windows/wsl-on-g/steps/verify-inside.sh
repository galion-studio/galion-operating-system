#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Prints key=value facts from inside Galion-Ubuntu. The Windows verify
# script decides pass or fail. A display value does not prove that a
# WSLg window painted pixels.

set -u

systemd_state=$(systemctl is-system-running 2>/dev/null || true)
printf 'systemd=%s\n' "$systemd_state"
printf 'display=%s\n' "${DISPLAY:-}"
printf 'wayland=%s\n' "${WAYLAND_DISPLAY:-}"
printf 'pulse=%s\n' "${PULSE_SERVER:-}"
if [ -S /mnt/wslg/PulseServer ]; then
  printf 'pulse_socket=yes\n'
else
  printf 'pulse_socket=no\n'
fi

bin=/usr/bin/openmind-desktop
if [ ! -x "$bin" ] && [ -x /opt/galion/openmind-desktop/openmind-desktop ]; then
  bin=/opt/galion/openmind-desktop/openmind-desktop
fi
if [ -x "$bin" ]; then
  ver=$("$bin" --version 2>&1 | tr '\n' ' ' || true)
  printf 'obsidian_version=%s\n' "$ver"
  if "$bin" --version >/dev/null 2>&1; then
    printf 'obsidian_exit=0\n'
  else
    printf 'obsidian_exit=1\n'
  fi
else
  printf 'obsidian_version=\n'
  printf 'obsidian_exit=127\n'
fi

obsidian_http=000
if command -v curl >/dev/null 2>&1 && curl -fsS -m 2 -o /dev/null http://127.0.0.1:18181/; then
  obsidian_http=200
elif [ -x "$bin" ] && command -v curl >/dev/null 2>&1; then
  "$bin" --listen --stack off >/tmp/openmind-desktop-verify.out 2>&1 &
  pid=$!
  i=0
  while [ "$i" -lt 25 ]; do
    if curl -fsS -m 1 -o /dev/null http://127.0.0.1:18181/; then
      obsidian_http=200
      break
    fi
    i=$((i + 1))
    sleep 0.2
  done
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
fi
printf 'obsidian_http=%s\n' "$obsidian_http"

voice_http=000
voice_bytes=0
if command -v curl >/dev/null 2>&1; then
  body=/tmp/galion-voice-health.txt
  if curl -fsS -m 5 -o "$body" http://127.0.0.1:7881/health; then
    voice_http=200
  fi
  if [ -f "$body" ]; then
    voice_bytes=$(wc -c <"$body" | tr -d ' ')
    rm -f -- "$body"
  fi
fi
printf 'voice_http=%s\n' "$voice_http"
printf 'voice_bytes=%s\n' "$voice_bytes"
