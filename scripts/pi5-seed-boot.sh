#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Boot Debian Bookworm for arm64 under qemu-system-aarch64, with no NIC,
# run the seed's install.sh, and start galion-os.target. The machine is a
# QEMU virt board. It is not a Raspberry Pi 5.
#
# The Debian nocloud image does not ship cloud-init, so the check is a
# one-shot unit written into the disk before boot. The unit is not a
# Galion unit.

set -eu

if [ "$#" -ne 1 ]; then
  printf 'usage: pi5-seed-boot.sh <galion-os-pi5-seed-SHA.tar.gz>\n' >&2
  exit 2
fi

TARBALL=$1
[ -f "$TARBALL" ] || {
  printf 'error: tarball is not a file: %s\n' "$TARBALL" >&2
  exit 1
}

base=$(basename "$TARBALL")
case "$base" in
  galion-os-pi5-seed-*.tar.gz) ;;
  *)
    printf 'error: tarball must be named galion-os-pi5-seed-<sha>.tar.gz\n' >&2
    exit 1
    ;;
esac

if ! tar -tzf "$TARBALL" | grep -E '(^|/)install\.sh$' >/dev/null; then
  printf 'error: tarball has no install.sh\n' >&2
  exit 1
fi

for cmd in qemu-system-aarch64 qemu-img; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'error: %s is not installed\n' "$cmd" >&2
    exit 1
  fi
done

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
LOG_DIR=${PI5_BOOT_LOG_DIR:-$ROOT/pi5-boot-logs}
CACHE=${PI5_DEBIAN_CACHE:-/tmp/pi5-debian-cache}
TIMEOUT=${PI5_QEMU_TIMEOUT:-1200}
IMAGE_NAME=debian-12-nocloud-arm64.qcow2
IMAGE_URL=https://cloud.debian.org/images/cloud/bookworm/latest/${IMAGE_NAME}
SUM_URL=https://cloud.debian.org/images/cloud/bookworm/latest/SHA512SUMS
work=$(mktemp -d)
mkdir -p "$LOG_DIR" "$CACHE"
LOOP=
MNT=$work/mnt

cat >"$LOG_DIR/README.txt" <<'EOF'
These files are from the Pi 5 seed boot job.

The guest is Debian Bookworm's arm64 nocloud image on a QEMU virt
machine (qemu-system-aarch64, TCG). The guest has no network interface.
There is no Raspberry Pi kernel, firmware, bootloader, or SSD in this job.

A PASS in pi5-unit-table.txt is an emulator result. It is not a
Raspberry Pi 5 result. scripts/pi5-flash-check.sh on the flashed board
is the hardware reading.
EOF

detach_disk() {
  if mountpoint -q "$MNT" 2>/dev/null; then
    sudo umount "$MNT" || true
  fi
  if [ -n "$LOOP" ]; then
    sudo losetup -d "$LOOP" || true
    LOOP=
  fi
}

cleanup() {
  status=$?
  if [ -n "${GUEST_RC:-}" ]; then
    status=$GUEST_RC
  fi
  detach_disk
  if [ -f "$LOG_DIR/pi5-unit-table.txt" ]; then
    printf '\n----- unit table -----\n'
    cat "$LOG_DIR/pi5-unit-table.txt"
  fi
  rm -rf "$work"
  trap - EXIT
  exit "$status"
}
trap cleanup EXIT

firmware=
for candidate in \
  /usr/share/AAVMF/AAVMF_CODE.fd \
  /usr/share/qemu-efi-aarch64/QEMU_EFI.fd
do
  if [ -f "$candidate" ]; then
    firmware=$candidate
    break
  fi
done
[ -n "$firmware" ] || {
  printf 'error: AAVMF firmware was not found\n' >&2
  exit 1
}
vars_template=
for candidate in \
  /usr/share/AAVMF/AAVMF_VARS.fd \
  /usr/share/qemu-efi-aarch64/QEMU_VARS.fd
do
  if [ -f "$candidate" ]; then
    vars_template=$candidate
    break
  fi
done
[ -n "$vars_template" ] || {
  printf 'error: AAVMF variable store was not found\n' >&2
  exit 1
}

image=$CACHE/$IMAGE_NAME
if [ ! -f "$CACHE/SHA512SUMS" ] || [ ! -f "$image" ]; then
  printf 'pi5-seed-boot: downloading Debian Bookworm nocloud arm64 checksums\n'
  curl -fsSL -o "$CACHE/SHA512SUMS" "$SUM_URL"
fi
if [ ! -f "$image" ]; then
  printf 'pi5-seed-boot: downloading Debian Bookworm nocloud arm64 image\n'
  curl -fsSL -o "$image.partial" "$IMAGE_URL"
  mv "$image.partial" "$image"
fi
grep " ${IMAGE_NAME}\$" "$CACHE/SHA512SUMS" >"$work/sha512"
if [ ! -s "$work/sha512" ]; then
  printf 'error: SHA512SUMS has no %s\n' "$IMAGE_NAME" >&2
  exit 1
fi
(
  cd "$CACHE"
  sha512sum -c "$work/sha512"
)

printf 'pi5-seed-boot: preparing a Bookworm disk\n'
qemu-img create -f qcow2 -b "$image" -F qcow2 "$work/overlay.qcow2" >/dev/null
qemu-img convert -O raw "$work/overlay.qcow2" "$work/disk.raw"
LOOP=$(sudo losetup -f --show -P "$work/disk.raw")
sudo partx -u "$LOOP"
part=${LOOP}p1
if [ ! -b "$part" ]; then
  printf 'error: Bookworm disk has no first partition\n' >&2
  exit 1
fi
mkdir -p "$MNT"
sudo mount "$part" "$MNT"

sudo mkdir -p "$MNT/opt/seed-boot/out" "$MNT/etc/systemd/system/multi-user.target.wants"
sudo cp "$TARBALL" "$MNT/opt/seed-boot/seed.tar.gz"
sudo cp "$ROOT/scripts/pi5-seed-guest.sh" "$MNT/opt/seed-boot/pi5-seed-guest.sh"
sudo cp "$ROOT/scripts/pi5-flash-check.sh" "$MNT/opt/seed-boot/pi5-flash-check.sh"
sudo tee "$MNT/opt/seed-boot/run.sh" >/dev/null <<'EOF'
#!/bin/sh
cp /opt/seed-boot/seed.tar.gz /tmp/seed.tar.gz
cp /opt/seed-boot/pi5-flash-check.sh /tmp/pi5-flash-check.sh
sh /opt/seed-boot/pi5-seed-guest.sh
sync
systemctl poweroff || poweroff
EOF
sudo chmod 755 "$MNT/opt/seed-boot/run.sh" "$MNT/opt/seed-boot/pi5-seed-guest.sh" "$MNT/opt/seed-boot/pi5-flash-check.sh"
sudo tee "$MNT/etc/systemd/system/pi5-seed-boot.service" >/dev/null <<'EOF'
[Unit]
Description=Galion seed boot check
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/opt/seed-boot/run.sh
TimeoutStartSec=infinity

[Install]
WantedBy=multi-user.target
EOF
sudo ln -sfn /etc/systemd/system/pi5-seed-boot.service \
  "$MNT/etc/systemd/system/multi-user.target.wants/pi5-seed-boot.service"
if [ -d "$MNT/etc/systemd/system" ]; then
  sudo ln -sfn /dev/null "$MNT/etc/systemd/system/systemd-networkd-wait-online.service"
fi
sudo umount "$MNT"
sudo losetup -d "$LOOP"
LOOP=

cp "$vars_template" "$work/vars.fd"
printf 'pi5-seed-boot: starting qemu-system-aarch64 (no NIC, timeout %ss)\n' "$TIMEOUT"
set +e
timeout --signal=TERM "$TIMEOUT" qemu-system-aarch64 \
  -machine virt,accel=tcg \
  -cpu cortex-a72 \
  -m 1536 \
  -smp 2 \
  -nic none \
  -display none \
  -serial file:"$LOG_DIR/pi5-console.log" \
  -monitor none \
  -no-reboot \
  -drive if=pflash,format=raw,readonly=on,file="$firmware" \
  -drive if=pflash,format=raw,file="$work/vars.fd" \
  -drive if=virtio,format=raw,file="$work/disk.raw"
qemu_rc=$?
set -e

LOOP=$(sudo losetup -f --show -P "$work/disk.raw")
sudo partx -u "$LOOP"
part=${LOOP}p1
sudo mount "$part" "$MNT"
if [ -d "$MNT/opt/seed-boot/out" ]; then
  sudo cp -a "$MNT/opt/seed-boot/out/." "$LOG_DIR/"
  sudo chown -R "$(id -u):$(id -g)" "$LOG_DIR"
fi
detach_disk

if [ "$qemu_rc" -eq 124 ]; then
  printf 'error: qemu-system-aarch64 exceeded %ss\n' "$TIMEOUT" >&2
  GUEST_RC=1
  exit 1
fi

if [ -f "$LOG_DIR/exit-code" ]; then
  GUEST_RC=$(cat "$LOG_DIR/exit-code")
else
  printf 'error: guest did not write an exit code (qemu exit %s)\n' "$qemu_rc" >&2
  if [ -f "$LOG_DIR/pi5-console.log" ]; then
    printf 'error: last console lines:\n' >&2
    tail -n 40 "$LOG_DIR/pi5-console.log" >&2 || true
  fi
  GUEST_RC=1
fi
case "$GUEST_RC" in
  ''|*[!0-9]*) GUEST_RC=1 ;;
esac
exit "$GUEST_RC"
