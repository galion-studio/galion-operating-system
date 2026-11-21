#!/bin/sh
# Exec the rustup proxy named by argv0, with the distro-local toolchain.
set -eu
RUSTUP_HOME=/opt/galion/rustup
CARGO_HOME=/opt/galion/cargo
export RUSTUP_HOME CARGO_HOME
tool=${0##*/}
exec "$CARGO_HOME/bin/$tool" "$@"
