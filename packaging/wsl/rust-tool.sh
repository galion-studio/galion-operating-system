#!/bin/sh
# Exec the rustup proxy named by argv0, with the distro-local toolchain.
set -eu
RUSTUP_HOME=/opt/galion/rustup
CARGO_HOME=/opt/galion/cargo
CARGO_TARGET_DIR=/opt/galion/cargo/target
TMPDIR=/var/cache/galion/tmp
export RUSTUP_HOME CARGO_HOME CARGO_TARGET_DIR TMPDIR
tool=${0##*/}
exec "$CARGO_HOME/bin/$tool" "$@"
