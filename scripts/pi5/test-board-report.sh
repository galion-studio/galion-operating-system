#!/bin/sh
# Host-side checks for the board report. No Pi, no QEMU, no seed build.
# A pass here is not a Raspberry Pi 5 result.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

fail() {
  printf 'not ok %s\n' "$1" >&2
  exit 1
}

ok() {
  printf 'ok %s\n' "$1"
}

sh -n scripts/pi5/board-report.sh
sh -n scripts/pi5/test-board-report.sh
ok 'sh -n'

make_systemctl() {
  fix=$1
  cat >"$fix/systemctl" <<EOF
#!/bin/sh
set -eu
fix=\$(CDPATH='' cd -- "\$(dirname "\$0")" && pwd)
cmd=\$1
shift
case "\$cmd" in
  list-unit-files)
    if [ -f "\$fix/list" ]; then
      cat "\$fix/list"
    fi
    exit 0
    ;;
  list-dependencies)
    if [ -f "\$fix/deps" ]; then
      cat "\$fix/deps"
    fi
    exit 0
    ;;
  start)
    printf '%s\n' "\$1" >>"\$fix/started"
    exit 0
    ;;
  show)
    unit=
    for arg in "\$@"; do
      case "\$arg" in
        -p|--*) continue ;;
        *) unit=\$arg ;;
      esac
    done
    if [ -f "\$fix/\$unit.props" ]; then
      cat "\$fix/\$unit.props"
    else
      printf '%s\n' 'LoadState=not-found' 'ActiveState=inactive' 'SubState=dead'
    fi
    exit 0
    ;;
  *)
    printf 'fake systemctl: unknown %s\n' "\$cmd" >&2
    exit 99
    ;;
esac
EOF
  chmod 755 "$fix/systemctl"
}

write_props() {
  dir=$1
  unit=$2
  shift 2
  {
    for line in "$@"; do
      printf '%s\n' "$line"
    done
  } >"$dir/$unit.props"
}

plant_disk() {
  sys=$1
  name=$2
  kind=$3
  sectors=$4
  mkdir -p "$sys/devices/$kind/block/$name" "$sys/class/block" "$sys/block/$name"
  ln -s "../../devices/$kind/block/$name" "$sys/class/block/$name"
  printf '%s\n' "$sectors" >"$sys/block/$name/size"
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fix=$tmp/active
mkdir -p "$fix"
make_systemctl "$fix"
printf '%s\n' 'galion-os.target enabled enabled' 'galion-init.service enabled enabled' >"$fix/list"
printf '%s\n' 'galion-os.target' 'galion-init.service' >"$fix/deps"
write_props "$fix" galion-os.target \
  'LoadState=loaded' 'ActiveState=active' 'SubState=active' 'Result=success' \
  'Type=' 'RemainAfterExit=no'
write_props "$fix" galion-init.service \
  'LoadState=loaded' 'ActiveState=active' 'SubState=exited' 'Result=success' \
  'Type=oneshot' 'RemainAfterExit=yes'

proc=$tmp/proc
sys=$tmp/sys
mkdir -p "$proc/device-tree" "$proc/net"
printf 'Fixture Board\0' >"$proc/device-tree/model"
printf '%s\n' 'root=/dev/sda2 rootwait' >"$proc/cmdline"
printf '%s\n' '/dev/sda2 / ext4 rw 0 0' >"$proc/mounts"
printf '%s\n' 'Iface Destination Gateway Flags' >"$proc/net/route"
plant_disk "$sys" sda usb 2048

out=$tmp/usb.out
if GALION_PROC=$proc GALION_SYS=$sys SYSTEMCTL=$fix/systemctl \
  sh scripts/pi5/board-report.sh >"$out"; then
  grep -q '^model: Fixture Board$' "$out" || fail 'model'
  grep -q '^root: /dev/sda2$' "$out" || fail 'root'
  grep -q '^root-cmdline: /dev/sda2$' "$out" || fail 'cmdline'
  grep -q '^boot-medium: usb$' "$out" || fail 'usb medium'
  grep -q '^block: sda$' "$out" || fail 'block'
  grep -q '^block-sectors: 2048$' "$out" || fail 'sectors'
  grep -q '^start galion-os.target: ok$' "$out" || fail 'target start'
  grep -q '^start galion-research-pi5.service: not-installed$' "$out" || fail 'research missing'
  grep -q '^start openmind-desktop.service: not-installed$' "$out" || fail 'desktop missing'
  grep -q 'unit check (scripts/pi5-flash-check.sh)' "$out" || fail 'unit heading'
  grep -q 'loopback check (scripts/symphony/health-table.sh)' "$out" || fail 'loopback heading'
  grep -q 'not a Raspberry Pi 5 result' "$out" || fail 'honesty'
  grep -q 'contract: failed' "$out" || fail 'contract stays failed off the emulator'
  grep -q 'not a failed flash' "$out" || fail 'contract note'
  ok 'usb report'
else
  cat "$out" >&2
  fail 'usb report'
fi

proc=$tmp/mmc-proc
sys=$tmp/mmc-sys
mkdir -p "$proc/device-tree"
printf 'Fixture Board' >"$proc/device-tree/model"
printf '%s\n' 'root=/dev/mmcblk0p2' >"$proc/cmdline"
printf '%s\n' '/dev/mmcblk0p2 / ext4 rw 0 0' >"$proc/mounts"
plant_disk "$sys" mmcblk0 mmc 4096
out=$tmp/mmc.out
GALION_PROC=$proc GALION_SYS=$sys SYSTEMCTL=$fix/systemctl \
  sh scripts/pi5/board-report.sh >"$out"
grep -q '^boot-medium: mmc$' "$out" || fail 'mmc medium'
grep -q '^block: mmcblk0$' "$out" || fail 'mmc block'
grep -q '^block-sectors: 4096$' "$out" || fail 'mmc sectors'
ok 'mmc report'

proc=$tmp/nvme-proc
sys=$tmp/nvme-sys
mkdir -p "$proc/device-tree"
printf 'Fixture Board' >"$proc/device-tree/model"
printf '%s\n' 'root=/dev/nvme0n1p2' >"$proc/cmdline"
printf '%s\n' '/dev/nvme0n1p2 / ext4 rw 0 0' >"$proc/mounts"
plant_disk "$sys" nvme0n1 nvme 8192
out=$tmp/nvme.out
GALION_PROC=$proc GALION_SYS=$sys SYSTEMCTL=$fix/systemctl \
  sh scripts/pi5/board-report.sh >"$out"
grep -q '^boot-medium: nvme$' "$out" || fail 'nvme medium'
grep -q '^block: nvme0n1$' "$out" || fail 'nvme block'
ok 'nvme report'

out=$tmp/nosys.out
set +e
GALION_PROC=$proc GALION_SYS=$sys SYSTEMCTL=$tmp/no-such-systemctl \
  sh scripts/pi5/board-report.sh >"$out"
rc=$?
set -e
[ "$rc" -eq 2 ] || fail "missing systemctl exit $rc"
grep -q 'systemctl is not available' "$out" || fail 'missing systemctl text'
grep -q '^model: Fixture Board$' "$out" || fail 'model still recorded'
ok 'missing systemctl'

set +e
sh scripts/pi5/board-report.sh extra extra >"$tmp/usage.out" 2>"$tmp/usage.err"
rc=$?
set -e
[ "$rc" -eq 2 ] || fail "usage exit $rc"
grep -q 'usage:' "$tmp/usage.err" || fail 'usage text'
ok 'usage'

file=$tmp/saved.txt
GALION_PROC=$proc GALION_SYS=$sys SYSTEMCTL=$fix/systemctl \
  sh scripts/pi5/board-report.sh "$file" >/dev/null
grep -q '^GALION BOARD REPORT$' "$file" || fail 'saved report'
ok 'report file'
