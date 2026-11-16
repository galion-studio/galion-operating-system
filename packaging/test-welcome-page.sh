#!/bin/sh
# Open the welcome page on the loopback interface and check its words.
# The binary under test is whatever path is passed in. A pass here is not
# a Raspberry Pi 5 result.
set -eu

bin=${1:?test-welcome-page: pass the galion-welcome binary}
if [ ! -x "$bin" ]; then
  echo "test-welcome-page: binary missing: $bin" >&2
  exit 1
fi

port=$(python3 -c 'import socket; s=socket.socket(); s.bind(("localhost", 0)); print(s.getsockname()[1]); s.close()')
work=$(mktemp -d)
pid=
cleanup() {
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  rm -rf "$work"
}
trap cleanup EXIT

cat >"$work/systemctl" <<'EOF'
#!/bin/sh
case "$1" in
  list-units)
    printf '%s\n' \
      'galion-os.target loaded active active Galion OS' \
      'galion-init.service loaded active exited Galion OS init plan' \
      'galion-welcome.service loaded active running Galion OS welcome'
    ;;
  list-unit-files)
    printf '%s\n' \
      'galion-os.target enabled enabled' \
      'galion-init.service enabled enabled' \
      'galion-welcome.service enabled enabled'
    ;;
  show)
    printf '%s\n' \
      'Id=openmind-desktop.service' \
      'LoadState=not-found' \
      'ActiveState=inactive' \
      'SubState=dead'
    ;;
  *)
    exit 1
    ;;
esac
exit 0
EOF
chmod 0755 "$work/systemctl"

GALION_WELCOME_PORT="$port" GALION_SYSTEMCTL="$work/systemctl" "$bin" >"$work/out" 2>"$work/err" &
pid=$!

i=0
while [ "$i" -lt 50 ]; do
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "test-welcome-page: server exited" >&2
    cat "$work/err" >&2
    exit 1
  fi
  if grep -q "port $port" "$work/err"; then
    break
  fi
  i=$((i + 1))
  sleep 0.1
done
if ! grep -q "port $port" "$work/err"; then
  echo "test-welcome-page: server did not listen" >&2
  cat "$work/err" >&2
  exit 1
fi

python3 - "$port" <<'PY'
import sys
import urllib.request

port = sys.argv[1]
url = "http://localhost:%s/" % port
with urllib.request.urlopen(url, timeout=3) as res:
    body = res.read().decode("utf-8")
    status = res.status
if status != 200:
    raise SystemExit("status %s" % status)
for word in (
    "Galion OS",
    "Welcome.",
    "Init",
    "Open Mind",
    "Research",
    "Voice",
    "Up",
    "Finished",
    "Not on this machine",
):
    if word not in body:
        raise SystemExit("missing %s" % word)
for banned in ("http://", "https://", "127.0.0.1"):
    if banned in body:
        raise SystemExit("page contains %s" % banned)
print("test-welcome-page: passed on loopback. This is not a Raspberry Pi 5 result.")
PY
