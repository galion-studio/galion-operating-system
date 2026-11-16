#!/bin/sh
# Check the Pi 5 seed archive and install it twice into an empty root.
# Needs root for useradd and systemctl --root. Does not touch the host's /opt.
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
archive=$(sh "$root/packaging/pi-seed.sh")
work=$(mktemp -d)
sysroot=
cleanup() {
  rm -rf "$work"
  if [ -n "$sysroot" ]; then
    sudo rm -rf "$sysroot"
  fi
}
trap cleanup EXIT

tar -C "$work" -xzf "$archive"
seed=$(find "$work" -mindepth 1 -maxdepth 1 -type d)
cd "$seed"
sha256sum -c SHA256SUMS
cmp "$root/LICENSE" "$seed/LICENSE"
cmp "$root/NOTICE" "$seed/NOTICE"
cmp "$root/README.md" "$seed/ideology/README.md"
cmp "$root/docs/voice-profile/README.md" "$seed/ideology/docs/voice-profile/README.md"
cmp "$root/docs/voice-profile/voice-first.md" "$seed/ideology/docs/voice-profile/voice-first.md"
cmp "$root/docs/voice-profile/hermes-later.md" "$seed/ideology/docs/voice-profile/hermes-later.md"
test -f "$seed/systemd/galion-os.target"
test -f "$seed/systemd/galion-init.service"
test -x "$seed/bin/galion-init"
test -x "$seed/install.sh"

if grep -E '(curl|wget|apt-get|apt |ssh |nc )' "$seed/install.sh"; then
  echo "test-pi-seed: install.sh names a network command" >&2
  exit 1
fi

sysroot=$(mktemp -d)
mkdir -p "$sysroot/etc/systemd/system" "$sysroot/usr/sbin"
printf '%s\n' '[Unit]' 'Description=Multi-user' > "$sysroot/etc/systemd/system/multi-user.target"
printf 'root:x:0:0:root:/root:/bin/sh\n' > "$sysroot/etc/passwd"
printf 'root:x:0:\n' > "$sysroot/etc/group"
printf 'root:!:1::::::\n' > "$sysroot/etc/shadow"
printf 'root:!:1:\n' > "$sysroot/etc/gshadow"
chmod 644 "$sysroot/etc/passwd" "$sysroot/etc/group"
if [ -x /usr/sbin/nologin ]; then
  cp /usr/sbin/nologin "$sysroot/usr/sbin/nologin"
fi

sudo GALION_SYSROOT="$sysroot" sh "$seed/install.sh"
sudo GALION_SYSROOT="$sysroot" sh "$seed/install.sh"
cmp "$seed/bin/galion-init" "$sysroot/opt/galion/bin/galion-init"
cmp "$root/LICENSE" "$sysroot/opt/galion/LICENSE"
test -f "$sysroot/etc/systemd/system/galion-os.target"
test -L "$sysroot/etc/systemd/system/multi-user.target.wants/galion-os.target"
grep -q '^galion:' "$sysroot/etc/passwd"
grep -q '^galion:' "$sysroot/etc/group"
echo "test-pi-seed: passed"
