#!/bin/sh
# Shellcheck the Pi 5, first-boot, and board-check scripts.
# Notes are not failed: SC2317 flags trap handlers, and SC2016 flags the
# quoted bash program those scripts pass to bash -c. Warnings and errors
# fail. A pass here is not a Raspberry Pi 5 result.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

if ! command -v shellcheck >/dev/null 2>&1; then
  printf 'error: shellcheck is required and was not found\n' >&2
  exit 1
fi

set -- \
  packaging/pi5/install.sh \
  packaging/pi-seed.sh \
  packaging/test-pi-seed.sh \
  packaging/test-welcome-page.sh \
  scripts/pi5/board-report.sh \
  scripts/pi5/first-boot.sh \
  scripts/pi5/lint.sh \
  scripts/pi5/pack-reports.sh \
  scripts/pi5/test-board-report.sh \
  scripts/pi5/test-pack-reports.sh \
  scripts/pi5/test-first-boot.sh \
  scripts/pi5-fixture-seed.sh \
  scripts/pi5-flash-check.sh \
  scripts/pi5-require-seed.sh \
  scripts/pi5-seed-boot.sh \
  scripts/pi5-seed-guest.sh \
  scripts/symphony/assemble-extra.sh \
  scripts/symphony/build-os-seed.sh \
  scripts/symphony/build-probe-targets.sh \
  scripts/symphony/fetch-seeds.sh \
  scripts/symphony/guest-run.sh \
  scripts/symphony/health-table.sh \
  scripts/symphony/pins.sh \
  scripts/symphony/prepare-root.sh \
  scripts/symphony/test-health-table.sh \
  scripts/test-pi5-seed-boot.sh

missing=0
for script in "$@"; do
  if [ ! -f "$script" ]; then
    printf 'error: missing %s\n' "$script" >&2
    missing=1
  fi
done

for found in scripts/pi5/*.sh scripts/pi5-*.sh scripts/symphony/*.sh packaging/pi5/*.sh; do
  [ -f "$found" ] || continue
  match=0
  for script in "$@"; do
    if [ "$script" = "$found" ]; then
      match=1
      break
    fi
  done
  if [ "$match" -eq 0 ]; then
    printf 'error: %s is not in the shellcheck list\n' "$found" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

shellcheck --severity=warning -s sh "$@"
printf 'shellcheck ok (%s scripts). This is not a Raspberry Pi 5 result.\n' "$#"
