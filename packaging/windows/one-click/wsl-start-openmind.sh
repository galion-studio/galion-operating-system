#!/bin/bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
# Galion OS: start OpenMind interfaces inside the existing Ubuntu WSL distro.
# Bind 127.0.0.1 only. Do not touch 8787, 7881, 7878, 11434.
# Paths default to /mnt/g/galion (G:\galion). Override with GALION_ROOT_MNT.
set -u
GALION_ROOT_MNT=${GALION_ROOT_MNT:-/mnt/g/galion}
export HOME=${HOME:-/home/galion}
export PATH=/home/galion/.cargo/bin:/usr/bin:/bin
export TMPDIR="${GALION_ROOT_MNT}/tmp/wsl"
BIN="${GALION_OPENMIND_BIN:-$GALION_ROOT_MNT/work/target-openmind-wsl/debug}"
DATA="${GALION_OPENMIND_DATA:-$GALION_ROOT_MNT/work/openmind-local}"
LOGDIR="${GALION_OPENMIND_LOGDIR:-$GALION_ROOT_MNT/logs/openmind}"
mkdir -p "$TMPDIR" "$LOGDIR" \
  "$DATA/memory" "$DATA/hermes" "$DATA/nerve" "$DATA/cortex" \
  "$DATA/desk-state" "$DATA/desk-one" "$DATA/desk-hermes" \
  "$DATA/galion-one" "$DATA/console-root" "$DATA/room-root"

export ONE_BIND=127.0.0.1:8091
export ONE_MOUTH_BIND=127.0.0.1:8002
export GALION_HOME="$DATA/galion-one"
export DESK_BIND=127.0.0.1:8646
export DESK_OLLAMA=127.0.0.1:11434
export DESK_STATE_DIR="$DATA/desk-state"
export DESK_ONE_DIR="$DATA/desk-one"
export DESK_HERMES_DIR="$DATA/desk-hermes"
export TUNER_ADDR=127.0.0.1:8650
export TUNER_ROOT="${TUNER_ROOT:-$GALION_ROOT_MNT/work/repos/obsidian-open-mind/crates/tuner/www}"
export ROOM_BIND=127.0.0.1:4020
export ROOM_ROOT="$DATA/room-root"
export OPENMIND_MEMORY_HOST=127.0.0.1
export OPENMIND_MEMORY_PORT=8420
export OPENMIND_MEMORY_DATA_DIR="$DATA/memory"
export HERMES_HOME="$DATA/hermes"
export HERMES_RS_HOST=127.0.0.1
export HERMES_RS_PORT=8642
export HERMES_RS_STATE_DB="$DATA/hermes/rs-state.db"
export NERVE_ADDR=127.0.0.1:8670
export NERVE_DATA_DIR="$DATA/nerve"
export CORTEX_LISTEN=127.0.0.1:8674
export CORTEX_DATA_DIR="$DATA/cortex"
export CORTEX_ACTIONS=dry-run
export CORTEX_LLM_ENABLED=0
export CORTEX_NERVE_URL=http://127.0.0.1:8670

listening() {
  ss -lnt | awk '{print $4}' | grep -qE "(^127\\.0\\.0\\.1:$1$)|(^\\[::1\\]:$1$)"
}

start_one() {
  local name="$1" port="$2" exe="$3"
  shift 3
  if [ ! -x "$exe" ] && [ ! -f "$exe" ]; then
    echo "MISSING $name $exe"
    return
  fi
  if listening "$port"; then
    echo "ALREADY 127.0.0.1:$port $name"
    return
  fi
  nohup "$exe" "$@" >>"$LOGDIR/$name.log" 2>&1 &
  echo "LAUNCH $name 127.0.0.1:$port pid=$!"
}

# Stack first so desktop can dial Galion One on 8091.
start_one galion-one 8091 "$BIN/galion-one"
start_one galion-desk 8646 "$BIN/galion-desk"
start_one tuner 8650 "$BIN/tuner"
start_one room 4020 "$BIN/room" --listen
start_one openmind-memory 8420 "$BIN/openmind-memory"
start_one hermes-gateway 8642 "$BIN/hermes-gateway" --mock
start_one openmind-nerve 8670 "$BIN/openmind-nerve" serve
start_one gaia-cortex 8674 "$BIN/gaia-cortex" serve
start_one galion-console 18080 "$BIN/galion-console-static" \
  --root "$DATA/console-root" --bind 127.0.0.1:18080 --ui rust --local-api \
  --desk 127.0.0.1:8646 --pulse 127.0.0.1:8091
# Desktop last; --listen dials 127.0.0.1:8091. If One is down, Look still serves the page.
start_one openmind-desktop 18181 "$BIN/openmind-desktop" --listen --port 18181
sleep 2
echo '----LISTEN----'
ss -lnt | grep 127.0.0.1 || true
