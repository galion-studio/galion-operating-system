#!/bin/sh
# Print one PASS/FAIL table from facts collected in the guest.
#
# Exit 0 when the installed services meet their own checks and the guest
# is the offline arm64 Bookworm emulator. Probe rows stay in the table.
# The guest starts loopback stand-ins for those six rows; a FAIL there does
# not by itself change this exit code. The symphony workflow requires the
# summary to be all PASS. Exit 1 when an installed check fails or the guest
# contract fails. Exit 2 on usage.
#
# A PASS here is an emulator reading. It is not a Raspberry Pi 5 result.

set -eu

if [ "$#" -ne 1 ] || [ ! -d "$1" ]; then
  printf 'usage: health-table.sh <facts-dir>\n' >&2
  exit 2
fi

FACTS=$1
HONESTY='An emulator, container, or QEMU result is not a Raspberry Pi 5 result.'
RESEARCH_BODY='{"ok":true,"service":"galion-research","bind":"127.0.0.1"}'
ROWS=$(mktemp)
trap 'rm -f "$ROWS"' EXIT

meta() {
  key=$1
  file=$FACTS/meta.env
  [ -f "$file" ] || return 0
  sed -n "s/^${key}=//p" "$file" | head -n 1
}

unit_prop() {
  file=$1
  key=$2
  [ -f "$file" ] || return 0
  sed -n "s/^${key}=//p" "$file" | head -n 1
}

one_line() {
  printf '%s' "$1" | tr '\r\n\t' '   ' | sed 's/  */ /g; s/^ //; s/ $//'
}

http_status() {
  file=$1
  [ -f "$file" ] || return 0
  awk 'NR==1 { sub(/\r$/, ""); if ($1 ~ /^HTTP\//) print $2; exit }' "$file"
}

http_body_file() {
  file=$1
  dest=$2
  : >"$dest"
  [ -f "$file" ] || return 0
  awk '
    { sub(/\r$/, "") }
    begun { print; next }
    $0 == "" { begun = 1 }
  ' "$file" >"$dest"
}

qfield() {
  printf '%s\n' "$1" | sed -n "s/.*\"$2\":\"\\([^\"]*\\)\".*/\\1/p" | head -n 1
}

nfield() {
  printf '%s\n' "$1" | sed -n "s/.*\"$2\":\\([A-Za-z0-9]*\\).*/\\1/p" | head -n 1
}

add_row() {
  service=$1
  endpoint=$2
  http=$3
  verdict=$4
  note=$5
  installed=$6
  [ -n "$http" ] || http='-'
  [ -n "$endpoint" ] || endpoint='-'
  note=$(one_line "$note")
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$service" "$endpoint" "$http" "$verdict" "$note" "$installed" >>"$ROWS"
}

judge_init() {
  file=$FACTS/unit/galion-init.service
  active=$(unit_prop "$file" ActiveState)
  sub=$(unit_prop "$file" SubState)
  result=$(unit_prop "$file" Result)
  type=$(unit_prop "$file" Type)
  remain=$(unit_prop "$file" RemainAfterExit)
  if [ "$active" = active ] && [ "$sub" = exited ] && [ "$type" = oneshot ] \
    && [ "$remain" = yes ] && { [ "$result" = success ] || [ -z "$result" ]; }; then
    add_row galion-init.service '(no HTTP health endpoint)' '-' PASS \
      'no HTTP health endpoint; oneshot dry-run' yes
  else
    add_row galion-init.service '(no HTTP health endpoint)' '-' FAIL \
      "no HTTP health endpoint; state ${active:-none}/${sub:-none} result ${result:-none}" yes
  fi
}

judge_target() {
  file=$FACTS/unit/galion-os.target
  active=$(unit_prop "$file" ActiveState)
  sub=$(unit_prop "$file" SubState)
  result=$(unit_prop "$file" Result)
  if [ "$active" = active ] && [ "$sub" = active ] \
    && { [ "$result" = success ] || [ -z "$result" ]; }; then
    add_row galion-os.target '(no HTTP health endpoint)' '-' PASS \
      'no HTTP health endpoint; active' yes
  else
    add_row galion-os.target '(no HTTP health endpoint)' '-' FAIL \
      "no HTTP health endpoint; state ${active:-none}/${sub:-none} result ${result:-none}" yes
  fi
}

judge_research() {
  file=$FACTS/http/research
  status=$(http_status "$file")
  body_file=$(mktemp)
  if [ -n "$status" ]; then
    http_body_file "$file" "$body_file"
  elif [ -f "$file" ]; then
    head -n 1 "$file" >"$body_file"
  fi
  body=$(tr -d '\r' <"$body_file" | sed 's/[[:space:]]*$//')
  rm -f "$body_file"
  unit=$FACTS/unit/galion-research-pi5.service
  ustate=$(unit_prop "$unit" ActiveState)
  usub=$(unit_prop "$unit" SubState)
  endpoint='http://127.0.0.1:8787/health'
  if [ "$status" = 200 ] && [ "$body" = "$RESEARCH_BODY" ]; then
    add_row galion-research "$endpoint" 200 PASS \
      "body matches galion-research; unit ${ustate:-none}/${usub:-none}" yes
  else
    add_row galion-research "$endpoint" "${status:--}" FAIL \
      "wanted the galion-research health body; got ${body:-none}; unit ${ustate:-none}/${usub:-none}" yes
  fi
}

judge_desktop_root() {
  file=$FACTS/http/desktop-root
  status=$(http_status "$file")
  body_file=$(mktemp)
  http_body_file "$file" "$body_file"
  endpoint='http://127.0.0.1:18181/'
  if [ "$status" = 200 ] && grep -q 'data-desktop="control-console"' "$body_file"; then
    add_row openmind-desktop "$endpoint" 200 PASS 'control console' yes
  else
    add_row openmind-desktop "$endpoint" "${status:--}" FAIL \
      'GET / did not return the control console' yes
  fi
  rm -f "$body_file"
}

judge_probes() {
  file=$FACTS/http/desktop-probes
  status=$(http_status "$file")
  body_file=$(mktemp)
  http_body_file "$file" "$body_file"
  body=$(tr -d '\r\n' <"$body_file")
  rm -f "$body_file"
  endpoint='http://127.0.0.1:18181/probes'
  if [ "$status" != 200 ] || ! printf '%s' "$body" | grep -q '"read_only":true'; then
    add_row openmind-desktop "$endpoint" "${status:--}" FAIL \
      'GET /probes did not return the read-only report' yes
    return
  fi
  add_row openmind-desktop "$endpoint" 200 PASS 'probe report' yes
  lines=$(mktemp)
  printf '%s' "$body" | tr '{' '\n' | grep '"service"' >"$lines" || true
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    service=$(qfield "$line" service)
    state=$(qfield "$line" state)
    host=$(qfield "$line" host)
    path=$(qfield "$line" path)
    detail=$(qfield "$line" detail)
    port=$(nfield "$line" port)
    code=$(nfield "$line" http_status)
    [ -n "$service" ] || service='?'
    if [ -n "$host" ] && [ -n "$port" ] && [ -n "$path" ]; then
      probe_url="http://${host}:${port}${path}"
    else
      probe_url='-'
    fi
    if [ "$state" = up ] && [ -n "$code" ] && [ "$code" != null ]; then
      verdict=PASS
    else
      verdict=FAIL
    fi
    [ -n "$code" ] && [ "$code" != null ] || code='-'
    note="state ${state:-none}"
    [ -n "$detail" ] && note="$note; $detail"
    add_row "$service" "$probe_url" "$code" "$verdict" "$note" no
  done <"$lines"
  rm -f "$lines"
}

machine=$(meta MACHINE)
codename=$(meta OS_CODENAME)
network=$(meta NETWORK)
environment=$(meta ENVIRONMENT)
os_sha=$(meta OS_SHA)
research_sha=$(meta RESEARCH_SHA)
desktop_sha=$(meta DESKTOP_SHA)

printf 'GALION HEALTH CHECK\n'
printf 'environment: %s\n' "${environment:-unknown}"
printf 'machine: %s\n' "${machine:-unknown}"
printf 'os-codename: %s\n' "${codename:-unknown}"
printf 'network: %s\n' "${network:-unknown}"
if [ "$environment" = raspberry-pi ]; then
  printf 'hardware-claim: device-tree\n'
else
  printf 'hardware-claim: none\n'
fi
printf 'os-commit: %s\n' "$os_sha"
printf 'research-commit: %s\n' "$research_sha"
printf 'research-source: %s\n' "$(meta RESEARCH_SOURCE)"
printf 'desktop-commit: %s\n' "$desktop_sha"
printf 'desktop-source: %s\n' "$(meta DESKTOP_SOURCE)"
printf 'note: %s\n' "$HONESTY"
printf 'note: This table is not a Raspberry Pi 5 result.\n'
if [ "$(meta PROBE_TARGETS)" = stand-in ]; then
  printf 'note: The six probe rows are loopback stand-ins started for this emulator. They are not the Open Mind services.\n'
fi
printf '\n'
printf '%-28s %-42s %-6s %-8s %s\n' SERVICE ENDPOINT HTTP VERDICT NOTE

judge_init
judge_target
judge_research
judge_desktop_root
judge_probes

pass=0
fail=0
installed_pass=0
installed_fail=0
while IFS=$(printf '\t') read -r service endpoint http verdict note installed; do
  [ -n "$service" ] || continue
  printf '%-28s %-42s %-6s %-8s %s\n' \
    "$service" "$endpoint" "$http" "$verdict" "$note"
  if [ "$verdict" = PASS ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
  fi
  if [ "$installed" = yes ]; then
    if [ "$verdict" = PASS ]; then
      installed_pass=$((installed_pass + 1))
    else
      installed_fail=$((installed_fail + 1))
    fi
  fi
done <"$ROWS"

printf '\n'
printf 'summary: %s PASS, %s FAIL\n' "$pass" "$fail"
printf 'installed: %s PASS, %s FAIL\n' "$installed_pass" "$installed_fail"

contract=ok
[ "$machine" = aarch64 ] || contract=failed
[ "$codename" = bookworm ] || contract=failed
[ "$network" = no-default-route ] || contract=failed
[ "$environment" = emulator ] || contract=failed
[ -n "$os_sha" ] || contract=failed
[ -n "$research_sha" ] || contract=failed
[ -n "$desktop_sha" ] || contract=failed
printf 'contract: %s\n' "$contract"

if [ "$contract" != ok ] || [ "$installed_fail" -ne 0 ]; then
  exit 1
fi
exit 0
