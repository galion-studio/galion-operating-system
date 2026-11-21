#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Install or remove the Galion Plymouth theme.
# It does not rebuild the initramfs and it does not boot a machine.
#
#   sh desktop/boot/plymouth/install.sh --dry-run
#   sudo sh desktop/boot/plymouth/install.sh
#   sudo sh desktop/boot/plymouth/install.sh --uninstall
#
# On Ubuntu, after a real install:
#   sudo update-initramfs -u
# WSL does not draw a Plymouth splash. preview.py renders frames instead.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
cd "$ROOT"
SRC=$ROOT/desktop/boot/plymouth
DEST=/usr/share/plymouth/themes/galion
PREV=/var/lib/galion/plymouth-previous

action=install
dry=0

while [ "$#" -gt 0 ]; do
  case $1 in
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

if [ "$dry" -eq 0 ] && [ "$(id -u)" -ne 0 ]; then
  printf 'refused: writing %s needs root. Pass --dry-run to print the paths.\n' "$DEST" >&2
  exit 1
fi

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

current_theme() {
  link=/usr/share/plymouth/themes/default.plymouth
  if [ -L "$link" ]; then
    target=$(readlink -f "$link")
    basename "$(dirname "$target")"
    return
  fi
  printf '\n'
}

if [ "$action" = install ]; then
  for name in galion.plymouth galion.script; do
    if [ ! -f "$SRC/$name" ]; then
      printf 'error: missing %s\n' "$SRC/$name" >&2
      exit 1
    fi
    place "$SRC/$name" "$DEST/$name"
  done
  found=0
  for src in "$SRC/images/"*.png; do
    if [ ! -f "$src" ]; then
      printf 'error: missing theme images in %s\n' "$SRC/images" >&2
      exit 1
    fi
    found=1
    place "$src" "$DEST/$(basename "$src")"
  done
  if [ "$found" -ne 1 ]; then
    printf 'error: no theme images\n' >&2
    exit 1
  fi
  if [ "$dry" -eq 0 ]; then
    mkdir -p "$(dirname "$PREV")"
    if [ ! -f "$PREV" ]; then
      name=$(current_theme)
      if [ -n "$name" ] && [ "$name" != galion ]; then
        printf '%s\n' "$name" > "$PREV"
        chmod 0644 "$PREV"
      fi
    fi
    if command -v plymouth-set-default-theme >/dev/null 2>&1; then
      plymouth-set-default-theme galion
    else
      printf 'note: plymouth-set-default-theme is not installed.\n'
    fi
  else
    printf 'install %s\n' "$PREV"
    printf 'theme galion\n'
  fi
else
  if [ "$dry" -eq 0 ] && [ -f "$PREV" ] && command -v plymouth-set-default-theme >/dev/null 2>&1; then
    name=$(IFS= read -r name < "$PREV" && printf '%s\n' "$name")
    case $name in
      ''|*[!a-z0-9-]*)
        printf 'note: previous theme name is not restored.\n'
        ;;
      *)
        plymouth-set-default-theme "$name" || printf 'note: could not restore theme %s\n' "$name"
        ;;
    esac
  fi
  remove_file "$PREV"
  remove_file "$DEST/galion.plymouth"
  remove_file "$DEST/galion.script"
  for src in "$SRC/images/"*.png; do
    if [ -f "$src" ]; then
      remove_file "$DEST/$(basename "$src")"
    fi
  done
  if [ "$dry" -eq 0 ]; then
    rmdir "$DEST" 2>/dev/null || true
    rmdir /var/lib/galion 2>/dev/null || true
  fi
fi

if [ "$dry" -eq 1 ]; then
  written=no
else
  written=yes
fi

printf '%s\n' \
  "action: $action" \
  "written: $written" \
  "shown: no" \
  "initramfs: sudo update-initramfs -u" \
  "wsl: Plymouth does not draw a splash under WSL."
