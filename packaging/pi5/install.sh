#!/bin/sh
# Install the Galion OS Pi 5 seed onto a Raspberry Pi OS root.
# Idempotent. Copies files only. Does not use the network.
set -eu

seed=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
sysroot=${GALION_SYSROOT:-}

if [ "$(id -u)" -ne 0 ]; then
  echo "install.sh: run as root" >&2
  exit 1
fi

cd "$seed"
sha256sum -c SHA256SUMS

opt="$sysroot/opt/galion"
unitdir="$sysroot/etc/systemd/system"
install -d "$opt/bin" "$unitdir"

for bin in "$seed"/bin/*; do
  if [ ! -f "$bin" ]; then
    continue
  fi
  install -m 0755 "$bin" "$opt/bin/$(basename "$bin")"
done

for unit in "$seed"/systemd/*; do
  if [ ! -f "$unit" ]; then
    continue
  fi
  install -m 0644 "$unit" "$unitdir/$(basename "$unit")"
done

install -m 0644 "$seed/LICENSE" "$opt/LICENSE"
if [ -f "$seed/NOTICE" ]; then
  install -m 0644 "$seed/NOTICE" "$opt/NOTICE"
fi
if [ -f "$seed/PI5-SEED.md" ]; then
  install -m 0644 "$seed/PI5-SEED.md" "$opt/PI5-SEED.md"
fi
if [ -d "$seed/ideology" ]; then
  mkdir -p "$opt/ideology"
  cp -a "$seed/ideology/." "$opt/ideology/"
fi

if [ -n "$sysroot" ]; then
  if ! grep -q '^galion:' "$sysroot/etc/passwd"; then
    useradd --root "$sysroot" --system --user-group \
      --home-dir /opt/galion --shell /usr/sbin/nologin --no-create-home galion
  fi
  systemctl --root "$sysroot" enable galion-os.target
else
  if ! id -u galion >/dev/null 2>&1; then
    useradd --system --user-group \
      --home-dir /opt/galion --shell /usr/sbin/nologin --no-create-home galion
  fi
  systemctl daemon-reload
  systemctl enable galion-os.target
  systemctl start galion-os.target
fi

echo "install.sh: installed $opt and enabled galion-os.target"
