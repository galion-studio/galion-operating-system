#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Print a PASS/FAIL table for each Galion unit on this machine.
# Run it on a Raspberry Pi after the seed's install.sh. The same script
# runs inside the arm64 Debian Bookworm emulator. The table says which
# machine it read. An emulator row is not a Raspberry Pi 5 result.
#
# Exit 0 when every Galion unit passes. Exit 1 when any unit fails.
# Exit 2 when systemctl cannot be run.
#
# GALION_UNIT_TIMEOUT   seconds to wait (default 90)
# GALION_NO_START       set to 1 to skip systemctl start
# GALION_EXPECTATIONS   optional file of documented states
# SYSTEMCTL             systemctl binary (tests set this)
# GALION_PROC           proc tree for the device-tree model (default /proc)
# GALION_VIRT           if set, including empty, used instead of systemd-detect-virt
# GALION_ROOT           root for /.dockerenv and /run/.containerenv (default /)
# Leave those three unset on a board. The offline test sets them.

set -eu

TIMEOUT=${GALION_UNIT_TIMEOUT:-90}
SYSTEMCTL=${SYSTEMCTL:-systemctl}
START=1
if [ "${GALION_NO_START:-0}" = 1 ]; then
  START=0
fi

HONESTY='An emulator, container, or QEMU result is not a Raspberry Pi 5 result.'

die() {
  printf 'error: %s\n' "$1" >&2
  exit 2
}

if ! command -v "$SYSTEMCTL" >/dev/null 2>&1; then
  die "systemctl is not available ($SYSTEMCTL)"
fi

case "$TIMEOUT" in
  ''|*[!0-9]*) die "GALION_UNIT_TIMEOUT must be a number of seconds" ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
TAB=$(printf '\t')
units=$tmp/units
snap=$tmp/snap
: >"$units"

is_galion_unit() {
  case "$1" in
    galion-*.service|galion-*.target|galion-*.socket|galion-*.timer|galion-*.path|galion-*.mount|galion-*.slice)
      return 0
      ;;
  esac
  return 1
}

add_unit() {
  name=$1
  is_galion_unit "$name" || return 0
  printf '%s\n' "$name" >>"$units"
}

sc() {
  "$SYSTEMCTL" "$@"
}

set +e
sc list-unit-files --no-legend --no-pager 'galion-*' >"$tmp/list" 2>"$tmp/list.err"
list_rc=$?
set -e
if [ "$list_rc" -gt 1 ]; then
  detail=$(head -n 1 "$tmp/list.err" | tr -d '\r')
  if [ -n "$detail" ]; then
    die "systemctl list-unit-files failed: $detail"
  fi
  die "systemctl list-unit-files failed (exit $list_rc)"
fi
while read -r name _rest; do
  [ -n "$name" ] || continue
  add_unit "$name"
done <"$tmp/list"

set +e
sc list-dependencies galion-os.target --all --plain --no-pager >"$tmp/deps" 2>/dev/null
dep_rc=$?
set -e
if [ "$dep_rc" -le 1 ]; then
  while read -r line; do
    name=$(printf '%s\n' "$line" | sed 's/^[^A-Za-z0-9]*//')
    [ -n "$name" ] || continue
    add_unit "$name"
  done <"$tmp/deps"
fi

for dir in /etc/systemd/system /run/systemd/system /usr/lib/systemd/system /lib/systemd/system; do
  [ -d "$dir" ] || continue
  for path in "$dir"/galion-*; do
    [ -f "$path" ] || continue
    add_unit "$(basename "$path")"
  done
done

add_unit galion-os.target

if [ -n "${GALION_EXPECTATIONS:-}" ]; then
  [ -f "$GALION_EXPECTATIONS" ] || die "GALION_EXPECTATIONS is not a file"
  cp "$GALION_EXPECTATIONS" "$tmp/expectations"
elif [ -f /opt/galion/etc/unit-expectations ]; then
  cp /opt/galion/etc/unit-expectations "$tmp/expectations"
else
  : >"$tmp/expectations"
fi

while read -r name active sub _rest; do
  [ -n "${name:-}" ] || continue
  case "$name" in
    \#*) continue ;;
  esac
  if ! is_galion_unit "$name" || [ -z "${active:-}" ] || [ -z "${sub:-}" ]; then
    die "expectations line must be a Galion unit, an active state, and a substate: ${name} ${active:-} ${sub:-}"
  fi
  printf '%s %s\n' "$active" "$sub" >"$tmp/expect.$name"
  add_unit "$name"
done <"$tmp/expectations"

sort -u "$units" >"$tmp/units.sorted"

proc=${GALION_PROC:-/proc}
rootfs=${GALION_ROOT:-/}

detect_virt() {
  if [ -n "${GALION_VIRT+x}" ]; then
    printf '%s\n' "$GALION_VIRT"
    return
  fi
  systemd-detect-virt 2>/dev/null || true
}

read_model() {
  if [ -r "$proc/device-tree/model" ]; then
    tr -d '\000\n' <"$proc/device-tree/model"
  fi
}

cell() {
  if [ -n "${1:-}" ]; then
    printf '%s' "$1"
  else
    printf '%s' '-'
  fi
}

undash() {
  if [ "$1" = - ]; then
    printf ''
  else
    printf '%s' "$1"
  fi
}

environment_kind() {
  if [ -f "$rootfs/.dockerenv" ] || [ -f "$rootfs/run/.containerenv" ]; then
    printf '%s\n' emulator
    return
  fi
  model=$(read_model || true)
  case "$model" in
    *Raspberry\ Pi*)
      printf '%s\n' raspberry-pi
      return
      ;;
  esac
  virt=$(detect_virt)
  case "$virt" in
    qemu|kvm|docker|podman|container|systemd-nspawn|lxc|lxc-libvirt|wsl|bochs|uml|bhyve|qnx|acrn)
      printf '%s\n' emulator
      return
      ;;
  esac
  printf '%s\n' other
}

ENV_KIND=$(environment_kind)
MODEL=$(read_model || true)
[ -n "$MODEL" ] || MODEL='-'
VIRT=$(detect_virt)
[ -n "$VIRT" ] || VIRT='-'
MACHINE=$(uname -m 2>/dev/null || printf '%s' unknown)
if [ "$ENV_KIND" = raspberry-pi ]; then
  CLAIM=device-tree
else
  CLAIM=none
fi

if [ "$START" = 1 ]; then
  if sc start galion-os.target >/dev/null 2>&1; then
    START_LINE='start: ok'
  else
    START_LINE='start: failed'
  fi
else
  START_LINE='start: skipped'
fi

prop() {
  key=$1
  file=$2
  val=$(sed -n "s/^${key}=//p" "$file" | head -n 1)
  printf '%s\n' "$val"
}

comment_expectation() {
  fragment=$1
  unit=$2
  [ -n "$fragment" ] && [ -f "$fragment" ] || return 0
  [ -f "$tmp/expect.$unit" ] && return 0
  line=$(sed -n 's/^#[[:space:]]*GalionExpected:[[:space:]]*//p' "$fragment" | head -n 1)
  [ -n "$line" ] || return 0
  case "$line" in
    */*)
      printf '%s %s\n' "${line%%/*}" "${line#*/}" >"$tmp/expect.$unit"
      ;;
  esac
}

snapshot() {
  : >"$snap"
  while read -r unit; do
    [ -n "$unit" ] || continue
    set +e
    sc show \
      -p LoadState \
      -p ActiveState \
      -p SubState \
      -p Result \
      -p Type \
      -p RemainAfterExit \
      -p FragmentPath \
      -- "$unit" >"$tmp/show" 2>/dev/null
    set -e
    load=$(prop LoadState "$tmp/show")
    active=$(prop ActiveState "$tmp/show")
    sub=$(prop SubState "$tmp/show")
    result=$(prop Result "$tmp/show")
    type=$(prop Type "$tmp/show")
    remain=$(prop RemainAfterExit "$tmp/show")
    fragment=$(prop FragmentPath "$tmp/show")
    comment_expectation "$fragment" "$unit"
    exp_active=
    exp_sub=
    if [ -f "$tmp/expect.$unit" ]; then
      read -r exp_active exp_sub <"$tmp/expect.$unit"
    fi
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$unit" "$(cell "$load")" "$(cell "$active")" "$(cell "$sub")" \
      "$(cell "$result")" "$(cell "$type")" "$(cell "$remain")" \
      "$(cell "$exp_active")" "$(cell "$exp_sub")" >>"$snap"
  done <"$tmp/units.sorted"
}

waiting() {
  active=$1
  case "$active" in
    activating|deactivating|reloading|inactive) return 0 ;;
  esac
  return 1
}

judge() {
  load=$1
  active=$2
  sub=$3
  result=$4
  type=$5
  remain=$6
  exp_active=$7
  exp_sub=$8
  VERDICT=FAIL
  NOTE="after ${TIMEOUT}s: state ${active:-none}/${sub:-none} result ${result:-none}"
  if [ -z "$load" ] || [ "$load" = not-found ]; then
    VERDICT=FAIL
    NOTE=missing
    return
  fi
  if [ -n "$exp_active" ]; then
    if [ "$active" = "$exp_active" ] && { [ "$exp_sub" = '*' ] || [ "$sub" = "$exp_sub" ]; }; then
      VERDICT=PASS
      NOTE='documented state'
      return
    fi
    NOTE="after ${TIMEOUT}s: expected ${exp_active}/${exp_sub}, got ${active:-none}/${sub:-none}"
    return
  fi
  if [ "$active" = active ] && { [ "$result" = success ] || [ -z "$result" ]; }; then
    VERDICT=PASS
    if [ "$type" = oneshot ] && [ "$sub" = exited ] && [ "$remain" = yes ]; then
      NOTE='oneshot dry-run'
    else
      NOTE=active
    fi
  fi
}

ready() {
  while IFS="$TAB" read -r unit load active sub result type remain exp_active exp_sub; do
    [ -n "$unit" ] || continue
    load=$(undash "$load")
    active=$(undash "$active")
    sub=$(undash "$sub")
    result=$(undash "$result")
    type=$(undash "$type")
    remain=$(undash "$remain")
    exp_active=$(undash "$exp_active")
    exp_sub=$(undash "$exp_sub")
    judge "$load" "$active" "$sub" "$result" "$type" "$remain" "$exp_active" "$exp_sub"
    if [ "$VERDICT" = PASS ]; then
      continue
    fi
    if [ -z "$load" ] || [ "$load" = not-found ]; then
      continue
    fi
    if waiting "$active"; then
      return 1
    fi
  done <"$snap"
  return 0
}

deadline=$(( $(date +%s) + TIMEOUT ))
while :; do
  snapshot
  if ready; then
    break
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    break
  fi
  sleep 1
done
snapshot

pass=0
fail=0
printf 'GALION UNIT CHECK\n'
printf 'environment: %s\n' "$ENV_KIND"
printf 'machine: %s\n' "$MACHINE"
printf 'model: %s\n' "$MODEL"
printf 'virt: %s\n' "$VIRT"
printf 'hardware-claim: %s\n' "$CLAIM"
printf 'timeout-seconds: %s\n' "$TIMEOUT"
printf '%s\n' "$START_LINE"
printf 'note: %s\n' "$HONESTY"
printf '\n'
printf '%-36s %-12s %-12s %-12s %-8s %s\n' \
  UNIT ACTIVE SUB RESULT VERDICT NOTE

while IFS="$TAB" read -r unit load active sub result type remain exp_active exp_sub; do
  [ -n "$unit" ] || continue
  load=$(undash "$load")
  active=$(undash "$active")
  sub=$(undash "$sub")
  result=$(undash "$result")
  type=$(undash "$type")
  remain=$(undash "$remain")
  exp_active=$(undash "$exp_active")
  exp_sub=$(undash "$exp_sub")
  judge "$load" "$active" "$sub" "$result" "$type" "$remain" "$exp_active" "$exp_sub"
  show_active=${active:--}
  show_sub=${sub:--}
  show_result=${result:--}
  if [ "$NOTE" = missing ]; then
    show_active='-'
    show_sub='-'
    show_result='-'
  fi
  printf '%-36s %-12s %-12s %-12s %-8s %s\n' \
    "$unit" "$show_active" "$show_sub" "$show_result" "$VERDICT" "$NOTE"
  if [ "$VERDICT" = PASS ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
  fi
done <"$snap"

printf '\n'
printf 'summary: %s PASS, %s FAIL\n' "$pass" "$fail"

if [ "$fail" -ne 0 ]; then
  exit 1
fi
exit 0
