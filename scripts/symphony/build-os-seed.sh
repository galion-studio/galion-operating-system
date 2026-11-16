#!/bin/sh
# Build the Galion OS Pi 5 seed from origin/main of this repository.
# Prints the tarball path. Writes the commit to <output>/os-sha.
#
# usage: build-os-seed.sh <output-directory>

set -eu

if [ "$#" -ne 1 ]; then
  printf 'usage: build-os-seed.sh <output-directory>\n' >&2
  exit 2
fi

OUT=$1
mkdir -p "$OUT"
ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
git -C "$ROOT" -c http.https://github.com/.extraheader= fetch origin main
git -C "$ROOT" worktree prune
dest=$OUT/src
rm -rf "$dest"
git -C "$ROOT" worktree add --detach "$dest" origin/main
cleanup() {
  git -C "$ROOT" worktree remove --force "$dest" >/dev/null 2>&1 || rm -rf "$dest"
}
trap cleanup EXIT

sha=$(git -C "$dest" rev-parse HEAD)
printf '%s\n' "$sha" >"$OUT/os-sha"
printf 'build-os-seed: origin/main %s\n' "$sha" >&2

sysroot=$(rustc --print sysroot)
host=$(rustc -vV | sed -n 's/^host: //p')
PATH="$sysroot/lib/rustlib/$host/bin:$PATH"
export PATH
command -v rust-lld >&2
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
(
  cd "$dest"
  cargo build --manifest-path galion-init/Cargo.toml --locked --release --target aarch64-unknown-linux-musl >&2
)
tarball=$(
  cd "$dest"
  sh packaging/pi-seed.sh
)
[ -f "$tarball" ] || {
  printf 'error: OS packager did not write a tarball (%s)\n' "$tarball" >&2
  exit 1
}
cp "$tarball" "$OUT/$(basename "$tarball")"
printf '%s\n' "$OUT/$(basename "$tarball")"
