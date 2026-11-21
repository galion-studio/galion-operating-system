#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Install the session look into a temporary home, then run the wake hook
# without opening a page or playing a tone. A pass here is not a
# Raspberry Pi 5 result.

set -eu
export PYTHONDONTWRITEBYTECODE=1

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
install_sh=$ROOT/desktop/install.sh
ux_sh=$ROOT/desktop/ux/install.sh
wake_sh=$ROOT/desktop/ux/session/wake.sh

if [ "$#" -ne 0 ]; then
  printf 'refused: this test takes no arguments.\n' >&2
  exit 2
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
home=$tmp/home
xdg=$tmp/xdg
config=$tmp/config
state=$tmp/state
mkdir -p "$home"
export HOME=$home
export XDG_DATA_HOME=$xdg
export XDG_CONFIG_HOME=$config
export XDG_STATE_HOME=$state

fail() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

expect_rc() {
  want=$1
  shift
  rc=0
  "$@" || rc=$?
  if [ "$rc" -ne "$want" ]; then
    printf 'error: command exited %s, wanted %s\n' "$rc" "$want" >&2
    exit 1
  fi
}

need_line() {
  text=$1
  needle=$2
  if ! printf '%s\n' "$text" | grep -F -q -e "$needle"; then
    printf 'error: missing line: %s\n' "$needle" >&2
    exit 1
  fi
}

reject_foreign() {
  if printf '%s\n' "$1" | grep -E -q -e 'localhost' -e 'https://' -e '0\.0\.0\.0'; then
    fail "output names a foreign host"
  fi
  if printf '%s\n' "$1" | grep -E -o -e '([0-9]{1,3}\.){3}[0-9]{1,3}' | grep -v -x '127.0.0.1' | grep -q .; then
    fail "output names an address other than 127.0.0.1"
  fi
}

theme=$xdg/themes/Galion/index.theme
icon=$xdg/icons/Galion/scalable/apps/galion-os.svg
cursor=$xdg/icons/Galion/cursors/left_ptr
wake=$xdg/galion/ux/session/wake.sh
page=$xdg/galion/ux/session/wake.html
autostart=$config/autostart/galion-wake.desktop
wallpaper=$xdg/galion/ux/wallpaper/galion-wallpaper.png

out=$(sh "$install_sh" --user --dry-run)
need_line "$out" "install $wake"
need_line "$out" "install $theme"
need_line "$out" "install $autostart"
need_line "$out" "written: no"
reject_foreign "$out"
if [ -e "$wake" ] || [ -e "$theme" ] || [ -e "$autostart" ]; then
  fail "dry-run wrote a ux file"
fi

sh "$install_sh" --user >/dev/null
for dest in "$theme" "$icon" "$cursor" "$wake" "$page" "$wallpaper" "$autostart"; do
  if [ ! -f "$dest" ] || [ -L "$dest" ]; then
    fail "$dest is not a regular file"
  fi
done
mode=$(stat -c %a "$wake")
if [ "$mode" != 755 ]; then
  fail "wake hook mode is $mode"
fi
cmp -s "$icon" "$ROOT/docs/brand/marks/icon-os.svg" || fail "installed icon is not the OS mark"
cmp -s "$page" "$ROOT/desktop/ux/session/wake.html" || fail "installed wake page drifted"
if ! grep -q "Exec=$wake" "$autostart"; then
  fail "autostart does not run the installed wake hook"
fi
magic=$(od -An -t x1 -N 4 "$cursor" | tr -d ' \n')
if [ "$magic" != "58637572" ]; then
  fail "installed cursor is not an Xcursor"
fi
if command -v desktop-file-validate >/dev/null 2>&1; then
  desktop-file-validate "$autostart"
fi

dry=$(GALION_WAKE_DRY=1 "$wake")
need_line "$dry" "mode: welcome"
need_line "$dry" "tone: wake"
need_line "$dry" "desktop: http://127.0.0.1:18181/"
need_line "$dry" "one: http://127.0.0.1:18181/one"
need_line "$dry" "research: http://127.0.0.1:8787/"
need_line "$dry" "animation: desktop/boot/animations/om-rise.css"
need_line "$dry" "hook: desktop/boot/sounds/openmind-desktop-sound.rs"
need_line "$dry" "opened: no"
reject_foreign "$dry"
if [ -e "$state/galion/welcomed" ]; then
  fail "dry wake wrote the welcome marker"
fi

mkdir -p "$state/galion"
printf '%s\n' welcomed > "$state/galion/welcomed"
dry=$(GALION_WAKE_DRY=1 "$wake")
need_line "$dry" "mode: desktop"
dry=$(GALION_WAKE_DRY=1 GALION_WELCOME=always "$wake")
need_line "$dry" "mode: welcome"
dry=$(GALION_WAKE_DRY=1 GALION_SILENCE=1 GALION_WELCOME=skip "$wake")
need_line "$dry" "mode: desktop"
need_line "$dry" "tone: silenced"

layout=$tmp/layout
mkdir -p "$layout/session" "$layout/tokens"
bad_url=$(printf 'http://%s.%s.%s.%s/' 10 1 2 3)
printf '%s\n' "GALION_DESKTOP_URL=$bad_url" 'GALION_ONE_URL=http://127.0.0.1:18181/one' 'GALION_RESEARCH_URL=http://127.0.0.1:8787/' > "$layout/tokens/session.env"
cp "$ROOT/desktop/ux/session/wake.sh" "$layout/session/wake.sh"
expect_rc 1 env GALION_WAKE_DRY=1 sh "$layout/session/wake.sh"

out=$(sh "$ux_sh" --system --dry-run)
need_line "$out" "install /etc/dconf/db/gdm.d/10-galion"
need_line "$out" "install /usr/local/share/themes/Galion/gtk-3.0/gtk.css"
need_line "$out" "dconf: skipped"
need_line "$out" "written: no"
reject_foreign "$out"
if [ -e /etc/dconf/db/gdm.d/10-galion ]; then
  before=$(cksum /etc/dconf/db/gdm.d/10-galion)
else
  before=absent
fi
if [ "$before" = absent ]; then
  if [ -e /etc/dconf/db/gdm.d/10-galion ]; then
    fail "system dry-run created the greeter key"
  fi
else
  after=$(cksum /etc/dconf/db/gdm.d/10-galion)
  if [ "$before" != "$after" ]; then
    fail "system dry-run changed the greeter key"
  fi
fi

sh "$install_sh" --user --uninstall >/dev/null
for dest in "$theme" "$icon" "$cursor" "$wake" "$page" "$wallpaper" "$autostart"; do
  if [ -e "$dest" ]; then
    fail "$dest is still installed"
  fi
done

expect_rc 2 sh "$ux_sh"
expect_rc 2 sh "$ux_sh" --user --system
expect_rc 2 sh "$wake_sh" --now

printf '%s\n' "ux install test passed" "opened: no" "played: no"
