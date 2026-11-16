#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Write a throwaway galion-os-pi5-seed-fixture.tar.gz and print its path.
# The archive is a CI stand-in so the Bookworm boot can be exercised before
# the product seed exists, and again as a harness. It is not the Galion OS
# Pi 5 seed, it contains no Rust binary, and it must not be flashed.

set -eu

out_dir=${PI5_FIXTURE_DIR:-$(mktemp -d)}
mkdir -p "$out_dir"
stage=$out_dir/galion-os-pi5-seed-fixture
rm -rf "$stage"
mkdir -p "$stage/bin" "$stage/systemd"

cat >"$stage/bin/galion-init" <<'EOF'
#!/bin/sh
if [ "$$" -eq 1 ]; then
  printf '%s\n' 'galion-init: refusing to run as PID 1' >&2
  exit 2
fi
if [ "${1:-}" = desktop ]; then
  printf '%s\n' 'profile desktop'
  exit 0
fi
printf '%s\n' 'galion-init: unknown argument' >&2
exit 2
EOF
chmod 755 "$stage/bin/galion-init"

cat >"$stage/systemd/galion-os.target" <<'EOF'
[Unit]
Description=Galion OS fixture target
Wants=galion-init.service

[Install]
WantedBy=multi-user.target
EOF

cat >"$stage/systemd/galion-init.service" <<'EOF'
[Unit]
Description=Galion OS init plan
PartOf=galion-os.target
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/galion/bin/galion-init desktop
User=galion
Group=galion
NoNewPrivileges=yes
PrivateNetwork=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
EOF

cat >"$stage/install.sh" <<'EOF'
#!/bin/sh
set -eu
cd "$(dirname "$0")"
sha256sum -c SHA256SUMS
if ! id galion >/dev/null 2>&1; then
  useradd --system --user-group --home-dir /opt/galion --shell /usr/sbin/nologin --no-create-home galion
fi
install -d /opt/galion/bin
install -m 0755 bin/galion-init /opt/galion/bin/galion-init
install -m 0644 systemd/galion-os.target /etc/systemd/system/galion-os.target
install -m 0644 systemd/galion-init.service /etc/systemd/system/galion-init.service
systemctl daemon-reload
systemctl enable galion-os.target
systemctl start galion-os.target
printf '%s\n' 'fixture: yes'
EOF
chmod 755 "$stage/install.sh"

(
  cd "$stage"
  sha256sum install.sh bin/galion-init systemd/galion-os.target systemd/galion-init.service >SHA256SUMS
)

tarball=$out_dir/galion-os-pi5-seed-fixture.tar.gz
rm -f "$tarball"
tar -czf "$tarball" -C "$out_dir" galion-os-pi5-seed-fixture
printf '%s\n' "$tarball"
