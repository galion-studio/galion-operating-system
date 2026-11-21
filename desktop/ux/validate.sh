#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Check the session look. It does not install it, play a tone, or open a socket.

set -eu
LC_ALL=C
export LC_ALL
export PYTHONDONTWRITEBYTECODE=1

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

if [ "$#" -ne 0 ]; then
  printf 'refused: ux validation takes no arguments.\n' >&2
  exit 2
fi

fail=0

say() {
  printf '%s\n' "$1" >&2
}

files=$(find desktop/ux \( -type f -o -type l \) | sed 's|^desktop/ux/||' | sort)
want=$(printf '%s\n' \
  README.md \
  greeter/10-galion.dconf \
  greeter/galion-gdm.css \
  greeter/galion.gresource.xml \
  gtk/Galion/gtk-3.0/gtk.css \
  gtk/Galion/gtk-4.0/gtk.css \
  gtk/Galion/index.theme \
  icons/Galion/cursors/crosshair \
  icons/Galion/cursors/hand2 \
  icons/Galion/cursors/left_ptr \
  icons/Galion/cursors/xterm \
  icons/Galion/index.theme \
  icons/Galion/scalable/apps/galion-one.svg \
  icons/Galion/scalable/apps/galion-os.svg \
  icons/Galion/scalable/apps/galion-research.svg \
  icons/Galion/scalable/apps/galion-voice.svg \
  install.sh \
  marks/icon-one.svg \
  marks/icon-os.svg \
  marks/icon-research.svg \
  marks/mark-dot.svg \
  preview/fonts.css \
  preview/greeter.css \
  preview/greeter.html \
  session/wake.css \
  session/wake.html \
  session/wake.sh \
  session/wake_tone.py \
  test-install.sh \
  tokens/export.py \
  tokens/gtk.css \
  tokens/session.env \
  tokens/tokens.css \
  tokens/tokens.js \
  tokens/tokens.json \
  validate.sh \
  wallpaper/galion-wallpaper.png \
  wallpaper/galion-wallpaper.svg)
if [ "$files" != "$want" ]; then
  say "error: ux file set is:"
  printf '%s\n' "$files" >&2
  fail=1
fi

if find desktop/ux -type f \( -name '*.wav' -o -name '*.ogg' -o -name '*.mp3' -o -name '*.flac' \) | grep -q .; then
  say "error: ux tree contains an audio file"
  fail=1
fi

text_files=$(find desktop/ux -type f \
  ! -name '*.png' \
  ! -name validate.sh \
  ! -name test-install.sh \
  ! -name left_ptr ! -name xterm ! -name hand2 ! -name crosshair)
if printf '%s\n' "$text_files" | grep -q .; then
  # shellcheck disable=SC2086
  if grep -n -E -e 'localhost' -e '0\.0\.0\.0' -e '::1' -e 'https://' $text_files; then
    say "error: ux text names a host other than loopback"
    fail=1
  fi
  # shellcheck disable=SC2086
  if grep -n -E -e '([0-9]{1,3}\.){3}[0-9]{1,3}' $text_files | grep -v '127\.0\.0\.1'; then
    say "error: ux text names an address other than 127.0.0.1"
    fail=1
  fi
fi

check_link() {
  path=$1
  brand=$2
  if [ ! -L "$path" ]; then
    say "error: $path must be a symlink to the brand mark"
    fail=1
    return
  fi
  if ! cmp -s "$path" "$ROOT/docs/brand/marks/$brand"; then
    say "error: $path does not match the brand mark"
    fail=1
  fi
}

check_link desktop/ux/marks/icon-os.svg icon-os.svg
check_link desktop/ux/marks/icon-one.svg icon-one.svg
check_link desktop/ux/marks/icon-research.svg icon-research.svg
check_link desktop/ux/marks/mark-dot.svg mark-dot.svg
check_link desktop/ux/icons/Galion/scalable/apps/galion-os.svg icon-os.svg
check_link desktop/ux/icons/Galion/scalable/apps/galion-one.svg icon-one.svg
check_link desktop/ux/icons/Galion/scalable/apps/galion-research.svg icon-research.svg
check_link desktop/ux/icons/Galion/scalable/apps/galion-voice.svg icon-voice.svg

for needle in 'Galion One' 'Galion Research' '>Desktop<' 'om-rise' '127.0.0.1:18181/' '127.0.0.1:8787/'; do
  if ! grep -q "$needle" desktop/ux/session/wake.html; then
    say "error: wake page is missing $needle"
    fail=1
  fi
done

if ! grep -q '#0a0a0c' desktop/ux/greeter/galion-gdm.css; then
  say "error: greeter is not on the obsidian ground"
  fail=1
fi
if ! grep -q 'icon-os.svg' desktop/ux/greeter/10-galion.dconf; then
  say "error: greeter logo is not the OS mark"
  fail=1
fi
if ! cmp -s desktop/ux/tokens/gtk.css desktop/ux/gtk/Galion/gtk-3.0/gtk.css; then
  say "error: GTK theme CSS is not the token export"
  fail=1
fi
if ! cmp -s desktop/ux/tokens/gtk.css desktop/ux/gtk/Galion/gtk-4.0/gtk.css; then
  say "error: GTK 4 theme CSS is not the token export"
  fail=1
fi

magic=$(od -An -t x1 -N 4 desktop/ux/icons/Galion/cursors/left_ptr | tr -d ' \n')
if [ "$magic" != "58637572" ]; then
  say "error: cursor file is not an Xcursor"
  fail=1
fi

if ! python3 desktop/ux/tokens/export.py --check >/dev/null; then
  say "error: token export is stale"
  fail=1
fi
if ! python3 desktop/ux/session/wake_tone.py --check >/dev/null; then
  say "error: wake tone does not match the vendored sine"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  exit 1
fi

printf '%s\n' "ux validated" "audio: none" "loopback: 127.0.0.1"
