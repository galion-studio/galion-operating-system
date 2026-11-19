#!/bin/sh
# Offline checks for the first-boot report.
# Hardware and systemd are stubs. A pass here is not a Raspberry Pi 5 result.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

printf '%s\n' 'offline first boot: stubbed hardware and systemd. This is not a Raspberry Pi 5 result.'

fail() {
  printf 'not ok %s\n' "$1" >&2
  exit 1
}

ok() {
  printf 'ok %s\n' "$1"
}

sh -n scripts/pi5/first-boot.sh
sh -n scripts/pi5/test-first-boot.sh
ok 'sh -n'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

plant_disk() {
  sys=$1
  name=$2
  kind=$3
  mkdir -p "$sys/devices/$kind/block/$name" "$sys/class/block"
  ln -s "../../devices/$kind/block/$name" "$sys/class/block/$name"
}

proc=$tmp/proc
sys=$tmp/sys
mkdir -p "$proc/device-tree"
printf 'Fixture Board\0' >"$proc/device-tree/model"
printf '%s\n' 'root=/dev/sda2 rootwait' >"$proc/cmdline"
printf '%s\n' '/dev/sda2 / ext4 rw 0 0' >"$proc/mounts"
plant_disk "$sys" sda usb

id_root=$tmp/id-root
cat >"$id_root" <<'EOF'
#!/bin/sh
printf '%s\n' 0
EOF
chmod 755 "$id_root"

id_user=$tmp/id-user
cat >"$id_user" <<'EOF'
#!/bin/sh
printf '%s\n' 1000
EOF
chmod 755 "$id_user"

make_systemctl() {
  fix=$1
  cat >"$fix/systemctl" <<'EOF'
#!/bin/sh
set -eu
fix=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
cmd=$1
shift
case "$cmd" in
  daemon-reload)
    exit 0
    ;;
  enable|start)
    printf '%s\n' "$1" >>"$fix/$cmd"
    exit 0
    ;;
  is-enabled|is-active)
    kind=enable
    if [ "$cmd" = is-active ]; then
      kind=start
    fi
    if [ -f "$fix/$kind" ] && grep -qx "$1" "$fix/$kind"; then
      exit 0
    fi
    exit 1
    ;;
  *)
    printf 'fake systemctl: unknown %s\n' "$cmd" >&2
    exit 99
    ;;
esac
EOF
  chmod 755 "$fix/systemctl"
}

write_seed() {
  dir=$1
  install_body=$2
  mkdir -p "$dir"
  printf '%s\n' "$install_body" >"$dir/install.sh"
  chmod 755 "$dir/install.sh"
  (
    cd "$dir"
    sha256sum install.sh >SHA256SUMS
  )
}

good_install='#!/bin/sh
set -eu
printf "%s\n" run >>"${GALION_INSTALL_LOG:?}"
"${SYSTEMCTL:-systemctl}" daemon-reload
"${SYSTEMCTL:-systemctl}" enable galion-os.target
"${SYSTEMCTL:-systemctl}" start galion-os.target
'

fix=$tmp/sc
mkdir -p "$fix"
make_systemctl "$fix"
seed=$tmp/seed
write_seed "$seed" "$good_install"
log=$tmp/install.log
: >"$log"
out=$tmp/work
mkdir -p "$out"
board=$out/pi5-board.txt
printf '%s\n' 'board report stays' >"$board"

run() {
  GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_root \
    GALION_INSTALL_LOG=$log SYSTEMCTL=$fix/systemctl \
    sh scripts/pi5/first-boot.sh "$@"
}

report=$out/pi5-first-boot.txt
run "$seed" "$report" >"$tmp/first.out"
run "$seed" "$report" >"$tmp/second.out"
grep -q 'not a Raspberry Pi 5 result' "$report" || fail 'honesty'
grep -q '^model: Fixture Board$' "$report" || fail 'model'
grep -q '^boot-medium: usb$' "$report" || fail 'usb'
grep -q '^root: ok$' "$report" || fail 'root'
grep -q '^seed: ok$' "$report" || fail 'seed'
grep -q '^checksum: ok$' "$report" || fail 'checksum'
grep -q '^install: ok$' "$report" || fail 'install'
grep -q '^systemd: ok$' "$report" || fail 'systemd'
grep -q '^summary: ok$' "$report" || fail 'summary'
[ "$(grep -c '^summary:' "$report")" -eq 1 ] || fail 'summary once'
[ "$(grep -c '^run$' "$log")" -eq 2 ] || fail 'install ran twice'
[ "$(grep -c '^galion-os.target$' "$fix/start")" -eq 2 ] || fail 'start twice'
cmp "$board" - >/dev/null <<'EOF' || fail 'board report was overwritten'
board report stays
EOF
ok 'twice is safe'

cd "$out"
GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_root \
  GALION_INSTALL_LOG=$log SYSTEMCTL=$fix/systemctl \
  sh "$ROOT/scripts/pi5/first-boot.sh" "$seed" >"$tmp/default.out"
[ -f "$out/pi5-first-boot.txt" ] || fail 'default report path'
grep -q 'board report stays' "$out/pi5-board.txt" || fail 'sibling board report'
ok 'report beside the board report'

bad=$tmp/not-root.txt
if GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_user \
  SYSTEMCTL=$fix/systemctl \
  sh "$ROOT/scripts/pi5/first-boot.sh" "$seed" "$bad" >"$tmp/user.out"; then
  fail 'unprivileged run exited 0'
fi
grep -q '^root: failed. Run this again with sudo.$' "$bad" || fail 'sudo hint'
grep -q 'not a Raspberry Pi 5 result' "$bad" || fail 'unprivileged honesty'
if grep -q '^install:' "$bad"; then
  fail 'install ran without root'
fi
ok 'asks for sudo'

broken=$tmp/broken-seed
mkdir -p "$broken"
printf '%s\n' '#!/bin/sh' >"$broken/install.sh"
printf '%s\n' 'nope' >"$broken/SHA256SUMS"
miss=$tmp/checksum.txt
runs_before=$(grep -c '^run$' "$log" || true)
if GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_root \
  GALION_INSTALL_LOG=$log SYSTEMCTL=$fix/systemctl \
  sh "$ROOT/scripts/pi5/first-boot.sh" "$broken" "$miss" >"$tmp/sum.out"; then
  fail 'bad checksum exited 0'
fi
grep -q '^checksum: failed. Stop. Copy the seed tarball again. Do not install this copy.$' "$miss" || fail 'checksum hint'
runs_after=$(grep -c '^run$' "$log" || true)
[ "$runs_before" = "$runs_after" ] || fail 'install ran after a bad checksum'
ok 'bad checksum stops'

empty=$tmp/empty-seed
mkdir -p "$empty"
gone=$tmp/missing.txt
if GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_root \
  SYSTEMCTL=$fix/systemctl \
  sh "$ROOT/scripts/pi5/first-boot.sh" "$empty" "$gone" >"$tmp/gone.out"; then
  fail 'missing seed exited 0'
fi
grep -q '^seed: failed. Unpack the seed tarball, then pass that directory as the first argument.$' "$gone" || fail 'seed hint'
ok 'missing seed'

fail_install='#!/bin/sh
"${SYSTEMCTL:-systemctl}" start galion-os.target || true
printf "%s\n" "Failed to start galion-os.target" >&2
exit 1
'
badfix=$tmp/bad-sc
mkdir -p "$badfix"
cat >"$badfix/systemctl" <<'EOF'
#!/bin/sh
exit 1
EOF
chmod 755 "$badfix/systemctl"
fail_seed=$tmp/fail-seed
write_seed "$fail_seed" "$fail_install"
failed=$tmp/failed.txt
if GALION_PROC=$proc GALION_SYS=$sys GALION_ID=$id_root \
  SYSTEMCTL=$badfix/systemctl \
  sh "$ROOT/scripts/pi5/first-boot.sh" "$fail_seed" "$failed" >"$tmp/fail.out"; then
  fail 'start failure exited 0'
fi
grep -q '^install: failed. galion-os.target did not start. Run this script again with sudo. Then run sudo sh scripts/pi5-flash-check.sh and keep the table.$' "$failed" || fail 'start hint'
if grep -q '^systemd:' "$failed"; then
  fail 'systemd line after a failed install'
fi
grep -q '^summary: failed$' "$failed" || fail 'failed summary'
grep -q 'not a Raspberry Pi 5 result' "$failed" || fail 'failure honesty'
ok 'start failure says what to do next'

set +e
sh "$ROOT/scripts/pi5/first-boot.sh" >"$tmp/usage.out" 2>"$tmp/usage.err"
usage_rc=$?
set -e
[ "$usage_rc" -eq 2 ] || fail "usage exit $usage_rc"
grep -q 'usage:' "$tmp/usage.err" || fail 'usage text'
ok 'usage'

printf '%s\n' 'offline first boot finished. This is not a Raspberry Pi 5 result.'
