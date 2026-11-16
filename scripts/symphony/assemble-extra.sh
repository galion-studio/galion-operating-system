#!/bin/sh
# Stage the directory pi5-seed-boot.sh copies into the guest.
#
# usage: assemble-extra.sh <dest> <os-sha-file> <fetch-directory>

set -eu

if [ "$#" -ne 3 ]; then
  printf 'usage: assemble-extra.sh <dest> <os-sha-file> <fetch-directory>\n' >&2
  exit 2
fi

DEST=$1
OS_SHA_FILE=$2
FETCH=$3
ROOT=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
[ -f "$OS_SHA_FILE" ] || {
  printf 'error: OS sha file is missing\n' >&2
  exit 1
}
[ -f "$FETCH/research-pi5-seed.tar.gz" ] || {
  printf 'error: research archive is missing\n' >&2
  exit 1
}
[ -f "$FETCH/openmind-desktop" ] || {
  printf 'error: openmind-desktop binary is missing\n' >&2
  exit 1
}
[ -f "$FETCH/sources.env" ] || {
  printf 'error: sources.env is missing\n' >&2
  exit 1
}

rm -rf "$DEST"
mkdir -p "$DEST"
cp "$FETCH/research-pi5-seed.tar.gz" "$DEST/research-pi5-seed.tar.gz"
cp "$FETCH/openmind-desktop" "$DEST/openmind-desktop"
chmod 0755 "$DEST/openmind-desktop"
cp "$ROOT/guest-run.sh" "$DEST/run.sh"
cp "$ROOT/health-table.sh" "$DEST/health-table.sh"
cp "$ROOT/prepare-root.sh" "$DEST/prepare-root.sh"
cp "$ROOT/openmind-desktop.service" "$DEST/openmind-desktop.service"
chmod 0755 "$DEST/run.sh" "$DEST/health-table.sh" "$DEST/prepare-root.sh"
{
  printf 'OS_SHA=%s\n' "$(tr -d '[:space:]' <"$OS_SHA_FILE")"
  cat "$FETCH/sources.env"
} >"$DEST/meta.env"
printf '%s\n' "$DEST"
