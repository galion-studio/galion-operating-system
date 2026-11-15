#!/usr/bin/env bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Dry run for the Galion OS desktop image described in docs/PACKAGING.md.
# The default mode prints the manifest and the package lists.
# --build and --flash exit 2 unless the matching explicit flag is also present.
# Those flags still exit 2 while galion-init, galion-voiced, and galion-probe
# are planned. --publish, --upload, and --gh-release always exit 2.
# This script does not install packages, write an image, flash a device, or publish.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ -z "${IMAGE_ROOT:-}" ]]; then
  IMAGE_ROOT="$ROOT/image"
elif [[ "$IMAGE_ROOT" != /* ]]; then
  IMAGE_ROOT="$ROOT/$IMAGE_ROOT"
fi

declare -A MANIFEST=()
UBUNTU_ROWS=()
GALION_ROWS=()
PAYLOAD_ROWS=()
REQUIRED_KEYS=(
  name profile version git openmind research base arch node node_path
  init init_status weights root unattended_upgrades publish
  console_user console_port research_port research_command one_url
  browser silence_file boot_tone
)

SHOW_HELP=0
MODE_DRY=0
MODE_BUILD=0
MODE_FLASH=0
MODE_PUBLISH=0
ALLOW_IMAGE=0
ALLOW_FLASH=0
FLASH_DEVICE=""
MODE_LABEL="dry-run"
GIT_SHA=""

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

stop() {
  printf 'refused: %s\n' "$*"
  printf 'result: no image was built. no device was flashed. nothing was published.\n'
  exit 2
}

usage() {
  cat <<'EOF'
Usage: scripts/image/dry-run.sh [--dry-run]
       scripts/image/dry-run.sh --build [--allow-real-image]
       scripts/image/dry-run.sh --flash [DEVICE] [--allow-real-flash]
       scripts/image/dry-run.sh --publish|--upload|--gh-release

The default is a dry run. It reads image/MANIFEST.txt and image/packages
and prints the Ubuntu 26.04 plan. It does not install packages.

--build writes nothing unless --allow-real-image is also set. With that
flag the build is still refused while galion-init, galion-voiced, and
galion-probe are planned. --flash is the same, with --allow-real-flash.
Environment variables do not authorize either action.

--publish, --upload, and --gh-release always exit 2.

Exit 0 is a dry run. Exit 2 is a refusal. Exit 1 is a bad manifest or
package list. Nothing is published.
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help|-h)
        SHOW_HELP=1
        ;;
      --dry-run)
        MODE_DRY=1
        ;;
      --build)
        MODE_BUILD=1
        ;;
      --allow-real-image)
        ALLOW_IMAGE=1
        ;;
      --allow-real-flash)
        ALLOW_FLASH=1
        ;;
      --flash)
        MODE_FLASH=1
        if [[ $# -ge 2 && "$2" != --* ]]; then
          FLASH_DEVICE="$2"
          shift
        fi
        ;;
      --publish|--upload|--gh-release)
        MODE_PUBLISH=1
        ;;
      *)
        stop "unknown argument: $1"
        ;;
    esac
    shift
  done
}

expect_value() {
  local key="$1"
  local want="$2"
  if [[ "${MANIFEST[$key]}" != "$want" ]]; then
    die "manifest ${key} is '${MANIFEST[$key]}'; the skeleton requires '${want}'"
  fi
}

load_manifest() {
  local file="$IMAGE_ROOT/MANIFEST.txt"
  local line key value n=0
  local -A allowed=()
  [[ -f "$file" ]] || die "missing manifest: $file"
  for key in "${REQUIRED_KEYS[@]}"; do
    allowed[$key]=1
  done
  while IFS= read -r line || [[ -n "$line" ]]; do
    n=$((n + 1))
    if [[ "$line" == *$'\r'* ]]; then
      die "$file:$n: carriage return"
    fi
    if [[ -z "${line//[[:space:]]/}" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    if [[ "$line" != *=* ]]; then
      die "$file:$n: expected key=value"
    fi
    key="${line%%=*}"
    value="${line#*=}"
    if [[ ! "$key" =~ ^[a-z0-9_]+$ ]]; then
      die "$file:$n: bad key"
    fi
    if [[ -z "$value" ]]; then
      die "$file:$n: empty value"
    fi
    if [[ -z "${allowed[$key]+x}" ]]; then
      die "$file:$n: unknown manifest key: $key"
    fi
    if [[ -n "${MANIFEST[$key]+x}" ]]; then
      die "$file:$n: duplicate key $key"
    fi
    MANIFEST[$key]="$value"
  done < "$file"
  for key in "${REQUIRED_KEYS[@]}"; do
    if [[ -z "${MANIFEST[$key]+x}" ]]; then
      die "manifest missing $key"
    fi
  done
  expect_value name galion-os
  expect_value profile desktop
  expect_value version none
  expect_value git filled-by-dry-run
  expect_value openmind de7480e71ce98191d2ee11f018fa15be6c5a1707
  expect_value research ed3ce9993f58ec655af4f23c2438eb83cd7ea844
  expect_value base ubuntu-26.04
  expect_value arch x86_64
  expect_value node 22.22.1
  expect_value node_path /usr/bin/node
  expect_value init galion-init
  expect_value init_status planned
  expect_value weights none
  expect_value root squashfs
  expect_value unattended_upgrades off
  expect_value publish off
  expect_value console_user galion
  expect_value console_port 18181
  expect_value research_port 8787
  expect_value research_command "/usr/bin/node src/server.js"
  expect_value one_url console-one-on-18181
  expect_value browser none
  expect_value silence_file none
  expect_value boot_tone planned
  if [[ ! "${MANIFEST[openmind]}" =~ ^[0-9a-f]{40}$ ]]; then
    die "openmind pin is not a full commit"
  fi
  if [[ ! "${MANIFEST[research]}" =~ ^[0-9a-f]{40}$ ]]; then
    die "research pin is not a full commit"
  fi
}

require_note() {
  local name="$1"
  local note="$2"
  if [[ -z "${note//[[:space:]]/}" ]]; then
    die "${name} note is empty"
  fi
}

append_row() {
  case "$1" in
    ubuntu) UBUNTU_ROWS+=("$2") ;;
    galion) GALION_ROWS+=("$2") ;;
    payloads) PAYLOAD_ROWS+=("$2") ;;
    *) die "internal: unknown package list" ;;
  esac
}

load_list() {
  local which="$1"
  local file="$2"
  local exact="$3"
  local line status n=0
  local -a fields=()
  [[ -f "$file" ]] || die "missing package list: $file"
  while IFS= read -r line || [[ -n "$line" ]]; do
    n=$((n + 1))
    if [[ "$line" == *$'\r'* ]]; then
      die "$file:$n: carriage return"
    fi
    if [[ -z "${line//[[:space:]]/}" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    if [[ "$line" != *$'\t'* ]]; then
      die "$file:$n: expected tab-separated fields"
    fi
    IFS=$'\t' read -r -a fields <<< "$line"
    if [[ "${#fields[@]}" -ne "$exact" ]]; then
      die "$file:$n: expected $exact fields, found ${#fields[@]}"
    fi
    local field
    for field in "${fields[@]}"; do
      if [[ -z "$field" ]]; then
        die "$file:$n: empty field"
      fi
    done
    status="${fields[0]}"
    if [[ "$status" == "built" ]]; then
      die "$file:$n: status built is not allowed (${fields[1]}). galion-init, galion-voiced, and galion-probe stay planned until they exist"
    fi
    append_row "$which" "$line"
  done < "$file"
}

validate_ubuntu() {
  local -A expect_status=(
    [nodejs]=included
    [unattended-upgrades]=excluded
    [kernel]=unnamed
    [firmware]=unnamed
  )
  local -A seen=()
  local line status name note want
  local -a fields=()
  if [[ "${#UBUNTU_ROWS[@]}" -ne 4 ]]; then
    die "ubuntu-26.04.list must name exactly nodejs, unattended-upgrades, kernel, and firmware"
  fi
  for line in "${UBUNTU_ROWS[@]}"; do
    IFS=$'\t' read -r status name note <<< "$line"
    if [[ -z "${expect_status[$name]+x}" ]]; then
      die "ubuntu-26.04.list names ${name}, which this skeleton does not"
    fi
    want="${expect_status[$name]}"
    if [[ "$status" != "$want" ]]; then
      die "${name} status is ${status}; the skeleton requires ${want}"
    fi
    require_note "$name" "$note"
    if [[ -n "${seen[$name]+x}" ]]; then
      die "duplicate ubuntu package ${name}"
    fi
    seen[$name]=1
  done
  for name in nodejs unattended-upgrades kernel firmware; do
    if [[ -z "${seen[$name]+x}" ]]; then
      die "ubuntu-26.04.list is missing ${name}"
    fi
  done
}

validate_galion() {
  local -A seen=()
  local line status name image note
  if [[ "${#GALION_ROWS[@]}" -ne 3 ]]; then
    die "galion-planned.list must name exactly galion-init, galion-voiced, and galion-probe"
  fi
  for line in "${GALION_ROWS[@]}"; do
    IFS=$'\t' read -r status name image note <<< "$line"
    if [[ "$status" != "planned" ]]; then
      die "${name} status is ${status}; this skeleton accepts only planned"
    fi
    require_note "$name" "$note"
    case "$name" in
      galion-init)
        if [[ "$image" != "desktop" ]]; then
          die "galion-init is the desktop PID 1 and the list marks it ${image}"
        fi
        ;;
      galion-voiced|galion-probe)
        if [[ "$image" != "voice" ]]; then
          die "${name} stays on the voice image; the list marks it ${image}"
        fi
        ;;
      *)
        die "unknown galion program: ${name}"
        ;;
    esac
    if [[ -n "${seen[$name]+x}" ]]; then
      die "duplicate galion program ${name}"
    fi
    seen[$name]=1
  done
  for name in galion-init galion-voiced galion-probe; do
    if [[ -z "${seen[$name]+x}" ]]; then
      die "galion-planned.list is missing ${name}"
    fi
  done
}

validate_payloads() {
  local -A expect_pin=(
    [openmind-desktop]="${MANIFEST[openmind]}"
    [site-one]=this-repository
    [site-research]=this-repository
    [hermes-research]="${MANIFEST[research]}"
  )
  local -A expect_path=(
    [openmind-desktop]=/opt/galion/openmind-desktop/openmind-desktop
    [site-one]=/opt/galion/site/one/
    [site-research]=/opt/galion/site/research/
    [hermes-research]=/opt/galion/research/current/
  )
  local -A seen=()
  local line status name pin path note
  if [[ "${#PAYLOAD_ROWS[@]}" -ne 4 ]]; then
    die "payloads.list must name the four desktop pieces from the plan"
  fi
  for line in "${PAYLOAD_ROWS[@]}"; do
    IFS=$'\t' read -r status name pin path note <<< "$line"
    if [[ -z "${expect_pin[$name]+x}" ]]; then
      die "payloads.list names ${name}, which this skeleton does not"
    fi
    if [[ "$status" != "planned" ]]; then
      die "${name} status is ${status}; payloads stay planned"
    fi
    if [[ "$pin" != "${expect_pin[$name]}" ]]; then
      die "${name} pin is ${pin}; the skeleton requires ${expect_pin[$name]}"
    fi
    if [[ "$path" != "${expect_path[$name]}" ]]; then
      die "${name} path is ${path}; the skeleton requires ${expect_path[$name]}"
    fi
    require_note "$name" "$note"
    if [[ -n "${seen[$name]+x}" ]]; then
      die "duplicate payload ${name}"
    fi
    seen[$name]=1
  done
  for name in openmind-desktop site-one site-research hermes-research; do
    if [[ -z "${seen[$name]+x}" ]]; then
      die "payloads.list is missing ${name}"
    fi
  done
}

check_tree_files() {
  local license="$ROOT/LICENSE"
  local notice="$ROOT/NOTICE"
  local line=""
  local i=0
  local -a expected=(
    "G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network"
    "Developed and distributed by Galion Labs"
    "Perpetual Open MIT License"
    "Copyright © 2026 Galion Labs. All rights reserved."
  )
  [[ -f "$license" ]] || die "missing LICENSE"
  while IFS= read -r line; do
    if [[ "$line" != "${expected[$i]}" ]]; then
      die "LICENSE line $((i + 1)) does not match the canonical header"
    fi
    i=$((i + 1))
    if [[ "$i" -eq 4 ]]; then
      break
    fi
  done < "$license"
  if [[ "$i" -ne 4 ]]; then
    die "LICENSE is shorter than the canonical header"
  fi
  [[ -f "$notice" ]] || die "missing NOTICE"
  IFS= read -r line < "$notice" || die "NOTICE is empty"
  if [[ "$line" != "The licence is LICENSE." ]]; then
    die "NOTICE must name LICENSE and must not restate it"
  fi
}

resolve_git() {
  if ! command -v git >/dev/null 2>&1; then
    die "git is required to resolve the manifest git field"
  fi
  GIT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
  if [[ ! "$GIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
    die "git rev-parse did not return a full commit"
  fi
}

print_rows() {
  local kind="$1"
  shift
  local line status name rest extra
  printf '%s\n' "$kind"
  for line in "$@"; do
    status="${line%%$'\t'*}"
    rest="${line#*$'\t'}"
    name="${rest%%$'\t'*}"
    if [[ "$kind" == "ubuntu-26.04 packages:" ]]; then
      case "$status" in
        included) extra="not-installed" ;;
        excluded) extra="kept-off" ;;
        unnamed) extra="package-unnamed" ;;
        *) extra="$status" ;;
      esac
    else
      extra="not-built"
      case "$name" in
        galion-init) extra="not-built required-before-boot" ;;
        galion-voiced|galion-probe) extra="not-built off-desktop-image" ;;
      esac
    fi
    printf '  %s\t%s\t%s\n' "$status" "$name" "$extra"
  done
}

print_context() {
  local line status name pin path
  printf 'galion-os image dry run\n'
  printf 'mode: %s\n' "$MODE_LABEL"
  printf 'base: %s\n' "${MANIFEST[base]}"
  printf 'arch: %s\n' "${MANIFEST[arch]}"
  printf 'profile: %s\n' "${MANIFEST[profile]}"
  printf 'name: %s\n' "${MANIFEST[name]}"
  printf 'version: %s\n' "${MANIFEST[version]}"
  printf 'git: %s\n' "$GIT_SHA"
  printf 'openmind: %s\n' "${MANIFEST[openmind]}"
  printf 'research: %s\n' "${MANIFEST[research]}"
  printf 'node: %s\n' "${MANIFEST[node]}"
  printf 'node_path: %s\n' "${MANIFEST[node_path]}"
  printf 'init: %s\n' "${MANIFEST[init]}"
  printf 'init_status: %s\n' "${MANIFEST[init_status]}"
  printf 'weights: %s\n' "${MANIFEST[weights]}"
  printf 'root: %s\n' "${MANIFEST[root]}"
  printf 'unattended_upgrades: %s\n' "${MANIFEST[unattended_upgrades]}"
  printf 'publish: %s\n' "${MANIFEST[publish]}"
  printf 'console_user: %s\n' "${MANIFEST[console_user]}"
  printf 'console_port: %s\n' "${MANIFEST[console_port]}"
  printf 'research_port: %s\n' "${MANIFEST[research_port]}"
  printf 'research_command: %s\n' "${MANIFEST[research_command]}"
  printf 'one_url: %s\n' "${MANIFEST[one_url]}"
  printf 'browser: %s\n' "${MANIFEST[browser]}"
  printf 'silence_file: %s\n' "${MANIFEST[silence_file]}"
  printf 'boot_tone: %s\n' "${MANIFEST[boot_tone]}"
  printf 'notice: The licence is LICENSE.\n'
  printf 'host_packages_installed: no\n'
  print_rows "ubuntu-26.04 packages:" "${UBUNTU_ROWS[@]}"
  print_rows "galion programs:" "${GALION_ROWS[@]}"
  printf 'payloads:\n'
  for line in "${PAYLOAD_ROWS[@]}"; do
    IFS=$'\t' read -r status name pin path _ <<< "$line"
    printf '  %s\t%s\t%s\t%s\tnot-built\n' "$status" "$name" "$pin" "$path"
  done
  printf 'image files not written:\n'
  printf '  galion-os-<untagged>-x86_64.iso\n'
  printf '  galion-os-<untagged>-x86_64.img\n'
}

apply_mode() {
  local device_note="no device path was given"
  if [[ "$MODE_PUBLISH" -eq 1 ]]; then
    MODE_LABEL="publish"
    print_context
    stop "--publish, --upload, and --gh-release are not implemented. Nothing was published."
  fi
  if [[ "$MODE_BUILD" -eq 1 && "$ALLOW_IMAGE" -ne 1 ]]; then
    MODE_LABEL="build"
    print_context
    stop "--build writes a real image and needs the explicit flag --allow-real-image. No image was written. Nothing was published."
  fi
  if [[ "$MODE_BUILD" -eq 1 && "$ALLOW_IMAGE" -eq 1 ]]; then
    MODE_LABEL="build"
    print_context
    stop "--allow-real-image was set. The build is still refused because galion-init, galion-voiced, and galion-probe are planned, not built. This skeleton does not run debootstrap, xorriso, apt, or mksquashfs. No image was written. Nothing was published."
  fi
  if [[ -n "$FLASH_DEVICE" ]]; then
    device_note="device $(printf '%q' "$FLASH_DEVICE")"
  fi
  if [[ "$MODE_FLASH" -eq 1 && "$ALLOW_FLASH" -ne 1 ]]; then
    MODE_LABEL="flash"
    print_context
    stop "--flash writes a device (${device_note}) and needs the explicit flag --allow-real-flash. No device was written. Nothing was published."
  fi
  if [[ "$MODE_FLASH" -eq 1 && "$ALLOW_FLASH" -eq 1 ]]; then
    MODE_LABEL="flash"
    print_context
    stop "--allow-real-flash was set (${device_note}). The flash is still refused because this skeleton has no image file and does not write block devices. No device was written. Nothing was published."
  fi
  if [[ "$ALLOW_IMAGE" -eq 1 ]]; then
    MODE_LABEL="build"
    print_context
    stop "--allow-real-image does nothing unless --build is also set. No image was written. Nothing was published."
  fi
  if [[ "$ALLOW_FLASH" -eq 1 ]]; then
    MODE_LABEL="flash"
    print_context
    stop "--allow-real-flash does nothing unless --flash is also set. No device was written. Nothing was published."
  fi
  MODE_LABEL="dry-run"
  if [[ "$MODE_DRY" -eq 1 || "$MODE_BUILD" -eq 0 ]]; then
    print_context
    printf 'result: dry run only. no image was built. no device was flashed. nothing was published.\n'
    exit 0
  fi
  stop "no image mode was selected. Nothing was published."
}

main() {
  parse_args "$@"
  if [[ "$SHOW_HELP" -eq 1 ]]; then
    if [[ "$MODE_BUILD" -eq 1 || "$MODE_FLASH" -eq 1 || "$MODE_PUBLISH" -eq 1 || "$ALLOW_IMAGE" -eq 1 || "$ALLOW_FLASH" -eq 1 ]]; then
      stop "--help cannot be combined with a build, flash, or publish request"
    fi
    usage
    exit 0
  fi
  if [[ -n "$FLASH_DEVICE" && "$FLASH_DEVICE" == *$'\n'* ]]; then
    stop "device argument contains a newline. No device was written."
  fi
  load_manifest
  load_list ubuntu "$IMAGE_ROOT/packages/ubuntu-26.04.list" 3
  load_list galion "$IMAGE_ROOT/packages/galion-planned.list" 4
  load_list payloads "$IMAGE_ROOT/packages/payloads.list" 5
  validate_ubuntu
  validate_galion
  validate_payloads
  check_tree_files
  resolve_git
  apply_mode
}

main "$@"
