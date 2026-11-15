#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
DRY=$ROOT/packaging/dry-run.sh
CHECK=$ROOT/packaging/check-pr-13.sh
STORY=$ROOT/packaging/check-one-story.sh
LAYOUT=$ROOT/packaging/layout.sh
PASS=0
TMP=$(mktemp -d)
STAMP=$TMP/called
LAST=
trap 'rm -rf "$TMP"' EXIT

fail() {
  printf 'test failed: %s\n' "$1" >&2
  exit 1
}

ok() {
  PASS=$((PASS + 1))
  printf 'ok %s\n' "$1"
}

need() {
  if ! printf '%s\n' "$LAST" | grep -F -q -- "$1"; then
    printf '%s\n' "$LAST" >&2
    fail "output missing: $1"
  fi
}

absent() {
  if printf '%s\n' "$LAST" | grep -F -q -- "$1"; then
    printf '%s\n' "$LAST" >&2
    fail "output unexpectedly contained: $1"
  fi
}

assert_no_tool() {
  if [ -e "$STAMP" ]; then
    cat "$STAMP" >&2
    fail "an image tool was executed"
  fi
}

run_expect() {
  expect=$1
  shift
  set +e
  LAST=$("$@" 2>&1)
  code=$?
  set -e
  if [ "$code" -ne "$expect" ]; then
    printf '%s\n' "$LAST" >&2
    fail "exited $code, expected $expect: $*"
  fi
  assert_no_tool
}

mkdir -p "$TMP/bin"
for tool in debootstrap xorriso mkisofs genisoimage dd apt apt-get apt-cache unsquashfs mksquashfs grub-mkrescue wget curl; do
  {
    printf '%s\n' '#!/bin/sh'
    printf '%s\n' "printf '%s\\n' \"\$0\" >> \"$STAMP\""
    printf '%s\n' 'exit 99'
  } > "$TMP/bin/$tool"
  chmod +x "$TMP/bin/$tool"
done
PATH="$TMP/bin:$PATH"
export PATH

run_expect 0 sh "$DRY"
need "base: ubuntu-26.04"
need "init: galion-init"
need "init_status: planned"
need "init_present: no"
need "node: 22.22.1"
need "weights: none"
need "console_port: 18181"
need "research_port: 8787"
need "one desktop image on Ubuntu 26.04"
need "galion-voiced"
need "galion-probe"
need "off-desktop-image"
need "not-built required-before-boot"
need "host_packages_installed: no"
need "result: dry run only. no image was built. no device was flashed. nothing was published."
sha=$(git -C "$ROOT" rev-parse HEAD)
need "git: $sha"
desktop=$(printf '%s\n' "$LAST" | sed -n '/^desktop payloads:$/,/^end desktop payloads$/p')
if printf '%s\n' "$desktop" | grep -E -q 'galion-voiced|galion-probe'; then
  fail "voice programs are in the desktop payload section"
fi
ok "default dry run"

run_expect 2 sh "$DRY" --execute
need "--execute would build or flash a real image"
need "Nothing was published."
absent "result: dry run only"
ok "execute"

run_expect 2 sh "$DRY" --build
need "--allow-real-image"
ok "build without flag"

run_expect 2 sh "$DRY" --build --allow-real-image
need "galion-init is planned, not built"
need "voice profile"
need "does not run apt"
ok "build with explicit flag still refused"

run_expect 2 sh "$DRY" --flash
need "--allow-real-flash"
ok "flash without flag"

run_expect 2 sh "$DRY" --flash --allow-real-flash
need "does not write block devices"
ok "flash with explicit flag still refused"

run_expect 2 sh "$DRY" --publish
need "not implemented"
ok "publish"

run_expect 2 sh "$DRY" --upload
need "not implemented"
ok "upload"

run_expect 2 sh "$DRY" --gh-release
need "not implemented"
ok "gh-release"

run_expect 2 env GALION_ALLOW_REAL_IMAGE=1 sh "$DRY" --build
need "--allow-real-image"
absent "--allow-real-image was set"
ok "environment variable does not authorize a build"

run_expect 0 sh "$CHECK"
need "present on main: docs/PACKAGING.md"
need "present on main: NOTICE"
need "NOTICE on main: The licence is LICENSE."
need "09540d5a0b07e9399791d2d3d86c717c54802371 is on main"
need "merge command: not run"
need "This script did not merge it."
ok "pr 13 landed"

run_expect 2 sh "$CHECK" --merge
need "does not merge pull request 13"
ok "readiness refuses merge"

run_expect 0 sh "$STORY"
need "one desktop boot"
need "console port 18181"
need "research port 8787"
ok "one story"

run_expect 2 sh "$STORY" --build
need "does not build an image"
ok "one story refuses build"

run_expect 0 sh "$LAYOUT"
need "mode: layout"
need "written: no"
need "payload openmind-desktop user galion path /opt/galion/openmind-desktop/openmind-desktop"
need "payload site-one user none path /opt/galion/site/one/"
need "payload site-research user none path /opt/galion/site/research/"
need "payload hermes-research user galion path /opt/galion/research/current/"
need "off galion-voiced"
need "off galion-probe"
need "no file was written"
absent "payload galion-voiced"
absent "payload galion-one"
ok "root layout"

run_expect 2 sh "$LAYOUT" --execute
need "does not write an image"
ok "layout refuses execute"

if find "$ROOT" "$TMP" -type f \( -name '*.iso' -o -name '*.img' \) | grep -q .; then
  fail "an iso or img file exists"
fi
assert_no_tool
ok "no image file and no image tool"

printf 'passed %s\n' "$PASS"
