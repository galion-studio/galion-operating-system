#!/bin/sh
# Host-side checks for the Pi 5 boot scripts. No Docker and no seed build.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

fail() {
  printf 'not ok %s\n' "$1" >&2
  exit 1
}

ok() {
  printf 'ok %s\n' "$1"
}

sh -n scripts/pi5-flash-check.sh
sh -n scripts/pi5-require-seed.sh
sh -n scripts/pi5-seed-boot.sh
sh -n scripts/pi5-seed-guest.sh
sh -n scripts/pi5-fixture-seed.sh
sh -n scripts/test-pi5-seed-boot.sh
ok 'sh -n'

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

run_check() {
  fix=$1
  shift
  SYSTEMCTL=$fix/systemctl "$@" sh "$ROOT/scripts/pi5-flash-check.sh"
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
  'Type=' 'RemainAfterExit=no' 'FragmentPath='
write_props "$fix" galion-init.service \
  'LoadState=loaded' 'ActiveState=active' 'SubState=exited' 'Result=success' \
  'Type=oneshot' 'RemainAfterExit=yes' 'FragmentPath='
out=$tmp/active.out
if run_check "$fix" >"$out"; then
  grep -q 'galion-init.service' "$out" || fail 'active row'
  grep -q 'oneshot dry-run' "$out" || fail 'oneshot note'
  grep -q 'An emulator, container, or QEMU result is not a Raspberry Pi 5 result.' "$out" || fail 'honesty'
  grep -q '^hardware-claim: none$' "$out" || fail 'hardware claim'
  grep -q '^summary: 2 PASS, 0 FAIL$' "$out" || fail 'active summary'
  grep -q '^galion-os.target$' "$fix/started" || fail 'did not start the target'
  ok 'active oneshot dry-run'
else
  cat "$out" >&2
  fail 'active oneshot dry-run'
fi

fix=$tmp/nostart
mkdir -p "$fix"
make_systemctl "$fix"
cp "$tmp/active/list" "$fix/list"
cp "$tmp/active/deps" "$fix/deps"
cp "$tmp/active/galion-os.target.props" "$fix/galion-os.target.props"
cp "$tmp/active/galion-init.service.props" "$fix/galion-init.service.props"
: >"$fix/started"
if GALION_NO_START=1 run_check "$fix" >"$tmp/nostart.out"; then
  [ ! -s "$fix/started" ] || fail 'start was not skipped'
  ok 'skip start'
else
  fail 'skip start'
fi

fix=$tmp/failed
mkdir -p "$fix"
make_systemctl "$fix"
printf '%s\n' 'galion-os.target enabled enabled' 'galion-init.service enabled enabled' >"$fix/list"
write_props "$fix" galion-os.target \
  'LoadState=loaded' 'ActiveState=active' 'SubState=active' 'Result=success' \
  'Type=' 'RemainAfterExit=no' 'FragmentPath='
write_props "$fix" galion-init.service \
  'LoadState=loaded' 'ActiveState=failed' 'SubState=failed' 'Result=exit-code' \
  'Type=oneshot' 'RemainAfterExit=yes' 'FragmentPath='
set +e
run_check "$fix" >"$tmp/failed.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "failed unit exit $rc"
grep -q 'galion-init.service' "$tmp/failed.out" || fail 'failed row'
grep -q 'FAIL' "$tmp/failed.out" || fail 'failed verdict'
grep -q '^summary: 1 PASS, 1 FAIL$' "$tmp/failed.out" || fail 'failed summary'
ok 'failed unit'

fix=$tmp/documented
mkdir -p "$fix"
make_systemctl "$fix"
printf '%s\n' 'galion-os.target enabled enabled' 'galion-probe.service enabled enabled' >"$fix/list"
write_props "$fix" galion-os.target \
  'LoadState=loaded' 'ActiveState=active' 'SubState=active' 'Result=success' \
  'Type=' 'RemainAfterExit=no' 'FragmentPath='
write_props "$fix" galion-probe.service \
  'LoadState=loaded' 'ActiveState=inactive' 'SubState=dead' 'Result=success' \
  'Type=oneshot' 'RemainAfterExit=no' 'FragmentPath='
printf '%s\n' 'galion-probe.service inactive dead' >"$tmp/expect"
if GALION_EXPECTATIONS=$tmp/expect GALION_UNIT_TIMEOUT=2 run_check "$fix" >"$tmp/documented.out"; then
  grep -q 'galion-probe.service' "$tmp/documented.out" || fail 'documented row'
  grep -q 'documented state' "$tmp/documented.out" || fail 'documented note'
  ok 'documented state'
else
  cat "$tmp/documented.out" >&2
  fail 'documented state'
fi

fix=$tmp/mismatch
mkdir -p "$fix"
make_systemctl "$fix"
printf '%s\n' 'galion-os.target enabled enabled' >"$fix/list"
unit=$tmp/galion-os.target
printf '%s\n' '# GalionExpected: active/active' >"$unit"
write_props "$fix" galion-os.target \
  'LoadState=loaded' 'ActiveState=inactive' 'SubState=dead' 'Result=success' \
  'Type=' 'RemainAfterExit=no' "FragmentPath=$unit"
set +e
GALION_UNIT_TIMEOUT=1 run_check "$fix" >"$tmp/mismatch.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "mismatch exit $rc"
grep -q 'expected active/active' "$tmp/mismatch.out" || fail 'mismatch note'
ok 'documented mismatch'

fix=$tmp/slow
mkdir -p "$fix"
make_systemctl "$fix"
printf '%s\n' 'galion-os.target enabled enabled' >"$fix/list"
write_props "$fix" galion-os.target \
  'LoadState=loaded' 'ActiveState=activating' 'SubState=start' 'Result=' \
  'Type=' 'RemainAfterExit=no' 'FragmentPath='
set +e
GALION_UNIT_TIMEOUT=1 run_check "$fix" >"$tmp/slow.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "timeout exit $rc"
grep -q 'activating/start' "$tmp/slow.out" || fail 'timeout note'
ok 'time limit'

fix=$tmp/missing
mkdir -p "$fix"
make_systemctl "$fix"
: >"$fix/list"
set +e
GALION_UNIT_TIMEOUT=30 run_check "$fix" >"$tmp/missing.out"
rc=$?
set -e
[ "$rc" -eq 1 ] || fail "missing exit $rc"
grep -q 'galion-os.target' "$tmp/missing.out" || fail 'missing row'
grep -q 'missing' "$tmp/missing.out" || fail 'missing note'
ok 'missing target'

set +e
SYSTEMCTL=$tmp/no-such-systemctl sh "$ROOT/scripts/pi5-flash-check.sh" >"$tmp/nosys.out" 2>"$tmp/nosys.err"
rc=$?
set -e
[ "$rc" -eq 2 ] || fail "missing systemctl exit $rc"
ok 'missing systemctl'

repo=$tmp/repo-empty
mkdir -p "$repo"
if PI5_REPO_ROOT=$repo sh scripts/pi5-require-seed.sh >"$tmp/empty.out" 2>"$tmp/empty.err"; then
  fail 'empty tree should not produce a tarball'
fi
grep -q 'no pi-seed packager' "$tmp/empty.err" || fail 'empty tree message'
ok 'require-seed without a packager'

repo=$tmp/repo-pack
mkdir -p "$repo/.github/workflows" "$repo/packaging"
cat >"$repo/.github/workflows/pi-seed.yml" <<'EOF'
name: Pi 5 seed
jobs:
  pack:
    steps:
      - run: sh packaging/make-seed.sh
EOF
cat >"$repo/packaging/make-seed.sh" <<'EOF'
#!/bin/sh
printf 'seed\n' > payload
tar -czf galion-os-pi5-seed-abc.tar.gz payload
EOF
chmod 755 "$repo/packaging/make-seed.sh"
got=$(PI5_REPO_ROOT=$repo sh scripts/pi5-require-seed.sh)
case "$got" in
  "$repo"/galion-os-pi5-seed-abc.tar.gz) ;;
  *) fail "require-seed path: $got" ;;
esac
ok 'require-seed runs the workflow packager'

if PI5_SEED_TARBALL=$tmp/missing.tar.gz sh scripts/pi5-require-seed.sh >"$tmp/bad.out" 2>"$tmp/bad.err"; then
  fail 'missing tarball should fail'
fi
ok 'require-seed rejects a missing path'

given=$tmp/galion-os-pi5-seed-given.tar.gz
printf 'x\n' >"$given"
got=$(PI5_SEED_TARBALL=$given sh scripts/pi5-require-seed.sh)
[ "$got" = "$given" ] || fail "given path: $got"
ok 'require-seed uses PI5_SEED_TARBALL'

tarball=$(PI5_FIXTURE_DIR=$tmp/fixture sh scripts/pi5-fixture-seed.sh)
unpack=$tmp/fixture-unpack
mkdir -p "$unpack"
tar -xzf "$tarball" -C "$unpack"
(
  cd "$unpack/galion-os-pi5-seed-fixture"
  sha256sum -c SHA256SUMS >/dev/null
)
grep -q 'fixture: yes' "$unpack/galion-os-pi5-seed-fixture/install.sh"
grep -q 'Type=oneshot' "$unpack/galion-os-pi5-seed-fixture/systemd/galion-init.service"
grep -q 'Wants=galion-init.service' "$unpack/galion-os-pi5-seed-fixture/systemd/galion-os.target"
ok 'fixture seed checksum'

printf 'ok all\n'
