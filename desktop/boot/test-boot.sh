#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Check the synthesised tones, the Plymouth preview, and the session
# player. It does not install the theme and it does not boot a machine.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

if [ "$#" -ne 0 ]; then
  printf 'refused: boot checks take no arguments.\n' >&2
  exit 2
fi

fail() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

python3 desktop/boot/sounds/generate_tones.py --check
python3 desktop/boot/plymouth/render_mark.py --check

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

python3 desktop/boot/plymouth/preview.py \
  --output "$tmp/frames" \
  --boot-frames 4 \
  --settle-frames 2 \
  --width 640 \
  --height 360

for name in boot-000.png boot-003.png boot.gif shutdown-000.png shutdown.gif reboot-000.png reboot.gif password.png; do
  if [ ! -f "$tmp/frames/$name" ]; then
    fail "preview did not write $name"
  fi
done
png_head=$(od -An -t x1 -N 8 "$tmp/frames/boot-000.png" | tr -d ' \n')
if [ "$png_head" != "89504e470d0a1a0a" ]; then
  fail "boot frame is not a PNG"
fi
gif_head=$(od -An -t c -N 6 "$tmp/frames/boot.gif" | tr -d ' \n')
case $gif_head in
  *G*I*F*8*9*a*) ;;
  *) fail "boot.gif is not a GIF89a" ;;
esac

python3 - <<'PY'
from pathlib import Path
images = {path.name for path in Path("desktop/boot/plymouth/images").glob("*.png")}
needed = {"mark-ring.png", "bar.png", "bullet.png", "entry.png"}
needed.update(f"dot-{index:02d}.png" for index in range(24))
missing = sorted(needed - images)
if missing:
    raise SystemExit("missing theme images: " + ", ".join(missing))
script = Path("desktop/boot/plymouth/galion.script").read_text(encoding="utf-8")
depth = 0
for line in script.splitlines():
    body = line.split("#", 1)[0]
    depth += body.count("{") - body.count("}")
    if depth < 0:
        raise SystemExit("Plymouth script closes a block it did not open")
if depth != 0:
    raise SystemExit("Plymouth script has unbalanced braces")
if "for (i = 0; i < 24; i = i + 1)" not in script:
    raise SystemExit("Plymouth script does not load 24 dot frames")
PY

missing=$(
  find desktop/boot \( -type f -o -type l \) | sed 's|^desktop/boot/||' | while IFS= read -r rel; do
    case $rel in
      test-boot.sh) continue ;;
    esac
    if ! grep -q -F -- "$rel" desktop/install.sh; then
      printf '%s\n' "$rel"
    fi
  done
)
if [ -n "$missing" ]; then
  printf '%s\n' "$missing" >&2
  fail "install.sh does not name every boot file"
fi

if find desktop/boot \( -iname '*samantha*' -o -iname '*jarvis*' -o -iname '*s711*' \) | grep -q .; then
  fail "a boot filename names a voice recording"
fi
if ! grep -q 'Not a recording' desktop/boot/sounds/PROVENANCE.txt; then
  fail "provenance does not say the tones are synthesised"
fi

export HOME=$tmp/home
export XDG_CONFIG_HOME=$tmp/config
export XDG_RUNTIME_DIR=$tmp/run
export GALION_LOCAL_HOUR=12
export GALION_PLAY_LOG=$tmp/played
export GALION_SOUND_PLAYER=$tmp/play
mkdir -p "$HOME" "$XDG_CONFIG_HOME" "$XDG_RUNTIME_DIR"
cat > "$GALION_SOUND_PLAYER" <<'EOF'
#!/bin/sh
printf '%s\n' "$1" >> "$GALION_PLAY_LOG"
EOF
chmod 0755 "$GALION_SOUND_PLAYER"
: > "$GALION_PLAY_LOG"

player=$ROOT/desktop/boot/sounds/galion-boot-sound
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'played: boot' || fail "start did not play boot"
if [ "$(wc -l < "$GALION_PLAY_LOG" | tr -d ' ')" != 1 ]; then
  fail "start played more than once"
fi
grep -q '/boot.wav$' "$GALION_PLAY_LOG" || fail "start did not pass boot.wav"
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'skipped: already' || fail "second start played again"

rm -f "$XDG_RUNTIME_DIR/galion/boot-sound-boot"
sh "$player" silence on
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'skipped: silence' || fail "silence did not hold"
test -f "$XDG_CONFIG_HOME/galion/silence"
sh "$player" silence off

rm -f "$XDG_RUNTIME_DIR/galion/boot-sound-boot"
sh "$player" mute on
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'skipped: mute' || fail "mute did not hold"
sh "$player" mute off

rm -f "$XDG_RUNTIME_DIR/galion/boot-sound-boot"
GALION_LOCAL_HOUR=23
export GALION_LOCAL_HOUR
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'skipped: night' || fail "night window did not hold"
GALION_LOCAL_HOUR=12
export GALION_LOCAL_HOUR

rm -f "$XDG_RUNTIME_DIR/galion/boot-sound-wake"
GALION_BOOT_SOUND=wake
export GALION_BOOT_SOUND
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'played: wake' || fail "wake was not the session sound"
unset GALION_BOOT_SOUND

out=$(sh "$player" stop)
printf '%s\n' "$out" | grep -q 'played: shutdown' || fail "stop did not play shutdown"
grep -q '/shutdown.wav$' "$GALION_PLAY_LOG" || fail "stop did not pass shutdown.wav"

cat > "$GALION_SOUND_PLAYER" <<'EOF'
#!/bin/sh
exit 1
EOF
chmod 0755 "$GALION_SOUND_PLAYER"
rm -f "$XDG_RUNTIME_DIR/galion/boot-sound-boot"
out=$(sh "$player" start)
printf '%s\n' "$out" | grep -q 'skipped: no-device' || fail "a failed player was fatal"
if [ -e "$XDG_RUNTIME_DIR/galion/boot-sound-boot" ]; then
  fail "a failed play left a stamp"
fi

out=$(sh "$player" status)
printf '%s\n' "$out" | grep -q 'silence: off' || fail "status did not report silence"
printf '%s\n' "$out" | grep -q 'sound: boot' || fail "status did not report the boot sound"

rc=0
sh "$player" >/dev/null 2>&1 || rc=$?
if [ "$rc" -ne 2 ]; then
  fail "missing arguments exited $rc"
fi
rc=0
GALION_BOOT_SOUND=chord sh "$player" start >/dev/null 2>&1 || rc=$?
if [ "$rc" -ne 2 ]; then
  fail "bad GALION_BOOT_SOUND exited $rc"
fi

out=$(sh desktop/boot/plymouth/install.sh --dry-run)
printf '%s\n' "$out" | grep -q 'update-initramfs -u' || fail "install did not name update-initramfs"
printf '%s\n' "$out" | grep -q 'WSL' || fail "install did not name WSL"
printf '%s\n' "$out" | grep -q 'shown: no' || fail "install claimed the splash was shown"
printf '%s\n' "$out" | grep -q 'written: no' || fail "dry-run wrote the theme"
if [ -e /usr/share/plymouth/themes/galion/galion.script ]; then
  fail "dry-run created the system theme"
fi
out=$(sh desktop/boot/plymouth/uninstall.sh --dry-run)
printf '%s\n' "$out" | grep -q 'action: uninstall' || fail "uninstall did not run"
printf '%s\n' "$out" | grep -q 'shown: no' || fail "uninstall claimed the splash was shown"

printf '%s\n' "boot experience checks passed" "played: in a fake player" "booted: no"
