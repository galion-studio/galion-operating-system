#!/bin/sh
# Host-side checks for the health table. No VM and no network.

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

sh -n scripts/symphony/health-table.sh
sh -n scripts/symphony/guest-run.sh
sh -n scripts/symphony/prepare-root.sh
sh -n scripts/symphony/fetch-seeds.sh
sh -n scripts/symphony/build-os-seed.sh
sh -n scripts/symphony/assemble-extra.sh
sh -n scripts/symphony/pins.sh
sh -n scripts/pi5-seed-boot.sh
sh -n scripts/pi5-seed-guest.sh
ok 'sh -n'

grep -q 'PI5_BOOT_EXTRA' scripts/pi5-seed-boot.sh || fail 'boot hook'
grep -q '/opt/seed-boot/extra/run.sh' scripts/pi5-seed-guest.sh || fail 'guest hook'
ok 'boot hook'

# shellcheck disable=SC1091
. scripts/symphony/pins.sh
case "$RESEARCH_SHA" in
  74f9a7071f1c9672c1fe83e8e96f70e6cbb17318) ;;
  *) fail "research pin $RESEARCH_SHA" ;;
esac
case "$DESKTOP_SHA" in
  b26ad02e1b1e9084815bb56d3aff9a02888ca8d8) ;;
  *) fail "desktop pin $DESKTOP_SHA" ;;
esac
ok 'pins'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

write_unit() {
  name=$1
  shift
  mkdir -p "$tmp/pass/unit"
  {
    for line in "$@"; do
      printf '%s\n' "$line"
    done
  } >"$tmp/pass/unit/$name"
}

mkdir -p "$tmp/pass/http"
cat >"$tmp/pass/meta.env" <<'EOF'
MACHINE=aarch64
OS_CODENAME=bookworm
NETWORK=no-default-route
ENVIRONMENT=emulator
OS_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
RESEARCH_SHA=74f9a7071f1c9672c1fe83e8e96f70e6cbb17318
DESKTOP_SHA=b26ad02e1b1e9084815bb56d3aff9a02888ca8d8
RESEARCH_SOURCE=public-git
DESKTOP_SOURCE=public-git
EOF
write_unit galion-init.service \
  'ActiveState=active' 'SubState=exited' 'Result=success' \
  'Type=oneshot' 'RemainAfterExit=yes'
write_unit galion-os.target \
  'ActiveState=active' 'SubState=active' 'Result=success' \
  'Type=' 'RemainAfterExit=no'
write_unit galion-research-pi5.service \
  'ActiveState=active' 'SubState=running' 'Result=success' \
  'Type=simple' 'RemainAfterExit=no'
cat >"$tmp/pass/http/research" <<'EOF'
HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true,"service":"galion-research","bind":"127.0.0.1"}
EOF
cat >"$tmp/pass/http/desktop-root" <<'EOF'
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html><html data-desktop="control-console"></html>
EOF
cat >"$tmp/pass/http/desktop-probes" <<'EOF'
HTTP/1.1 200 OK
Content-Type: application/json

{"read_only":true,"writes":0,"timeout_ms":2000,"probes":[{"service":"nerve","enabled":true,"state":"up","host":"localhost","port":8670,"path":"/health","http_status":200,"detail":"200","observed_mode":null},{"service":"cortex","enabled":true,"state":"down","host":"localhost","port":8674,"path":"/health","http_status":null,"detail":"connection refused","observed_mode":null}]}
EOF

if sh scripts/symphony/health-table.sh "$tmp/pass" >"$tmp/pass.out"; then
  grep -q 'An emulator, container, or QEMU result is not a Raspberry Pi 5 result.' "$tmp/pass.out" || fail 'honesty'
  grep -q 'This table is not a Raspberry Pi 5 result.' "$tmp/pass.out" || fail 'second honesty'
  grep -q '^environment: emulator$' "$tmp/pass.out" || fail 'environment'
  grep -q '^hardware-claim: none$' "$tmp/pass.out" || fail 'hardware'
  grep -q '^network: no-default-route$' "$tmp/pass.out" || fail 'network'
  grep -q '^machine: aarch64$' "$tmp/pass.out" || fail 'machine'
  grep -q '^os-codename: bookworm$' "$tmp/pass.out" || fail 'codename'
  grep -q 'oneshot dry-run' "$tmp/pass.out" || fail 'init note'
  grep -q 'http://127.0.0.1:8787/health' "$tmp/pass.out" || fail 'research url'
  grep -q 'body matches galion-research' "$tmp/pass.out" || fail 'research body'
  grep -q 'http://127.0.0.1:18181/' "$tmp/pass.out" || fail 'desktop url'
  grep -q 'control console' "$tmp/pass.out" || fail 'desktop page'
  grep -q 'http://localhost:8670/health' "$tmp/pass.out" || fail 'probe url'
  grep -q 'connection refused' "$tmp/pass.out" || fail 'probe detail'
  grep -q '^summary: 6 PASS, 1 FAIL$' "$tmp/pass.out" || fail 'summary'
  grep -q '^installed: 5 PASS, 0 FAIL$' "$tmp/pass.out" || fail 'installed'
  grep -q '^contract: ok$' "$tmp/pass.out" || fail 'contract'
  ok 'passing installed services and one down probe'
else
  cat "$tmp/pass.out" >&2
  fail 'passing installed services and one down probe'
fi

cp -a "$tmp/pass" "$tmp/bad-research"
printf '%s\n' 'HTTP/1.1 500 ERR' '' 'nope' >"$tmp/bad-research/http/research"
set +e
sh scripts/symphony/health-table.sh "$tmp/bad-research" >"$tmp/bad-research.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "bad research exit $rc"
grep -q '^installed: 4 PASS, 1 FAIL$' "$tmp/bad-research.out" || fail 'bad research installed'
ok 'research body mismatch'

cp -a "$tmp/pass" "$tmp/online"
sed -i 's/^NETWORK=.*/NETWORK=default-route/' "$tmp/online/meta.env"
set +e
sh scripts/symphony/health-table.sh "$tmp/online" >"$tmp/online.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "online exit $rc"
grep -q '^network: default-route$' "$tmp/online.out" || fail 'online network'
grep -q '^contract: failed$' "$tmp/online.out" || fail 'online contract'
ok 'default route fails the contract'

if sh scripts/symphony/prepare-root.sh >/dev/null 2>"$tmp/prepare.err"; then
  fail 'prepare-root without a mount should fail'
fi
grep -q 'usage:' "$tmp/prepare.err" || fail 'prepare-root usage'
ok 'prepare-root usage'

printf 'ok all\n'
