#!/bin/sh
# Build the research seed and the openmind-desktop binary from public git.
# The Actions artifact API answers 401 without a token. This job has no token.
#
# usage: fetch-seeds.sh <output-directory>

set -eu

if [ "$#" -ne 1 ]; then
  printf 'usage: fetch-seeds.sh <output-directory>\n' >&2
  exit 2
fi

OUT=$1
mkdir -p "$OUT"
ROOT=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
# shellcheck disable=SC1091
. "$ROOT/pins.sh"

clone_sha() {
  url=$1
  sha=$2
  dest=$3
  rm -rf "$dest"
  # Do not send this repository's Actions token to the other public repos.
  git -c http.https://github.com/.extraheader= init "$dest"
  git -C "$dest" -c http.https://github.com/.extraheader= remote add origin "$url"
  git -C "$dest" -c http.https://github.com/.extraheader= fetch --depth 1 origin "$sha"
  git -C "$dest" checkout --detach FETCH_HEAD
  got=$(git -C "$dest" rev-parse HEAD)
  [ "$got" = "$sha" ] || {
    printf 'error: %s checked out %s, want %s\n' "$url" "$got" "$sha" >&2
    exit 1
  }
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

printf 'fetch-seeds: hermes-research %s\n' "$RESEARCH_SHA"
clone_sha "$RESEARCH_REPO" "$RESEARCH_SHA" "$work/hermes"
(
  cd "$work/hermes"
  node scripts/pi-seed/build.js
  archive=$(node scripts/pi-seed/pack.js)
  cp "$archive" "$OUT/research-pi5-seed.tar.gz"
)

printf 'fetch-seeds: obsidian-open-mind %s openmind-desktop\n' "$DESKTOP_SHA"
clone_sha "$DESKTOP_REPO" "$DESKTOP_SHA" "$work/openmind"
(
  cd "$work/openmind"
  sysroot=$(rustc --print sysroot)
  host=$(rustc -vV | sed -n 's/^host: //p')
  PATH="$sysroot/lib/rustlib/$host/bin:$PATH"
  export PATH
  command -v rust-lld
  export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
  cargo build -p openmind-desktop --locked --profile pi-seed --target aarch64-unknown-linux-musl
  cp target/aarch64-unknown-linux-musl/pi-seed/openmind-desktop "$OUT/openmind-desktop"
  chmod 0755 "$OUT/openmind-desktop"
)

file_desktop=$(file "$OUT/openmind-desktop")
printf '%s\n' "$file_desktop" | grep -q 'ARM aarch64'
printf '%s\n' "$file_desktop" | grep -Eq 'statically linked|static-pie linked'

cat >"$OUT/sources.env" <<EOF
RESEARCH_SHA=$RESEARCH_SHA
DESKTOP_SHA=$DESKTOP_SHA
RESEARCH_SOURCE=$RESEARCH_SOURCE
DESKTOP_SOURCE=$DESKTOP_SOURCE
EOF
printf 'fetch-seeds: wrote %s\n' "$OUT"
