#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.

set -euo pipefail

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
PASS=0

fail() {
  printf 'test failed: %s\n' "$1" >&2
  exit 1
}

ok() {
  PASS=$((PASS + 1))
  printf 'ok %s\n' "$1"
}

OBS=$ROOT/install-obsidian-wslg.sh
VOICE=$ROOT/install-voice-wsl.sh
PORTS=$ROOT/apply-laptop-ports.sh

LAST=$(bash "$OBS" --dry-run)
printf '%s\n' "$LAST" | grep -F -q 'openmind-desktop' || fail 'obsidian name'
printf '%s\n' "$LAST" | grep -F -q '272060c8b9559b0f517721baaebcd45685b0537a' || fail 'obsidian pin'
printf '%s\n' "$LAST" | grep -F -q '/opt/galion/src/obsidian-open-mind' || fail 'obsidian path'
printf '%s\n' "$LAST" | grep -F -q 'refuses a checkout on /mnt' || fail 'obsidian mount'
printf '%s\n' "$LAST" | grep -F -q 'does not install the Obsidian.md application' || fail 'obsidian.md'
printf '%s\n' "$LAST" | grep -F -q 'CARGO_HOME=/opt/galion/cargo' || fail 'obsidian cargo'
printf '%s\n' "$LAST" | grep -F -q -- '--listen --stack off' || fail 'stack off'
printf '%s\n' "$LAST" | grep -F -q '127.0.0.1:8091' || fail 'stack dial'
ok obsidian-dry-run

LAST=$(bash "$VOICE" --dry-run)
printf '%s\n' "$LAST" | grep -F -q '127.0.0.1:7881' || fail 'voice port'
printf '%s\n' "$LAST" | grep -F -q 'GALION_SAMANTHA_REF=unset' || fail 'voice ref'
printf '%s\n' "$LAST" | grep -F -q '363cd4b77a87f036d31caf413941fc5c184e5685' || fail 'voice pin'
printf '%s\n' "$LAST" | grep -F -q 'no voice clone' || fail 'voice clone'
printf '%s\n' "$LAST" | grep -F -q '127.0.0.1:7878' || fail 'one-dot'
printf '%s\n' "$LAST" | grep -F -q '127.0.0.1:8670' || fail 'nerve'
printf '%s\n' "$LAST" | grep -F -q '127.0.0.1:8642' || fail 'hermes'
printf '%s\n' "$LAST" | grep -F -q 'horbm crate is not cloned' || fail 'horbm'
ok voice-dry-run

LAST=$(bash "$PORTS" --dry-run)
printf '%s\n' "$LAST" | grep -F -q 'GALION_RESEARCH_PORT=8797' || fail 'research port'
printf '%s\n' "$LAST" | grep -F -q 'GALION_HORBM_PREVIEW_PORT=8787' || fail 'preview port'
printf '%s\n' "$LAST" | grep -F -q 'does not export PORT' || fail 'port export'
printf '%s\n' "$LAST" | grep -F -q 'does not start the Node research desk' || fail 'research start'
ok ports-dry-run

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FAKE=$TMP/root
bash "$PORTS" --dest-root "$FAKE"
grep -F -q 'GALION_RESEARCH_PORT=8797' "$FAKE/etc/profile.d/galion-research-port.sh" || fail 'ports file'
if grep -E -q '^export PORT=' "$FAKE/etc/profile.d/galion-research-port.sh"; then
  fail 'ports file exports PORT'
fi
ok ports-file

STUB=$TMP/stubs
LOG=$TMP/stub.log
mkdir -p "$STUB"
: >"$LOG"
for cmd in git curl cargo rustup; do
  cat >"$STUB/$cmd" <<EOF
#!/bin/sh
printf '%s\n' "\$0" >> "$LOG"
exit 99
EOF
  chmod +x "$STUB/$cmd"
done
PATH="$STUB:$PATH" bash "$OBS" --dry-run >/dev/null
PATH="$STUB:$PATH" bash "$VOICE" --dry-run >/dev/null
PATH="$STUB:$PATH" bash "$PORTS" --dry-run >/dev/null
if [ -s "$LOG" ]; then
  cat "$LOG" >&2
  fail 'dry-run called git, curl, or cargo'
fi
ok dry-run-offline

set +e
bash "$OBS" --bogus >/dev/null 2>"$TMP/obs.err"
code=$?
set -e
[ "$code" -eq 2 ] || fail "obsidian unknown $code"
grep -F -q 'unknown argument' "$TMP/obs.err" || fail 'obsidian unknown text'
ok obsidian-unknown

set +e
bash "$VOICE" --bogus >/dev/null 2>"$TMP/voice.err"
code=$?
set -e
[ "$code" -eq 2 ] || fail "voice unknown $code"
ok voice-unknown

bash "$OBS" --help >/dev/null
bash "$VOICE" --help >/dev/null
bash "$PORTS" --help >/dev/null
ok help

printf 'passed %s\n' "$PASS"
