#!/bin/sh
# Build the static musl binaries twice, from two directories, and require
# the bytes to match. The recorded inputs are this rustc, the triple,
# galion-init/Cargo.lock, and the welcome page stylesheet.
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
sysroot=$(rustc --print sysroot)
host=$(rustc -vV | sed -n 's/^host: //p')
export PATH="$sysroot/lib/rustlib/$host/bin:$PATH"
command -v rust-lld >/dev/null
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
export CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
export SOURCE_DATE_EPOCH=0
export CARGO_INCREMENTAL=0

work=$(mktemp -d)
cleanup() {
  rm -rf "$work"
}
trap cleanup EXIT

# welcome.rs embeds this file. The release build reads it from the copy.
tar -C "$root" --exclude galion-init/target -cf "$work/src.tar" \
  .cargo galion-init site/assets/tokens.css
mkdir -p "$work/a" "$work/b"
tar -C "$work/a" -xf "$work/src.tar"
tar -C "$work/b" -xf "$work/src.tar"

build_tree() {
  dest=$1
  (
    cd "$dest"
    # RUSTFLAGS replaces the flags in .cargo/config.toml, so the static
    # link and the stable build id are repeated here. Both trees remap
    # onto the same prefix.
    RUSTFLAGS="-C target-feature=+crt-static -C link-arg=--build-id=none --remap-path-prefix=${dest}=/galion"
    export RUSTFLAGS
    cargo build --manifest-path galion-init/Cargo.toml --locked --release --target aarch64-unknown-linux-musl
    cargo build --manifest-path galion-init/Cargo.toml --locked --release --target x86_64-unknown-linux-musl
  )
}

build_tree "$work/a"
build_tree "$work/b"

for target in aarch64-unknown-linux-musl x86_64-unknown-linux-musl; do
  for name in galion-init galion-core galion-welcome; do
    left="$work/a/galion-init/target/$target/release/$name"
    right="$work/b/galion-init/target/$target/release/$name"
    if ! cmp -s "$left" "$right"; then
      echo "repro-musl: $target $name differs" >&2
      exit 1
    fi
    description=$(file "$left")
    printf '%s\n' "$description" | grep -Eq 'statically linked|static-pie linked'
    printf '%s\n' "$description" | grep -q stripped
    case $target in
      aarch64-unknown-linux-musl)
        printf '%s\n' "$description" | grep -q 'ARM aarch64'
        ;;
      x86_64-unknown-linux-musl)
        printf '%s\n' "$description" | grep -q 'x86-64'
        ;;
      *)
        echo "repro-musl: unknown target $target" >&2
        exit 1
        ;;
    esac
  done
done

echo "repro-musl: rustc $(rustc --version)"
echo "repro-musl: lock $(sha256sum "$root/galion-init/Cargo.lock")"
echo "repro-musl: aarch64 and x86_64 static binaries match"
