#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Print the desktop image root as a file list. It does not copy files,
# build an image, or mount a filesystem.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

if [ "$#" -gt 0 ]; then
  printf 'refused: the layout takes no arguments and does not write an image.\n'
  exit 2
fi

payloads=$ROOT/packaging/packages/desktop-payloads.list
voice=$ROOT/packaging/packages/voice-profile.list

user_for() {
  case $1 in
    openmind-desktop|hermes-research) printf 'galion\n' ;;
    site-one|site-research) printf 'none\n' ;;
    *)
      printf 'refused: unknown desktop payload: %s\n' "$1" >&2
      exit 1
      ;;
  esac
}

path_ok() {
  case $1 in
    /opt/galion/*) ;;
    *)
      printf 'refused: payload path is outside /opt/galion: %s\n' "$1" >&2
      exit 1
      ;;
  esac
  case $1 in
    *..*)
      printf 'refused: payload path contains dotdot: %s\n' "$1" >&2
      exit 1
      ;;
  esac
}

printf 'galion-os root layout\n'
printf 'mode: layout\n'
printf 'written: no\n'
printf 'root: squashfs\n'
printf 'init: galion-init planned absent\n'
printf 'payloads:\n'

count=0
while IFS= read -r line || [ -n "$line" ]; do
  case $line in
    ''|'#'*) continue ;;
  esac
  name=$(printf '%s\n' "$line" | cut -f2)
  path=$(printf '%s\n' "$line" | cut -f4)
  case $name in
    galion-voiced|galion-probe|galion-one)
      printf 'refused: %s is not a desktop payload.\n' "$name" >&2
      exit 1
      ;;
  esac
  path_ok "$path"
  user=$(user_for "$name")
  printf 'payload %s user %s path %s\n' "$name" "$user" "$path"
  count=$((count + 1))
done < "$payloads"

if [ "$count" -ne 4 ]; then
  printf 'refused: the desktop image has four payloads, found %s.\n' "$count" >&2
  exit 1
fi

printf 'end payloads\n'
printf 'other profile:\n'
while IFS= read -r line || [ -n "$line" ]; do
  case $line in
    ''|'#'*) continue ;;
  esac
  name=$(printf '%s\n' "$line" | cut -f2)
  printf 'off %s\n' "$name"
done < "$voice"
printf 'end other profile\n'
printf 'result: layout only. no image was built. no file was written.\n'
