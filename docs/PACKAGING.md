# Galion OS image — packaging plan

*Maciej Grajczyk · 2026-11-14 (Europe/Zagreb, CET, UTC+1).*
*Decision list · 2026-11-15 (Europe/Zagreb, CET, UTC+1).*
*Decided · 2026-11-15, 15:00 CET.*

Galion OS has no image. Nothing in this repository builds a kernel, an ISO, or a disk image, and nothing here publishes one. This note is the packaging plan for the image that carries the Obsidian desktop. It is a document. It adds no workflow, no image, and no release.

The voice-profile note, [PACKAGING.md](voice-profile/PACKAGING.md), stays the contract for the Galion OS Voice binaries and for the later voice image (read-only root, no display server, Hermes off the device). This note does not replace that one. The two images are named apart in [§2](#2-the-image-this-plan-is-for).

Words for status stay the brand words. **In development** means the work is underway and is not something a person can take as finished. **Roadmap** means a later image. **Planned** means a choice written here that is not built. [§10](#10-decisions-for-maciej) records the five decisions Maciej made on 2026-11-15 at 15:00 CET. Pricing and billing are outside this plan.

## 1. What is already true

These points come from files that exist today. They are the floor of the plan.

| Fact | Where it is written |
|---|---|
| Galion OS is free forever, MIT, Linux and Rust, CPU-first. No account and no licence key. No image is published from this repository. | [README.md](../README.md), [brand guide](brand/BRANDING-V2.md) |
| Two profiles share `galion-init` and the Obsidian Open Mind contract. Galion OS Voice is first: no X11, Wayland, or compositor. The Hermes GUI is later: one window, one gradient, one prompt field. | [voice-first.md](voice-profile/voice-first.md), [hermes-later.md](voice-profile/hermes-later.md) |
| The voice image builder is unchosen. The note names buildroot or a custom initramfs and does not pick. Updates by A/B image swap are a design hold, and they are unimplemented. The voice archive, when it exists, is signed with keyless cosign. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4 and §6 |
| `openmind-desktop` is the local control console in [galion-studio/obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind), crate `openmind-desktop`. It is a loopback page: stack list, one prompt, file gate, read-only probes, seven tones tuned from 432 Hz. It calls no model. The listen address is configurable. A non-loopback address is refused before a socket exists. With no address, the binary uses port 18181 (`DEFAULT_PORT` in `lib.rs`). Port 18081 stays unused. | [Cargo.toml](https://github.com/galion-studio/obsidian-open-mind/blob/main/crates/openmind-desktop/Cargo.toml), [desktop README](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| The desktop workflow has four jobs. `linux` on `ubuntu-latest` builds the host binary, tests it, and writes a local tarball. It does not upload the tarball and it does not create a release. `linux-aarch64` cross-builds `aarch64-unknown-linux-musl` and runs the tests under qemu-user. It does not write a tarball. `windows` and `macos` build and test, and they do not package. The workflow refuses `--publish`, `--upload`, and `--gh-release`. | [openmind-desktop.yml](https://github.com/galion-studio/obsidian-open-mind/blob/de7480e71ce98191d2ee11f018fa15be6c5a1707/.github/workflows/openmind-desktop.yml) at `de7480e71ce98191d2ee11f018fa15be6c5a1707` |
| The Open Mind release archive, when the owner enables it, is `obsidian-open-mind-<tag>-x86_64-linux.tar.gz`. The binaries it copies are `galion-one`, `galion-desk`, `room`, `desk-hermes`, and `link-watch`. `openmind-desktop` is not in that list. Signing there is keyless cosign over GitHub OIDC, and the job stays off unless the repository is public and `RELEASE_ENABLED` is `true`. | [release.yml](https://github.com/galion-studio/obsidian-open-mind/blob/main/.github/workflows/release.yml) |
| On the console, Galion One and Hermes are stack rows in state `planned`. The page does not start them. `GET /one` and `GET /research` are short entry pages inside the same binary. They are not the marketing pages in this repository, and they are not the research app. | `crates/openmind-desktop/src/stack.rs` and `page.rs` in obsidian-open-mind |
| The wake tone is a 160 ms sine at 432 Hz (ratio 1:1). The page embeds it and the script does not play it. Mute starts off (`aria-pressed="false"`). Local hours 22:00–06:59 skip the tones the script does play. Mute is not stored: the page has no `localStorage`. | [desktop README](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md), `sound.rs` and `page.rs` |
| [site/one/](../site/one/index.html) is the Galion One page for the path `galion.app/one`. This plan copies the files. Pricing is outside this plan. | [site/one/index.html](../site/one/index.html) |
| [site/research/](../site/research/index.html) is the Galion Research page for the path `galion.app/research`. This plan copies the files. Pricing is outside this plan. | [site/research/index.html](../site/research/index.html) |
| [galion-studio/hermes-research](https://github.com/galion-studio/hermes-research) is the research app. Node.js 22 or newer, no packages. `npm start` runs `node src/server.js`, binds the loopback interface, and serves the desk at `/research` on port 8787 unless `PORT` is set. Research cues in [src/cues.js](https://github.com/galion-studio/hermes-research/blob/main/src/cues.js) are 432 Hz just-intonation ratios. The file says definitions only: no voice audio, no clones, no wav files. The app ships no voice model. | hermes-research `README.md`, `package.json`, `src/cues.js` |
| Galion Voice weights are not in git. The voice packaging manifest keeps `weights` at `none` until counsel signs a separate weight artifact. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §3, [galion-one-voice](https://github.com/galion-studio/galion-one-voice) README |
| This repository does not deploy galion.app and does not change DNS. Hosting the pages is an owner decision. | [site/README.md](../site/README.md) |

The Rust unit `deploy/galion-one.service` in obsidian-open-mind starts `/opt/galion/openmind/dist/bin/galion-one` with `ONE_BIND` on IPv4 loopback port 8091 and `ONE_MOUTH_BIND` on IPv4 loopback port 8002. The unit has no `[Install]` section. Its comment says it stays disabled until Slavik approves the switch. That binary is a different artifact from the page at `galion.app/one`. This plan leaves it off the image. See the settled row in [§10](#10-decisions-for-maciej).

## 2. The image this plan is for

One image family, two profiles that already have notes, and one desktop payload that those notes do not package.

| Image | Profile note | Display | This plan |
|---|---|---|---|
| Galion OS Voice | [voice-first.md](voice-profile/voice-first.md) | None. At most one dot on `/dev/fb0`. | Unchanged. Built later, under the voice packaging note. It does not carry `openmind-desktop`, the site pages, or the hermes-research app. |
| Hermes GUI | [hermes-later.md](voice-profile/hermes-later.md) | One window, one gradient, one prompt field. | Roadmap. The window backend is still an owner pick in that note. |
| Desktop image | This file | The control console, on loopback. | The image this plan describes. x86_64 first. |

**Decided.** PID 1 is `galion-init`. The desktop image waits for that binary. It does not boot through systemd, and it does not boot through the `galion-boot` supervisor. The voice notes already name `galion-init` for the Voice profile and the Hermes GUI ([voice-first.md](voice-profile/voice-first.md), [hermes-later.md](voice-profile/hermes-later.md)). The binary is not in this repository, and obsidian-open-mind at `de7480e71ce98191d2ee11f018fa15be6c5a1707` has no `crates/galion-init`. What the binary must provide before this image can boot is [§10](#d2-init-decided).

The systemd units in the other trees stay as reference. `deploy/systemd/galion-research.service` records user `galion`, working directory `/opt/galion/research/current`, and port 8787. `deploy/galion-one.service` records the Galion One binary this image leaves off. This image does not install either unit as the boot path.

**Settled.** Two roots. The voice image keeps the read-only root, no shell, and no package manager ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §6). The desktop image is the root that starts Node.js 22. hermes-research `package.json` requires `"node": ">=22"`.

**Settled.** The desktop image is a third boot. It carries the loopback control console. The Hermes GUI stays the later profile in [hermes-later.md](voice-profile/hermes-later.md). The root [README](../README.md) profile table has those two rows. [voice-first.md](voice-profile/voice-first.md) calls the developer console a developer tool and says it is not that interface. `stack.rs` marks Hermes `planned` and says nothing on the list is live.

## 3. Base distro options

**Decided.** The desktop base is Ubuntu 26.04 LTS. The table is the comparison that led there. The voice image builder stays the unchosen buildroot or custom initramfs in the voice note. This repository still adds no workflow. The desktop image also waits on `galion-init`.

| Option | What it gives this image | What it costs |
|---|---|---|
| Debian stable | A small package set can be baked in, then left frozen. Hardware coverage is wide, including boards in the Raspberry Pi class the root README already names. | glibc, not the musl triple the voice binaries use. The stable archive's `nodejs` package is 20.19.2 (trixie, [packages.debian.org/stable/nodejs](https://packages.debian.org/stable/nodejs)), below the research app's Node.js 22 line. An `apt` database left on the device is a second update path beside the image channel in [§9](#9-update-channel). |
| Ubuntu LTS | Same family as Debian, with a newer hardware enablement stack for laptops. Ubuntu 26.04 LTS (resolute) ships `nodejs` 22.22.1 for amd64 and arm64 ([packages.ubuntu.com/resolute/nodejs](https://packages.ubuntu.com/resolute/nodejs)). Ubuntu 24.04 LTS ships 18.19.1, which is below the research app's line. | Larger. If `unattended-upgrades` stays installed, the machine has a second update channel that this plan does not operate. |
| Fedora bootc (image mode) | The deliverable is already a disk image. Updates are an atomic image pull. Signing and measured boot have an upstream story. | Heavier than a musl voice root. Nothing in the Galion repositories names bootc. A Galion image would still replace Fedora's update remote with the channel in [§9](#9-update-channel). |
| Alpine | musl, small, aarch64 is first-class. Closest of the general distributions to the voice triples `x86_64-unknown-linux-musl` and `aarch64-unknown-linux-musl`. | The packaged x86_64 console is the glibc host build. An Alpine root runs that binary only after a musl rebuild, and the `linux` job does not do that rebuild. The `linux-aarch64` job already builds musl and does not write a tarball. Node.js on musl is a separate pin from Debian's Node.js. |
| NixOS | One lock can pin Node.js 22, the Rust toolchain, and the three product commits. A generation is an update. | No Galion repository uses Nix today. Evaluating the image in CI is its own cost. The voice rule "no package manager on the device" and a Nix store on the device are different models, and this note does not merge them. |
| Buildroot | Already named in the voice packaging note. Read-only root, no package manager on the device, small, cross-build to aarch64 is ordinary. | Node.js and a browser are awkward guests. The desktop is an HTML page. Buildroot does not, by itself, decide what draws that page. |
| Yocto | Image recipes, and signed A/B updates through a project such as RAUC, Mender, or swupdate. aarch64 is ordinary. | Slow CI. Nothing in the Galion repositories names Yocto. The update project would still have to match the hold in [§9](#9-update-channel). |

Shared costs, whichever row is picked:

- **Settled.** Two roots, as [§2](#2-the-image-this-plan-is-for) records. The voice root omits a shell and a package manager. The desktop root starts Node.js 22.
- **Decided.** The running image carries the four pieces in [§4](#4-what-the-image-carries), Ubuntu 26.04's boot set, and `/usr/bin/node` from that release's `nodejs` package (22.22.1). `unattended-upgrades` stays off, so updates stay on the image channel in [§9](#9-update-channel).
- **Decided.** Kernel and firmware are Ubuntu 26.04's. The root filesystem is squashfs. Persistent Silence stays planned, so the first image has no Silence state file.

## 4. What the image carries

The desktop image carries four pieces. Each piece stays the bytes of its own repository, pinned by a full git commit in the manifest. The image does not build them from a floating branch tip.

Loopback is the bind for every listener. The desktop crate refuses any other address. The research app binds the loopback interface. The image does not add a reverse proxy, a public port, or a tunnel. A tunnel, if an owner wants one, stays the owner's step, as the voice packaging note already says.

### 4.1 openmind-desktop

Ships as the release binary `openmind-desktop`, built the way [package-local.sh](https://github.com/galion-studio/obsidian-open-mind/blob/main/scripts/desktop/package-local.sh) already builds it: `cargo build -p openmind-desktop --release --locked`, then a tarball named `openmind-desktop-<version>-<host>.tar.gz` plus `SHA256SUMS`. The archive also holds `LICENSE`, the desktop README, `console.html` from page mode, and `LOCAL-ARTIFACT.txt`.

On the image the plan places that binary at `/opt/galion/openmind-desktop/openmind-desktop`. The prefix `/opt/galion/` is the prefix already used by `deploy/galion-one.service` in obsidian-open-mind. The directory `openmind-desktop` under it is this plan. The unit file for it does not exist yet.

The process starts on loopback. With no address, no `--port`, and no `OPENMIND_DESKTOP_PORT`, the binary uses `DEFAULT_PORT`, which is 18181, on IPv4 loopback (`lib.rs` at `de7480e71ce98191d2ee11f018fa15be6c5a1707`). The comment there says 18081 is the staging page beside the Rust console on 18080, so the desktop does not bind 18081. The image passes no address.

```sh
/opt/galion/openmind-desktop/openmind-desktop --listen
```

An address may be passed to `--listen` when the image needs a different loopback port. A non-loopback address is still refused.

**Settled.** `openmind-desktop` and `node src/server.js` run as the unprivileged user `galion`. The voice packaging note already places the voice binaries on that account ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §7). `deploy/systemd/galion-research.service` in hermes-research sets `User=galion`. The listen port is the crate default, 18181.

The binary's own routes stay what the crate serves today:

| Route | What the binary serves today |
|---|---|
| `GET /` | The control console. |
| `GET /one` | A short Galion One entry. The stack stays on `/`. |
| `GET /research` | A short Galion Research entry. Hermes is named as the engine. The stack stays on `/`. |
| `GET /probes` | Read-only probes, and only when asked. |

The first image uses the x86_64 binary that `ubuntu-latest` produces. It does not claim an aarch64 binary. See [§6](#6-target-architectures).

The crate's stack list is part of the binary. Galion One and Hermes stay `planned` there. Starting those programs is a separate unit, not a side effect of the console.

### 4.2 Galion One, the page at galion.app/one

Ships as the static files in [site/one/](../site/one/index.html) of this repository, copied to `/opt/galion/site/one/`. Those files are the page written for `galion.app/one`. Copying them onto the image is not a deploy of galion.app, and it does not change DNS.

The page stays a file on disk. No process on the image serves it. Pricing is outside this plan.

Galion Voice weights stay off this image. The voice packaging manifest keeps `weights` at `none`. A weight file would be a separate artifact, a separate checksum, and a separate licence, after counsel signs. The image does not fetch weights at boot.

**Decided.** The files stay on disk. `openmind-desktop` already answers `/one` with its own short entry. The console page does not load `https://` URLs. No second listener is added. See [§10](#d4-access-decided).

**Settled.** The Rust `galion-one` binary stays off this image. The unit has no `[Install]` section, and `stack.rs` marks `galion-one` `planned`. Galion One on the image is the static page in `site/one/`.

### 4.3 Galion Research, the page and the app

Both ship. They are different trees.

The static page in [site/research/](../site/research/index.html) is copied to `/opt/galion/site/research/`. It is the page written for `galion.app/research`. It stays a file on disk. Copying the files is not a deploy. Pricing is outside this plan.

The app from hermes-research is copied to `/opt/galion/research/current/`. That path, the user `galion`, and port 8787 are the reference values in `deploy/systemd/galion-research.service` (hermes-research `ed3ce9993f58ec655af4f23c2438eb83cd7ea844`). The unit is not the boot path. `galion-init` starts the same process. The copy is the repository files the app runs from: `package.json`, `src/`, `public/`. There is no `node_modules` and no install step. The command is `/usr/bin/node src/server.js`, with `PORT=8787`. `src/server.js` binds the loopback interface. `GET /` and `GET /research` serve `public/research.html` from that app. That desk is not the static page in `site/research/`.

`GET /one` on this app redirects. With `GALION_ONE_URL` unset, `oneTarget` in `src/server.js` sends the browser to `https://galion.app/one`. That default leaves the machine. The image does not set `GALION_LLM_KEY`. The app's README keeps that key on the server that holds it, and out of responses. With `GALION_RESEARCH_URL` unset, the README says Hermes is the engine on this machine, and a missed answer is marked local. `researchOrigin` accepts an `https` origin when the variable is set, so a public research URL is possible and this plan does not set one.

**Decided.** `GALION_ONE_URL` is the console's `/one` on port 18181, using http on the IPv4 loopback interface. `oneTarget` accepts an http loopback origin (`researchOrigin` in `src/server.js`). `PORT` is 8787. `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` stay unset. `configFromEnv` in `src/hermes.js` attaches a client only when `GALION_LLM` is `hermes`, or when `GALION_LLM` is empty and `GALION_LLM_URL` is set. `canned`, `echo`, and `mock` stay detached. The key stays off the image. `.env.example` points `GALION_ONE_URL` at `https://galion.app/one`. The image does not copy that value.

**Decided.** The Node.js binary is `/usr/bin/node` from Ubuntu 26.04's `nodejs` package, version 22.22.1 ([packages.ubuntu.com/resolute/nodejs](https://packages.ubuntu.com/resolute/nodejs)). hermes-research CI installs `node-version: "22"`. `package.json` and `ci.yml` do not record a tarball checksum, so this plan does not invent one. The package manager is not left running as an updater.

**Decided.** The console, the static pages, and the research desk stay three documents. The desktop README quotes the content-security policy: `connect-src 'self'`. The page source contains no `http://` or `https://` (`page_stays_on_the_machine` in `page.rs`). A browser on the console origin does not call port 8787. A person opens the desk on its own loopback URL. A same-origin path would be a change in obsidian-open-mind, and it is outside this note.

### 4.4 What stays off the image

- Voice weights, checkpoints, embeddings, and model containers. Same rule as the voice packaging note.
- Billing and payments. They are outside this plan.
- A listener on a public address.
- The Open Mind release set (`galion-one`, `galion-desk`, `room`, `desk-hermes`, `link-watch`), until an owner adds one of them by name.
- A shell and a package manager on the voice image. The desktop image is a second root, so it can carry `/usr/bin/node` without putting a package manager on the voice image. See [§2](#2-the-image-this-plan-is-for).
- This repository's link-check workflow, the brand marks, and the Labs kit. They are documents and site source. They are not operating-system programs. The site pages named in §4.2 and §4.3 are the exception, and they are copied as pages.

## 5. First boot

The policy for this image:

1. The machine boots without an account gate and without a licence key.
2. **Planned, and decided.** The first image follows the desktop crate. It does not play a boot tone. A 432 Hz boot resonance stays planned.
3. **Planned, and decided.** Silence mode is opt-in. The first image does not implement it.
4. **Planned, and decided.** Persistent Silence stays planned. The page does not store it. The first image has no Silence file.
5. A missing sound device still finishes boot. The voice profile already treats a missing `/dev/fb0` as a normal boot. The desktop image treats a missing playback device the same way: the console still comes up.
6. Listeners bind after `galion-init` has brought up the loopback interface. `openmind-desktop --listen` on port 18181, then `node src/server.js` in `/opt/galion/research/current` on port 8787. `GALION_ONE_URL` is that console's `/one`.
7. Pricing and billing are outside this plan.

What the repositories already implement is narrower than that policy.

- The only 432 Hz generator in the desktop crate is the wake tone: 160 ms, ratio 1:1, peak amplitude 0.32, 16 kHz mono, synthesised in the binary. The page script does not play `wake`.
- hermes-research records 432 Hz as `RESEARCH_A` and a table of ratios. Those are definitions. The app does not play them.
- Mute on the console is a button for that page load. Night hours 22:00–06:59 skip the tones the script plays. Neither control is named Silence, and neither is stored.

**Decided.** The first image follows the crate. `wake` stays in the page, and the script does not call `play("wake")`. The clip is a sine, 432 Hz, 160 ms, peak amplitude 0.32, 16 kHz, 8 ms fade (`sound.rs`). Mute and local hours 22:00–06:59 skip `play`. The page has no `localStorage`. A 432 Hz boot tone and persistent Silence stay planned. See [§10](#d3-first-boot-sound-decided).

**Settled.** On this image, the audio Silence can reach is the seven desktop tones: `wake`, `ask`, `hear`, `notice`, `done`, `deny`, `close`. hermes-research `src/cues.js` says "Definitions only" and holds no wav files. Its `audible` function returns false when silence is true, `"on"`, or `"1"`. That flag marks a definition quiet. It plays nothing. Galion Voice audio stays on the voice image.

## 6. Target architectures

| Order | Architecture | What the first cut includes | What blocks the next cut |
|---|---|---|---|
| First | `x86_64` | The desktop image. Ubuntu 26.04 LTS. `openmind-desktop` from the `ubuntu-latest` job. hermes-research under Node.js 22.22.1. The static pages, as files. | `galion-init` does not exist yet, so the image cannot boot. This plan adds no workflow and no publish job. |
| Second | `aarch64` | Roadmap. The root README already names ARM boards, Snapdragon, and Raspberry Pi-class machines. The voice packaging note already names the triple `aarch64-unknown-linux-musl` for the three voice binaries. The desktop workflow already builds and tests that triple. | The aarch64 job does not write a tarball and does not build a disk image. No board revision is named. |

The first published image is one x86_64 ISO and one x86_64 disk image. An aarch64 ISO or disk image is absent from that publication. The channel in [§9](#9-update-channel) does not advertise an aarch64 file that CI has not built.

The voice binaries' two musl triples stay on the voice archive's own manifest. Building those binaries is the voice packaging note's job. This plan does not fold them into the desktop tarball.

**Settled.** The first publication has no aarch64 ISO and no aarch64 disk image. No board, firmware file, or boot partition is named. The root README and the voice note name the class.

**Settled.** An aarch64 desktop binary, when one is packaged, uses `aarch64-unknown-linux-musl`, the triple the `linux-aarch64` job already builds and tests. The x86_64 tarball stays the `ubuntu-latest` host build, which passes no `--target`.

## 7. Build pipeline

CI in this repository, later, produces the image. This note is the sketch. The workflow file is not part of this change, and a run of this sketch does not publish.

The voice archive and the Open Mind release already refuse a publish flag unless an owner turns a gate on. The image pipeline keeps that shape.

### Pins

One manifest, written before the image build, records:

- `name` — `galion-os`
- `profile` — `desktop`
- `version` — a semver git tag of this repository, the same rule as the voice archive (`version` in [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4). The desktop crate's version stays inside the `openmind` pin. This repository has no package version. This plan creates no tag.
- `git` — full commit of this repository
- `openmind` — full commit of obsidian-open-mind
- `research` — full commit of hermes-research
- `base` — `ubuntu-26.04`
- `arch` — `x86_64` on the first cut
- `node` — `22.22.1`, from Ubuntu 26.04's `nodejs` package, at `/usr/bin/node`
- `init` — `galion-init`, absent until that binary exists
- `weights` — `none`

### Jobs

The jobs are ordered. A red job stops the chain. Nothing in the chain passes `--publish`, `--upload`, or `--gh-release` to `package-local.sh`.

1. **desktop** — `ubuntu-latest`. Checkout the pinned obsidian-open-mind commit. Run the same build the desktop workflow runs: `cargo build -p openmind-desktop --release --locked`, then `scripts/desktop/package-local.sh`. Keep the tarball and `SHA256SUMS` as a job artifact. Do not upload them to a release.
2. **research** — Node.js 22. Checkout the pinned hermes-research commit. Run `npm test`. Archive the tree. Fail if `node_modules` is present.
3. **pages** — From this repository, copy `site/one/` and `site/research/` unchanged, and copy [NOTICE](../NOTICE).
4. **image** — An Ubuntu 26.04 root consumes the artifacts and writes two files. The root inside both files includes `NOTICE`, `galion-init` once that binary exists, the console, the research tree, and the static pages as files. The job is not in this change. It stays off until `galion-init` exists and an owner asks for the workflow.
   - `galion-os-<version>-x86_64.iso`
   - `galion-os-<version>-x86_64.img`
   Write `SHA256SUMS` over both, and write the manifest beside them.
5. **sign** — [§8](#8-signing). Runs only when the owner gate is on. A pull request build does not run job 4.
6. **publish** — Does not exist until the owner asks for a release. This plan does not add a release job, a tag, or a download link on the root README.

**Settled.** This change adds no workflow. Job 4 does not run. No file read for this note records an image build on a hosted runner, so this plan does not claim that `ubuntu-latest` can finish one.

**Settled.** One root, two files. The ISO is a hybrid of that root, the usual shape of a file a person writes onto a disk. The img is the raw disk image of the same root. Neither file is an installer. The voice note says the production image has no installer and the owner swaps the image ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §7).

**Settled.** Binaries inside the image follow the voice bar: reproducible against the recorded `rustc`, triple, and lockfile hash ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §5). The ISO and the img record the manifest pins. This plan does not claim those disk-image bytes are bit-identical. No image has been built here.

A pull request that touches this document does not run jobs 4–6. The link-check workflow already on this repository stays the check for pages and marks. It does not build an image.

## 8. Signing

The signature story that already exists is keyless cosign, GitHub OIDC, a bundle per file.

- Open Mind `release.yml` runs `cosign sign-blob --yes --bundle <file>.sigstore.json <file>` over the tarball, the CycloneDX SBOM, and `SHA256SUMS`, and only when `RELEASE_ENABLED` is `true` and the repository is public. The verify hint in that workflow uses the certificate identity regexp `https://github.com/galion-studio/obsidian-open-mind/` and the issuer `https://token.actions.githubusercontent.com`.
- The voice packaging note uses the same keyless cosign for the voice archive, and that archive is not published yet.

The desktop image uses that same tool on the files job 4 writes:

- `galion-os-<version>-x86_64.iso`
- `galion-os-<version>-x86_64.img`
- `SHA256SUMS`
- the manifest

Each file gets a `<file>.sigstore.json` bundle. The identity regexp for a workflow in this repository is `https://github.com/galion-studio/galion-operating-system/`. The issuer is `https://token.actions.githubusercontent.com`. The sign job asks for `id-token: write` and nothing wider. It does not hold a long-lived private key in the repository.

The owner gate matches the Open Mind shape: a repository variable, off until the owner sets it, and no signing from a pull request. Keyless cosign writes to the public Rekor log. Open Mind's release comment says that is why the job stays off while a repository is private. This repository's publish gate stays off for the same reason until the owner wants a public signature.

**Settled.** The signature is keyless cosign on the downloaded files. This plan adds no firmware key. The voice packaging note does not name one, and the desktop files read for this list (`lib.rs`, `openmind-desktop.yml`, `galion-boot`, `galion-one.service`) do not name one.

**Settled.** Signing, when a workflow exists, stays in this repository. The identity regexp is `https://github.com/galion-studio/galion-operating-system/`. No move is proposed.

**Settled.** The check runs on the machine that holds the downloaded files, before the owner swaps the image. The image does not carry `cosign`. The voice archive's three binaries are `galion-init`, `galion-voiced`, and `galion-probe` ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4). The A/B swap stays unimplemented (§6 of that note).

## 9. Update channel

One channel for Galion OS images. The device does not run the base distribution's package updater. That keeps a single path, and it matches the voice note: updates are an image swap, and the swap is unimplemented.

What the channel carries, once an owner opens it:

| File | First publication |
|---|---|
| `galion-os-<version>-x86_64.iso` plus its `.sigstore.json` | Yes, after the owner gate. |
| `galion-os-<version>-x86_64.img` plus its `.sigstore.json` | Yes, after the owner gate. |
| `SHA256SUMS` and the manifest, each signed | Yes. |
| Any `aarch64` file | No. Absent until [§6](#6-target-architectures) has a green build. |

A machine applies an update only as a whole image, and only after the signature check in [§8](#8-signing) succeeds. Silence mode does not freeze the channel. Silence is the sound policy in [§5](#5-first-boot). It is not a refusal of updates.

The voice archive (`galion-os-voice-<version>-<triple>.tar.xz`) stays a different publication. It is three binaries and no kernel. Mixing it into this channel would make a tarball look like a disk image.

There is no channel URL in this note. This repository does not deploy, and galion.app's host is an owner decision. The root README is where a download will be listed once an image exists. Until then the README stays as it is.

**Settled.** This note names no hostname and no path. [site/README.md](../site/README.md) says hosting and any DNS change are the owner's later steps, and this repository does not do them. The index, when a host exists, is the signed manifest and `SHA256SUMS` already described above. The root README lists a download once an image exists.

**Settled.** A/B stays the unimplemented hold in [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §6. This plan adds no partition map, no bootloader, and no slot-flip program.

**Settled.** Two publications. The desktop files are `galion-os-<version>-x86_64.iso` and `.img`. The voice publication stays `galion-os-voice-<version>-<triple>.tar.xz`. Each manifest keeps its `profile` field, `desktop` or `voice`.

**Settled.** Whole images only. No delta format is specified in this repository, in the voice note, or in hermes-research.

## 10. Decisions for Maciej

Decided by Maciej on 2026-11-15 at 15:00 CET. Pricing and billing are outside this plan. The readings below still use obsidian-open-mind `de7480e71ce98191d2ee11f018fa15be6c5a1707` and hermes-research `ed3ce9993f58ec655af4f23c2438eb83cd7ea844`.

### D1. Base, decided

Ubuntu 26.04 LTS. Its archive `nodejs` package is 22.22.1 on amd64 and arm64 ([packages.ubuntu.com/resolute/nodejs](https://packages.ubuntu.com/resolute/nodejs)), which meets hermes-research `"node": ">=22"`. The path is `/usr/bin/node`. Kernel and firmware are that release's. `unattended-upgrades` stays off the image. The manifest field `base` is `ubuntu-26.04`.

The comparison in [§3](#3-base-distro-options) stays as the record of the rows that were set aside. The voice image builder stays unchosen in the voice note.

### D2. Init, decided

Wait for `galion-init`. The desktop image does not boot through systemd. It does not boot through the `galion-boot` supervisor.

`galion-init` is not in this repository. It is not at `crates/galion-init` in the Open Mind commit above. Until that binary exists, this image does not boot, and the image job in [§7](#7-build-pipeline) stays off.

The voice note already says what the binary is ([voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §3 and §6, [voice-first.md](voice-profile/voice-first.md)). Before this desktop image can boot, that binary must provide all of the following.

| What `galion-init` must provide | Where that requirement comes from |
|---|---|
| The binary itself, static musl, as PID 1. | Voice packaging note §3. It is absent today. |
| Mount the filesystems. The desktop root is squashfs. | Voice packaging note §3. This plan's root type. |
| Bring up the network far enough that the loopback interface exists. | Voice packaging note §3: it brings up the network. The listeners in [§5](#5-first-boot) bind after that. |
| Set the clock. | Voice packaging note §3. |
| Start processes itself. The production image has no shell. | Voice packaging note §3. |
| Supervise `/opt/galion/openmind-desktop/openmind-desktop` with no listen address, so the crate uses port 18181. Run it as user `galion`. | This plan, and `DEFAULT_PORT` in `lib.rs`. |
| Supervise `/usr/bin/node src/server.js` in `/opt/galion/research/current`, as user `galion`, with `PORT=8787` and `GALION_ONE_URL` set to the console's `/one` on port 18181. | This plan. The path, user, and port match the research unit, which is reference only. |
| Leave `galion-voiced` off this image. | The voice image is the other root. The voice note's supervision of `galion-voiced` stays there. |
| Leave the Rust `galion-one` binary off this image. | `galion-one.service` has no `[Install]`. `stack.rs` marks it `planned`. |

Systemd units stay as reference. They are not installed as the boot path.

| Unit | What it is used for | What it is not |
|---|---|---|
| `deploy/systemd/galion-research.service` in hermes-research | User `galion`, directory `/opt/galion/research/current`, port 8787, command `/usr/bin/node src/server.js`. | Not PID 1. Not enabled by this image. |
| `deploy/galion-one.service` in obsidian-open-mind | A record that the Galion One binary stays off, and that the unit has no `[Install]` section. | Not installed. |

### D3. First-boot sound, decided

Follow the desktop crate. The first image adds no boot player and no Silence file.

`wake` stays in the page. The script does not call `play("wake")`. Mute and local hours 22:00–06:59 skip `play`. Mute lasts one page load. The page has no `localStorage`.

A 432 Hz boot tone stays planned. Persistent Silence stays planned.

### D4. Access, decided

Static pages stay files under `/opt/galion/site/one/` and `/opt/galion/site/research/`. No new listener. No browser package is added. No repository names one.

`GALION_ONE_URL` is the console's `/one` on port 18181, http on the IPv4 loopback interface. `oneTarget` accepts that shape. The console's content-security policy is `connect-src 'self'`, so the console page does not call port 8787. A person opens the research desk on its own loopback URL.

`GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` stay unset. `PORT` is 8787.

### D5. Copyright, decided

This repository has a [NOTICE](../NOTICE). It carries the four G.A.L.I.O.N. lines and the MIT line `Copyright (c) 2026 Galion Labs`, matching [LICENSE](../LICENSE). The image root includes that file. Each other tree keeps its own `LICENSE`. This NOTICE does not replace them.

### Settled, and still standing under those decisions

| Topic | Answer | Source |
|---|---|---|
| What this image is | A third boot: the loopback control console. The Hermes GUI stays the later profile. | [README](../README.md) profile table, [voice-first.md](voice-profile/voice-first.md), [hermes-later.md](voice-profile/hermes-later.md), `stack.rs` |
| Roots | Two. The voice root stays read-only, with no shell and no package manager. The desktop root starts Node.js 22. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §6, hermes-research `package.json` |
| Packages and updates | Four payloads plus the base boot set. The base updater stays off the image. | [§4](#4-what-the-image-carries), [§9](#9-update-channel) |
| Kernel, firmware, filesystem | Ubuntu 26.04's kernel and firmware. Root is squashfs. No Silence state file. | [D1](#d1-base-decided) and [D3](#d3-first-boot-sound-decided). |
| Account | User `galion` for the console and for Node.js. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §7. The research unit records the same user and is reference only. |
| Desktop port | 18181, the crate default. The image passes no override. 18080 is the console probe. 18081 stays unused. | `DEFAULT_PORT` in `crates/openmind-desktop/src/lib.rs` |
| Research port and Node | `PORT=8787`. Node is `/usr/bin/node` from Ubuntu 26.04, version 22.22.1. No tarball checksum is invented. | [packages.ubuntu.com/resolute/nodejs](https://packages.ubuntu.com/resolute/nodejs), `src/server.js` |
| Research environment | `GALION_ONE_URL` is the console's `/one` on port 18181. The other variables stay unset. | [D4](#d4-access-decided). `oneTarget` in `src/server.js`. |
| Galion One binary | Off this image. The static page stays. | `galion-one.service` has no `[Install]`. `stack.rs` marks `galion-one` `planned`. |
| Silence scope | The seven desktop tones. Research cues are definitions. `audible()` marks one quiet and plays nothing. Voice audio is the other image. | `sound.rs` `TONES`, `src/cues.js` |
| Image version | Semver git tag of this repository. Component versions stay pins. No tag is created here. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4 |
| aarch64 | No disk image and no board in the first publication. A later binary uses `aarch64-unknown-linux-musl`, the triple CI already tests. The x86_64 tarball stays the host build. | `openmind-desktop.yml`, [README](../README.md) |
| ISO and img | One squashfs root. The ISO is a hybrid a person can write to a disk. The img is the raw disk. No installer. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §7 |
| Reproducibility | Record the pins. Binaries follow the voice bar. Disk-image bytes are not claimed bit-identical. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §5 |
| Pipeline | No workflow in this change. Job 4 does not run. Signing, when it exists, stays in this repository, keyless cosign, gate off. No firmware key. `cosign` is not on the image. The check happens before the swap. | [§7](#7-build-pipeline), [§8](#8-signing), voice archive layout |
| Channel | No hostname and no path. Two publications, whole images only. A/B stays the unimplemented hold. | [site/README.md](../site/README.md), [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §6 |

Fedora bootc, NixOS, and Yocto stay off the short list. [§3](#3-base-distro-options) already records that nothing in the Galion repositories names bootc or Yocto, and that no Galion repository uses Nix. Buildroot stays the voice note's unchosen builder.

### Where the old 31 went

| Old questions | Now |
|---|---|
| 2, 4, 6, 8, 10, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31 | Settled, table above |
| 5 | DECIDED with D1. Ubuntu 26.04 kernel and firmware. Squashfs. No Silence state file, because D3 keeps persistent Silence planned. |
| 9 | DECIDED in D4 |
| 1 | DECIDED in D2 |
| 3 | DECIDED in D1 |
| 7, 11 | DECIDED in D4 |
| 12, 13, 14 | DECIDED in D3 |
| 29 | DECIDED in D5. [NOTICE](../NOTICE) |

## 11. What this change does not do

- It does not add a GitHub Actions workflow. The base is Ubuntu 26.04 LTS, and the image still waits on `galion-init`.
- It does not build or publish an ISO or a disk image.
- It does not edit the root README, the voice-profile notes, the landing pages, or the brand guide.
- It does not deploy galion.app, change DNS, or open a public listener.
- It does not change billing, a price, or a payment form. Pricing is outside this plan.
- It does not put a weight file in the tree.

## Licence

The four Galion Labs lines, then the MIT licence text from this repository's [LICENSE](../LICENSE).

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

```
MIT License

Copyright (c) 2026 Galion Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

— Maciej Grajczyk
