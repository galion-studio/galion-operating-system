#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Install or remove the Galion session look: tokens, greeter files,
# wake hook, GTK theme, icons, cursors, and wallpaper.
# It does not start a display manager, play a tone, or open a socket.
#
#   sh desktop/ux/install.sh --user
#   sh desktop/ux/install.sh --system --dry-run
#   sh desktop/ux/install.sh --user --uninstall

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
UX=$ROOT/desktop/ux

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

require_file() {
  if [ ! -f "$1" ]; then
    printf 'error: missing %s\n' "$1" >&2
    exit 1
  fi
}

place() {
  src=$1
  dest=$2
  mode=$3
  if [ "$dry" -eq 1 ]; then
    printf 'install %s\n' "$dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  install -m "$mode" "$src" "$dest"
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

dest_for() {
  rel=$1
  case $rel in
    gtk/Galion/*)
      printf '%s\n' "$data/themes/${rel#gtk/}"
      ;;
    icons/Galion/*)
      printf '%s\n' "$data/$rel"
      ;;
    *)
      printf '%s\n' "$data/galion/ux/$rel"
      ;;
  esac
}

mode_for() {
  case $1 in
    session/wake.sh) printf '%s\n' 0755 ;;
    *) printf '%s\n' 0644 ;;
  esac
}

while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  src=$UX/$rel
  dest=$(dest_for "$rel")
  if [ "$action" = install ]; then
    require_file "$src"
    place "$src" "$dest" "$(mode_for "$rel")"
  else
    remove_file "$dest"
  fi
done <<'EOF'
tokens/tokens.json
tokens/tokens.css
tokens/tokens.js
tokens/gtk.css
tokens/session.env
greeter/galion-gdm.css
greeter/galion.gresource.xml
greeter/10-galion.dconf
session/wake.sh
session/wake.html
session/wake.css
session/wake_tone.py
marks/icon-os.svg
marks/icon-one.svg
marks/icon-research.svg
marks/mark-dot.svg
wallpaper/galion-wallpaper.svg
wallpaper/galion-wallpaper.png
gtk/Galion/index.theme
gtk/Galion/gtk-3.0/gtk.css
gtk/Galion/gtk-4.0/gtk.css
icons/Galion/index.theme
icons/Galion/scalable/apps/galion-os.svg
icons/Galion/scalable/apps/galion-one.svg
icons/Galion/scalable/apps/galion-research.svg
icons/Galion/scalable/apps/galion-voice.svg
icons/Galion/cursors/left_ptr
icons/Galion/cursors/xterm
icons/Galion/cursors/hand2
icons/Galion/cursors/crosshair
EOF

autostart=$config/autostart/galion-wake.desktop
wake_bin=$data/galion/ux/session/wake.sh
if [ "$action" = uninstall ]; then
  remove_file "$autostart"
else
  if [ "$dry" -eq 1 ]; then
    printf 'install %s\n' "$autostart"
  else
    mkdir -p "$(dirname "$autostart")"
    cat > "$autostart" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Galion wake
Comment=Fade the desktop in, then open Open Mind
Exec=$wake_bin
Terminal=false
StartupNotify=false
X-GNOME-Autostart-Phase=Desktop
EOF
    chmod 644 "$autostart"
    printf 'install %s\n' "$autostart"
  fi
fi

if [ "$scope" = system ]; then
  gdm=/etc/dconf/db/gdm.d/10-galion
  if [ "$action" = uninstall ]; then
    remove_file "$gdm"
  else
    place "$UX/greeter/10-galion.dconf" "$gdm" 0644
  fi
  if [ "$dry" -eq 0 ] && command -v dconf >/dev/null 2>&1; then
    dconf update || true
    printf '%s\n' "dconf: updated"
  else
    printf '%s\n' "dconf: skipped"
  fi
fi

if [ "$dry" -eq 1 ]; then
  written=no
else
  written=yes
fi

printf '%s\n' "action: $action" "scope: $scope" "written: $written"
