#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Dry run for one Galion OS desktop image. Draft #13 section 7.
# No arguments: print the story and exit 0.
# --execute, --build, --flash, and --publish exit 2.
# This script does not call apt, fetch an image, or run a disc builder.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
PKG="$ROOT/packaging"
MANIFEST="$PKG/MANIFEST.txt"

HELP=0
EXECUTE=0
BUILD=0
FLASH=0
PUBLISH=0
ALLOW_IMAGE=0
ALLOW_FLASH=0
VAL=

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

stop() {
  printf 'refused: %s\n' "$1"
  printf 'result: no image was built. no device was flashed. nothing was published.\n'
  exit 2
}

usage() {
  cat <<'EOF'
Usage: sh packaging/dry-run.sh
       sh packaging/dry-run.sh --execute
       sh packaging/dry-run.sh --build [--allow-real-image]
       sh packaging/dry-run.sh --flash [--allow-real-flash]
       sh packaging/dry-run.sh --publish

The default prints the desktop image story and writes nothing.
--execute, --build, --flash, and --publish exit 2.
EOF
}

parse_args() {
  for arg in "$@"; do
    case $arg in
      --help|-h) HELP=1 ;;
      --dry-run) ;;
      --execute) EXECUTE=1 ;;
      --build) BUILD=1 ;;
      --flash) FLASH=1 ;;
      --publish|--upload|--gh-release) PUBLISH=1 ;;
      --allow-real-image) ALLOW_IMAGE=1 ;;
      --allow-real-flash) ALLOW_FLASH=1 ;;
      *) stop "unknown argument: $arg" ;;
    esac
  done
}

manifest_get() {
  key=$1
  VAL=
  found=0
  while IFS= read -r line || [ -n "$line" ]; do
    case $line in
      ''|'#'*) continue ;;
    esac
    case $line in
      "$key"=*)
        if [ "$found" -eq 1 ]; then
          die "duplicate manifest key $key"
        fi
        VAL=${line#"$key"=}
        found=1
        ;;
    esac
  done < "$MANIFEST"
  if [ "$found" -ne 1 ] || [ -z "$VAL" ]; then
    die "manifest missing $key"
  fi
}

expect() {
  manifest_get "$1"
  if [ "$VAL" != "$2" ]; then
    die "manifest $1 is '$VAL'; the skeleton requires '$2'"
  fi
}

full_commit() {
  printf '%s' "$1" | grep -E -q '^[0-9a-f]{40}$' || die "$2 is not a full commit"
}

read_row() {
  tab=$(printf '\t')
  IFS=$tab read -r f1 f2 f3 f4 f5 <<EOF
$1
EOF
}

scan_file() {
  file=$1
  want=$2
  count=0
  while IFS= read -r line || [ -n "$line" ]; do
    case $line in
      ''|'#'*) continue ;;
    esac
    case $line in
      *$(printf '\r')*) die "$file: carriage return" ;;
    esac
    case $line in
      *$(printf '\t')*) ;;
      *) die "$file: expected tab-separated fields" ;;
    esac
    read_row "$line"
    if [ -z "$f1" ] || [ -z "$f2" ]; then
      die "$file: empty field"
    fi
    if [ "$f1" = "built" ]; then
      die "$file: status built is not allowed ($f2)"
    fi
    count=$((count + 1))
    case $want in
      ubuntu) scan_ubuntu ;;
      init) scan_init ;;
      desktop) scan_desktop ;;
      voice) scan_voice ;;
      *) die "internal list kind" ;;
    esac
  done < "$file"
  COUNT=$count
}

scan_ubuntu() {
  case $f2 in
    nodejs) [ "$f1" = "included" ] || die "nodejs status is $f1" ;;
    unattended-upgrades) [ "$f1" = "excluded" ] || die "unattended-upgrades status is $f1" ;;
    kernel|firmware) [ "$f1" = "unnamed" ] || die "$f2 status is $f1" ;;
    *) die "ubuntu list names $f2, which this skeleton does not" ;;
  esac
  case $SEEN in
    *" $f2 "*) die "duplicate ubuntu package $f2" ;;
  esac
  SEEN="$SEEN $f2 "
}

scan_init() {
  [ "$f2" = "galion-init" ] || die "init list names $f2"
  [ "$f1" = "planned" ] || die "galion-init status is $f1"
  [ "$f3" = "desktop" ] || die "galion-init role is $f3"
  case $SEEN in
    *" galion-init "*) die "duplicate galion-init" ;;
  esac
  SEEN="$SEEN galion-init "
}

scan_desktop() {
  case $f2 in
    galion-voiced|galion-probe)
      die "$f2 is the voice profile and is not a desktop payload"
      ;;
    galion-init)
      die "galion-init is PID 1, not a desktop payload"
      ;;
    openmind-desktop|site-one|site-research|hermes-research) ;;
    *) die "desktop payload list names $f2, which this skeleton does not" ;;
  esac
  [ "$f1" = "planned" ] || die "$f2 status is $f1"
  [ -n "$f5" ] || die "$f2 note is empty"
  case $f2 in
    openmind-desktop)
      [ "$f3" = "$OPENMIND" ] || die "openmind-desktop pin mismatch"
      [ "$f4" = "/opt/galion/openmind-desktop/openmind-desktop" ] || die "openmind-desktop path mismatch"
      ;;
    site-one)
      [ "$f3" = "this-repository" ] || die "site-one pin mismatch"
      [ "$f4" = "/opt/galion/site/one/" ] || die "site-one path mismatch"
      ;;
    site-research)
      [ "$f3" = "this-repository" ] || die "site-research pin mismatch"
      [ "$f4" = "/opt/galion/site/research/" ] || die "site-research path mismatch"
      ;;
    hermes-research)
      [ "$f3" = "$RESEARCH" ] || die "hermes-research pin mismatch"
      [ "$f4" = "/opt/galion/research/current/" ] || die "hermes-research path mismatch"
      ;;
  esac
  case $SEEN in
    *" $f2 "*) die "duplicate payload $f2" ;;
  esac
  SEEN="$SEEN $f2 "
}

scan_voice() {
  case $f2 in
    galion-voiced|galion-probe) ;;
    *) die "voice profile list names $f2" ;;
  esac
  [ "$f1" = "planned" ] || die "$f2 status is $f1"
  [ "$f3" = "voice" ] || die "$f2 profile is $f3"
  case $SEEN in
    *" $f2 "*) die "duplicate voice program $f2" ;;
  esac
  SEEN="$SEEN $f2 "
}

require_seen() {
  case $SEEN in
    *" $1 "*) ;;
    *) die "missing package row $1" ;;
  esac
}

load_lists() {
  SEEN=" "
  scan_file "$PKG/packages/ubuntu-26.04.list" ubuntu
  [ "$COUNT" -eq 4 ] || die "ubuntu list must have four rows"
  require_seen nodejs
  require_seen unattended-upgrades
  require_seen kernel
  require_seen firmware

  SEEN=" "
  scan_file "$PKG/packages/init.list" init
  [ "$COUNT" -eq 1 ] || die "init list must name only galion-init"
  require_seen galion-init

  SEEN=" "
  scan_file "$PKG/packages/desktop-payloads.list" desktop
  [ "$COUNT" -eq 4 ] || die "desktop payload list must have four rows"
  require_seen openmind-desktop
  require_seen site-one
  require_seen site-research
  require_seen hermes-research

  SEEN=" "
  scan_file "$PKG/packages/voice-profile.list" voice
  [ "$COUNT" -eq 2 ] || die "voice profile list must name galion-voiced and galion-probe"
  require_seen galion-voiced
  require_seen galion-probe
}

check_license() {
  if [ -f "$ROOT/NOTICE" ]; then
    notice=$(IFS= read -r line < "$ROOT/NOTICE" && printf '%s' "$line")
    [ "$notice" = "The licence is LICENSE." ] || die "NOTICE must name LICENSE and must not restate it"
    NOTICE_STATE="present: The licence is LICENSE."
  else
    NOTICE_STATE="absent on this tree"
  fi
  expected=$(printf '%s\n' \
    "G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network" \
    "Developed and distributed by Galion Labs" \
    "Perpetual Open MIT License" \
    "Copyright © 2026 Galion Labs. All rights reserved.")
  actual=$(head -n 4 "$ROOT/LICENSE")
  [ "$actual" = "$expected" ] || die "LICENSE header does not match the canonical four lines"
}

print_rows() {
  file=$1
  kind=$2
  printf '%s\n' "$kind"
  while IFS= read -r line || [ -n "$line" ]; do
    case $line in
      ''|'#'*) continue ;;
    esac
    read_row "$line"
    case $kind in
      "ubuntu-26.04 packages:")
        case $f1 in
          included) extra=not-installed ;;
          excluded) extra=kept-off ;;
          unnamed) extra=package-unnamed ;;
          *) extra=$f1 ;;
        esac
        printf '  %s %s %s\n' "$f1" "$f2" "$extra"
        ;;
      "init:")
        printf '  %s %s not-built required-before-boot\n' "$f1" "$f2"
        ;;
      "desktop payloads:")
        printf '  %s %s not-built %s\n' "$f1" "$f2" "$f4"
        ;;
      "other profile:")
        printf '  %s %s not-built off-desktop-image\n' "$f1" "$f2"
        ;;
    esac
  done < "$file"
}

print_story() {
  printf 'galion-os image dry run\n'
  printf 'mode: %s\n' "$MODE_LABEL"
  printf 'story: one desktop image on Ubuntu 26.04. galion-init is PID 1 and is absent. The console is openmind-desktop with no listen address, port 18181. Research is node src/server.js with PORT 8787. Static pages stay files. The handoff at /one is current only while the console and research are alive. The 432 Hz tone is planned and is not played.\n'
  printf 'name: %s\n' "$NAME"
  printf 'profile: %s\n' "$PROFILE"
  printf 'base: %s\n' "$BASE"
  printf 'arch: %s\n' "$ARCH"
  printf 'version: %s\n' "$VERSION"
  printf 'git: %s\n' "$GIT_SHA"
  printf 'node: %s\n' "$NODE"
  printf 'node_path: %s\n' "$NODE_PATH"
  printf 'init: %s\n' "$INIT"
  printf 'init_status: %s\n' "$INIT_STATUS"
  printf 'init_present: no\n'
  printf 'weights: %s\n' "$WEIGHTS"
  printf 'publish: %s\n' "$PUBLISH_VALUE"
  printf 'openmind: %s\n' "$OPENMIND"
  printf 'research: %s\n' "$RESEARCH"
  printf 'console_user: %s\n' "$CONSOLE_USER"
  printf 'console_port: %s\n' "$CONSOLE_PORT"
  printf 'research_port: %s\n' "$RESEARCH_PORT"
  printf 'one_url: %s\n' "$ONE_URL"
  printf 'browser: %s\n' "$BROWSER"
  printf 'silence_file: %s\n' "$SILENCE_FILE"
  printf 'boot_tone: %s\n' "$BOOT_TONE"
  printf 'root: %s\n' "$ROOTFS"
  printf 'unattended_upgrades: %s\n' "$UNATTENDED"
  printf 'notice: %s\n' "$NOTICE_STATE"
  printf 'host_packages_installed: no\n'
  print_rows "$PKG/packages/ubuntu-26.04.list" "ubuntu-26.04 packages:"
  print_rows "$PKG/packages/init.list" "init:"
  print_rows "$PKG/packages/desktop-payloads.list" "desktop payloads:"
  printf 'end desktop payloads\n'
  print_rows "$PKG/packages/voice-profile.list" "other profile:"
  printf 'end other profile\n'
  printf 'image files not written:\n'
  printf '  galion-os-<untagged>-x86_64.iso\n'
  printf '  galion-os-<untagged>-x86_64.img\n'
}

load_all() {
  [ -f "$MANIFEST" ] || die "missing manifest"
  expect name galion-os; NAME=$VAL
  expect profile desktop; PROFILE=$VAL
  expect version none; VERSION=$VAL
  expect git filled-by-dry-run
  expect base ubuntu-26.04; BASE=$VAL
  expect arch x86_64; ARCH=$VAL
  expect node 22.22.1; NODE=$VAL
  expect node_path /usr/bin/node; NODE_PATH=$VAL
  expect init galion-init; INIT=$VAL
  expect init_status planned; INIT_STATUS=$VAL
  expect weights none; WEIGHTS=$VAL
  expect publish off; PUBLISH_VALUE=$VAL
  expect openmind de7480e71ce98191d2ee11f018fa15be6c5a1707; OPENMIND=$VAL
  expect research ed3ce9993f58ec655af4f23c2438eb83cd7ea844; RESEARCH=$VAL
  expect console_user galion; CONSOLE_USER=$VAL
  expect console_port 18181; CONSOLE_PORT=$VAL
  expect research_port 8787; RESEARCH_PORT=$VAL
  expect one_url "http on the IPv4 loopback interface, port 18181, path /one"; ONE_URL=$VAL
  expect browser none; BROWSER=$VAL
  expect silence_file none; SILENCE_FILE=$VAL
  expect boot_tone planned; BOOT_TONE=$VAL
  expect root squashfs; ROOTFS=$VAL
  expect unattended_upgrades off; UNATTENDED=$VAL
  full_commit "$OPENMIND" openmind
  full_commit "$RESEARCH" research
  command -v git >/dev/null 2>&1 || die "git is required to resolve the manifest git field"
  GIT_SHA=$(git -C "$ROOT" rev-parse HEAD)
  full_commit "$GIT_SHA" "git rev-parse"
  load_lists
  check_license
}

refuse_modes() {
  if [ "$PUBLISH" -eq 1 ]; then
    MODE_LABEL=publish
    print_story
    stop "--publish, --upload, and --gh-release are not implemented. Nothing was published."
  fi
  if [ "$EXECUTE" -eq 1 ]; then
    MODE_LABEL=execute
    print_story
    stop "--execute would build or flash a real image. galion-init is planned, not built. No image was written. Nothing was published."
  fi
  if [ "$BUILD" -eq 1 ] && [ "$ALLOW_IMAGE" -ne 1 ]; then
    MODE_LABEL=build
    print_story
    stop "--build writes a real image and needs the explicit flag --allow-real-image. No image was written. Nothing was published."
  fi
  if [ "$BUILD" -eq 1 ] && [ "$ALLOW_IMAGE" -eq 1 ]; then
    MODE_LABEL=build
    print_story
    stop "--allow-real-image was set. The build is still refused because galion-init is planned, not built. galion-voiced and galion-probe stay on the voice profile. This skeleton does not run apt or a disc builder. No image was written. Nothing was published."
  fi
  if [ "$FLASH" -eq 1 ] && [ "$ALLOW_FLASH" -ne 1 ]; then
    MODE_LABEL=flash
    print_story
    stop "--flash writes a device and needs the explicit flag --allow-real-flash. No device was written. Nothing was published."
  fi
  if [ "$FLASH" -eq 1 ] && [ "$ALLOW_FLASH" -eq 1 ]; then
    MODE_LABEL=flash
    print_story
    stop "--allow-real-flash was set. The flash is still refused because this skeleton has no image file and does not write block devices. No device was written. Nothing was published."
  fi
  if [ "$ALLOW_IMAGE" -eq 1 ]; then
    MODE_LABEL=build
    print_story
    stop "--allow-real-image does nothing unless --build is also set. No image was written. Nothing was published."
  fi
  if [ "$ALLOW_FLASH" -eq 1 ]; then
    MODE_LABEL=flash
    print_story
    stop "--allow-real-flash does nothing unless --flash is also set. No device was written. Nothing was published."
  fi
}

main() {
  parse_args "$@"
  if [ "$HELP" -eq 1 ]; then
    if [ "$EXECUTE" -eq 1 ] || [ "$BUILD" -eq 1 ] || [ "$FLASH" -eq 1 ] || [ "$PUBLISH" -eq 1 ]; then
      stop "--help cannot be combined with execute, build, flash, or publish"
    fi
    usage
    exit 0
  fi
  load_all
  refuse_modes
  MODE_LABEL=dry-run
  print_story
  printf 'result: dry run only. no image was built. no device was flashed. nothing was published.\n'
}

main "$@"
