#!/bin/sh
# Host-side, while the Bookworm disk is mounted and before qemu starts.
# Copies any arm64 shared libraries the research binary needs that the
# nocloud image does not already have. The libraries come from Debian
# Bookworm's public archive. The guest still has no NIC.
#
# usage: prepare-root.sh <mounted-guest-root>

set -eu

if [ "$#" -ne 1 ] || [ ! -d "$1" ]; then
  printf 'usage: prepare-root.sh <mounted-guest-root>\n' >&2
  exit 2
fi

MNT=$1
EXTRA=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
ARCHIVE=$EXTRA/research-pi5-seed.tar.gz
[ -f "$ARCHIVE" ] || {
  printf 'error: research archive is missing: %s\n' "$ARCHIVE" >&2
  exit 1
}
command -v readelf >/dev/null 2>&1 || {
  printf 'error: readelf is not installed\n' >&2
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  printf 'error: python3 is not installed\n' >&2
  exit 1
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
tar -xzf "$ARCHIVE" -C "$work"
bin=$work/galion-research-linux-arm64
[ -f "$bin" ] || {
  printf 'error: research archive has no arm64 binary\n' >&2
  exit 1
}

missing=$work/missing
: >"$missing"
readelf -d -W "$bin" | awk '/NEEDED/ {
  lib = $NF
  gsub(/[][]/, "", lib)
  print lib
}' | while read -r lib; do
  [ -n "$lib" ] || continue
  if [ -e "$MNT/usr/lib/aarch64-linux-gnu/$lib" ] || [ -e "$MNT/lib/aarch64-linux-gnu/$lib" ]; then
    continue
  fi
  printf '%s\n' "$lib" >>"$missing"
done

if [ ! -s "$missing" ]; then
  printf 'prepare-root: research binary libraries are already in the image\n'
  exit 0
fi

pkg_for() {
  case "$1" in
    libstdc++.so.6) printf '%s\n' libstdc++6 ;;
    libgcc_s.so.1) printf '%s\n' libgcc-s1 ;;
    libc.so.6|libm.so.6|libdl.so.2|libpthread.so.0|ld-linux-aarch64.so.1)
      printf '%s\n' libc6
      ;;
    *)
      return 1
      ;;
  esac
}

pkgs=$work/pkgs
: >"$pkgs"
while read -r lib; do
  [ -n "$lib" ] || continue
  if ! pkg=$(pkg_for "$lib"); then
    printf 'error: no Bookworm package mapped for %s\n' "$lib" >&2
    exit 1
  fi
  printf '%s\n' "$pkg" >>"$pkgs"
done <"$missing"
sort -u "$pkgs" -o "$pkgs"

printf 'prepare-root: downloading Bookworm arm64 package index\n'
curl -fsSL -o "$work/Packages.gz" \
  https://deb.debian.org/debian/dists/bookworm/main/binary-arm64/Packages.gz
gzip -dc "$work/Packages.gz" >"$work/Packages"

copied=0
while read -r pkg; do
  [ -n "$pkg" ] || continue
  filename=$(python3 -c '
import sys
want = sys.argv[1]
text = open(sys.argv[2], encoding="utf-8", errors="replace").read()
for block in text.split("\n\n"):
    name = filename = ""
    for line in block.splitlines():
        if line.startswith("Package: "):
            name = line.split(": ", 1)[1]
        elif line.startswith("Filename: "):
            filename = line.split(": ", 1)[1]
    if name == want and filename:
        print(filename)
        raise SystemExit(0)
raise SystemExit(1)
' "$pkg" "$work/Packages") || {
    printf 'error: Bookworm index has no %s\n' "$pkg" >&2
    exit 1
  }
  printf 'prepare-root: fetching %s\n' "$filename"
  curl -fsSL -o "$work/pkg.deb" "https://deb.debian.org/debian/$filename"
  rm -rf "$work/tree"
  dpkg-deb -x "$work/pkg.deb" "$work/tree"
  if [ -d "$work/tree/usr/lib/aarch64-linux-gnu" ]; then
    mkdir -p "$MNT/usr/lib/aarch64-linux-gnu"
    cp -a "$work/tree/usr/lib/aarch64-linux-gnu/." "$MNT/usr/lib/aarch64-linux-gnu/"
    copied=1
  fi
done <"$pkgs"

if [ "$copied" -eq 1 ]; then
  touch "$MNT/opt/seed-boot/extra/need-ldconfig"
  printf 'prepare-root: copied Bookworm libraries into the guest root\n'
fi
exit 0
