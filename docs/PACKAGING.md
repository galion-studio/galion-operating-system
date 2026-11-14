# Galion OS image — packaging plan

*Maciej Grajczyk · 2026-11-14 (Europe/Zagreb, CET, UTC+1).*

Galion OS has no image. Nothing in this repository builds a kernel, an ISO, or a disk image, and nothing here publishes one. This note is the packaging plan for the image that carries the Obsidian desktop. It is a document. It adds no workflow, no image, and no release.

The voice-profile note, [PACKAGING.md](voice-profile/PACKAGING.md), stays the contract for the Galion OS Voice binaries and for the later voice image (read-only root, no display server, Hermes off the device). This note does not replace that one. The two images are named apart in [§2](#2-the-image-this-plan-is-for).

Words for status stay the brand words. **In development** means the work is underway and is not something a person can take as finished. **Roadmap** means a later image. **Planned** means a choice written here that is not built. An **open question** is a fact this note does not have. It is left open on purpose.

## 1. What is already true

These points come from files that exist today. They are the floor of the plan.

| Fact | Where it is written |
|---|---|
| Galion OS is free forever, MIT, Linux and Rust, CPU-first. No account and no licence key. No image is published from this repository. | [README.md](../README.md), [brand guide](brand/BRANDING-V2.md) |
| Two profiles share `galion-init` and the Obsidian Open Mind contract. Galion OS Voice is first: no X11, Wayland, or compositor. The Hermes GUI is later: one window, one gradient, one prompt field. | [voice-first.md](voice-profile/voice-first.md), [hermes-later.md](voice-profile/hermes-later.md) |
| The voice image builder is unchosen. The note names buildroot or a custom initramfs and does not pick. Updates by A/B image swap are a design hold, and they are unimplemented. The voice archive, when it exists, is signed with keyless cosign. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §4 and §6 |
| `openmind-desktop` is the local control console in [galion-studio/obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind), crate `openmind-desktop`. It is a loopback page: stack list, one prompt, file gate, read-only probes, seven tones tuned from 432 Hz. It calls no model. The listen address is configurable. A non-loopback address is refused before a socket exists. The port number is not fixed here. | [Cargo.toml](https://github.com/galion-studio/obsidian-open-mind/blob/main/crates/openmind-desktop/Cargo.toml), [desktop README](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md) |
| The only CI job for that crate runs on `ubuntu-latest` (Linux x86_64). It builds, tests, and writes a local tarball. It does not upload the tarball and it does not create a release. `package-local.sh` can take `--target TRIPLE` when the toolchain already has that triple. No aarch64 job is in that workflow. | [openmind-desktop.yml](https://github.com/galion-studio/obsidian-open-mind/blob/main/.github/workflows/openmind-desktop.yml), [package-local.sh](https://github.com/galion-studio/obsidian-open-mind/blob/main/scripts/desktop/package-local.sh) |
| The Open Mind release archive, when the owner enables it, is `obsidian-open-mind-<tag>-x86_64-linux.tar.gz`. The binaries it copies are `galion-one`, `galion-desk`, `room`, `desk-hermes`, and `link-watch`. `openmind-desktop` is not in that list. Signing there is keyless cosign over GitHub OIDC, and the job stays off unless the repository is public and `RELEASE_ENABLED` is `true`. | [release.yml](https://github.com/galion-studio/obsidian-open-mind/blob/main/.github/workflows/release.yml) |
| On the console, Galion One and Hermes are stack rows in state `planned`. The page does not start them. `GET /one` and `GET /research` are short entry pages inside the same binary. They are not the marketing pages in this repository, and they are not the research app. | `crates/openmind-desktop/src/stack.rs` and `page.rs` in obsidian-open-mind |
| The wake tone is a 160 ms sine at 432 Hz (ratio 1:1). The page embeds it and the script does not play it. Mute starts off (`aria-pressed="false"`). Local hours 22:00–06:59 skip the tones the script does play. Mute is not stored: the page has no `localStorage`. | [desktop README](https://github.com/galion-studio/obsidian-open-mind/blob/main/docs/desktop/README.md), `sound.rs` and `page.rs` |
| [site/one/](../site/one/index.html) is the Galion One page for the path `galion.app/one`. Plus is $20 / €20 per month. Billing is not live. `paid_tiers` stays false. | [site/one/index.html](../site/one/index.html) |
| [site/research/](../site/research/index.html) is the Galion Research page for the path `galion.app/research`. Ultra is $220 / €220 per month. Billing is not live. | [site/research/index.html](../site/research/index.html) |
| [galion-studio/hermes-research](https://github.com/galion-studio/hermes-research) is the research app. Node.js 22 or newer, no packages. `npm start` runs `node src/server.js`, binds the loopback interface, and serves the desk at `/research` on port 8787 unless `PORT` is set. Research cues in [src/cues.js](https://github.com/galion-studio/hermes-research/blob/main/src/cues.js) are 432 Hz just-intonation ratios. The file says definitions only: no voice audio, no clones, no wav files. The app ships no voice model. | hermes-research `README.md`, `package.json`, `src/cues.js` |
| Galion Voice weights are not in git. The voice packaging manifest keeps `weights` at `none` until counsel signs a separate weight artifact. | [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §3, [galion-one-voice](https://github.com/galion-studio/galion-one-voice) README |
| This repository does not deploy galion.app and does not change DNS. Hosting the pages is an owner decision. | [site/README.md](../site/README.md) |

The Rust unit `deploy/galion-one.service` in obsidian-open-mind starts `/opt/galion/openmind/dist/bin/galion-one` on `127.0.0.1:8091`, with the mouth on `127.0.0.1:8002`. The unit has no `[Install]` section. That binary is a different artifact from the page at `galion.app/one`. This plan does not put it on the image. Whether a later edit adds it is an open question, recorded in [§10](#10-open-questions).

## 2. The image this plan is for

One image family, two profiles that already have notes, and one desktop payload that those notes do not package.

| Image | Profile note | Display | This plan |
|---|---|---|---|
| Galion OS Voice | [voice-first.md](voice-profile/voice-first.md) | None. At most one dot on `/dev/fb0`. | Unchanged. Built later, under the voice packaging note. It does not carry `openmind-desktop`, the site pages, or the hermes-research app. |
| Hermes GUI | [hermes-later.md](voice-profile/hermes-later.md) | One window, one gradient, one prompt field. | Roadmap. The window backend is still an owner pick in that note. |
| Desktop image | This file | The control console, on loopback. | The image this plan describes. x86_64 first. |

**Open question.** The voice note says both profiles boot through `galion-init`. `galion-init` is not in this repository. Whether the desktop image also uses `galion-init` as PID 1, and what that process supervises besides `galion-voiced`, is open. The voice packaging note specifies a production image with no shell and no package manager. The research app needs a Node.js 22 binary. No single root in this plan satisfies both yet.

**Open question.** The Hermes GUI and the desktop image may be the same boot or two boots. The GUI note describes one window with Hermes at the centre. The desktop crate describes a loopback HTML console that does not start Hermes. This plan packages the console. It does not decide that the console is that window.

## 3. Base distro options

No base is chosen. The voice packaging note already leaves the image builder unchosen. This section compares bases against the constraints that are already written: Linux, CPU-first, x86_64 then aarch64, a read-only voice root with no package manager and no shell, static musl for the three voice binaries, a glibc `ubuntu-latest` build of `openmind-desktop` today, and a Node.js 22 process for hermes-research.

The owner picks one row. Until that pick, the pipeline in [§7](#7-build-pipeline) stops before the image build.

| Option | What it gives this image | What it costs |
|---|---|---|
| Debian stable | A small package set can be baked in, then left frozen. Node.js 22 exists for x86_64 and aarch64. Hardware coverage is wide, including boards in the Raspberry Pi class the root README already names. | glibc, not the musl triple the voice binaries use. An `apt` database left on the device is a second update path beside the image channel in [§9](#9-update-channel). Reproducibility is a snapshot of a mirror at a date. |
| Ubuntu LTS | Same family as Debian, with a newer hardware enablement stack for laptops. | Larger. If `unattended-upgrades` stays installed, the machine has a second update channel that this plan does not operate. |
| Fedora bootc (image mode) | The deliverable is already a disk image. Updates are an atomic image pull. Signing and measured boot have an upstream story. | Heavier than a musl voice root. Nothing in the Galion repositories names bootc. A Galion image would still replace Fedora's update remote with the channel in [§9](#9-update-channel). |
| Alpine | musl, small, aarch64 is first-class. Closest of the general distributions to the voice triples `x86_64-unknown-linux-musl` and `aarch64-unknown-linux-musl`. | The desktop CI builds on glibc Ubuntu. An Alpine root runs that binary only after a musl rebuild. That rebuild has no job in `openmind-desktop.yml`. Node.js on musl is a separate pin from Debian's Node.js. |
| NixOS | One lock can pin Node.js 22, the Rust toolchain, and the three product commits. A generation is an update. | No Galion repository uses Nix today. Evaluating the image in CI is its own cost. The voice rule "no package manager on the device" and a Nix store on the device are different models, and this note does not merge them. |
| Buildroot | Already named in the voice packaging note. Read-only root, no package manager on the device, small, cross-build to aarch64 is ordinary. | Node.js and a browser are awkward guests. The desktop is an HTML page. Buildroot does not, by itself, decide what draws that page. |
| Yocto | Image recipes, and signed A/B updates through a project such as RAUC, Mender, or swupdate. aarch64 is ordinary. | Slow CI. Nothing in the Galion repositories names Yocto. The update project would still have to match the hold in [§9](#9-update-channel). |

Shared costs, whichever row is picked:

- The voice image and the desktop image can share a base only if that base can omit a shell and a package manager on the voice image and still start Node.js 22 on the desktop image. **Open question.** One root filesystem with two manifests, or two roots.
- A package manager on the running desktop image would publish updates beside the image channel. This plan keeps updates on the image channel. The base's own updater stays off the image, or the owner records an exception. **Open question.** Which packages are baked in, and which updater binaries are deleted from the root.
- **Open question.** Kernel version, firmware set, and whether the root is squashfs, erofs, or a plain ext4.

## 4. What the image carries

The desktop image carries four pieces. Each piece stays the bytes of its own repository, pinned by a full git commit in the manifest. The image does not build them from a floating branch tip.

Loopback is the bind for every listener. The desktop crate refuses any other address. The research app binds the loopback interface. The image does not add a reverse proxy, a public port, or a tunnel. A tunnel, if an owner wants one, stays the owner's step, as the voice packaging note already says.

### 4.1 openmind-desktop

Ships as the release binary `openmind-desktop`, built the way [package-local.sh](https://github.com/galion-studio/obsidian-open-mind/blob/main/scripts/desktop/package-local.sh) already builds it: `cargo build -p openmind-desktop --release --locked`, then a tarball named `openmind-desktop-<version>-<host>.tar.gz` plus `SHA256SUMS`. The archive also holds `LICENSE`, the desktop README, `console.html` from page mode, and `LOCAL-ARTIFACT.txt`.

On the image the plan places that binary at `/opt/galion/openmind-desktop/openmind-desktop`. The prefix `/opt/galion/` is the prefix already used by `deploy/galion-one.service` in obsidian-open-mind. The directory `openmind-desktop` under it is this plan. The unit file for it does not exist yet.

The process starts on loopback. The port is configurable. With no address, the binary uses its own default. That default is the one the obsidian-open-mind change sets when it moves the console off port 18081, which clashes with a staging page on the server. This plan does not choose the replacement number.

```sh
/opt/galion/openmind-desktop/openmind-desktop --listen
```

An address may be passed to `--listen` when the image needs a different loopback port. A non-loopback address is still refused.

The voice packaging note names the unprivileged user `galion` for the voice binaries on plain Linux. **Open question.** Whether this process runs as that same account. **Open question.** The numeric default port, which belongs to that obsidian-open-mind change and not to this note.

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

The page stays a page. It has no payment form. Plus remains $20 / €20 per month, written down, with billing not live.

Galion Voice weights stay off this image. The voice packaging manifest keeps `weights` at `none`. A weight file would be a separate artifact, a separate checksum, and a separate licence, after counsel signs. The image does not fetch weights at boot.

**Open question.** Which process serves `/opt/galion/site/one/` on the loopback interface. `openmind-desktop` already occupies `/one` with its own short entry. The console page does not load `https://` URLs. The plan does not point the console at the public web.

**Open question.** Whether the Rust `galion-one` binary (loopback `127.0.0.1:8091`) is added beside the static page. This plan leaves it off. The console does not start it.

### 4.3 Galion Research, the page and the app

Both ship. They are different trees.

The static page in [site/research/](../site/research/index.html) is copied to `/opt/galion/site/research/`. It is the page written for `galion.app/research`. Ultra remains $220 / €220 per month, written down, with billing not live. Copying the files is not a deploy.

The app from hermes-research is copied to `/opt/galion/research/`. The copy is the repository files the app runs from: `package.json`, `src/`, `public/`. There is no `node_modules` and no install step. `src/server.js` listens on `127.0.0.1` and port 8787 unless `PORT` is set. `GET /` and `GET /research` serve `public/research.html` from that app. That desk is not the static page in `site/research/`.

`GET /one` on this app redirects. With `GALION_ONE_URL` unset, `oneTarget` in `src/server.js` sends the browser to `https://galion.app/one`. That default leaves the machine. The image does not set `GALION_LLM_KEY`. The app's README keeps that key on the server that holds it, and out of responses. With `GALION_RESEARCH_URL` unset, the README says Hermes is the engine on this machine, and a missed answer is marked local. `researchOrigin` accepts an `https` origin when the variable is set, so a public research URL is possible and this plan does not set one.

**Open question.** The environment block the image passes. In particular `GALION_ONE_URL`, `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `PORT`. This note does not invent values. Leaving `GALION_ONE_URL` unset keeps the public redirect above. Canned, echo, and mock stay off that client, which is already the app's rule.

**Open question.** Where the `node` binary comes from: a package baked from the base in [§3](#3-base-distro-options), or a pinned upstream Node.js tarball checked by sha256. The app requires Node.js 22 or newer. The voice image's "no package manager" rule makes the second option the one that keeps the voice root free of a package database, and this note does not choose it yet.

**Open question.** How a person moves from the console's `GET /research` entry to the desk on port 8787, and to the static page under `/opt/galion/site/research/`. Three documents exist. The image carries all three. The route between them is open. The console's content-security policy allows connections only to its own origin, so a browser on the console will not call port 8787 unless the desktop crate grows a same-origin path. That change belongs in obsidian-open-mind, and it is not part of this note.

### 4.4 What stays off the image

- Voice weights, checkpoints, embeddings, and model containers. Same rule as the voice packaging note.
- A payment form, a card field, or a licence check. `paid_tiers` stays false.
- A listener on a public address.
- The Open Mind release set (`galion-one`, `galion-desk`, `room`, `desk-hermes`, `link-watch`), until an owner adds one of them by name.
- A shell and a package manager on the voice image. The desktop image's exception, if it needs one to start Node.js, is the open question in [§2](#2-the-image-this-plan-is-for).
- This repository's link-check workflow, the brand marks, and the Labs kit. They are documents and site source. They are not operating-system programs. The site pages named in §4.2 and §4.3 are the exception, and they are copied as pages.

## 5. First boot

The policy for this image:

1. The machine boots without an account gate and without a licence key.
2. 432 Hz resonance is on.
3. Silence mode is opt-in. A new image is not in Silence. A person turns Silence on. The image does not ask them to opt in before the first resonance.
4. Silence, once chosen, is the mode on the next boot as well.
5. A missing sound device still finishes boot. The voice profile already treats a missing `/dev/fb0` as a normal boot. The desktop image treats a missing playback device the same way: the console still comes up.
6. Listeners bind after the loopback interface exists. `openmind-desktop --listen` on its configurable loopback port, then `node src/server.js` in `/opt/galion/research`. The desktop port is the default that obsidian-open-mind change sets. This note does not write the number.
7. Billing stays off. The prices on the copied pages stay the prices already printed there.

What the repositories already implement is narrower than that policy.

- The only 432 Hz generator in the desktop crate is the wake tone: 160 ms, ratio 1:1, peak amplitude 0.32, 16 kHz mono, synthesised in the binary. The page script does not play `wake`.
- hermes-research records 432 Hz as `RESEARCH_A` and a table of ratios. Those are definitions. The app does not play them.
- Mute on the console is a button for that page load. Night hours 22:00–06:59 skip the tones the script plays. Neither control is named Silence, and neither is stored.

**Open question.** Which process plays the boot resonance. Candidates that already exist are the wake clip inside `openmind-desktop`, and no player at all in hermes-research. A sustained tone, a chord, or a player started by PID 1 is not in either repository. Duration, level, and the output device (ALSA, the console's `<audio>` element, or something else) are open with it.

**Open question.** Whether the console's night window also suppresses the boot resonance. The image policy is that resonance defaults on. The page policy is that those hours skip tones. This note does not merge them.

**Open question.** The control a person uses to enter Silence, and the file or boot argument that stores it. The console's Mute button is not that store. The page forbids `localStorage`.

**Open question.** The scope of Silence: the boot resonance only, the seven desktop tones, Galion Voice's sounds, or all of those. The research cues are not audio, so Silence does not switch them off inside `cues.js`.

## 6. Target architectures

| Order | Architecture | What the first cut includes | What blocks the next cut |
|---|---|---|---|
| First | `x86_64` | The desktop image. `openmind-desktop` from the `ubuntu-latest` job. hermes-research under Node.js 22. The static pages. | Nothing further in this plan. The image still waits on the base in [§3](#3-base-distro-options) and on an owner gate before CI may publish. |
| Second | `aarch64` | Roadmap. The root README already names ARM boards, Snapdragon, and Raspberry Pi-class machines. The voice packaging note already names the triple `aarch64-unknown-linux-musl` for the three voice binaries. | `openmind-desktop.yml` has no aarch64 job. `package-local.sh --target` can pass a triple only when the toolchain already has it. No log in this plan shows that the desktop crate links on `aarch64`. |

The first published image is one x86_64 ISO and one x86_64 disk image. An aarch64 ISO or disk image is absent from that publication. The channel in [§9](#9-update-channel) does not advertise an aarch64 file that CI has not built.

The voice binaries' two musl triples stay on the voice archive's own manifest. Building those binaries is the voice packaging note's job. This plan does not fold them into the desktop tarball.

**Open question.** The aarch64 machine for the first board image (which Raspberry Pi, which firmware, which boot partition). The root README names the class. It does not name a board revision.

**Open question.** Whether `openmind-desktop` on aarch64 is a musl binary, to match the voice triples and the Open Mind universal-CPU note, or a glibc binary, to match the desktop CI host. The crate's CI does not record either result for aarch64.

## 7. Build pipeline

CI in this repository, later, produces the image. This note is the sketch. The workflow file is not part of this change, and a run of this sketch does not publish.

The voice archive and the Open Mind release already refuse a publish flag unless an owner turns a gate on. The image pipeline keeps that shape.

### Pins

One manifest, written before the image build, records:

- `name` — `galion-os`
- `profile` — `desktop`
- `version` — **open question.** The voice archive uses semver of a git tag. `openmind-desktop` takes the workspace version in obsidian-open-mind (`0.1.0` today). This repository has no package version. Which of those the image version is, or whether it is a new tag of this repository, is open.
- `git` — full commit of this repository
- `openmind` — full commit of obsidian-open-mind
- `research` — full commit of hermes-research
- `base` — the row chosen in [§3](#3-base-distro-options), or `unset` while it is open
- `arch` — `x86_64` on the first cut
- `node` — the Node.js version baked for hermes-research
- `weights` — `none`

### Jobs

The jobs are ordered. A red job stops the chain. Nothing in the chain passes `--publish`, `--upload`, or `--gh-release` to `package-local.sh`.

1. **desktop** — `ubuntu-latest`. Checkout the pinned obsidian-open-mind commit. Run the same build the desktop workflow runs: `cargo build -p openmind-desktop --release --locked`, then `scripts/desktop/package-local.sh`. Keep the tarball and `SHA256SUMS` as a job artifact. Do not upload them to a release.
2. **research** — Node.js 22. Checkout the pinned hermes-research commit. Run `npm test`. Archive the tree. Fail if `node_modules` is present.
3. **pages** — From this repository, copy `site/one/` and `site/research/` unchanged, including the licence text those pages already carry.
4. **image** — The unchosen builder from [§3](#3-base-distro-options) consumes the three artifacts and writes two files from the same root:
   - `galion-os-<version>-x86_64.iso`
   - `galion-os-<version>-x86_64.img`
   Write `SHA256SUMS` over both, and write the manifest beside them.
5. **sign** — [§8](#8-signing). Runs only when the owner gate is on. A pull request build stops after job 4 and discards the files, or it stops before job 4 while the base is `unset`.
6. **publish** — Does not exist until the owner asks for a release. This plan does not add a release job, a tag, or a download link on the root README.

**Open question.** Whether job 4 can finish on a GitHub-hosted `ubuntu-latest` runner. An image build may need a privilege, a device mapper, or more disk than that runner has. The runner class is open with the base.

**Open question.** The difference between the ISO and the img. The voice note says the production image has no installer and the owner swaps the image. This plan keeps that: both files are the bootable root, not an installer wizard. Whether the ISO is a hybrid image that `dd` can write, or a separate optical boot of the same root, is open. The img is the raw disk image.

**Open question.** The reproducible-build bar. The voice binaries are meant to be reproducible against the recorded `rustc`, triple, and lockfile hash. Whether the ISO and the img can meet that bar depends on the base, and it is open until the base is chosen.

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

**Open question.** Whether UEFI Secure Boot is in scope. Keyless cosign signs the file a person downloads. A firmware key that the machine checks at power-on is a different key, and no Galion repository names one.

**Open question.** Who is allowed to sign if the image workflow is ever moved to a different repository. The identity regexp above is this repository, because this is the repository the plan lives in.

**Open question.** The checker on the device. `cosign` is not one of the voice binaries, and the voice size bar is 2 MiB per binary. Whether the image carries `cosign`, a smaller verifier, or checks the bundle on another machine before the swap, is open.

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

**Open question.** The hostname, the path, and the index format (a signed manifest of versions, or a directory of files). No repository names them.

**Open question.** The A/B mechanism the voice note already holds: partition layout, bootloader, which component flips the slot, and how a bad boot returns to the previous image. Naming the channel does not implement that mechanism.

**Open question.** Whether the voice image, when it exists, is a second profile field on this channel or a second channel. The files must stay distinguishable either way. The profile field in the manifest (`desktop` here, `voice` in the voice note) is the marker this plan can write now.

**Open question.** Delta updates. This plan publishes whole images only. A delta format is unspecified.

## 10. Open questions

Collected from the sections above. An answer is an owner edit to this file, or a later change in the repository that owns the code. This note does not guess them.

1. Does the desktop image use `galion-init` as PID 1, and which programs does that init supervise?
2. Is the desktop image the Hermes GUI profile, or a third boot beside it?
3. Which base from [§3](#3-base-distro-options)?
4. One root filesystem for the voice image and the desktop image, or two roots?
5. Kernel version, firmware, and the root filesystem type.
6. Which packages are baked in, and which of the base's updater binaries are left out?
7. Which process serves `/opt/galion/site/one/` and `/opt/galion/site/research/`?
8. Does the image later gain the Rust `galion-one` binary, or does Galion One on the image stay the static page?
9. The environment passed to hermes-research (`GALION_ONE_URL`, `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, `PORT`). With `GALION_ONE_URL` unset, `GET /one` on that app redirects to `https://galion.app/one`.
10. Where the Node.js 22 binary comes from.
11. How `/one` and `/research` on the console meet the static pages and the research desk, given the console's content-security policy.
12. Which process plays the 432 Hz boot resonance, and what the waveform, duration, level, and device are?
13. Does the console's night window suppress that resonance?
14. Which control selects Silence mode, and where is the choice stored?
15. What Silence covers besides the boot resonance.
16. The image version: a tag of this repository, the desktop crate's version, or another scheme.
17. The aarch64 board, firmware, and boot partition for the second image.
18. musl or glibc for `openmind-desktop` on aarch64.
19. Whether the image job fits a GitHub-hosted runner.
20. Hybrid ISO, or a separate optical image of the same root.
21. Whether the ISO and the img are reproducible, and against which inputs.
22. UEFI Secure Boot, and any firmware key.
23. A signing workflow that lives in a repository other than this one.
24. The on-device signature checker, and whether `cosign` itself is on the image.
25. The channel hostname, path, and index format.
26. The A/B slot layout, the bootloader, and rollback.
27. One channel with a profile field, or a separate channel for the voice image.
28. Anything beyond whole-image updates.
29. A `NOTICE` file if the image must reconcile this repository's copyright line (`Copyright (c) 2026 Galion Labs`) with obsidian-open-mind's `LICENSE` (`Copyright (c) 3000 Galion / galion-studio`). hermes-research's `LICENSE` uses the same four Galion Labs lines and the same 2026 MIT line as this repository. Each tree keeps its own `LICENSE` until an owner writes that notice.
30. The account that runs `openmind-desktop` and `node src/server.js`. The voice note names `galion` for the voice binaries. This note does not assign it.
31. The desktop listen port. It is configurable and loopback-only. The number is the default set by the obsidian-open-mind change that moves the console off 18081, because that port clashes with a staging page. This note does not pick a replacement.

## 11. What this change does not do

- It does not add a GitHub Actions workflow.
- It does not build or publish an ISO or a disk image.
- It does not edit the root README, the voice-profile notes, the landing pages, or the brand guide.
- It does not deploy galion.app, change DNS, or open a public listener.
- It does not set `paid_tiers`, take a payment, or put a weight file in the tree.
- It does not choose the base distribution. [§3](#3-base-distro-options) is the comparison. The pick is open question 3.

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
