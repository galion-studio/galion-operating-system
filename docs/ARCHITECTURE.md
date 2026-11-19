# Architecture

How Galion OS, Galion Research, the Obsidian desktop, and Galion Voice sit on one Linux machine, and what a Raspberry Pi 5 adds.

This page is the map. The notes it links already hold the detail. A line here is only as strong as the file it cites. Links into the other three repositories are their default branch. The Pi 5 symphony job pins two of its own commits, named below.

A virtual machine or qemu pass is an emulator reading. It is a Raspberry Pi 5 result only when [docs/PI5.md](PI5.md) says a board produced it. That page's board fields are empty.

## The four repositories

| Name here | Repository | Role on one machine |
|---|---|---|
| Galion OS | this repository | The operating-system direction, two image profiles, and the Pi 5 seeds. `galion-init` in this tree is an in-memory prototype of the boot plan. |
| Galion Research | [galion-studio/hermes-research](https://github.com/galion-studio/hermes-research) | The research desk. Its own memory. It ships no voice model. |
| Obsidian desktop | [galion-studio/obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind) | The Rust agent stack. `openmind-desktop` is the local control console. This is a different project from the Obsidian note-taking app. |
| Galion Voice | [galion-studio/galion-one-voice](https://github.com/galion-studio/galion-one-voice) | The voice program. One 80 ms clock. Three bands: you, me, feeling. It runs on plain Linux. An OS image is not required. |

The long form of the two OS profiles is [docs/voice-profile/README.md](voice-profile/README.md). The Pi 5 order is [docs/PI5.md](PI5.md).

Read the behaviour in the repository that owns it:

- Research: [README](https://github.com/galion-studio/hermes-research/blob/main/README.md), [docs/FORWARD.md](https://github.com/galion-studio/hermes-research/blob/main/docs/FORWARD.md), [docs/DEPLOY.md](https://github.com/galion-studio/hermes-research/blob/main/docs/DEPLOY.md), [docs/PI5-SEED.md](https://github.com/galion-studio/hermes-research/blob/main/docs/PI5-SEED.md)
- Desktop: [README](https://github.com/galion-studio/obsidian-open-mind/blob/main/README.md), [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md), [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md)
- Voice: [README](https://github.com/galion-studio/galion-one-voice/blob/main/README.md), [symphony index](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/symphony/README.md), [nerve and cortex seam](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/OPENMIND-NERVE-CORTEX.md), [live demo](https://github.com/galion-studio/galion-one-voice/blob/main/docs/LIVE-DEMO.md)

## What you can start

These programs are in the public trees. You start them. The host init stays PID 1.

| Process | Start | Where it is written |
|---|---|---|
| Research desk, `node src/server.js` | `npm start` in hermes-research. Node.js 22 or newer. No packages. | [hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md) |
| Same desk, one executable | The Pi 5 seed archive. `linux-arm64` and `linux-x64`. The arm64 smoke start is qemu-user on the runner. | [hermes-research docs/PI5-SEED.md](https://github.com/galion-studio/hermes-research/blob/main/docs/PI5-SEED.md) |
| `openmind-desktop` | A local build. No flags prints the page and opens no socket. `--listen` serves it. | [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| Voice one-dot screen | `scripts/run-v1-screen.sh`. `GALION_LLM=canned`. Default lifetime is `V1_SCREEN_SECONDS` 3600. | [symphony index](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/symphony/README.md) |
| Voice heartbeat demo | `scripts/run-live-demo.sh`. Writes a WAV. That runbook's "me" band is synthetic, and that command takes no microphone. | [docs/LIVE-DEMO.md](https://github.com/galion-studio/galion-one-voice/blob/main/docs/LIVE-DEMO.md) |
| `galion-init` | `galion-init desktop`, or the OS seed unit. Prints the in-memory plan and exits. | [galion-init/README.md](../galion-init/README.md), [docs/PI5-SEED.md](PI5-SEED.md) |
| `galion-welcome` | The OS seed unit. One HTML page. | [docs/PI5-SEED.md](PI5-SEED.md) |

Speech is chosen in `SpeechStack::detect`. It never downloads a pack. `auto` tries the clone child, then Piper, then Flite. Weights are not in git. The screen script sets `GALION_SPEECH=auto` and uses Piper when the A21 pack is present, otherwise Flite. ([galion-one-voice README](https://github.com/galion-studio/galion-one-voice/blob/main/README.md), [symphony index](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/symphony/README.md))

## Planned

| Item | What the notes say | Where |
|---|---|---|
| Galion OS image | No image is published from this repository. Downloads wait until the first image exists. | [README](../README.md), [docs/voice-profile/README.md](voice-profile/README.md) |
| Galion OS Voice, the first profile | Linux, then static musl `galion-init` as PID 1, then ALSA, then `galion-voiced`. No display server. At most one dot on `/dev/fb0`. Hermes stays off the device, outside the 80 ms audio path. The image is not built here. | [voice-first.md](voice-profile/voice-first.md), [PACKAGING.md](voice-profile/PACKAGING.md) |
| `galion-voiced` and `galion-probe` | Named in the voice packaging contract. They are absent from this repository and from the Pi 5 seed. | [PACKAGING.md](voice-profile/PACKAGING.md), [docs/PI5-SEED.md](PI5-SEED.md) |
| Hermes GUI, the later profile | One window, one gradient, one prompt field. Which Hermes binary is an owner pick. | [hermes-later.md](voice-profile/hermes-later.md) |
| Desktop supervision | The in-memory plan records `openmind-desktop`, then research, then one handoff. It does not fork, bind, or mint PID 1. Process id 1 exits 2. `--execute` exits 2. | [galion-init/README.md](../galion-init/README.md) |
| Stack rows on the console | `staged` or `planned`. The test name in the Open Mind README is that nothing is live. The page does not start Galion One or Hermes. | [obsidian-open-mind README](https://github.com/galion-studio/obsidian-open-mind/blob/main/README.md), [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| Deploy | The research kit and the voice dry-run scripts refuse `--execute`. Neither tree deploys. | [hermes-research docs/DEPLOY.md](https://github.com/galion-studio/hermes-research/blob/main/docs/DEPLOY.md), [galion-one-voice README](https://github.com/galion-studio/galion-one-voice/blob/main/README.md) |
| A Raspberry Pi 5 pass | The board commands exist. No step on the Pi 5 page has been run on a Pi 5. | [docs/PI5.md](PI5.md) |

## Ports

These are the loopback defaults the notes write down. A dial row is a client target. This map does not start that process.

Research binds `127.0.0.1`. A host argument cannot move it. `PORT` changes the port. The unit port is 8787. ([hermes-research docs/PI5-SEED.md](https://github.com/galion-studio/hermes-research/blob/main/docs/PI5-SEED.md))

The desktop default is `127.0.0.1:18181`. Another loopback address, including `::1`, is accepted. A non-loopback address is refused before a socket exists. The desktop does not bind port 18081. ([docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md), [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md))

| Port | Service | Listen or dial | Status |
|---|---|---|---|
| 18711 | `galion-welcome` | listen, loopback | OS seed. The aarch64 binary in the tarball was not run on a Pi 5. [docs/PI5-SEED.md](PI5-SEED.md) |
| 18181 | `openmind-desktop` | listen, `DEFAULT_BIND` | `--listen`. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 8787 | `galion-research` | listen, `127.0.0.1` | Galion Research. `GET /health` returns `{"ok":true,"service":"galion-research","bind":"127.0.0.1"}`. Keep `galion-research.service` and `galion-research-pi5.service` from both using this port. [hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md), [docs/DEPLOY.md](https://github.com/galion-studio/hermes-research/blob/main/docs/DEPLOY.md) |
| 7878 | `voice-screen` | listen | Voice one-dot screen. Default `V1_SCREEN_ADDR` is `127.0.0.1:7878`. Not in the OS seed. [symphony index](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/symphony/README.md) |
| 8091 | `galion-one` | listen, `ONE_BIND`. Also the desktop's `DEFAULT_STACK` dial for `POST /files` | Crate default. The desktop row is `planned`. `--stack off` does not dial. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md), [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| 8002 | `galion-one-mouth` | listen, `ONE_MOUTH_BIND` | `galion-one` mouth. Crate default. The desktop page does not start it. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 8646 | `galion-desk` | listen, `DESK_BIND` | Separate program. The desktop desk row is `staged`. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md), [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| 8642 | `hermes-gateway` | dial | Hermes gateway. Research default `GALION_LLM_URL` is `http://127.0.0.1:8642/v1/chat/completions`. Other hosts are refused. `link-watch` probes `http://127.0.0.1:8642`. The desk does not start the gateway. [hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md), [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 18080 | `console` | probe target | Rust console. The desktop probe default. The desktop does not bind it. [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| 8420 | `openmind-memory` | probe, `GET /health` | Open Mind memory. Default in `openmind-memory`. The desktop row is `planned`. The voice seam's local turn file is a different store. [docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md), [OPENMIND-NERVE-CORTEX.md](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/OPENMIND-NERVE-CORTEX.md) |
| 8670 | `openmind-nerve` | listen, when a human runs `openmind-nerve serve` | Voice does not start it. Unset `GALION_NERVE_URL` posts nothing. [OPENMIND-NERVE-CORTEX.md](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/OPENMIND-NERVE-CORTEX.md) |
| 8650 | `tuner` | listen, when `TUNER_ADDR` is unset and no config sets `bind` | Not in the OS seed. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 4020 | `room` | listen, only `room --listen` | No flags open no socket. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 11434 | `ollama` | dial from `galion-desk` and `link-watch` | Ollama. A dial default in those crates. [docs/bind-defaults.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/bind-defaults.md) |
| 8674 | `cortex-stand-in` | probe stand-in | The symphony emulator answers this port. It is not cortex. [docs/PI5-SYMPHONY.md](PI5-SYMPHONY.md) |

The symphony emulator also answers six probe URLs with static stand-ins on ports 8670, 8674, 18080, 8642, 8002, and 8646. Those stand-ins are not nerve, cortex, the console, Hermes, voice, or desk. The voice stand-in uses port 8002, which is also the `galion-one` mouth default above. The stand-in is not that process. The table and the contract are [docs/PI5-SYMPHONY.md](PI5-SYMPHONY.md).

## Read this machine

[`tools/galion-status`](../tools/galion-status) checks each service in the table on `127.0.0.1`. It prints `up`, `down`, or `not installed`. `--json` prints those same rows for other scripts. [check_architecture.py](../tools/galion-status/check_architecture.py) fails when the table and that output disagree on the service id or the port. The command does not start a process. `--execute` exits 2.

`up` means the port accepted a connection. Galion Research is `up` when `GET /health` includes `{"ok":true,"service":"galion-research","bind":"127.0.0.1"}`. Open Mind memory is `up` when `GET /health` answers 2xx. A redirect is left alone.

A closed port is `down` when one of these files is present, and `not installed` when none of them is:

| Row | File |
|---|---|
| `galion-welcome` | `/etc/systemd/system/galion-welcome.service`, `/opt/galion/bin/galion-welcome` |
| `openmind-desktop` | `/etc/systemd/system/openmind-desktop.service`, `/opt/galion/openmind-desktop/openmind-desktop` |
| Galion Research | `/etc/systemd/system/galion-research.service`, `/etc/systemd/system/galion-research-pi5.service`, `/opt/galion/research/current` |
| `galion-one` and its mouth | `/etc/systemd/system/galion-one.service`, `/opt/galion/openmind/dist/bin/galion-one` ([docs/PACKAGING.md](PACKAGING.md)) |
| `openmind-nerve` | `/etc/systemd/system/galion-nerve.service` |
| Ollama | `/usr/bin/ollama`, `/usr/local/bin/ollama` |

The other rows have no install file on this page. A closed port there is `not installed`.

```sh
cargo run --manifest-path tools/galion-status/Cargo.toml --locked --quiet
```

The reading is the machine the command runs on.

## How a turn moves

The four programs do not discover each other. A person opens each loopback page, or sets an environment variable the note already names.

1. The desktop console stays on its own origin. The content security policy includes `connect-src 'self'`. The page source contains no `http://` or `https://`. A browser on that page does not call port 8787 or port 7878. ([docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md))
2. Desktop `/one` and `/research` are entry pages in the same binary: a title, one sentence, and a link back to `/`. They are not the research desk and not Galion Voice. ([docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md))
3. Research reaches the desktop only when `GALION_OPENMIND_URL` is loopback `http`. The forward note's example is `http://127.0.0.1:18181`. It reaches the voice web surface only when `GALION_VOICE_URL` is loopback `http`. `GALION_RESEARCH_URL` is the older origin, and only when the voice URL is unset. `https` and any other host are refused and are not dialed. ([hermes-research docs/FORWARD.md](https://github.com/galion-studio/hermes-research/blob/main/docs/FORWARD.md))
4. `GET /one` on the research desk redirects to `{GALION_OPENMIND_URL}/one` when that value is an accepted loopback origin. Otherwise it uses `GALION_ONE_URL`. The default is `https://galion.app/one`, the product link. The research README says this repo does not draw the One dot. ([docs/FORWARD.md](https://github.com/galion-studio/hermes-research/blob/main/docs/FORWARD.md), [hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md))
5. A question uses a voice answer only when that origin returns the `galion-research/1` shape. With Hermes attached (`GALION_LLM=hermes`, or a set `GALION_LLM_URL` and no mode), the question goes to the loopback gateway. With both quiet, the desk answers from local knowledge and marks the answer `Offline`. Citations stay empty. The desk does not invent a paper, a URL, a date, or a measurement. ([hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md), [docs/FORWARD.md](https://github.com/galion-studio/hermes-research/blob/main/docs/FORWARD.md))
6. A file on the desktop stays on the machine. Plain `--listen` also dials `127.0.0.1:8091`. `--stack off` does not. The typed command is not uploaded. The microphone is opt-in and loopback-only. The label says the audio is not saved and is not sent. ([docs/desktop/README.md](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md))
7. The voice clock stays 80 ms, 12.5 Hz, 24 kHz, from `LOCKS.toml`. A nerve note is enqueued after `Heartbeat::step`. A post happens when `GALION_NERVE_URL` is numeric loopback `http`. The seam's example is `http://127.0.0.1:8670`. A Hermes offer is a side-band handoff at a turn boundary. The retrieval cap in that seam is 3000 ms. The landing does not call the gateway. The audio tick does not ask Hermes anything. Consent starts denied. ([galion-one-voice README](https://github.com/galion-studio/galion-one-voice/blob/main/README.md), [OPENMIND-NERVE-CORTEX.md](https://github.com/galion-studio/galion-one-voice/blob/main/docs/galion-voice-v2/OPENMIND-NERVE-CORTEX.md))

The in-memory desktop plan records another handoff: the console with no listen address, so the crate default 18181, then `node src/server.js` in `/opt/galion/research/current` with `PORT` 8787, then `GALION_ONE_URL` as http on IPv4 loopback, port 18181, path `/one`. `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` stay unset in that plan. The plan does not start those processes. ([galion-init/README.md](../galion-init/README.md))

Responses from the research desk say `key` is `set` or `none`. The key stays on the server that holds it. This page records no key and no password. ([hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md))

The research README names the desk for `research.galion.app`. Placing it there is a DNS step this repository does not perform. ([hermes-research README](https://github.com/galion-studio/hermes-research/blob/main/README.md), [docs/DEPLOY.md](https://github.com/galion-studio/hermes-research/blob/main/docs/DEPLOY.md))

## A Raspberry Pi 5

Raspberry Pi OS stays the operating system. The seeds are tarballs and one static binary. The flash, the install, and the limit are [docs/PI5.md](PI5.md).

| Seed | Unit on the machine | Process |
|---|---|---|
| OS seed | `galion-os.target` | `galion-init.service` runs `galion-init desktop` as user `galion` and exits. `galion-welcome.service` keeps the page on port 18711. systemd remains PID 1. |
| Research seed | `galion-research-pi5.service` | The arm64 executable on `127.0.0.1:8787`. The Pi does not need a separate Node install. The `galion` user must already exist. The research kit does not create the account. The OS seed's `install.sh` does. |
| Desktop | `openmind-desktop.service` | The symphony job installs this unit. Open Mind pull request 100 shipped the binary and no unit. The unit runs `openmind-desktop --listen 127.0.0.1:18181 --stack off` as user `galion`. |

Sources: [docs/PI5-SEED.md](PI5-SEED.md), [hermes-research docs/PI5-SEED.md](https://github.com/galion-studio/hermes-research/blob/main/docs/PI5-SEED.md), [docs/PI5.md](PI5.md), [docs/PI5-SYMPHONY.md](PI5-SYMPHONY.md), [scripts/symphony/openmind-desktop.service](../scripts/symphony/openmind-desktop.service).

Galion Voice is not in these seeds. The welcome page lists Open Mind, Research, and Voice as not on the machine until those units exist. When Research is up, including `galion-research-pi5.service`, the page links `http://127.0.0.1:8787/`. When Open Mind is up, it links `http://127.0.0.1:18181/`. ([docs/PI5-SEED.md](PI5-SEED.md), [docs/PI5.md](PI5.md))

The symphony job builds Research from hermes-research commit `74f9a7071f1c9672c1fe83e8e96f70e6cbb17318` and the desktop from obsidian-open-mind commit `b26ad02e1b1e9084815bb56d3aff9a02888ca8d8`. The guest is Debian's arm64 Bookworm image under qemu, with no network interface. ([docs/PI5-SYMPHONY.md](PI5-SYMPHONY.md), [scripts/symphony/pins.sh](../scripts/symphony/pins.sh))

[docs/PI5.md](PI5.md) records what has been run: qemu-user for `galion-init`, `install.sh` against an empty directory, the welcome page from the x86_64 binary on the runner, `galion-os.target` inside an arm64 Debian Bookworm virtual machine, and Research plus the desktop in one virtual machine of that kind. The guest is Debian, not Raspberry Pi OS. `scripts/pi5-flash-check.sh` and `scripts/pi5/board-report.sh` have not been run on a Pi 5. On a board the symphony health table's `contract:` stays `failed`, because that contract requires the offline emulator.

The voice image, with `galion-init` as PID 1 and no shell, remains the later packaging story in [docs/voice-profile/PACKAGING.md](voice-profile/PACKAGING.md). The Pi seed does not boot that image.

## Left in the other notes

Brand, the static pages, and Galion Labs stay in [docs/brand/BRANDING-V2.md](brand/BRANDING-V2.md), [site/README.md](../site/README.md), and [labs/README.md](../labs/README.md). The licence is the repository [LICENSE](../LICENSE).
