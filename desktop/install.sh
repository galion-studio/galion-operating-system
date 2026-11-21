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
  mode=${3:-0644}
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

write_unit() {
  template=$ROOT/desktop/boot/systemd/galion-boot-sound.service
  bin=$data/galion/boot/sounds/galion-boot-sound
  if [ "$scope" = user ]; then
    dest=$config/systemd/user/galion-boot-sound.service
    wants=$config/systemd/user/graphical-session.target.wants/galion-boot-sound.service
  else
    dest=/usr/local/lib/systemd/user/galion-boot-sound.service
    wants=/usr/local/lib/systemd/user/graphical-session.target.wants/galion-boot-sound.service
  fi
  if [ "$action" = uninstall ]; then
    remove_file "$dest"
    remove_file "$wants"
    return
  fi
  require_file "$template"
  require_file "$ROOT/desktop/boot/sounds/galion-boot-sound"
  if [ "$dry" -eq 1 ]; then
    printf 'install %s\n' "$dest"
    printf 'enable %s\n' "$wants"
    return
  fi
  if printf '%s\n' "$bin" | grep -q -e '@' -e '|' -e '&' -e '\\' -e ' '; then
    printf 'error: sound path cannot be written into the unit\n' >&2
    exit 1
  fi
  mkdir -p "$(dirname "$dest")" "$(dirname "$wants")"
  sed "s|@BIN@|$bin|g" "$template" > "$dest"
  chmod 0644 "$dest"
  if grep -q '@BIN@' "$dest"; then
    printf 'error: unit still has a placeholder\n' >&2
    exit 1
  fi
  ln -sfn ../galion-boot-sound.service "$wants"
  if [ ! -L "$wants" ]; then
    printf 'error: %s is not a symlink\n' "$wants" >&2
    exit 1
  fi
  printf 'install %s\n' "$dest"
  printf 'enable %s\n' "$wants"
}

# Boot definitions, the Plymouth theme sources, and the session tones.
# The unit is enabled for the next graphical session. Nothing is played.
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  src=$ROOT/desktop/boot/$rel
  dest=$data/galion/boot/$rel
  if [ "$action" = install ]; then
    require_file "$src"
    place "$src" "$dest"
  else
    remove_file "$dest"
  fi
done <<'EOF'
README.md
index.html
sounds/openmind-desktop-sound.rs
sounds/console-ui-sound.rs
sounds/galion-sound.ts
sounds/os-tones.js
animations/om-rise.css
animations/status-pulse.css
animations/host-splash.html
animations/one-dot.css
animations/one-dot-draw.js
animations/one-dot.html
animations/dot.rs
animations/spring.rs
animations/orb_engine.rs
animations/palette.rs
animations/frame.rs
UX.md
sounds/PROVENANCE.txt
sounds/boot.ogg
sounds/boot.wav
sounds/generate_tones.py
sounds/shutdown.ogg
sounds/shutdown.wav
sounds/wake.ogg
sounds/wake.wav
plymouth/galion.plymouth
plymouth/galion.script
plymouth/install.sh
plymouth/preview.py
plymouth/render_mark.py
plymouth/uninstall.sh
plymouth/images/bar.png
plymouth/images/bullet.png
plymouth/images/entry.png
plymouth/images/mark-ring.png
plymouth/images/dot-00.png
plymouth/images/dot-01.png
plymouth/images/dot-02.png
plymouth/images/dot-03.png
plymouth/images/dot-04.png
plymouth/images/dot-05.png
plymouth/images/dot-06.png
plymouth/images/dot-07.png
plymouth/images/dot-08.png
plymouth/images/dot-09.png
plymouth/images/dot-10.png
plymouth/images/dot-11.png
plymouth/images/dot-12.png
plymouth/images/dot-13.png
plymouth/images/dot-14.png
plymouth/images/dot-15.png
plymouth/images/dot-16.png
plymouth/images/dot-17.png
plymouth/images/dot-18.png
plymouth/images/dot-19.png
plymouth/images/dot-20.png
plymouth/images/dot-21.png
plymouth/images/dot-22.png
plymouth/images/dot-23.png
systemd/galion-boot-sound.service
EOF

player=$ROOT/desktop/boot/sounds/galion-boot-sound
player_dest=$data/galion/boot/sounds/galion-boot-sound
if [ "$action" = install ]; then
  require_file "$player"
  place "$player" "$player_dest" 0755
else
  remove_file "$player_dest"
fi
write_unit

if [ "$dry" -eq 1 ]; then
  written=no
else
  written=yes
fi

if [ "$action" = install ]; then
  enabled=next-graphical-session
else
  enabled=no
fi

printf '%s\n' \
  "action: $action" \
  "scope: $scope" \
  "written: $written" \
  "enabled: $enabled" \
  "played: no"
