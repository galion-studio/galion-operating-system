#!/bin/sh
# Toolchain and package caches for the Galion-Ubuntu WSL distro.
# Sourced from /etc/profile.d. The managed paths are on the distro
# filesystem. /mnt/<drive> is a Windows drive and is not a cache.

export RUSTUP_HOME=/opt/galion/rustup
export CARGO_HOME=/opt/galion/cargo
export CARGO_TARGET_DIR=/opt/galion/cargo/target
export NPM_CONFIG_CACHE=/var/cache/npm
export PIP_CACHE_DIR=/var/cache/pip
export TMPDIR=/var/cache/galion/tmp
export TMP=/var/cache/galion/tmp
export TEMP=/var/cache/galion/tmp

case ${XDG_CACHE_HOME:-} in
  /mnt | /mnt/*) unset XDG_CACHE_HOME ;;
esac

case ${HOME:-} in
  / | /mnt | /mnt/*) ;;
  *)
    if [ -z "${XDG_CACHE_HOME:-}" ]; then
      XDG_CACHE_HOME=$HOME/.cache
      export XDG_CACHE_HOME
    fi
    ;;
esac

case :${PATH:-}: in
  *:/opt/galion/cargo/bin:*) ;;
  *) PATH="/opt/galion/cargo/bin${PATH:+:$PATH}" ;;
esac
export PATH

if [ -S /mnt/wslg/PulseServer ] && [ -z "${PULSE_SERVER:-}" ]; then
  PULSE_SERVER=unix:/mnt/wslg/PulseServer
  export PULSE_SERVER
fi
