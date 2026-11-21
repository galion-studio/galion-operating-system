#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Install and remove the desktop entries, the icon set, and the GTK
# session defaults in a temporary XDG home.
# It does not write the system directories and it does not start an app.
# A pass here is not a Raspberry Pi 5 result.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"
install_sh=$ROOT/desktop/install.sh

if [ "$#" -ne 0 ]; then
  printf 'refused: this test takes no arguments.\n' >&2
  exit 2
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
home=$tmp/home
xdg=$tmp/xdg
config=$tmp/config
mkdir -p "$home"
export HOME=$home
export XDG_DATA_HOME=$xdg
export XDG_CONFIG_HOME=$config

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

reject_address() {
  if printf '%s\n' "$1" | grep -E -q -e '://' -e 'localhost' -e '([0-9]{1,3}\.){3}[0-9]{1,3}'; then
    fail "output contains a server address"
  fi
}

desktop_file=$xdg/applications/galion-research.desktop
icon_file=$xdg/icons/hicolor/scalable/apps/galion-research.svg
voice_icon=$xdg/icons/hicolor/scalable/apps/galion-voice.svg
os_icon=$xdg/icons/hicolor/scalable/apps/galion-os.svg
console_file=$xdg/applications/openmind-desktop.desktop
voice_file=$xdg/applications/galion-voice.desktop
gtk3_ini=$config/gtk-3.0/settings.ini
gtk4_ini=$config/gtk-4.0/settings.ini
gtk3_css=$config/gtk-3.0/gtk.css
gtk4_css=$config/gtk-4.0/gtk.css
boot_wake=$xdg/galion/boot/sounds/openmind-desktop-sound.rs
boot_index=$xdg/galion/boot/index.html
boot_wav=$xdg/galion/boot/sounds/boot.wav
boot_player=$xdg/galion/boot/sounds/galion-boot-sound
boot_unit=$config/systemd/user/galion-boot-sound.service
boot_wants=$config/systemd/user/graphical-session.target.wants/galion-boot-sound.service

out=$(sh "$install_sh" --user --dry-run)
need_line "$out" "install $desktop_file"
need_line "$out" "install $icon_file"
need_line "$out" "install $os_icon"
need_line "$out" "install $gtk3_ini"
need_line "$out" "install $gtk4_css"
need_line "$out" "install $boot_wake"
need_line "$out" "install $boot_index"
need_line "$out" "install $boot_wav"
need_line "$out" "install $boot_player"
need_line "$out" "install $boot_unit"
need_line "$out" "enable $boot_wants"
need_line "$out" "action: install"
need_line "$out" "scope: user"
need_line "$out" "written: no"
need_line "$out" "played: no"
need_line "$out" "enabled: next-graphical-session"
reject_address "$out"
if [ -e "$desktop_file" ] || [ -e "$icon_file" ] || [ -e "$gtk3_ini" ] || [ -e "$gtk3_css" ] || [ -e "$boot_unit" ]; then
  fail "dry-run wrote a file"
fi

sh "$install_sh" --user >/dev/null
for dest in "$desktop_file" "$console_file" "$voice_file" "$icon_file" "$voice_icon" "$os_icon"; do
  if [ ! -f "$dest" ] || [ -L "$dest" ]; then
    fail "$dest is not a regular file"
  fi
  mode=$(stat -c %a "$dest")
  if [ "$mode" != 644 ]; then
    fail "$dest mode is $mode"
  fi
done
cmp -s "$desktop_file" "$ROOT/desktop/applications/galion-research.desktop"
cmp -s "$console_file" "$ROOT/desktop/applications/openmind-desktop.desktop"
cmp -s "$voice_file" "$ROOT/desktop/applications/galion-voice.desktop"
cmp -s "$icon_file" "$ROOT/docs/brand/marks/icon-research.svg"
cmp -s "$voice_icon" "$ROOT/docs/brand/marks/icon-voice.svg"
cmp -s "$os_icon" "$ROOT/docs/brand/marks/icon-os.svg"
for ini in "$gtk3_ini" "$gtk4_ini"; do
  if [ ! -f "$ini" ]; then
    fail "$ini was not installed"
  fi
  cmp -s "$ini" "$ROOT/desktop/gtk/settings.ini"
  keys=$(grep -v '^[#[]' "$ini" || true)
  if printf '%s\n' "$keys" | grep -q 'gtk-application-prefer-dark-theme'; then
    fail "$ini pins a colour scheme"
  fi
  if printf '%s\n' "$keys" | grep -q 'gtk-enable-animations'; then
    fail "$ini pins animations"
  fi
  if ! grep -q 'IBM Plex Sans 16px' "$ini"; then
    fail "$ini does not name the token font"
  fi
done
for css in "$gtk3_css" "$gtk4_css"; do
  cmp -s "$css" "$ROOT/desktop/gtk/gtk.css"
done
if [ ! -f "$boot_wake" ] || [ -L "$boot_wake" ]; then
  fail "$boot_wake is not a regular file"
fi
cmp -s "$boot_wake" "$ROOT/desktop/boot/sounds/openmind-desktop-sound.rs"
cmp -s "$boot_index" "$ROOT/desktop/boot/index.html"
if ! grep -q 'Copyright (c) 3000 Galion / galion-studio' "$boot_wake"; then
  fail "wake tone lost its copyright header"
fi
cmp -s "$boot_wav" "$ROOT/desktop/boot/sounds/boot.wav"
if [ ! -f "$boot_player" ] || [ -L "$boot_player" ]; then
  fail "$boot_player is not a regular file"
fi
player_mode=$(stat -c %a "$boot_player")
if [ "$player_mode" != 755 ]; then
  fail "$boot_player mode is $player_mode"
fi
if [ ! -f "$boot_unit" ] || [ -L "$boot_unit" ]; then
  fail "$boot_unit is not a regular file"
fi
if ! grep -q "ExecStart=$boot_player start" "$boot_unit"; then
  fail "unit does not start the installed player"
fi
if grep -q '@BIN@' "$boot_unit"; then
  fail "unit still has a placeholder"
fi
if [ ! -L "$boot_wants" ]; then
  fail "$boot_wants is not a symlink"
fi
if ! grep -q 'prefers-color-scheme: light' "$ROOT/desktop/gtk/gtk.css"; then
  fail "gtk.css does not follow a light scheme"
fi
if ! grep -q 'prefers-reduced-motion: reduce' "$ROOT/desktop/gtk/gtk.css"; then
  fail "gtk.css does not respect reduced motion"
fi
if ! grep -q '3.2s ease-in-out' "$ROOT/desktop/gtk/gtk.css"; then
  fail "gtk.css does not use the breath timing"
fi
if find "$tmp" -name '*.woff2' | grep -q .; then
  fail "a WOFF2 web font was copied"
fi

sh "$install_sh" --user >/dev/null
cmp -s "$icon_file" "$ROOT/docs/brand/marks/icon-research.svg"

out=$(sh "$install_sh" --user --uninstall --dry-run)
need_line "$out" "remove $desktop_file"
need_line "$out" "remove $icon_file"
need_line "$out" "remove $gtk3_ini"
need_line "$out" "remove $boot_unit"
need_line "$out" "action: uninstall"
need_line "$out" "written: no"
need_line "$out" "played: no"
need_line "$out" "enabled: no"
reject_address "$out"
if [ ! -f "$desktop_file" ] || [ ! -f "$gtk3_ini" ]; then
  fail "uninstall dry-run removed a file"
fi

sh "$install_sh" --user --uninstall >/dev/null
for dest in "$desktop_file" "$console_file" "$voice_file" "$icon_file" "$voice_icon" "$os_icon" "$gtk3_ini" "$gtk4_ini" "$gtk3_css" "$gtk4_css" "$boot_wake" "$boot_index" "$boot_wav" "$boot_player" "$boot_unit" "$boot_wants"; do
  if [ -e "$dest" ]; then
    fail "$dest is still installed"
  fi
done
sh "$install_sh" --user --uninstall >/dev/null

unset XDG_DATA_HOME
unset XDG_CONFIG_HOME
fallback=$home/.local/share/applications/galion-voice.desktop
fallback_ini=$home/.config/gtk-3.0/settings.ini
fallback_boot=$home/.local/share/galion/boot/index.html
fallback_unit=$home/.config/systemd/user/galion-boot-sound.service
sh "$install_sh" --user >/dev/null
if [ ! -f "$fallback" ]; then
  fail "HOME fallback did not install $fallback"
fi
if [ ! -f "$fallback_ini" ]; then
  fail "HOME fallback did not install $fallback_ini"
fi
if [ ! -f "$fallback_boot" ]; then
  fail "HOME fallback did not install $fallback_boot"
fi
sh "$install_sh" --user --uninstall >/dev/null
if [ -e "$fallback" ] || [ -e "$fallback_ini" ] || [ -e "$fallback_boot" ] || [ -e "$fallback_unit" ]; then
  fail "HOME fallback uninstall left a file"
fi
export XDG_DATA_HOME=$xdg
export XDG_CONFIG_HOME=$config

system_desktop=/usr/local/share/applications/galion-research.desktop
system_icon=/usr/local/share/icons/hicolor/scalable/apps/galion-os.svg
system_ini=/etc/xdg/gtk-3.0/settings.ini
system_css=/etc/xdg/gtk-4.0/gtk.css
if [ -e "$system_desktop" ]; then
  system_before=$(cksum "$system_desktop")
else
  system_before=absent
fi
if [ -e "$system_ini" ]; then
  ini_before=$(cksum "$system_ini")
else
  ini_before=absent
fi
out=$(sh "$install_sh" --system --dry-run)
need_line "$out" "install $system_desktop"
need_line "$out" "install $system_icon"
need_line "$out" "install $system_ini"
need_line "$out" "install $system_css"
need_line "$out" "install /usr/local/share/galion/boot/README.md"
need_line "$out" "install /usr/local/share/galion/boot/sounds/boot.wav"
need_line "$out" "install /usr/local/lib/systemd/user/galion-boot-sound.service"
need_line "$out" "played: no"
need_line "$out" "scope: system"
need_line "$out" "written: no"
reject_address "$out"
if [ "$system_before" = absent ]; then
  if [ -e "$system_desktop" ]; then
    fail "system dry-run created $system_desktop"
  fi
else
  system_after=$(cksum "$system_desktop")
  if [ "$system_before" != "$system_after" ]; then
    fail "system dry-run changed $system_desktop"
  fi
fi
if [ "$ini_before" = absent ]; then
  if [ -e "$system_ini" ]; then
    fail "system dry-run created $system_ini"
  fi
else
  ini_after=$(cksum "$system_ini")
  if [ "$ini_before" != "$ini_after" ]; then
    fail "system dry-run changed $system_ini"
  fi
fi

expect_rc 2 sh "$install_sh"
expect_rc 2 sh "$install_sh" --dry-run
expect_rc 2 sh "$install_sh" --uninstall
expect_rc 2 sh "$install_sh" --user --system
expect_rc 2 sh "$install_sh" --publish
expect_rc 1 env -u HOME -u XDG_DATA_HOME -u XDG_CONFIG_HOME sh "$install_sh" --user

printf '%s\n' "desktop install test passed" "xdg: temporary" "pi5: not a board result"
