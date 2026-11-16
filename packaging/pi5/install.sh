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

# galion-core is optional. When the seed packed it, install a oneshot that
# prints the greeting after galion-os.target. A missing binary, a non-zero
# exit, or a failed start does not fail this script. The unit's own start
# timeout is 3 seconds, and ExecStart=- treats a bad exit as success.
core_unit=0
if [ -x "$opt/bin/galion-core" ]; then
  core_tmp=$(mktemp)
  cat > "$core_tmp" <<'EOF'
[Unit]
Description=Galion OS boot greeting
Documentation=file:/opt/galion/PI5-SEED.md
After=galion-os.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=-/opt/galion/bin/galion-core
TimeoutStartSec=3
User=galion
Group=galion
NoNewPrivileges=yes
PrivateNetwork=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
StandardOutput=journal+console
StandardError=journal
SyslogIdentifier=galion-core

[Install]
WantedBy=multi-user.target
EOF
  install -m 0644 "$core_tmp" "$unitdir/galion-core.service"
  rm -f "$core_tmp"
  core_unit=1
fi

if [ -n "$sysroot" ]; then
  if ! grep -q '^galion:' "$sysroot/etc/passwd"; then
    useradd --root "$sysroot" --system --user-group \
      --home-dir /opt/galion --shell /usr/sbin/nologin --no-create-home galion
  fi
  systemctl --root "$sysroot" enable galion-os.target
  if [ "$core_unit" -eq 1 ]; then
    systemctl --root "$sysroot" enable galion-core.service
  fi
else
  if ! id -u galion >/dev/null 2>&1; then
    useradd --system --user-group \
      --home-dir /opt/galion --shell /usr/sbin/nologin --no-create-home galion
  fi
  systemctl daemon-reload
  systemctl enable galion-os.target
  systemctl start galion-os.target
  if [ "$core_unit" -eq 1 ]; then
    systemctl enable galion-core.service
    # After the target is up. A timeout or a missing console must not stop install.
    systemctl start galion-core.service || echo "install.sh: galion-core did not stay up; boot continues"
  fi
fi

echo "install.sh: installed $opt and enabled galion-os.target"
