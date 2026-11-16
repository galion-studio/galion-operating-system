#!/bin/sh
# Runs inside the arm64 Bookworm guest, as root, after the OS seed install.
# Installs the research seed and the openmind-desktop binary, then writes
# pi5-health-table.txt. The guest has no NIC. This script does not fetch.

set -eu

EXTRA=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
LOG=/tmp/pi5-boot-logs
mkdir -p "$LOG" "$LOG/facts/unit" "$LOG/facts/http"
FACTS=$LOG/facts

os_field() {
  sed -n "s/^$1=//p" /etc/os-release | head -n 1 | tr -d '"'
}

has_default_route() {
  found=0
  while read -r iface dest _rest; do
    [ "$iface" = Iface ] && continue
    if [ "$dest" = 00000000 ] && [ "$iface" != lo ]; then
      found=1
    fi
  done < /proc/net/route
  [ "$found" -eq 1 ]
}

environment_kind() {
  if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then
    printf '%s\n' emulator
    return
  fi
  if [ -r /proc/device-tree/model ] && tr -d '\000\n' < /proc/device-tree/model | grep -q 'Raspberry Pi'; then
    printf '%s\n' raspberry-pi
    return
  fi
  virt=$(systemd-detect-virt 2>/dev/null || true)
  case "$virt" in
    qemu|kvm|docker|podman|container|systemd-nspawn|lxc|lxc-libvirt|wsl|bochs|uml|bhyve|qnx|acrn)
      printf '%s\n' emulator
      ;;
    *)
      printf '%s\n' other
      ;;
  esac
}

write_meta() {
  {
    printf 'MACHINE=%s\n' "$(uname -m)"
    printf 'OS_CODENAME=%s\n' "$(os_field VERSION_CODENAME)"
    if has_default_route; then
      printf 'NETWORK=%s\n' default-route
    else
      printf 'NETWORK=%s\n' no-default-route
    fi
    printf 'ENVIRONMENT=%s\n' "$(environment_kind)"
    if [ -f "$EXTRA/meta.env" ]; then
      cat "$EXTRA/meta.env"
    fi
  } >"$FACTS/meta.env"
}

record_unit() {
  name=$1
  systemctl show \
    -p ActiveState -p SubState -p Result -p Type -p RemainAfterExit \
    -- "$name" >"$FACTS/unit/$name" 2>/dev/null || true
}

http_get() {
  host=$1
  port=$2
  path=$3
  out=$4
  if ! command -v bash >/dev/null 2>&1; then
    printf 'error: bash is not installed\n' >"$out"
    return
  fi
  set +e
  timeout 8 bash -c '
    host=$1
    port=$2
    path=$3
    out=$4
    if ! exec 3<>"/dev/tcp/${host}/${port}"; then
      printf "error: connection refused\n" >"$out"
      exit 1
    fi
    printf "GET %s HTTP/1.1\r\nHost: %s:%s\r\nConnection: close\r\n\r\n" \
      "$path" "$host" "$port" >&3
    cat <&3 >"$out"
  ' bash "$host" "$port" "$path" "$out"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ] && [ ! -s "$out" ]; then
    printf 'error: no response\n' >"$out"
  fi
}

wait_port() {
  port=$1
  n=0
  while [ "$n" -lt 30 ]; do
    if bash -c "exec 3<>/dev/tcp/127.0.0.1/$port" 2>/dev/null; then
      return 0
    fi
    n=$((n + 1))
    sleep 1
  done
  return 1
}

start_unit() {
  name=$1
  systemctl daemon-reload || true
  systemctl enable "$name" || true
  systemctl start "$name" || true
}

write_meta

if [ -f "$EXTRA/need-ldconfig" ]; then
  ldconfig || true
fi

if id galion >/dev/null 2>&1; then
  have_user=1
else
  have_user=0
  printf 'symphony: user galion is missing\n' >"$LOG/pi5-symphony-status.txt"
fi

stage=$(mktemp -d)
if tar -xzf "$EXTRA/research-pi5-seed.tar.gz" -C "$stage" \
  && (cd "$stage" && sha256sum -c SHA256SUMS); then
  sha=$(sed -n 's/^RESEARCH_SHA=//p' "$FACTS/meta.env" | head -n 1)
  if [ -n "$sha" ] && [ -f "$stage/galion-research-linux-arm64" ] \
    && [ -f "$stage/galion-research-pi5.service" ]; then
    dest=/opt/galion/research/release/$sha
    mkdir -p "$dest"
    install -m 0755 "$stage/galion-research-linux-arm64" "$dest/galion-research"
    install -m 0644 "$stage/LICENSE" "$dest/LICENSE"
    install -m 0644 "$stage/SHA256SUMS" "$dest/SHA256SUMS"
    ln -sfn "$dest" /opt/galion/research/current
    install -m 0644 "$stage/galion-research-pi5.service" \
      /etc/systemd/system/galion-research-pi5.service
    if [ "$have_user" = 1 ]; then
      start_unit galion-research-pi5.service
    fi
  else
    printf 'error: research archive is incomplete\n' >"$FACTS/http/research"
  fi
else
  printf 'error: research archive failed checksum\n' >"$FACTS/http/research"
fi
rm -rf "$stage"

if [ -x "$EXTRA/openmind-desktop" ] && [ -f "$EXTRA/openmind-desktop.service" ]; then
  mkdir -p /opt/galion/openmind-desktop
  install -m 0755 "$EXTRA/openmind-desktop" /opt/galion/openmind-desktop/openmind-desktop
  install -m 0644 "$EXTRA/openmind-desktop.service" \
    /etc/systemd/system/openmind-desktop.service
  if [ "$have_user" = 1 ]; then
    start_unit openmind-desktop.service
  fi
else
  printf 'error: openmind-desktop binary is missing\n' >"$FACTS/http/desktop-root"
fi

wait_port 8787 || true
wait_port 18181 || true
if [ ! -s "$FACTS/http/research" ]; then
  http_get 127.0.0.1 8787 /health "$FACTS/http/research"
fi
if [ ! -s "$FACTS/http/desktop-root" ]; then
  http_get 127.0.0.1 18181 / "$FACTS/http/desktop-root"
fi
http_get 127.0.0.1 18181 /probes "$FACTS/http/desktop-probes"

record_unit galion-init.service
record_unit galion-os.target
record_unit galion-research-pi5.service
record_unit openmind-desktop.service

{
  printf '----- galion-research-pi5 -----\n'
  systemctl status --no-pager --full galion-research-pi5.service || true
  printf '----- openmind-desktop -----\n'
  systemctl status --no-pager --full openmind-desktop.service || true
} >"$LOG/pi5-symphony-status.txt" 2>&1 || true

set +e
sh "$EXTRA/health-table.sh" "$FACTS" >"$LOG/pi5-health-table.txt"
rc=$?
set -e
cat "$LOG/pi5-health-table.txt"
exit "$rc"
