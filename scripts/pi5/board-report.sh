#!/bin/sh
# Read this machine and write a plain-text report.
# The unit rows are scripts/pi5-flash-check.sh. The loopback rows are
# scripts/symphony/health-table.sh. This script does not decide those
# rows again.
#
# A report from a virtual machine is not a Raspberry Pi 5 result.
# The health table's contract requires the emulator, so on a board that
# line is failed. That is the contract. It is not a broken flash.
#
# GALION_PROC     proc tree (default /proc). The unit check reads the same tree.
# GALION_SYS      sysfs tree (default /sys)
# GALION_VIRT     if set, including empty, used instead of systemd-detect-virt
# GALION_ROOT     passed through to the unit check for container marks
# SYSTEMCTL       systemctl binary (the unit check reads the same name)
#
# Exit 0 when the report is written and the unit check could be run.
# The report itself may contain FAIL rows. Exit 2 when the report could
# not be written, or when the unit check could not be run.

set -eu

if [ "$#" -gt 1 ]; then
  printf 'usage: board-report.sh [report-file]\n' >&2
  exit 2
fi

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
PROC=${GALION_PROC:-/proc}
SYS=${GALION_SYS:-/sys}
SYSTEMCTL=${SYSTEMCTL:-systemctl}
export SYSTEMCTL

HONESTY='A virtual machine is not a Raspberry Pi 5 result.'
CONTRACT_NOTE='On a board, contract: failed is the emulator rule in scripts/symphony/health-table.sh. It is not a failed flash.'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

field() {
  if [ -n "${1:-}" ]; then
    printf '%s' "$1"
  fi
}

read_model() {
  if [ -r "$PROC/device-tree/model" ]; then
    tr -d '\000\n' <"$PROC/device-tree/model"
  fi
}

root_mount() {
  if [ -r "$PROC/mounts" ]; then
    awk '$2 == "/" { print $1; exit }' "$PROC/mounts"
  fi
}

root_cmdline() {
  if [ -r "$PROC/cmdline" ]; then
    tr ' ' '\n' <"$PROC/cmdline" | sed -n 's/^root=//p' | head -n 1
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

block_sectors() {
  disk=$1
  [ -n "$disk" ] || return 0
  if [ -r "$SYS/block/$disk/size" ]; then
    tr -d ' \n' <"$SYS/block/$disk/size"
  elif [ -r "$SYS/class/block/$disk/size" ]; then
    tr -d ' \n' <"$SYS/class/block/$disk/size"
  fi
}

has_default_route() {
  [ -r "$PROC/net/route" ] || return 1
  found=0
  while read -r iface dest _rest; do
    [ "$iface" = Iface ] && continue
    if [ "$dest" = 00000000 ] && [ "$iface" != lo ]; then
      found=1
    fi
  done <"$PROC/net/route"
  [ "$found" -eq 1 ]
}

environment_kind() {
  model=$(read_model || true)
  case "$model" in
    *Raspberry\ Pi*)
      printf '%s\n' raspberry-pi
      return
      ;;
  esac
  if [ -n "${GALION_VIRT+x}" ]; then
    virt=$GALION_VIRT
  else
    virt=$(systemd-detect-virt 2>/dev/null || true)
  fi
  case "$virt" in
    qemu|kvm|docker|podman|container|systemd-nspawn|lxc|lxc-libvirt|wsl|bochs|uml|bhyve|qnx|acrn)
      printf '%s\n' emulator
      ;;
    *)
      printf '%s\n' other
      ;;
  esac
}

os_codename() {
  if [ -r /etc/os-release ]; then
    sed -n 's/^VERSION_CODENAME=//p' /etc/os-release | head -n 1 | tr -d '"'
  fi
}

# Same read as scripts/symphony/guest-run.sh. The body is what
# scripts/symphony/health-table.sh judges. Loopback only.
http_get() {
  host=$1
  port=$2
  path=$3
  out=$4
  if ! command -v bash >/dev/null 2>&1; then
    printf 'error: bash is not installed\n' >"$out"
    return
  fi
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout 8 bash -c '
      host=$1
      port=$2
      path=$3
      out=$4
      if ! exec 3<>"/dev/tcp/${host}/${port}"; then
        printf "error: connection refused\n" >"$out"
        exit 1
      fi
      printf "GET %s HTTP/1.1\r\nHost: %s:%s\r\nConnection: close\r\n\r\n" \
        "$path" "$host" "$port" >&3
      cat <&3 >"$out"
    ' bash "$host" "$port" "$path" "$out" >/dev/null 2>/dev/null
  else
    bash -c '
      host=$1
      port=$2
      path=$3
      out=$4
      if ! exec 3<>"/dev/tcp/${host}/${port}"; then
        printf "error: connection refused\n" >"$out"
        exit 1
      fi
      printf "GET %s HTTP/1.1\r\nHost: %s:%s\r\nConnection: close\r\n\r\n" \
        "$path" "$host" "$port" >&3
      cat <&3 >"$out"
    ' bash "$host" "$port" "$path" "$out" >/dev/null 2>/dev/null
  fi
  rc=$?
  set -e
  if [ "$rc" -ne 0 ] && [ ! -s "$out" ]; then
    printf 'error: no response\n' >"$out"
  fi
}

start_line() {
  unit=$1
  if ! command -v "$SYSTEMCTL" >/dev/null 2>&1; then
    printf 'start %s: systemctl-missing\n' "$unit"
    return
  fi
  load=$("$SYSTEMCTL" show -p LoadState -- "$unit" 2>/dev/null | sed -n 's/^LoadState=//p' | head -n 1)
  case "$load" in
    ''|not-found)
      printf 'start %s: not-installed\n' "$unit"
      ;;
    *)
      if "$SYSTEMCTL" start "$unit" >/dev/null 2>&1; then
        printf 'start %s: ok\n' "$unit"
      else
        printf 'start %s: failed\n' "$unit"
      fi
      ;;
  esac
}

model=$(read_model || true)
kernel=$(uname -sr 2>/dev/null || true)
arch=$(uname -m 2>/dev/null || true)
root=$(root_mount || true)
cmdline=$(root_cmdline || true)
disk=$(disk_name "$root")
if [ -z "$disk" ]; then
  disk=$(disk_name "$cmdline")
fi
medium=$(boot_medium "$disk")
sectors=$(block_sectors "$disk" || true)

{
  printf 'GALION BOARD REPORT\n'
  printf 'note: %s\n' "$HONESTY"
  printf 'model: %s\n' "$(field "$model")"
  printf 'kernel: %s\n' "$(field "$kernel")"
  printf 'arch: %s\n' "$(field "$arch")"
  printf 'root: %s\n' "$(field "$root")"
  printf 'root-cmdline: %s\n' "$(field "$cmdline")"
  printf 'boot-medium: %s\n' "$(field "$medium")"
  printf 'block: %s\n' "$(field "$disk")"
  printf 'block-sectors: %s\n' "$(field "$sectors")"
  printf '\n'
  printf '%s\n' '----- starts -----'
  start_line galion-os.target
  start_line galion-init.service
  start_line galion-welcome.service
  start_line galion-core.service
  start_line galion-research-pi5.service
  start_line openmind-desktop.service
  printf '\n'
  printf '%s\n' '----- unit check (scripts/pi5-flash-check.sh) -----'
} >"$tmp/report"

unit_rc=0
if [ -x "$ROOT/scripts/pi5-flash-check.sh" ] || [ -f "$ROOT/scripts/pi5-flash-check.sh" ]; then
  set +e
  sh "$ROOT/scripts/pi5-flash-check.sh" >"$tmp/units" 2>"$tmp/units.err"
  unit_rc=$?
  set -e
  cat "$tmp/units" >>"$tmp/report"
  if [ -s "$tmp/units.err" ]; then
    printf '\n' >>"$tmp/report"
    cat "$tmp/units.err" >>"$tmp/report"
  fi
  printf '\nunit-check-exit: %s\n' "$unit_rc" >>"$tmp/report"
else
  printf 'error: scripts/pi5-flash-check.sh is missing\n' >>"$tmp/report"
  unit_rc=2
fi

mkdir -p "$tmp/facts/unit" "$tmp/facts/http"
{
  printf 'MACHINE=%s\n' "$(field "$arch")"
  printf 'OS_CODENAME=%s\n' "$(field "$(os_codename || true)")"
  if has_default_route; then
    printf 'NETWORK=%s\n' default-route
  elif [ -r "$PROC/net/route" ]; then
    printf 'NETWORK=%s\n' no-default-route
  else
    printf 'NETWORK=%s\n' unread
  fi
  printf 'ENVIRONMENT=%s\n' "$(environment_kind)"
} >"$tmp/facts/meta.env"

record_unit() {
  name=$1
  if ! command -v "$SYSTEMCTL" >/dev/null 2>&1; then
    return 0
  fi
  "$SYSTEMCTL" show \
    -p ActiveState -p SubState -p Result -p Type -p RemainAfterExit \
    -- "$name" >"$tmp/facts/unit/$name" 2>/dev/null || true
}

record_unit galion-init.service
record_unit galion-os.target
record_unit galion-research-pi5.service
record_unit openmind-desktop.service

http_get 127.0.0.1 8787 /health "$tmp/facts/http/research"
http_get 127.0.0.1 18181 / "$tmp/facts/http/desktop-root"
http_get 127.0.0.1 18181 /probes "$tmp/facts/http/desktop-probes"

{
  printf '\n'
  printf '%s\n' '----- loopback check (scripts/symphony/health-table.sh) -----'
  printf 'note: %s\n' "$CONTRACT_NOTE"
} >>"$tmp/report"

health_rc=0
if [ -f "$ROOT/scripts/symphony/health-table.sh" ]; then
  set +e
  sh "$ROOT/scripts/symphony/health-table.sh" "$tmp/facts" >"$tmp/health" 2>"$tmp/health.err"
  health_rc=$?
  set -e
  cat "$tmp/health" >>"$tmp/report"
  if [ -s "$tmp/health.err" ]; then
    printf '\n' >>"$tmp/report"
    cat "$tmp/health.err" >>"$tmp/report"
  fi
  printf '\nhealth-table-exit: %s\n' "$health_rc" >>"$tmp/report"
else
  printf 'error: scripts/symphony/health-table.sh is missing\n' >>"$tmp/report"
  health_rc=2
fi

cat "$tmp/report"
if [ "$#" -eq 1 ]; then
  cp "$tmp/report" "$1"
fi

if [ "$unit_rc" -eq 2 ] || [ "$health_rc" -eq 2 ]; then
  exit 2
fi
exit 0
