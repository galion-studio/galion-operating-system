# galion-init

*Swarm 9, lane galion-init. 2026-11-15T15:22:24+01:00 (Europe/Zagreb, CET).*

`galion-init` is the shared init for Galion OS Voice and for the later desktop image. The image binary is planned as a static musl PID 1. This note is the boot contract, and `init/` is a CPU prototype of that contract. The prototype records decisions in memory. It does not mount filesystems, set the host clock, open a socket, play audio, spawn a process, or replace the host init.

The voice notes stay the profile contract: [voice-first.md](voice-profile/voice-first.md), [hermes-later.md](voice-profile/hermes-later.md), and [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md). The desktop image decisions are on draft [pull request #13](https://github.com/galion-studio/galion-operating-system/pull/13). This note does not edit those files.

## What was already in the crates

On 2026-11-15 the `crates/` directory of [obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind) `main` listed 75 crate directories. The only name matching init, boot, or supervisor is [`galion-boot`](https://github.com/galion-studio/obsidian-open-mind/tree/main/crates/galion-boot).

`galion-boot` is the Open Mind boot/keep tool. Its crate description says it replaces the keep, stack-boot, persist-boot, and hardware scripts: a hardware probe, secret restore, a tunnel env file, a systemd unit renderer, a plain supervisor fallback, and status. `systemd_present` is true when `/run/systemd/system` is a directory, and the `supervise` command prints that the rendered units are preferred when that directory exists. It is not PID 1.

There is no `crates/galion-init`. `docs/crate-index.md` in that repository still lists `openmind-boot`. That directory is not under `crates/` on `main` (the contents API returned 404). The index is older than the tree.

Draft #13, decision D2, says the desktop image waits for `galion-init`. It does not boot through systemd, and it does not boot through the `galion-boot` supervisor. This prototype follows that split. It does not depend on `galion-boot`, and it does not copy the unit renderer, the secret restore, or the hardware probe.

The supervision numbers are the ones `galion-boot` already uses in `supervise.rs`: no shell, an absolute program path, restart `always` / `on-failure` / `no`, and a start limit of 10 starts in a 300 second window followed by a 300 second pause. A secret marker on argv (`--token`, `lock-secrets`) is refused, as that crate already refuses. Children exist only as rows this supervisor records. It does not signal a host process.

No open pull request was titled "Swarm 9 os plan" at 2026-11-15T15:22:24+01:00. The open pulls on this repository were #17, #13, and #6.

## Boot order

The kernel is already running before `galion-init`. The phases below are the ones init owns. The prototype stores the list. It does not perform a phase.

### Galion OS Voice

From [voice-first.md](voice-profile/voice-first.md) and [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §3 and §6: Linux, then `galion-init` as PID 1, then ALSA, then `galion-voiced`. Inside init, the voice note also requires mounts, the network, and the clock.

| Order | Phase | What the image binary will do | What this prototype does |
|---|---|---|---|
| 1 | Mount filesystems | Mount the read-only root. | Record the phase. |
| 2 | Network | Bring up the network. | Record the phase. |
| 3 | Clock | Set the clock. | Record the phase. |
| 4 | ALSA | Bring up ALSA before `galion-voiced`. | Record the phase. |
| 5 | Supervise | Supervise `galion-voiced` as user `galion`. | Admit one caller-supplied absolute path. |

The voice order has no desktop handoff and no boot-tone phase. The voice notes do not name one.

### Desktop image

From draft #13 §5 and D2. The root, when an image exists, is squashfs. Listeners bind after loopback exists.

| Order | Phase | What the image binary will do | What this prototype does |
|---|---|---|---|
| 1 | Mount filesystems | Mount the squashfs root. | Record the phase. |
| 2 | Loopback | Bring up the loopback interface. | Record the phase. |
| 3 | Clock | Set the clock. | Record the phase. |
| 4 | Tone hook | A 432 Hz boot tone, planned. The first image does not play it. | Record Planned or Silenced. Zero samples. |
| 5 | Supervise | Start the desktop, then the research process. | Record both services and start them in the table. |
| 6 | Handoff | The Open Mind desktop is the console on loopback port 18181. | Record `127.0.0.1:18181` and path `/`. |

`galion-voiced` stays off this image. The Rust `galion-one` binary stays off this image. Both are absent from `desktop_services()`.

## Service supervision

A service is admitted only when all of the following hold:

- The name is non-empty and uses ASCII letters, digits, `-`, `_`, or `.`.
- `user` is non-empty. The desktop services use `galion`.
- `argv` is non-empty and `argv[0]` is absolute. A `..` path component is refused.
- `argv[0]` is not a shell (`sh`, `bash`, `dash`, `ash`, `busybox`).
- No argument is the host init: `/sbin/init`, `/usr/sbin/init`, systemd, `systemctl`, or `telinit`, including those base names.
- The joined argv and the environment contain no `--token`, `lock-secrets`, `private key`, or `begin ` marker.
- A workdir, when set, is absolute and is not a host-init path.

The desktop list, in order:

| Service | Program | Args | Workdir | After | Env |
|---|---|---|---|---|---|
| `openmind-desktop` | `/opt/galion/openmind-desktop/openmind-desktop` | `--listen` | unset | none | none |
| `galion-research` | `/usr/bin/node` | `src/server.js` | `/opt/galion/research/current` | `openmind-desktop` | `PORT=8787`, `GALION_ONE_URL=http://127.0.0.1:18181/one` |

`--listen` carries no address, so the desktop crate keeps `DEFAULT_PORT` 18181. Research does not start in the table until `openmind-desktop` has a live child. `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` are unset.

Restart is `always`, `on-failure`, or `no`. The desktop services use `always` with 5 seconds between starts. After 10 starts whose age is still within 300 seconds, the next start waits 300 seconds from that attempt. A tick at the exact 300 second mark still counts those starts and waits another 300 seconds. A tick one second later, once the pause is due and the starts are older than 300 seconds, may start again. The tests step an in-memory clock. They do not sleep.

The table's first pid is 100. A request to start at pid 0 or 1 is raised to 2. Pid 1 is never recorded. Exits of unknown pids are ignored, so the table cannot reap a process it did not create.

The voice service name is `galion-voiced`. The caller passes the absolute program path. [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4 names the archive entry `bin/galion-voiced` and does not name the installed path. This note does not invent one.

## 432 Hz boot tone and Silence

The desktop tone step is a hook, and it is planned.

| Call | Result | Samples |
|---|---|---|
| Silence flag clear | `Planned`, 432 Hz | 0 |
| Silence flag set | `Silenced` | 0 |
| Playback device absent, Silence clear | `Planned`, 432 Hz | 0 |

The hook does not synthesise a sine, does not write a sample file, and does not read or write a Silence file. `--silence` on the prototype binary is the in-memory flag. Draft #13 decision D3 keeps a played boot tone and persistent Silence planned. The first image follows the desktop crate: the page's `wake` clip stays unwired, and there is no Silence file. A missing playback device does not stop the later phases. The same rule as a missing `/dev/fb0` on the voice image: boot continues.

## Handoff to the Open Mind desktop

The handoff address is IPv4 loopback port 18181, path `/`. That is `DEFAULT_BIND` / `DEFAULT_PORT` in `openmind-desktop`. The prototype checks a proposed bind and accepts only `127.0.0.1` or `::1` on port 18181.

| Bind | Result |
|---|---|
| `127.0.0.1:18181` and `::1:18181` | Accepted |
| Any other host, including `0.0.0.0` | Refused |
| Port 18080 | Refused. That port is the console probe. |
| Port 18081 | Refused. The desktop crate leaves it unused. |
| Any other port, including 8787 | Refused for this handoff |

Research stays on port 8787. It is the next supervised process, not a second handoff. The console page does not call it. A person opens the desk on its own loopback URL, as draft #13 D4 says.

The prototype does not bind either port.

## The prototype binary

`galion-init` with no arguments prints the desktop plan and exits 0. If the process id is 1, it prints a refusal and exits 2. `--silence` prints the silenced hook. There is no config path, no `--apply`, and no command that writes a unit file.

CI runs `cargo test --manifest-path init/Cargo.toml --locked` on `ubuntu-latest` (workflow `galion-init`). That is a host CPU run. This change does not cross-compile musl and does not build an image. The static musl PID 1 binary remains the voice packaging rule for a later build.

## Out of scope

- Replacing `/sbin/init` or systemd on the machine that runs the tests.
- Mounts, the clock, ALSA, sockets, and audio samples.
- An image, a workflow that builds an ISO, and a publish job.
- Edits to the voice-profile notes, to draft #13, or to `galion-boot`.
- `galion-voiced` and `galion-probe` themselves.

## Licence

The repository [LICENSE](../LICENSE). This note does not restate it.

## Open for Maciej

- The split from `galion-boot` follows draft #13 D2. Say if the image binary should call that supervisor instead of this contract.
- The installed path of `galion-voiced` on the voice image is still unnamed.
- The voice order has no 432 Hz hook. Say if the voice image should share the desktop hook later.
- No Swarm 9 os plan pull request was open when this note was written.
