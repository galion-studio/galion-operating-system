#!/bin/sh
# Pack the first-boot report and the board report into one dated tarball.
# Hostnames, secret values, and addresses other than loopback are removed
# from the copies inside the archive. The files on disk are left as they are.
#
# A tarball from CI is not a Raspberry Pi 5 result.
#
# Usage: pack-reports.sh <report-dir> [tarball]
# Reads <report-dir>/pi5-first-boot.txt and <report-dir>/pi5-board.txt.
# The default tarball is <report-dir>/pi5-reports-YYYYMMDD.tar.gz.
#
# GALION_PACK_DATE   YYYYMMDD (default: today's UTC date)
# GALION_HOSTNAME    one hostname to remove (default: this machine's name)

set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  printf 'usage: pack-reports.sh <report-dir> [tarball]\n' >&2
  exit 2
fi

dir=$1
if [ ! -d "$dir" ]; then
  printf 'error: %s is not a directory. Save both reports there, then run this script again.\n' "$dir" >&2
  exit 2
fi

boot=$dir/pi5-first-boot.txt
board=$dir/pi5-board.txt
if [ ! -f "$boot" ]; then
  printf 'error: %s is missing. Run sudo sh scripts/pi5/first-boot.sh <seed> %s and then run this script again.\n' "$boot" "$boot" >&2
  exit 1
fi
if [ ! -f "$board" ]; then
  printf 'error: %s is missing. Run sudo sh scripts/pi5/board-report.sh %s and then run this script again.\n' "$board" "$board" >&2
  exit 1
fi

if [ -n "${GALION_PACK_DATE:-}" ]; then
  day=$GALION_PACK_DATE
else
  day=$(date -u +%Y%m%d)
fi
case "$day" in
  [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]) ;;
  *)
    printf 'error: the pack date must be eight digits (YYYYMMDD).\n' >&2
    exit 2
    ;;
esac

tarball=${2:-$dir/pi5-reports-$day.tar.gz}
if [ -d "$tarball" ]; then
  printf 'error: tarball path is a directory: %s\n' "$tarball" >&2
  exit 2
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
names=$tmp/names
: >"$names"

if [ -n "${GALION_HOSTNAME:-}" ]; then
  printf '%s\n' "$GALION_HOSTNAME" >>"$names"
else
  if [ -r /etc/hostname ]; then
    head -n 1 /etc/hostname >>"$names"
  fi
  if command -v hostname >/dev/null 2>&1; then
    hostname >>"$names" 2>/dev/null || true
  fi
fi

redact_file() {
  src=$1
  dest=$2
  awk -v namesfile="$names" '
function keep_name(name) {
  gsub(/^[ \t]+|[ \t]+$/, "", name)
  if (length(name) < 4) return
  if (name == "localhost" || name == "localhost.localdomain") return
  if (name == "[hostname]") return
  if (index(seen, "\n" name "\n") > 0) return
  seen = seen "\n" name "\n"
  names[++count] = name
}
function literal(s,    i, c, out) {
  out = ""
  for (i = 1; i <= length(s); i++) {
    c = substr(s, i, 1)
    if (c ~ /[\[\].\\*^$+?{}|()]/) out = out "\\" c
    else out = out c
  }
  return out
}
function hide_ips(s,    out, ip) {
  out = ""
  while (match(s, /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/)) {
    ip = substr(s, RSTART, RLENGTH)
    out = out substr(s, 1, RSTART - 1)
    if (ip == "127.0.0.1" || ip == "0.0.0.0") out = out ip
    else out = out "[ip]"
    s = substr(s, RSTART + RLENGTH)
  }
  return out s
}
function hide_value(s, label,    keylen, prefix, value) {
  while (match(s, label "[[:space:]]*[:=][[:space:]]*[^[:space:]]+")) {
    keylen = RLENGTH
    prefix = substr(s, RSTART, RLENGTH)
    value = prefix
    sub(/^.*[[:space:]]*[:=][[:space:]]*/, "", value)
    if (value == "[redacted]") break
    sub(/[[:space:]]*[:=][[:space:]]*[^[:space:]]+$/, "", prefix)
    s = substr(s, 1, RSTART - 1) prefix "=[redacted]" substr(s, RSTART + keylen)
  }
  return s
}
function redact(s,    i, name, token) {
  if (s ~ /^ssh-(ed25519|rsa|dss)[[:space:]]/) return "[redacted ssh key]"
  while (match(s, /[Bb]earer[[:space:]]+[^[:space:]]+/)) {
    token = substr(s, RSTART, RLENGTH)
    if (token ~ /\[redacted\]$/) break
    s = substr(s, 1, RSTART - 1) "Bearer [redacted]" substr(s, RSTART + RLENGTH)
  }
  if (match(s, /[Aa]uthorization[[:space:]]*[:=]/) && s !~ /\[redacted\]/) {
    s = substr(s, 1, RSTART - 1) "Authorization=[redacted]"
  }
  s = hide_ips(s)
  s = hide_value(s, "[Pp]ass(word|wd)")
  s = hide_value(s, "[Ss]ecret")
  s = hide_value(s, "[Tt]oken")
  s = hide_value(s, "[Aa]pi[_-]?[Kk]ey")
  for (i = 1; i <= count; i++) {
    name = literal(names[i])
    gsub(name, "[hostname]", s)
  }
  return s
}
BEGIN {
  seen = "\n"
  count = 0
  while ((getline name < namesfile) > 0) keep_name(name)
  close(namesfile)
  hide = 0
}
hide && /-----END / && /PRIVATE KEY-----/ { hide = 0; next }
hide { next }
/-----BEGIN / && /PRIVATE KEY-----/ {
  print "[redacted private key]"
  hide = 1
  next
}
{ print redact($0) }
' "$src" >"$dest"
}

redact_file "$boot" "$tmp/pi5-first-boot.txt"
redact_file "$board" "$tmp/pi5-board.txt"

cat >"$tmp/NOTE.txt" <<'EOF'
GALION PI 5 REPORT BUNDLE
note: This file is not a Raspberry Pi 5 result unless the two reports were written on the board.
note: Hostnames, secret values, and addresses other than loopback were removed before this archive was written.
EOF

tar -czf "$tarball" -C "$tmp" NOTE.txt pi5-first-boot.txt pi5-board.txt
printf '%s\n' "packed: $tarball"
printf '%s\n' 'note: This pack is not a Raspberry Pi 5 result unless the reports were written on the board.'
