#!/bin/sh
# Build the aarch64 musl stand-in that answers the six desktop probes.
# The binary listens on the loopback interface only. It is not nerve,
# cortex, the console, Hermes, voice, or desk.
#
# usage: build-probe-targets.sh <output-directory>

set -eu

if [ "$#" -ne 1 ]; then
  printf 'usage: build-probe-targets.sh <output-directory>\n' >&2
  exit 2
fi

OUT=$1
mkdir -p "$OUT"
ROOT=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
CRATE=$ROOT/probe-targets

cargo test --manifest-path "$CRATE/Cargo.toml" --locked

sysroot=$(rustc --print sysroot)
host=$(rustc -vV | sed -n 's/^host: //p')
PATH="$sysroot/lib/rustlib/$host/bin:$PATH"
export PATH
command -v rust-lld >/dev/null 2>&1 || {
  printf 'error: rust-lld is not in the Rust sysroot\n' >&2
  exit 1
}
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
cargo build --manifest-path "$CRATE/Cargo.toml" --locked --release \
  --target aarch64-unknown-linux-musl
cp "$CRATE/target/aarch64-unknown-linux-musl/release/probe-targets" "$OUT/probe-targets"
chmod 0755 "$OUT/probe-targets"

file_desktop=$(file "$OUT/probe-targets")
printf '%s\n' "$file_desktop" | grep -q 'ARM aarch64'
printf '%s\n' "$file_desktop" | grep -Eq 'statically linked|static-pie linked'
printf 'build-probe-targets: wrote %s\n' "$OUT/probe-targets"
