#!/bin/sh
# Pack galion-os-pi5-seed-<sha>.tar.gz from the aarch64 release binaries.
# Does not publish a release and does not contact the network.
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
sha=$(git -C "$root" rev-parse HEAD)
rel="$root/galion-init/target/aarch64-unknown-linux-musl/release"
name="galion-os-pi5-seed-$sha"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
dest="$stage/$name"

mkdir -p "$dest/bin" "$dest/systemd" "$dest/ideology"

found=0
for candidate in "$rel"/*; do
  if [ ! -f "$candidate" ] || [ ! -x "$candidate" ]; then
    continue
  fi
  info=$(file "$candidate")
  printf '%s\n' "$info" | grep -q 'ARM aarch64'
  printf '%s\n' "$info" | grep -Eq 'statically linked|static-pie linked'
  printf '%s\n' "$info" | grep -q 'stripped'
  cp "$candidate" "$dest/bin/$(basename "$candidate")"
  chmod 0755 "$dest/bin/$(basename "$candidate")"
  found=$((found + 1))
done
if [ "$found" -lt 1 ]; then
  echo "pi-seed: no aarch64 release binary in $rel" >&2
  exit 1
fi

cp "$root/packaging/pi5/galion-os.target" "$dest/systemd/galion-os.target"
cp "$root/packaging/pi5/galion-init.service" "$dest/systemd/galion-init.service"
cp "$root/packaging/pi5/galion-welcome.service" "$dest/systemd/galion-welcome.service"
cp "$root/packaging/pi5/install.sh" "$dest/install.sh"
chmod 0755 "$dest/install.sh"
cp "$root/LICENSE" "$dest/LICENSE"
cp "$root/NOTICE" "$dest/NOTICE"
cp "$root/docs/PI5-SEED.md" "$dest/PI5-SEED.md"

if [ -d "$root/docs/ideology" ]; then
  cp -a "$root/docs/ideology/." "$dest/ideology/"
else
  # This repository has no docs/ideology directory. Copy the notes that
  # already say what Galion OS is. Bytes are unchanged.
  mkdir -p "$dest/ideology/docs/voice-profile"
  cp "$root/README.md" "$dest/ideology/README.md"
  cp "$root/docs/voice-profile/README.md" "$dest/ideology/docs/voice-profile/README.md"
  cp "$root/docs/voice-profile/voice-first.md" "$dest/ideology/docs/voice-profile/voice-first.md"
  cp "$root/docs/voice-profile/hermes-later.md" "$dest/ideology/docs/voice-profile/hermes-later.md"
fi

(
  cd "$dest"
  list=$(mktemp)
  find . -type f ! -name SHA256SUMS -print | sed 's|^\./||' | LC_ALL=C sort > "$list"
  : > SHA256SUMS
  while IFS= read -r relpath; do
    sha256sum "$relpath" >> SHA256SUMS
  done < "$list"
  rm -f "$list"
)

mkdir -p "$root/dist"
out="$root/dist/$name.tar.gz"
tar -C "$stage" -czf "$out" "$name"
echo "$out"
