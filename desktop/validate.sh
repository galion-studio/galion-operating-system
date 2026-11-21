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

files=$(find desktop \( -type f -o -type l \) ! -path 'desktop/ux/*' ! -path '*/__pycache__/*' | sed 's|^desktop/||' | sort)
expect_files "desktop file" "$(printf '%s\n' \
  README.md \
  applications/galion-research.desktop \
  applications/galion-voice.desktop \
  applications/openmind-desktop.desktop \
  boot/README.md \
  boot/UX.md \
  boot/animations/dot.rs \
  boot/animations/frame.rs \
  boot/animations/host-splash.html \
  boot/animations/om-rise.css \
  boot/animations/one-dot-draw.js \
  boot/animations/one-dot.css \
  boot/animations/one-dot.html \
  boot/animations/orb_engine.rs \
  boot/animations/palette.rs \
  boot/animations/spring.rs \
  boot/animations/status-pulse.css \
  boot/cinematic/THIRD_PARTY_NOTICES.md \
  boot/cinematic/capture.mjs \
  boot/cinematic/check_motion.mjs \
  boot/cinematic/cinematic.css \
  boot/cinematic/cinematic.mjs \
  boot/cinematic/field.mjs \
  boot/cinematic/field.py \
  boot/cinematic/index.html \
  boot/cinematic/motion.mjs \
  boot/cinematic/motion.py \
  boot/cinematic/render_frames.py \
  boot/cinematic/serve.py \
  boot/cinematic/snoise.mjs \
  boot/cinematic/timeline.json \
  boot/cinematic/vendor/coaurora/LICENSE \
  boot/cinematic/vendor/coaurora/src/cpu.js \
  boot/cinematic/vendor/coaurora/src/curtains.js \
  boot/cinematic/vendor/coaurora/src/gl.js \
  boot/cinematic/vendor/coaurora/src/index.js \
  boot/cinematic/vendor/coaurora/src/shaders.js \
  boot/cinematic/vendor/coaurora/src/store.js \
  boot/cinematic/vendor/webgl-noise/LICENSE \
  boot/cinematic/vendor/webgl-noise/noise2D.glsl \
  boot/index.html \
  boot/plymouth/galion.plymouth \
  boot/plymouth/galion.script \
  boot/plymouth/images/bar.png \
  boot/plymouth/images/bullet.png \
  boot/plymouth/images/cin-000.png \
  boot/plymouth/images/cin-001.png \
  boot/plymouth/images/cin-002.png \
  boot/plymouth/images/cin-003.png \
  boot/plymouth/images/cin-004.png \
  boot/plymouth/images/cin-005.png \
  boot/plymouth/images/cin-006.png \
  boot/plymouth/images/cin-007.png \
  boot/plymouth/images/cin-008.png \
  boot/plymouth/images/cin-009.png \
  boot/plymouth/images/cin-010.png \
  boot/plymouth/images/cin-011.png \
  boot/plymouth/images/cin-012.png \
  boot/plymouth/images/cin-013.png \
  boot/plymouth/images/cin-014.png \
  boot/plymouth/images/cin-015.png \
  boot/plymouth/images/cin-016.png \
  boot/plymouth/images/cin-017.png \
  boot/plymouth/images/cin-018.png \
  boot/plymouth/images/cin-019.png \
  boot/plymouth/images/cin-020.png \
  boot/plymouth/images/cin-021.png \
  boot/plymouth/images/cin-022.png \
  boot/plymouth/images/cin-023.png \
  boot/plymouth/images/cin-024.png \
  boot/plymouth/images/cin-025.png \
  boot/plymouth/images/cin-026.png \
  boot/plymouth/images/cin-027.png \
  boot/plymouth/images/cin-028.png \
  boot/plymouth/images/cin-029.png \
  boot/plymouth/images/cin-030.png \
  boot/plymouth/images/cin-031.png \
  boot/plymouth/images/cin-032.png \
  boot/plymouth/images/cin-033.png \
  boot/plymouth/images/cin-034.png \
  boot/plymouth/images/cin-035.png \
  boot/plymouth/images/cin-036.png \
  boot/plymouth/images/cin-037.png \
  boot/plymouth/images/cin-038.png \
  boot/plymouth/images/cin-039.png \
  boot/plymouth/images/cin-040.png \
  boot/plymouth/images/cin-041.png \
  boot/plymouth/images/cin-042.png \
  boot/plymouth/images/cin-043.png \
  boot/plymouth/images/cin-044.png \
  boot/plymouth/images/cin-045.png \
  boot/plymouth/images/cin-046.png \
  boot/plymouth/images/cin-047.png \
  boot/plymouth/images/cin-048.png \
  boot/plymouth/images/cin-049.png \
  boot/plymouth/images/cin-050.png \
  boot/plymouth/images/cin-051.png \
  boot/plymouth/images/cin-052.png \
  boot/plymouth/images/cin-053.png \
  boot/plymouth/images/cin-054.png \
  boot/plymouth/images/cin-055.png \
  boot/plymouth/images/cin-056.png \
  boot/plymouth/images/cin-057.png \
  boot/plymouth/images/cin-058.png \
  boot/plymouth/images/cin-059.png \
  boot/plymouth/images/cin-060.png \
  boot/plymouth/images/cin-061.png \
  boot/plymouth/images/cin-062.png \
  boot/plymouth/images/cin-063.png \
  boot/plymouth/images/cin-064.png \
  boot/plymouth/images/cin-065.png \
  boot/plymouth/images/cin-066.png \
  boot/plymouth/images/cin-067.png \
  boot/plymouth/images/cin-068.png \
  boot/plymouth/images/cin-069.png \
  boot/plymouth/images/cin-070.png \
  boot/plymouth/images/cin-071.png \
  boot/plymouth/images/cin-072.png \
  boot/plymouth/images/cin-073.png \
  boot/plymouth/images/cin-074.png \
  boot/plymouth/images/cin-075.png \
  boot/plymouth/images/cin-076.png \
  boot/plymouth/images/cin-077.png \
  boot/plymouth/images/cin-078.png \
  boot/plymouth/images/cin-079.png \
  boot/plymouth/images/cin-080.png \
  boot/plymouth/images/cin-081.png \
  boot/plymouth/images/cin-082.png \
  boot/plymouth/images/cin-083.png \
  boot/plymouth/images/cin-084.png \
  boot/plymouth/images/cin-085.png \
  boot/plymouth/images/cin-086.png \
  boot/plymouth/images/cin-087.png \
  boot/plymouth/images/cin-088.png \
  boot/plymouth/images/cin-089.png \
  boot/plymouth/images/cin-090.png \
  boot/plymouth/images/cin-091.png \
  boot/plymouth/images/cin-092.png \
  boot/plymouth/images/cin-093.png \
  boot/plymouth/images/cin-094.png \
  boot/plymouth/images/cin-095.png \
  boot/plymouth/images/cin-096.png \
  boot/plymouth/images/cin-097.png \
  boot/plymouth/images/cin-098.png \
  boot/plymouth/images/cin-099.png \
  boot/plymouth/images/dot-00.png \
  boot/plymouth/images/dot-01.png \
  boot/plymouth/images/dot-02.png \
  boot/plymouth/images/dot-03.png \
  boot/plymouth/images/dot-04.png \
  boot/plymouth/images/dot-05.png \
  boot/plymouth/images/dot-06.png \
  boot/plymouth/images/dot-07.png \
  boot/plymouth/images/dot-08.png \
  boot/plymouth/images/dot-09.png \
  boot/plymouth/images/dot-10.png \
  boot/plymouth/images/dot-11.png \
  boot/plymouth/images/dot-12.png \
  boot/plymouth/images/dot-13.png \
  boot/plymouth/images/dot-14.png \
  boot/plymouth/images/dot-15.png \
  boot/plymouth/images/dot-16.png \
  boot/plymouth/images/dot-17.png \
  boot/plymouth/images/dot-18.png \
  boot/plymouth/images/dot-19.png \
  boot/plymouth/images/dot-20.png \
  boot/plymouth/images/dot-21.png \
  boot/plymouth/images/dot-22.png \
  boot/plymouth/images/dot-23.png \
  boot/plymouth/images/entry.png \
  boot/plymouth/images/mark-ring.png \
  boot/plymouth/install.sh \
  boot/plymouth/preview.py \
  boot/plymouth/render_mark.py \
  boot/plymouth/uninstall.sh \
  boot/sounds/PROVENANCE.txt \
  boot/sounds/boot.ogg \
  boot/sounds/boot.wav \
  boot/sounds/console-ui-sound.rs \
  boot/sounds/galion-boot-sound \
  boot/sounds/galion-os-startup.mp3 \
  boot/sounds/galion-os-startup.ogg \
  boot/sounds/galion-sound.ts \
  boot/sounds/generate_tones.py \
  boot/sounds/openmind-desktop-sound.rs \
  boot/sounds/os-tones.js \
  boot/sounds/shutdown.ogg \
  boot/sounds/shutdown.wav \
  boot/sounds/wake.ogg \
  boot/sounds/wake.wav \
  boot/systemd/galion-boot-sound.service \
  boot/test-boot.sh \
  gtk/gtk.css \
  gtk/settings.ini \
  icons/hicolor/scalable/apps/galion-os.svg \
  icons/hicolor/scalable/apps/galion-research.svg \
  icons/hicolor/scalable/apps/galion-voice.svg \
  install.sh \
  test-install.sh \
  validate.sh \
)" "$files"

# Scan the entries and the note. Skip this script: its patterns are the
# check. Skip the icon marks: they are the brand SVGs, and the namespace
# in those files is not a listen address. The icon check below requires
# those bytes.
if grep -n -E -e '://' -e 'localhost' -e '0\.0\.0\.0' -e '::1' -e '([0-9]{1,3}\.){3}[0-9]{1,3}' \
  desktop/README.md \
  desktop/applications/*.desktop \
  desktop/gtk/gtk.css \
  desktop/gtk/settings.ini; then
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
