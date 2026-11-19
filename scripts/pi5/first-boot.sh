#!/bin/sh
# Bring the Galion seed up on this machine, then say what happened.
# Safe to run again: the seed install copies the same files, and systemd
# enable and start are issued again only as the same commands.
#
# Each step is one line in the report. A failed line says what to do next.
# The report is not a Raspberry Pi 5 result unless the model line names a
# Raspberry Pi and you ran this script on that board.
#
# Usage: first-boot.sh <seed-dir> [report-file]
# The default report is ./pi5-first-boot.txt, beside a board report saved
# in the same directory. This script does not write the board report.
#
# GALION_PROC        proc tree (default /proc)
# GALION_SYS         sysfs tree (default /sys)
# GALION_ID          id command (default id)
# GALION_SHA256SUM   sha256sum command (default sha256sum)
# SYSTEMCTL          systemctl binary (default systemctl)

set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  printf 'usage: first-boot.sh <seed-dir> [report-file]\n' >&2
  exit 2
fi

seed=$1
report=${2:-pi5-first-boot.txt}
if [ -d "$report" ]; then
  printf 'error: report path is a directory: %s\n' "$report" >&2
  exit 2
fi

PROC=${GALION_PROC:-/proc}
SYS=${GALION_SYS:-/sys}
ID=${GALION_ID:-id}
SHA=${GALION_SHA256SUM:-sha256sum}
SYSTEMCTL=${SYSTEMCTL:-systemctl}
export SYSTEMCTL

report_dir=$(dirname "$report")
mkdir -p "$report_dir"
if ! : >"$report"; then
  printf 'error: cannot write %s\n' "$report" >&2
  exit 2
fi

say() {
  printf '%s\n' "$1" >>"$report"
  printf '%s\n' "$1"
}

fail() {
  say "$1"
  say "summary: failed"
  exit 1
}

read_model() {
  if [ -r "$PROC/device-tree/model" ]; then
    tr -d '\000\n' <"$PROC/device-tree/model"
  fi
}

root_source() {
  if [ -r "$PROC/cmdline" ]; then
    tr ' ' '\n' <"$PROC/cmdline" | sed -n 's/^root=//p' | head -n 1
  fi
  if [ -r "$PROC/mounts" ]; then
    awk '$2 == "/" { print $1; exit }' "$PROC/mounts"
  fi
}

disk_name() {
  name=$(printf '%s' "$1" | sed 's|.*/||')
  case "$name" in
    mmcblk*p[0-9]*|nvme*p[0-9]*)
      printf '%s\n' "${name%p*}"
      ;;
    sd[a-z]*[0-9])
      printf '%s\n' "$(printf '%s' "$name" | sed 's/[0-9]*$//')"
      ;;
    '')
      ;;
    *)
      printf '%s\n' "$name"
      ;;
  esac
}

boot_medium() {
  disk=$1
  [ -n "$disk" ] || {
    printf '%s\n' unread
    return
  }
  link=
  if [ -e "$SYS/class/block/$disk" ]; then
    link=$(readlink "$SYS/class/block/$disk" 2>/dev/null || true)
    full=$(readlink -f "$SYS/class/block/$disk" 2>/dev/null || true)
    link="$link $full"
  fi
  case "$link" in
    *usb*) printf '%s\n' usb ;;
    *mmc*) printf '%s\n' mmc ;;
    *nvme*) printf '%s\n' nvme ;;
    *) printf '%s\n' unclassified ;;
  esac
}

say "GALION FIRST BOOT"
say "note: This report is not a Raspberry Pi 5 result unless the model line names a Raspberry Pi and you ran this script on that board."

model=$(read_model || true)
if [ -n "$model" ]; then
  say "model: $model"
else
  say "model: unread"
fi

root_dev=$(root_source | head -n 1 || true)
disk=$(disk_name "$root_dev")
medium=$(boot_medium "$disk")
say "boot-medium: $medium"

set +e
uid=$("$ID" -u 2>/dev/null)
id_rc=$?
set -e
if [ "$id_rc" -ne 0 ] || [ "$uid" -ne 0 ]; then
  fail "root: failed. Run this again with sudo."
fi
say "root: ok"

if [ ! -d "$seed" ] || [ ! -f "$seed/install.sh" ] || [ ! -f "$seed/SHA256SUMS" ]; then
  fail "seed: failed. Unpack the seed tarball, then pass that directory as the first argument."
fi
say "seed: ok"

if ! command -v "$SHA" >/dev/null 2>&1; then
  fail "checksum: failed. sha256sum is not available. Install it, then run this script again."
fi
set +e
( cd "$seed" && "$SHA" -c SHA256SUMS >/dev/null 2>&1 )
sum_rc=$?
set -e
if [ "$sum_rc" -ne 0 ]; then
  fail "checksum: failed. Stop. Copy the seed tarball again. Do not install this copy."
fi
say "checksum: ok"

set +e
install_out=$(sh "$seed/install.sh" 2>&1)
install_rc=$?
set -e
if [ "$install_rc" -ne 0 ]; then
  case "$install_out" in
    *Failed\ to\ start*|*systemctl*)
      fail "install: failed. galion-os.target did not start. Run this script again with sudo. Then run sudo sh scripts/pi5-flash-check.sh and keep the table."
      ;;
    *useradd*|*user\ galion*)
      fail "install: failed. The user galion could not be created. Fix that, then run this script again. A second run is safe."
      ;;
    *)
      fail "install: failed. The seed install did not finish. Fix the cause, then run this script again. A second run is safe."
      ;;
  esac
fi
say "install: ok"

if [ -n "${GALION_SYSROOT:-}" ]; then
  say "systemd: ok. The seed was copied into a sysroot. This script did not start units on the machine."
  say "summary: ok"
  exit 0
fi

if ! "$SYSTEMCTL" is-enabled galion-os.target >/dev/null 2>&1; then
  fail "systemd: failed. galion-os.target is not enabled. Run this script again with sudo so systemctl can enable it."
fi
if ! "$SYSTEMCTL" is-active galion-os.target >/dev/null 2>&1; then
  fail "systemd: failed. galion-os.target is not active. Run sudo sh scripts/pi5-flash-check.sh, keep the table, and run this script again."
fi
say "systemd: ok"
say "summary: ok"
exit 0
