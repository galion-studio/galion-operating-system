#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Refusal tests for scripts/image/dry-run.sh.
# Image tools on PATH are stubs that record a call and fail the test.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DRY="$ROOT/scripts/image/dry-run.sh"
LAST_OUT=""
PASS=0
TMP="$(mktemp -d)"
STAMP="$TMP/called"
trap 'rm -rf "$TMP"' EXIT

fail() {
  printf 'test failed: %s\n' "$*" >&2
  exit 1
}

ok() {
  PASS=$((PASS + 1))
  printf 'ok %s\n' "$1"
}

need() {
  local needle="$1"
  if ! grep -F -q -- "$needle" <<<"$LAST_OUT"; then
    printf '%s\n' "$LAST_OUT" >&2
    fail "output missing: ${needle}"
  fi
}

absent() {
  local needle="$1"
  if grep -F -q -- "$needle" <<<"$LAST_OUT"; then
    printf '%s\n' "$LAST_OUT" >&2
    fail "output unexpectedly contained: ${needle}"
  fi
}

assert_no_tool() {
  if [[ -e "$STAMP" ]]; then
    cat "$STAMP" >&2
    fail "an image tool was executed"
  fi
}

run_expect() {
  local expect="$1"
  shift
  local code=0
  set +e
  LAST_OUT="$("$@" 2>&1)"
  code=$?
  set -e
  if [[ "$code" -ne "$expect" ]]; then
    printf '%s\n' "$LAST_OUT" >&2
    fail "exited ${code}, expected ${expect}: $*"
  fi
  assert_no_tool
}

mkdir -p "$TMP/bin"
tools=(
  debootstrap xorriso mkisofs genisoimage dd apt apt-get apt-cache
  unsquashfs mksquashfs grub-mkrescue mcopy mmd sgdisk parted
  losetup mount umount mkfs.ext4 wget curl
)
for tool in "${tools[@]}"; do
  quoted_stamp="$(printf '%q' "$STAMP")"
  {
    printf '%s\n' '#!/bin/sh'
    printf '%s\n' "printf '%s\\n' \"\$0\" >> ${quoted_stamp}"
    printf '%s\n' 'exit 99'
  } > "$TMP/bin/$tool"
  chmod +x "$TMP/bin/$tool"
done
export PATH="$TMP/bin:${PATH}"
hash -r

run_expect 0 "$DRY"
need "base: ubuntu-26.04"
need "arch: x86_64"
need "node: 22.22.1"
need "node_path: /usr/bin/node"
need "init: galion-init"
need "init_status: planned"
need "weights: none"
need "root: squashfs"
need "publish: off"
need "galion-init"
need "galion-voiced"
need "galion-probe"
need "not-built"
need "off-desktop-image"
need "required-before-boot"
need "unattended-upgrades"
need "not-installed"
need "kept-off"
need "package-unnamed"
need "host_packages_installed: no"
need "image files not written:"
need "galion-os-<untagged>-x86_64.iso"
need "galion-os-<untagged>-x86_64.img"
need "result: dry run only. no image was built. no device was flashed. nothing was published."
sha="$(git -C "$ROOT" rev-parse HEAD)"
need "git: ${sha}"
ok "default dry run"

run_expect 0 "$DRY" --dry-run
need "mode: dry-run"
ok "explicit dry run"

pushd /tmp >/dev/null
run_expect 0 "$DRY"
need "base: ubuntu-26.04"
popd >/dev/null
ok "dry run from another directory"

run_expect 0 "$DRY" --help
need "--allow-real-image"
need "--allow-real-flash"
absent "result: dry run only"
ok "help"

run_expect 2 "$DRY" --build
need "refused:"
need "--allow-real-image"
need "Nothing was published."
absent "result: dry run only"
ok "build without flag"

run_expect 2 "$DRY" --build --allow-real-image
need "--allow-real-image was set"
need "galion-init, galion-voiced, and galion-probe are planned, not built"
need "No image was written."
need "Nothing was published."
ok "build with explicit flag still refused"

device="$TMP/not-a-device"
run_expect 2 "$DRY" --flash "$device"
need "--allow-real-flash"
need "No device was written."
if [[ -e "$device" ]]; then
  fail "flash created ${device}"
fi
ok "flash without flag"

run_expect 2 "$DRY" --flash "$device" --allow-real-flash
need "--allow-real-flash was set"
need "does not write block devices"
if [[ -e "$device" ]]; then
  fail "allowed flash created ${device}"
fi
ok "flash with explicit flag still refused"

for flag in --publish --upload --gh-release; do
  run_expect 2 "$DRY" "$flag"
  need "not implemented"
  need "Nothing was published."
  ok "refuses ${flag}"
done

run_expect 2 "$DRY" --build --allow-real-image --publish
need "not implemented"
need "Nothing was published."
ok "publish wins over an allowed build"

run_expect 2 "$DRY" --allow-real-image
need "--allow-real-image does nothing unless --build is also set"
ok "image flag alone"

run_expect 2 "$DRY" --allow-real-flash
need "--allow-real-flash does nothing unless --flash is also set"
ok "flash flag alone"

run_expect 2 "$DRY" --dry-run --build
need "refused:"
need "--allow-real-image"
ok "dry-run does not hide build"

run_expect 2 "$DRY" --execute
need "unknown argument: --execute"
ok "unknown argument"

run_expect 2 env GALION_ALLOW_REAL_IMAGE=1 "$DRY" --build
need "--allow-real-image"
absent "--allow-real-image was set"
ok "environment variable does not authorize a build"

cp -a "$ROOT/image" "$TMP/built"
built_file="$TMP/built/packages/galion-planned.list"
built_text="$(cat "$built_file")"
built_new="${built_text/planned$'\t'galion-init/built$'\t'galion-init}"
if [[ "$built_new" == "$built_text" ]]; then
  fail "could not rewrite galion-init status"
fi
printf '%s\n' "$built_new" > "$built_file"
run_expect 1 env IMAGE_ROOT="$TMP/built" "$DRY"
need "status built is not allowed"
ok "rejects status built"

cp -a "$ROOT/image" "$TMP/missing"
missing_file="$TMP/missing/packages/galion-planned.list"
{
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == planned$'\t'galion-probe$'\t'* ]]; then
      continue
    fi
    printf '%s\n' "$line"
  done < "$missing_file"
} > "$TMP/rows"
mv "$TMP/rows" "$missing_file"
run_expect 1 env IMAGE_ROOT="$TMP/missing" "$DRY"
need "galion-probe"
ok "rejects a list that drops galion-probe"

cp -a "$ROOT/image" "$TMP/base"
sed -i 's/^base=ubuntu-26.04$/base=ubuntu-24.04/' "$TMP/base/MANIFEST.txt"
run_expect 1 env IMAGE_ROOT="$TMP/base" "$DRY"
need "ubuntu-26.04"
ok "rejects a different base"

if find "$ROOT" "$TMP" -type f \( -name '*.iso' -o -name '*.img' \) | grep -q .; then
  fail "an iso or img file exists"
fi
assert_no_tool
ok "no image file and no image tool"

printf 'passed %s\n' "$PASS"
