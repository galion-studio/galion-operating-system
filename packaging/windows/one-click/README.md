# Galion OS one-click start (Windows)

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../../../LICENSE). This page does not restate it.

Start the Galion OS desktop and the local loopback stack with one shortcut
or one command. Everything binds `127.0.0.1` only. Nothing in this package
listens on every interface, opens a tunnel, or calls a paid model.

## G: only

The default root is `G:\galion`. Override it:

```bat
set GALION_ROOT=G:\galion
START-GALION-OS.cmd
```

```powershell
$env:GALION_ROOT = 'G:\galion'
.\START-GALION-OS.ps1
```

Caches, logs, OpenMind data, and cargo targets stay under that root (or
inside the WSL distro disk when a path is inside the ext4 VHDX). Do not
point `GALION_ROOT` at `C:` for large trees. The only files this package
is meant to write on `C:` are the optional `Galion OS.lnk` shortcuts
created by `Install-GalionOSShortcut.ps1` on the user Desktop and, when
present, the OneDrive Desktop.

## Usage

1. Keep the OpenMind Linux binaries and data under `%GALION_ROOT%` (the
   current laptop layout uses `work\target-openmind-wsl\debug` and
   `work\openmind-local`). Override with `GALION_OPENMIND_BIN` /
   `GALION_OPENMIND_DATA` inside WSL if needed.
2. From this directory, run `START-GALION-OS.cmd`, or install the shortcut:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\Install-GalionOSShortcut.ps1
   ```

3. The launcher is idempotent. Ports that are already listening on
   `127.0.0.1` are left alone. Protected processes (`GalionLaptopLink`,
   `GalionShellLink`, `sshd`, `cloudflared`) are never stopped.

The default WSL distro is the existing `Ubuntu` distro. Override with
`GALION_WSL_DISTRO`. This launcher does not create, delete, unregister,
or overwrite a distro, and it does not run `wsl --shutdown`.

## Ports (127.0.0.1 only)

| Port | Service | Notes |
| ---: | --- | --- |
| 18181 | OpenMind desktop | Opens in the browser when it is up |
| 8091 | Galion One | `/health` |
| 8002 | Galion One mouth | Local or `GALION_MOUTH`; Piper CPU is a separate voice path |
| 8646 | galion-desk | |
| 8650 | tuner | |
| 4020 | room | |
| 8420 | openmind-memory | |
| 8642 | hermes-gateway | The bundled start script uses `--mock`. No paid calls. |
| 8670 | openmind-nerve | |
| 8674 | gaia-cortex | LLM off / dry-run in the bundled start script |
| 18080 | galion-console | |
| 7900 | knowledge-ro | Read-only cards. Not 8787. |
| 7881 | samantha-local | Started only if it is down; never stopped if it is up |
| 7911 | galion-research-gateway | Loopback only. Dials Hermes at `127.0.0.1:8642`. |
| 8787 | HORBM preview | Never started or stopped by this launcher |
| 11434 | Ollama | Not started or stopped by this launcher |
| 22 | sshd | Protected |

Knowledge is served by `knowledge-ro-server.py` (GET/HEAD only, loopback).
Set `KNOWLEDGE_ROOT` (default `/mnt/g/galion/knowledge`) and
`KNOWLEDGE_PORT` (default `7900`).

The research gateway binary is looked up at
`%GALION_ROOT%\work\target-research-gateway\release\galion-research-gateway`
or `$env:GALION_RESEARCH_GATEWAY`. It is started only if port 7911 is
down. Confirm it is bound to `127.0.0.1` and not every interface.

## Icon

The Galion OS app icon lives in `docs/brand/icons/`:

- `galion-os-icon-1024.png` — 1024 master
- `galion-os.ico` — 16, 24, 32, 48, 64, 128, 256 PNG entries
- `icon-os.svg` — official mark used to build the face
- `make-galion-os-icon.py` — rebuild script (iOS squircle, ~22% corner radius)

```bat
py docs\brand\icons\make-galion-os-icon.py
```

The official mark also lives at `docs/brand/marks/icon-os.svg`.

## Hermes note

`wsl-start-openmind.sh` starts `hermes-gateway --mock` on `127.0.0.1:8642`.
Hermes may require a locally generated `API_SERVER_KEY` of at least 16
characters in its data directory. Do not commit that file, do not print
the key, and do not put a mock key in this repository.
