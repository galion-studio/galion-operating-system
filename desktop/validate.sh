#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Check the freedesktop entries under desktop/. It does not install them,
# start a program, or open a socket.

set -eu
LC_ALL=C
export LC_ALL

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

if [ "$#" -ne 0 ]; then
  printf 'refused: desktop validation takes no arguments and does not install entries.\n'
  exit 2
fi

if ! command -v desktop-file-validate >/dev/null 2>&1; then
  printf 'error: desktop-file-validate is not on PATH. Install desktop-file-utils.\n' >&2
  exit 1
fi

fail=0

say() {
  printf '%s\n' "$1" >&2
}

expect_key() {
  file=$1
  name=$2
  want=$3
  got=$(sed -n "s/^${name}=//p" "$file")
  lines=$(printf '%s\n' "$got" | grep -c . || true)
  if [ "$lines" -ne 1 ] || [ "$got" != "$want" ]; then
    say "error: $file key $name must be: $want"
    fail=1
  fi
}

absent_key() {
  file=$1
  name=$2
  if grep -q "^${name}=" "$file"; then
    say "error: $file must not set $name"
    fail=1
  fi
}

expect_files() {
  label=$1
  want=$2
  got=$3
  if [ "$got" != "$want" ]; then
    say "error: $label set is:"
    printf '%s\n' "$got" >&2
    fail=1
  fi
}

files=$(find desktop \( -type f -o -type l \) | sed 's|^desktop/||' | sort)
expect_files "desktop file" "$(printf '%s\n' \
  README.md \
  applications/galion-research.desktop \
  applications/galion-voice.desktop \
  applications/openmind-desktop.desktop \
  icons/hicolor/scalable/apps/galion-os.svg \
  icons/hicolor/scalable/apps/galion-research.svg \
  icons/hicolor/scalable/apps/galion-voice.svg \
  validate.sh)" "$files"

# Scan the entries and the note. Skip this script: its patterns are the
# check. Skip the icon marks: they are the brand SVGs, and the namespace
# in those files is not a listen address. The icon check below requires
# those bytes.
if grep -n -E -e '://' -e 'localhost' -e '0\.0\.0\.0' -e '::1' -e '([0-9]{1,3}\.){3}[0-9]{1,3}' \
  desktop/README.md \
  desktop/applications/*.desktop; then
  say "error: desktop files must not contain a server address"
  fail=1
fi

check_icon() {
  name=$1
  brand=$2
  icon=$ROOT/desktop/icons/hicolor/scalable/apps/$name.svg
  rel=../../../../../docs/brand/marks/$brand
  if [ ! -L "$icon" ]; then
    say "error: $name.svg must be a symlink to the brand mark"
    fail=1
    return
  fi
  got=$(readlink "$icon")
  if [ "$got" != "$rel" ]; then
    say "error: $name.svg points at $got"
    fail=1
  fi
  if ! cmp -s "$icon" "$ROOT/docs/brand/marks/$brand"; then
    say "error: $name.svg does not match docs/brand/marks/$brand"
    fail=1
  fi
}

check_icon galion-research icon-research.svg
check_icon galion-voice icon-voice.svg
check_icon galion-os icon-os.svg

research=desktop/applications/galion-research.desktop
console=desktop/applications/openmind-desktop.desktop
voice=desktop/applications/galion-voice.desktop

for file in "$research" "$console" "$voice"; do
  expect_key "$file" Type Application
  expect_key "$file" Terminal false
  expect_key "$file" StartupNotify false
  absent_key "$file" URL
  absent_key "$file" MimeType
  rc=0
  out=$(desktop-file-validate "$file" 2>&1) || rc=$?
  if [ "$rc" -ne 0 ] || [ -n "$out" ]; then
    say "error: desktop-file-validate failed for $file"
    printf '%s\n' "$out" >&2
    fail=1
  fi
done

expect_key "$research" Name "Galion Research"
expect_key "$research" GenericName "Research desk"
expect_key "$research" Comment "Local research desk"
expect_key "$research" Exec "env PORT=8787 /opt/galion/research/current/galion-research"
expect_key "$research" Path "/opt/galion/research/current"
expect_key "$research" TryExec "/opt/galion/research/current/galion-research"
expect_key "$research" Icon galion-research
expect_key "$research" Categories "Science;"

expect_key "$console" Name "Obsidian Open Mind"
expect_key "$console" GenericName "Obsidian desktop"
expect_key "$console" Comment "Local control console"
expect_key "$console" Exec "/opt/galion/openmind-desktop/openmind-desktop --listen --stack off"
expect_key "$console" TryExec "/opt/galion/openmind-desktop/openmind-desktop"
expect_key "$console" Icon galion-os
expect_key "$console" Categories "System;"
absent_key "$console" Path

expect_key "$voice" Name "Galion Voice"
expect_key "$voice" GenericName "Voice model"
expect_key "$voice" Comment "Voice model inside Galion One"
expect_key "$voice" Exec galion-voiced
expect_key "$voice" TryExec galion-voiced
expect_key "$voice" Icon galion-voice
expect_key "$voice" Categories "AudioVideo;Audio;"
absent_key "$voice" Path

if [ "$fail" -ne 0 ]; then
  exit 1
fi

printf '%s\n' \
  "desktop entries validated" \
  "validator: desktop-file-validate" \
  "addresses: none" \
  "installed: no" \
  "started: no"
