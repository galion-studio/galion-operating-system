#!/bin/sh
# Offline checks for the report bundle.
# The files are fixtures. A pass here is not a Raspberry Pi 5 result.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

printf '%s\n' 'offline report pack: fixtures only. This is not a Raspberry Pi 5 result.'

fail() {
  printf 'not ok %s\n' "$1" >&2
  exit 1
}

ok() {
  printf 'ok %s\n' "$1"
}

sh -n scripts/pi5/pack-reports.sh
sh -n scripts/pi5/test-pack-reports.sh
ok 'sh -n'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
dir=$tmp/reports
mkdir -p "$dir"

cat >"$dir/pi5-first-boot.txt" <<'EOF'
GALION FIRST BOOT
note: This report is not a Raspberry Pi 5 result unless the model line names a Raspberry Pi and you ran this script on that board.
model: Fixture Board
boot-medium: usb
root: ok
seed: ok
EOF

cat >"$dir/pi5-board.txt" <<'EOF'
GALION BOARD REPORT
note: A virtual machine is not a Raspberry Pi 5 result.
model: Fixture Board
kernel: Linux 6.1.0-board-host
root: /dev/sda2
http://127.0.0.1:8787/health
peer 10.9.8.7 spoke from board-host
password=example-secret
Authorization: Bearer example-token
ssh-ed25519 AAAATEST board-host
-----BEGIN OPENSSH PRIVATE KEY-----
not-a-real-key
-----END OPENSSH PRIVATE KEY-----
EOF

out=$tmp/pi5-reports-20261119.tar.gz
GALION_HOSTNAME=board-host GALION_PACK_DATE=20261119 \
  sh scripts/pi5/pack-reports.sh "$dir" "$out" >"$tmp/pack.out"
grep -q 'not a Raspberry Pi 5 result' "$tmp/pack.out" || fail 'pack note'
grep -q "packed: $out" "$tmp/pack.out" || fail 'packed path'

# A second run replaces the same dated archive and still succeeds.
GALION_HOSTNAME=board-host GALION_PACK_DATE=20261119 \
  sh scripts/pi5/pack-reports.sh "$dir" "$out" >/dev/null
ok 'twice is safe'

unpack=$tmp/unpack
mkdir -p "$unpack"
tar -xzf "$out" -C "$unpack"
for name in NOTE.txt pi5-first-boot.txt pi5-board.txt; do
  [ -f "$unpack/$name" ] || fail "missing $name"
done
grep -q 'not a Raspberry Pi 5 result' "$unpack/NOTE.txt" || fail 'bundle note'
grep -q 'Fixture Board' "$unpack/pi5-board.txt" || fail 'model kept'
grep -q '127.0.0.1' "$unpack/pi5-board.txt" || fail 'loopback kept'
if grep -q 'board-host' "$unpack/pi5-board.txt" "$unpack/pi5-first-boot.txt"; then
  fail 'hostname leaked'
fi
if grep -q 'example-secret' "$unpack/pi5-board.txt"; then
  fail 'secret leaked'
fi
if grep -q 'example-token' "$unpack/pi5-board.txt"; then
  fail 'token leaked'
fi
if grep -q '10.9.8.7' "$unpack/pi5-board.txt"; then
  fail 'address leaked'
fi
if grep -q 'not-a-real-key' "$unpack/pi5-board.txt"; then
  fail 'private key leaked'
fi
if grep -q 'AAAATEST' "$unpack/pi5-board.txt"; then
  fail 'ssh key leaked'
fi
grep -q '\[hostname\]' "$unpack/pi5-board.txt" || fail 'hostname mark'
grep -q 'password=\[redacted\]' "$unpack/pi5-board.txt" || fail 'password mark'
grep -q 'Bearer \[redacted\]' "$unpack/pi5-board.txt" || fail 'bearer mark'
grep -q '\[ip\]' "$unpack/pi5-board.txt" || fail 'address mark'
grep -q '\[redacted private key\]' "$unpack/pi5-board.txt" || fail 'private key mark'
grep -q '\[redacted ssh key\]' "$unpack/pi5-board.txt" || fail 'ssh key mark'
cmp "$dir/pi5-board.txt" "$unpack/pi5-board.txt" >/dev/null 2>&1 && fail 'original was not redacted'
grep -q 'password=example-secret' "$dir/pi5-board.txt" || fail 'original report was edited'
ok 'redacted bundle'

default=$dir/pi5-reports-20261119.tar.gz
GALION_HOSTNAME=board-host GALION_PACK_DATE=20261119 \
  sh scripts/pi5/pack-reports.sh "$dir" >"$tmp/default.out"
[ -f "$default" ] || fail 'default tarball path'
grep -q "packed: $default" "$tmp/default.out" || fail 'default packed line'
ok 'dated name'

rm -f "$dir/pi5-board.txt"
if GALION_PACK_DATE=20261119 sh scripts/pi5/pack-reports.sh "$dir" "$tmp/missing.tar.gz" >"$tmp/miss.out" 2>"$tmp/miss.err"; then
  fail 'missing board report exited 0'
fi
grep -q 'pi5-board.txt is missing' "$tmp/miss.err" || fail 'missing board hint'
grep -q 'board-report.sh' "$tmp/miss.err" || fail 'missing board next step'
ok 'missing board report'

set +e
sh scripts/pi5/pack-reports.sh >"$tmp/usage.out" 2>"$tmp/usage.err"
usage_rc=$?
set -e
[ "$usage_rc" -eq 2 ] || fail "usage exit $usage_rc"
grep -q 'usage:' "$tmp/usage.err" || fail 'usage text'
ok 'usage'

printf '%s\n' 'offline report pack finished. This is not a Raspberry Pi 5 result.'
