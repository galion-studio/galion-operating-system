# Voice profile — prebuilt binaries

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1). Sector 12-DEPLOY, job W3-12c.*

This is the packaging contract for the **Galion OS Voice** profile. It describes the prebuilt binaries that profile ships, the archive they travel in, and the order an owner follows before any remote probe. The root README stays the short product page. An open change may add a profile table there; this file does not edit it.

Nothing in this repository is a published binary yet. Remote gates R0–R3 stay **pending**. This note grants no remote login, no weight file, and no training run.

## 1. The profile this package is

Galion OS Voice is the first image profile.

| | Galion OS Voice |
|---|---|
| Ships | First |
| Display | None. No X11, Wayland, or compositor. At most one dot on `/dev/fb0`. |
| Hermes | Off the device, on the side band, outside the 80 ms audio path. |
| Shared base | `galion-init` and the Obsidian Open Mind contract, shared with the later Hermes GUI profile. |
| Also runs on | Plain Linux (a laptop or a probe machine), with the same three binaries and no image. |

The Hermes GUI profile (one window, one prompt field) is a later package. It is outside this archive. Hermes stays the centre for knowledge and tools, and it stays off the Voice image.

## 2. One binary set, two delivery shapes

| Shape | When it exists | What the owner receives |
|---|---|---|
| Plain Linux drop-in | First. This is the probe artifact. | The archive in §4. No kernel. |
| Galion OS Voice image | After the drop-in binaries exist and the owner asks for an image. | A Linux kernel, a read-only root, and the same three binaries. `galion-init` is PID 1. |

The image carries the same three binaries. The kernel and the read-only root are the pieces added around them.

## 3. The three programs

| Binary | Role in the Voice profile |
|---|---|
| `galion-init` | Static musl PID 1. Mounts filesystems, brings up the network, sets the clock, and supervises `galion-voiced`. It is a supervisor, and the production image contains no shell. |
| `galion-voiced` | The voice daemon. It speaks the Open Mind voice contract: 24 kHz, an 80 ms frame, bands **you · me · feeling**. ALSA capture and playback, Opus on the wire. The first build is **T-Thin** (relay client, device identity, owner approval before a device joins). **T-Edge** adds the on-device engine only when a local probe says the machine can hold the frame. A failed probe keeps the process on T-Thin. |
| `galion-probe` | Zero-dependency machine probe. A local run is a baseline and is non-authoritative. The owner-operated remote probe is the number that sizes later work, and that run is still pending. The local label in the deploy posture is probe **v0.1.0**. |

Frame rules that the `galion-voiced` binary has to keep, once it exists: the audio thread may run `SCHED_FIFO` on an isolated core, the hot frame path does no allocation, and a late frame pauses rather than blocking the clock. The binary still starts on a machine that has none of those knobs set.

### Stays out of this archive

- Hermes, `hermes-gateway`, and any tool-calling agent. The side band is a different host.
- A window, a display server, a compositor, and a window-backend feature.
- A listener on a public address. A future metrics page, if one is built, binds `127.0.0.1` only. Another machine sees it through a tunnel the owner opens.
- A package manager, a compiler, Cargo, or a Rust toolchain.
- A shell. A debug image, if one is ever built, is a separate artifact with its own name.
- Model weights, checkpoints, embeddings, and every model container, including a GGML-family container. The weights slot in the manifest is `none`.
- A training program, a teacher run, or a distillation job. Adapting a published lab resource (Mimi, Moshi / Moshiko, PersonaPlex outputs, SenseVoice-Small, Hermes) waits on written counsel sign-off and is a different artifact.

Counsel sign-off is a precondition for any weight file. Until that signature exists, the package ships code only.

## 4. Archive layout

```
galion-os-voice-<version>-<triple>.tar.xz
  MANIFEST.txt
  SHA256SUMS
  NOTICE
  bin/galion-init
  bin/galion-voiced
  bin/galion-probe
```

`MANIFEST.txt` records:

- `name` — `galion-os-voice`
- `profile` — `voice`
- `version` — semver, matching the git tag
- `git` — full commit
- `target` — the triple below
- `rustc` — the compiler version that produced the binaries
- `opt` — opt-level of each binary
- `bytes` — size of each binary
- `sha256` — the same digests as `SHA256SUMS`
- `tier` — `t-thin` or `t-edge`
- `weights` — `none`
- `built` — UTC time

`NOTICE` states that the code follows the MIT text in `LICENSE`, and that this archive contains no weights. A future weight artifact would be a separate file, a separate checksum, and a separate licence.

`SHA256SUMS` covers every file under `bin/` plus `MANIFEST.txt` and `NOTICE`. The owner checks it before the binaries are placed anywhere.

v0.1.0 is the local probe label. A GitHub release asset for that version waits on a green CI run. The published archive is signed with keyless cosign. Until that run is green, there is no release asset and no signature to trust.

## 5. Targets and the build profile

The release build, once the crates exist, is two static triples:

| Triple | Machine |
|---|---|
| `x86_64-unknown-linux-musl` | Ordinary PCs and the probe machine. |
| `aarch64-unknown-linux-musl` | ARM boards, including Raspberry Pi-class devices. |

Build rules:

- Fully static musl. The target machine needs no libc package and no libgcc.
- No `target-cpu=native`. SIMD stays behind `cfg` and keeps a portable fallback.
- Strip and LTO.
- `opt-level = "z"` for `galion-init` and `galion-probe`.
- `galion-voiced` uses `opt-level = 3` when `z` misses the frame budget. The manifest records the choice.
- Size bar: **2 MiB per binary**, the Open Mind release bar. A binary over that bar fails packaging. An owner may record an exception in the manifest; a silent overage is a failed package.
- The three binaries are reproducible against the recorded `rustc`, triple, and lockfile hash.

## 6. Image carrier (later)

The image is specified so a later job does not invent a second packaging story. It is not built in this repository.

- A Linux kernel.
- A read-only root and no package manager.
- No shell in the production image.
- `galion-init` as PID 1, supervising `galion-voiced`.
- At most one dot on `/dev/fb0`.
- Updates by A/B image swap. The swap mechanism is a design hold, and it is unimplemented.
- The image builder (buildroot, or a custom initramfs) is unchosen here.
- A device joins only with explicit owner approval. Identity material is absent from the public archive.

Boot order inside the image: kernel, then `galion-init`, then ALSA, then `galion-voiced`. Hermes is on another machine.

## 7. What an install is

On plain Linux the install is: unpack the archive, check `SHA256SUMS`, and place the three binaries on the `PATH` of the unprivileged user `galion`. Then run `galion-probe` locally. There is no compile step on that machine.

The production image has no installer. The owner swaps the image.

Owner order before any remote gate, all of it still ahead of this repository:

1. The owner hardens the machine: root password rotation, key-only login, root login disabled, work done as the non-root user `galion`. An agent does none of this.
2. The tree is pushed and the local gates are green before anything is copied to a remote machine.
3. R0, the probe, runs first, from the prebuilt archive. The machine has no Rust toolchain.
4. R1–R3 stay pending until the owner enables them. A release stays blocked while they are pending.
5. Any web view binds localhost. The owner opens the tunnel. This file has no host name, no key, no port, and no tunnel command.

The sector posture on disk, outside this repository, is print-only: `harden-dryrun.sh`, `release-dryrun.sh`, and `remote-r0-dryrun.sh`. Their `--execute` switch exits 2. This repository does not add those scripts and does not add a remote runner.

## 8. What this repository holds today

`README.md`, `LICENSE`, and this note. It has no Cargo workspace, no release workflow, and no remote gate. `Galion-Voice-` is a separate repository and is left as it is, including its open branding change.

## 9. Outside this change

- The root README.
- Branding work on `Galion-Voice-`.
- Packing or fetching weights.
- A training run of any kind.
- A remote login of any kind.
- Choosing the image builder.
- Publishing a GitHub release.

— Maciej Grajczyk
