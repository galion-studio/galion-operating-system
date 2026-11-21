#!/bin/bash
# Run inside ubuntu:24.04. Installs shellcheck, then the Galion-Ubuntu
# provisioner in --dry-run, real mode, or both. PROVISION_MODE selects
# which. The checkout is only read. Nothing is published.

set -euo pipefail

here=$(CDPATH='' cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd) || exit 1
root=$(CDPATH='' cd -- "$here/../.." && pwd) || exit 1
cd "$root"

mode=${PROVISION_MODE:-both}
case $mode in
  both | dry-run | real) ;;
  *)
    printf 'refused: PROVISION_MODE must be both, dry-run, or real\n' >&2
    exit 2
    ;;
esac

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y shellcheck

if [[ $mode == both || $mode == dry-run ]]; then
  bash packaging/wsl/test-provision.sh
fi
if [[ $mode == both || $mode == real ]]; then
  bash packaging/wsl/test-provision.sh --real
fi
