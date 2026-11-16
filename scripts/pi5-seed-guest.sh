#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Runs inside the arm64 Debian Bookworm emulator, as root, after systemd
# is up. The container has no default route. This script is not a Pi flash.

set -eu

LOG=/tmp/pi5-boot-logs
mkdir -p "$LOG"

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

save_guest_logs() {
  status=$?
  trap - EXIT
  mkdir -p "$LOG"
  if command -v journalctl >/dev/null 2>&1; then
    journalctl --no-pager -o short-iso >"$LOG/pi5-journal.log" 2>&1 || true
    {
      printf '\n----- galion units -----\n'
      systemctl list-units --all --no-pager 'galion-*' || true
      printf '\n----- galion-os.target -----\n'
      systemctl status --no-pager --full galion-os.target || true
      printf '\n----- galion-init.service -----\n'
      systemctl status --no-pager --full galion-init.service || true
    } >>"$LOG/pi5-journal.log" 2>&1 || true
  fi
  for dest in /mnt/seed/out /opt/seed-boot/out; do
    if [ -d "$dest" ]; then
      cp -a "$LOG/." "$dest/" 2>/dev/null || true
      printf '%s\n' "$status" > "$dest/exit-code"
      sync || true
    fi
  done
  exit "$status"
}
trap save_guest_logs EXIT

os_field() {
  sed -n "s/^$1=//p" /etc/os-release | head -n 1 | tr -d '"'
}

has_default_route() {
  found=0
  while read -r iface dest _rest; do
    [ "$iface" = Iface ] && continue
    if [ "$dest" = 00000000 ] && [ "$iface" != lo ]; then
      found=1
    fi
  done < /proc/net/route
  if [ -f /proc/net/ipv6_route ]; then
    while read -r dest _plen _src _splen _hop _metric _ref _use _flags iface; do
      if [ "$dest" = 00000000000000000000000000000000 ] \
        && [ -n "$iface" ] && [ "$iface" != lo ]; then
        found=1
      fi
    done < /proc/net/ipv6_route
  fi
  [ "$found" -eq 1 ]
}

write_environment() {
  {
    printf 'boot-backend: qemu-system-aarch64\n'
    printf 'machine: %s\n' "$(uname -m)"
    printf 'os-id: %s\n' "$(os_field ID)"
    printf 'os-codename: %s\n' "$(os_field VERSION_CODENAME)"
    printf 'os-pretty: %s\n' "$(os_field PRETTY_NAME)"
    if [ -f /.dockerenv ]; then
      printf 'dockerenv: yes\n'
    else
      printf 'dockerenv: no\n'
    fi
    printf 'virt: %s\n' "$(systemd-detect-virt 2>/dev/null || printf '%s' unknown)"
    printf 'systemd: %s\n' "$(systemctl --version | head -n 1)"
    if has_default_route; then
      printf 'network: default-route\n'
    else
      printf 'network: no-default-route\n'
    fi
    printf 'hardware: not-a-raspberry-pi\n'
    printf 'note: An emulator, container, or QEMU result is not a Raspberry Pi 5 result.\n'
  } >"$LOG/pi5-environment.txt"
}

write_environment

machine=$(uname -m)
[ "$machine" = aarch64 ] || die "guest machine is $machine, want aarch64"
os_id=$(os_field ID)
os_code=$(os_field VERSION_CODENAME)
[ "$os_id" = debian ] || die "guest os is $os_id, want debian"
[ "$os_code" = bookworm ] || die "guest codename is $os_code, want bookworm"
if has_default_route; then
  die "offline check failed: a default route is present before install"
fi

[ -f /tmp/seed.tar.gz ] || die "seed tarball was not copied into the guest"
rm -rf /tmp/seed-unpack
mkdir -p /tmp/seed-unpack
tar -xzf /tmp/seed.tar.gz -C /tmp/seed-unpack

list=$(mktemp)
find /tmp/seed-unpack -name install.sh -type f >"$list"
best=
best_len=999999
while read -r path; do
  [ -n "$path" ] || continue
  n=${#path}
  if [ "$n" -lt "$best_len" ]; then
    best=$path
    best_len=$n
  fi
done <"$list"
rm -f "$list"
[ -n "$best" ] || die "unpacked seed has no install.sh"

unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy || true
cd "$(dirname "$best")"
chmod +x ./install.sh
./install.sh >"$LOG/pi5-install.log" 2>&1
./install.sh >>"$LOG/pi5-install.log" 2>&1

if has_default_route; then
  die "offline check failed: install.sh brought up a default route"
fi

systemctl cat galion-os.target >/dev/null
enabled=$(systemctl is-enabled galion-os.target 2>/dev/null || true)
case "$enabled" in
  enabled|enabled-runtime) ;;
  *) die "galion-os.target is not enabled (state: ${enabled:-unknown})" ;;
esac

bin_ok=0
if [ -d /opt/galion ]; then
  bins=$(mktemp)
  find /opt/galion -type f -name galion-init >"$bins"
  while read -r path; do
    if [ -n "$path" ] && [ -x "$path" ]; then
      bin_ok=1
    fi
  done <"$bins"
  rm -f "$bins"
fi
if [ "$bin_ok" -ne 1 ]; then
  find /opt/galion -type f -print >&2 || true
  die "galion-init was not installed under /opt/galion"
fi

cp /tmp/pi5-flash-check.sh /tmp/pi5-flash-check-run.sh
chmod +x /tmp/pi5-flash-check-run.sh
set +e
/tmp/pi5-flash-check-run.sh >"$LOG/pi5-unit-table.txt" 2>"$LOG/pi5-flash-check.err"
table_rc=$?
set -e
cat "$LOG/pi5-unit-table.txt"
if [ -s "$LOG/pi5-flash-check.err" ]; then
  cat "$LOG/pi5-flash-check.err" >&2
fi

journalctl --no-pager -o short-iso >"$LOG/pi5-journal.log" 2>&1 || true
{
  printf '\n----- galion units -----\n'
  systemctl list-units --all --no-pager 'galion-*' || true
  printf '\n----- galion-os.target -----\n'
  systemctl status --no-pager --full galion-os.target || true
} >>"$LOG/pi5-journal.log"

write_environment

grep -q 'An emulator, container, or QEMU result is not a Raspberry Pi 5 result.' \
  "$LOG/pi5-unit-table.txt" || die "unit table is missing the emulator honesty line"
if grep -q '^environment: raspberry-pi$' "$LOG/pi5-unit-table.txt"; then
  die "emulator table claimed a Raspberry Pi"
fi
grep -q '^hardware: not-a-raspberry-pi$' "$LOG/pi5-environment.txt" \
  || die "environment file claimed hardware"
grep -q '^network: no-default-route$' "$LOG/pi5-environment.txt" \
  || die "environment file lost the offline check"
grep -q '^machine: aarch64$' "$LOG/pi5-environment.txt" \
  || die "environment file is not aarch64"

exit "$table_rc"
