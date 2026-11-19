#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Copy or remove the freedesktop entries, the icon set, and the
# opt-in GTK session defaults in this directory.
# It does not start the programs and it does not open a socket.
#
#   sh desktop/install.sh --user
#   sh desktop/install.sh --system
#   sh desktop/install.sh --user --dry-run
#   sh desktop/install.sh --user --uninstall
#   sh desktop/install.sh --system --uninstall --dry-run
#
# --user writes entries and icons under XDG_DATA_HOME, or
# $HOME/.local/share when that variable is unset, and GTK files under
# XDG_CONFIG_HOME, or $HOME/.config. --system writes entries and icons
# under /usr/local/share and GTK files under /etc/xdg. Raspberry Pi OS
# Bookworm and Ubuntu already search those places. --dry-run prints
# the paths and writes nothing.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

scope=
action=install
dry=0

while [ "$#" -gt 0 ]; do
  case $1 in
    --user)
      if [ "$scope" = system ]; then
        printf 'refused: pass only one of --user or --system.\n' >&2
        exit 2
      fi
      scope=user
      ;;
    --system)
      if [ "$scope" = user ]; then
        printf 'refused: pass only one of --user or --system.\n' >&2
        exit 2
      fi
      scope=system
      ;;
    --dry-run)
      dry=1
      ;;
    --uninstall)
      action=uninstall
      ;;
    *)
      printf 'refused: unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
  shift
done

if [ -z "$scope" ]; then
  printf 'refused: pass --user or --system.\n' >&2
  exit 2
fi

if [ "$scope" = user ]; then
  if [ -n "${XDG_DATA_HOME:-}" ]; then
    data=$XDG_DATA_HOME
  elif [ -n "${HOME:-}" ]; then
    data=$HOME/.local/share
  else
    printf 'error: HOME is unset, so the user scope has no directory.\n' >&2
    exit 1
  fi
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    config=$XDG_CONFIG_HOME
  elif [ -n "${HOME:-}" ]; then
    config=$HOME/.config
  else
    printf 'error: HOME is unset, so the user scope has no directory.\n' >&2
    exit 1
  fi
else
  data=/usr/local/share
  config=/etc/xdg
fi

apps=$data/applications
icons=$data/icons/hicolor/scalable/apps

require_file() {
  if [ ! -f "$1" ]; then
    printf 'error: missing %s\n' "$1" >&2
    exit 1
  fi
}

place() {
  src=$1
  dest=$2
  if [ "$dry" -eq 1 ]; then
    printf 'install %s\n' "$dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  install -m 0644 "$src" "$dest"
  if [ -L "$dest" ]; then
    printf 'error: %s is still a symlink\n' "$dest" >&2
    exit 1
  fi
  if ! cmp -s "$src" "$dest"; then
    printf 'error: %s does not match %s\n' "$dest" "$src" >&2
    exit 1
  fi
  printf 'install %s\n' "$dest"
}

remove_file() {
  dest=$1
  if [ "$dry" -eq 1 ]; then
    printf 'remove %s\n' "$dest"
    return
  fi
  rm -f -- "$dest"
  printf 'remove %s\n' "$dest"
}

session_file() {
  major=$1
  name=$2
  src=$ROOT/desktop/gtk/$name
  dest=$config/gtk-$major/$name
  if [ "$action" = install ]; then
    require_file "$src"
    place "$src" "$dest"
  else
    remove_file "$dest"
  fi
}

if [ "$action" = install ]; then
  for name in galion-research.desktop openmind-desktop.desktop galion-voice.desktop; do
    src=$ROOT/desktop/applications/$name
    require_file "$src"
    place "$src" "$apps/$name"
  done
  for name in galion-research galion-voice galion-os; do
    src=$ROOT/desktop/icons/hicolor/scalable/apps/$name.svg
    require_file "$src"
    place "$src" "$icons/$name.svg"
  done
else
  for name in galion-research.desktop openmind-desktop.desktop galion-voice.desktop; do
    remove_file "$apps/$name"
  done
  for name in galion-research galion-voice galion-os; do
    remove_file "$icons/$name.svg"
  done
fi

for major in 3.0 4.0; do
  session_file "$major" settings.ini
  session_file "$major" gtk.css
done

if [ "$dry" -eq 1 ]; then
  written=no
else
  written=yes
fi

printf '%s\n' "action: $action" "scope: $scope" "written: $written"
