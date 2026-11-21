#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Session start. Play the wake sine, show the wake page, and on a later
# start open the Open Mind desktop. The first start shows one screen
# with three choices. GALION_WAKE_DRY=1 prints the plan and does not
# open, play, or write the welcome marker.

set -eu
export PYTHONDONTWRITEBYTECODE=1

if [ "$#" -ne 0 ]; then
  printf 'refused: the wake hook takes no arguments.\n' >&2
  exit 2
fi

here=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
env_file=$here/../tokens/session.env

if [ ! -f "$env_file" ]; then
  printf 'error: missing session tokens\n' >&2
  exit 1
fi

# shellcheck disable=SC1090,SC1091
. "$env_file"

loopback() {
  case $1 in
    http://127.0.0.1:18181/|http://127.0.0.1:18181/one|http://127.0.0.1:8787/)
      ;;
    *)
      printf 'error: refused address\n' >&2
      exit 1
      ;;
  esac
}

loopback "${GALION_DESKTOP_URL:?}"
loopback "${GALION_ONE_URL:?}"
loopback "${GALION_RESEARCH_URL:?}"

if [ -n "${XDG_STATE_HOME:-}" ]; then
  state=$XDG_STATE_HOME
elif [ -n "${HOME:-}" ]; then
  state=$HOME/.local/state
else
  state=
fi

marker=
if [ -n "$state" ]; then
  marker=$state/galion/welcomed
fi

if [ "${GALION_WELCOME:-}" = always ]; then
  mode=welcome
elif [ "${GALION_WELCOME:-}" = skip ]; then
  mode=desktop
elif [ -z "$marker" ] || [ ! -f "$marker" ]; then
  mode=welcome
else
  mode=desktop
fi

if [ "${GALION_SILENCE:-}" = 1 ]; then
  tone=silenced
else
  tone=wake
fi

if [ "${GALION_WAKE_DRY:-}" = 1 ]; then
  printf '%s\n' \
    "mode: $mode" \
    "tone: $tone" \
    "desktop: $GALION_DESKTOP_URL" \
    "one: $GALION_ONE_URL" \
    "research: $GALION_RESEARCH_URL" \
    "animation: ${GALION_WAKE_ANIMATION_PATH:?}" \
    "hook: ${GALION_WAKE_TONE_PATH:?}" \
    "opened: no"
  exit 0
fi

page_tone=0
if [ "$tone" = wake ]; then
  played=$(python3 "$here/wake_tone.py" || true)
  if [ "$played" != "played" ]; then
    page_tone=1
  fi
fi

query="mode=$mode"
if [ "$page_tone" -eq 1 ]; then
  query="$query&tone=page"
fi
url="file://$here/wake.html?$query"

opened=0
if command -v xdg-open >/dev/null 2>&1; then
  if xdg-open "$url" >/dev/null 2>&1; then
    opened=1
  fi
fi
if [ "$opened" -eq 0 ] && command -v gio >/dev/null 2>&1; then
  if gio open "$url" >/dev/null 2>&1; then
    opened=1
  fi
fi

if [ "$mode" = welcome ] && [ "$opened" -eq 1 ] && command -v gsettings >/dev/null 2>&1; then
  png=$here/../wallpaper/galion-wallpaper.png
  if [ -f "$png" ]; then
    gsettings set org.gnome.desktop.background picture-uri "file://$png" >/dev/null 2>&1 || true
    gsettings set org.gnome.desktop.background picture-uri-dark "file://$png" >/dev/null 2>&1 || true
    gsettings set org.gnome.desktop.background primary-color '#0A0A0C' >/dev/null 2>&1 || true
  fi
fi

if [ "$mode" = welcome ] && [ "$opened" -eq 1 ] && [ -n "$marker" ]; then
  mkdir -p "$(dirname "$marker")"
  printf '%s\n' welcomed > "$marker"
fi

if [ "$opened" -eq 1 ]; then
  opened_word=yes
else
  opened_word=no
fi

printf '%s\n' "mode: $mode" "tone: $tone" "opened: $opened_word"
