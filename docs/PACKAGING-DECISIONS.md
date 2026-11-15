# Galion OS image — packaging recommendations

*Maciej Grajczyk · 2026-11-14 (Europe/Zagreb, CET, UTC+1).*

**2026-11-15.** The decision list is [PACKAGING.md](PACKAGING.md) §10. This file is the earlier question-by-question reading. It left every question open. §10 is the list to answer.

This note was written against the plan's list of 31 questions, which at the time sat in §10. It recommended an answer for each one and did not edit the plan. The 2026-11-15 edit of the plan is the list Maciej answers. The pins below are the commits this reading used. The later reading for §10 used obsidian-open-mind `de7480e71ce98191d2ee11f018fa15be6c5a1707` and hermes-research `ed3ce9993f58ec655af4f23c2438eb83cd7ea844`.

The reading is pinned to these commits:

| Repository | Commit | What that commit is |
|---|---|---|
| This repository, branch `cursor/os-packaging-plan-3946` | `514fa127faf4da7d423af09432c6dcf48926f738` | The packaging plan. |
| [obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind) `main` | `1e6b9e5e40201469342dcfb7e133f89dc450150a` | "Desktop: move off port 18081, document the page, build Windows and macOS (#46)", 2026-11-14. |
| [hermes-research](https://github.com/galion-studio/hermes-research) `main` | `466b784b80b40a2efe1798fdfbb377c6d5c80144` | The research app. |
| [galion-one-voice](https://github.com/galion-studio/galion-one-voice) `main` | `4272b20046663291f481ac336c6837daccea6761` | The voice tree. Weights stay out of git. |

Two sentences in the plan were written before that Open Mind commit. The recommendations below follow the commit.

- The plan says the desktop workflow has a single `ubuntu-latest` job and no aarch64 job. [openmind-desktop.yml](https://github.com/galion-studio/obsidian-open-mind/blob/1e6b9e5e40201469342dcfb7e133f89dc450150a/.github/workflows/openmind-desktop.yml) has four jobs: `linux` on `ubuntu-latest`, `linux-aarch64` (target `aarch64-unknown-linux-musl`, tests under qemu-user), `windows`, and `macos`. None of them uploads a tarball or creates a release.
- The plan leaves the desktop listen port unnamed, waiting on the change that moves the console off 18081. That change is the commit above. `DEFAULT_PORT` in [lib.rs](https://github.com/galion-studio/obsidian-open-mind/blob/1e6b9e5e40201469342dcfb7e133f89dc450150a/crates/openmind-desktop/src/lib.rs) is 18181. `DEFAULT_BIND` is IPv4 loopback on that port.

`galion-init` is a name in the voice-profile notes. It is not a path in the obsidian-open-mind tree, and it is not a path in the galion-one-voice tree. This repository still has no Cargo workspace.

## How a row is laid out

Each question has four parts.

- **Recommendation.** The reading. Still open.
- **Why the repositories support it.** Files only. No new measurement.
- **Alternatives.** The other rows the plan already allows, or the other shape the code already has.
- **What Mate must decide.** The part no repository settles.

## 1. Does the desktop image use `galion-init` as PID 1, and which programs does that init supervise?

**Recommendation.** The desktop image follows the init Open Mind already codes. When `/run/systemd/system` is present, systemd is init and the units are ordinary service units. When it is absent, `galion-boot` supervises the processes. `galion-init` stays the PID 1 of the voice image, once that binary exists. The desktop init starts `openmind-desktop` and `node src/server.js`. The loopback static server from question 7 joins that list if Mate accepts it there. The desktop init does not start `galion-voiced`.

**Why the repositories support it.** [voice-first.md](voice-profile/voice-first.md) plans the voice boot as Linux, then static musl `galion-init` as PID 1, then ALSA, then `galion-voiced`, with a read-only root and no shell. [hermes-later.md](voice-profile/hermes-later.md) says both of those profiles boot through `galion-init`. [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) repeats that, and it says the binary is not in this repository. [galion-boot](https://github.com/galion-studio/obsidian-open-mind/blob/1e6b9e5e40201469342dcfb7e133f89dc450150a/crates/galion-boot/src/lib.rs) is a different program: it renders systemd units, or supervises processes where systemd is missing. `systemd_present` is true when `/run/systemd/system` is a directory. The desktop crate and the research app are the two programs [PACKAGING.md](PACKAGING.md) §4 actually places on this image.

**Alternatives.** Wait until `galion-init` exists and teach it to start the console and Node.js as well as `galion-voiced`. That is the sentence the voice notes use for the two profiles. The desktop image is the third boot in question 2, so that sentence does not yet name these two programs.

**What Mate must decide.** Whether the desktop image may boot through systemd, which is the init the Open Mind units assume, or whether the image waits for a `galion-init` that can also start Node.js. The voice production image has no shell. A systemd image is a different machine.

## 2. Is the desktop image the Hermes GUI profile, or a third boot beside it?

**Recommendation.** A third boot. The image carries the loopback control console. The Hermes GUI stays the later profile in its own note.

**Why the repositories support it.** The root [README](../README.md) profile table has two rows: Galion OS Voice, then the Hermes GUI. [hermes-later.md](voice-profile/hermes-later.md) is one window, one gradient, one prompt field, with Hermes at the centre of the screen, and the Hermes binary (Rust gateway or the published Python line) is still an owner pick. [stack.rs](https://github.com/galion-studio/obsidian-open-mind/blob/1e6b9e5e40201469342dcfb7e133f89dc450150a/crates/openmind-desktop/src/stack.rs) lists Hermes as `planned` with the role "Engine. Not started by this page." The same file says nothing on the list is `live`. The desktop README calls the page a command surface: a stack list, one prompt, file gate, probes, and the seven tones. It does not call the page that window.

**Alternatives.** Declare the console to be the Hermes GUI, and put Hermes in the window. No file describes that arrangement. The stack row would have to leave `planned`, and the GUI note would have to accept a loopback HTML page as its window.

**What Mate must decide.** Whether the root README sentence "One window. One gradient. One prompt field." is this console or the later GUI note. The files describe two different programs.

## 3. Which base from §3?

**Recommendation.** For the desktop image, the Ubuntu row. The root is the family of the `ubuntu-latest` runner that already builds and tests the x86_64 console. The workflow does not pin the Ubuntu version, so this note does not write a version number. The base updater stays off the image (question 6). The voice image keeps the builder the voice note already leaves open: buildroot, or a custom initramfs.

**Why the repositories support it.** The `linux` job in `openmind-desktop.yml` runs on `ubuntu-latest` and does not pass `--target`, so the binary it packages is that runner's host triple. The voice note names buildroot or a custom initramfs and does not pick. The packaging plan records that bootc, Nix, and Yocto appear in no Galion repository. The obsidian-open-mind tree and the galion-one-voice tree have no path under those names, and none under `buildroot`. hermes-research CI also runs on `ubuntu-latest`, with Node.js 22 from `actions/setup-node`.

**Alternatives.** Debian stable, the plan's smaller frozen set, with the same glibc distance from the musl voice triples. Alpine, the musl general distribution, which matches the aarch64 desktop job and the voice triples, and which would need a musl rebuild of the x86_64 console the current `linux` job does not perform. Fedora bootc, NixOS, and Yocto stay the rows the plan compares and no repository uses. Buildroot stays the voice-image candidate, and the plan already says Node.js is an awkward guest there.

**What Mate must decide.** The Ubuntu version number, and whether a glibc desktop root is acceptable beside a musl voice root. Until that version is written down, the plan's pipeline still stops before the image build.

## 4. One root filesystem for the voice image and the desktop image, or two roots?

**Recommendation.** Two roots. The voice root stays the read-only, no-shell, no-package-manager image in the voice note. The desktop root is the root that can start Node.js 22 and `openmind-desktop`.

**Why the repositories support it.** The voice packaging note forbids a shell and a package manager on the production voice image, and it keeps Hermes off that image. hermes-research `package.json` requires Node.js 22 or newer and starts with `node src/server.js`. The packaging plan already says no single root in the plan satisfies both. The two images are named apart in the plan's §2, and the voice image does not carry the console, the site pages, or the research app.

**Alternatives.** One root filesystem with two manifests: the voice manifest omits Node.js, the shell, and the package manager, and the desktop manifest adds them. That is one build recipe with two delete-lists. It is easier to drift, because the voice rule is "those programs are absent," and a shared recipe has to prove the absence on every build.

**What Mate must decide.** Whether the cost of two roots is acceptable. The shared name `galion-init` in the voice notes pulls toward one root. The Node.js requirement pulls toward two.

## 5. Kernel version, firmware, and the root filesystem type.

**Recommendation.** Leave the kernel version and the firmware set as whatever the desktop base from question 3 ships for x86_64, and record both in the manifest once that base has a version. The root filesystem is read-only. The plan's read-only names are squashfs and erofs. A small writable area sits beside that root for the Silence file in question 14. This note writes neither a kernel version nor a firmware list, because no repository states one.

**Why the repositories support it.** The voice note requires a read-only root. No file in this repository, in obsidian-open-mind, or in hermes-research names a kernel version, a firmware package, squashfs, erofs, or ext4. hermes-research keeps its history in memory (`HISTORY_CAP` is 32 in `src/desk.js`). The console page has no `localStorage`. The only durable write the plan's own first-boot policy needs is the Silence choice, and that store does not exist yet.

**Alternatives.** A plain ext4 root, which the plan lists, and which can hold the Silence file without a second partition. Firmware pinned by hand, which no repository lists.

**What Mate must decide.** The filesystem name, the kernel version, and the firmware set. Those three strings are empty in every repository read for this note.

## 6. Which packages are baked in, and which of the base's updater binaries are left out?

**Recommendation.** Bake the four pieces the plan already names: the `openmind-desktop` binary, a Node.js 22 binary, the hermes-research tree (`package.json`, `src/`, `public/`, no `node_modules`), and the static pages `site/one/` and `site/research/`. Bake the base's own boot set and nothing past it. Leave the base updater off the image. On the Ubuntu row that updater is `unattended-upgrades`, and the `apt` database is the second update path the plan wants off the device.

**Why the repositories support it.** The plan's §9 keeps updates on one image channel. The voice note has no package manager on the device. hermes-research has no dependencies and no install step. `package-local.sh` produces one binary plus `LICENSE`, the desktop README, `console.html`, and `LOCAL-ARTIFACT.txt`. The tones are generated in the binary and embedded in the page. They do not come from a sample package.

**Alternatives.** Leave the base updater installed and disabled. That is still a second channel on disk. Add a browser package so the HTML console has a viewer. No repository names that browser (question 12).

**What Mate must decide.** The package list, by name, once the base version from question 3 is known. This note does not invent package names beyond the updater the plan already names for Ubuntu.

## 7. Which process serves `/opt/galion/site/one/` and `/opt/galion/site/research/`?

**Recommendation.** A loopback-only static file server whose only job is those two directories. It is a new process. It is not `openmind-desktop`, and it is not `node src/server.js`.

**Why the repositories support it.** [site/README.md](../site/README.md) says the pages are opened locally and this repository does not deploy them. `openmind-desktop` answers `/one` and `/research` with its own short entries (`entry` in `page.rs`, as the desktop README describes). hermes-research answers `/` and `/research` with `public/research.html`, and its `/one` redirects. `galion-console-static` serves `console-dist/static` and proxies `/api`. That is a different console. The plan's §4.4 leaves the Open Mind release set off the image until an owner adds a binary by name, and `galion-console-static` is not in the release.yml copy list (`galion-one`, `galion-desk`, `room`, `desk-hermes`, `link-watch`).

**Alternatives.** Leave the HTML as files and give them no listener. Question 9 then has no on-machine HTTP target for `GALION_ONE_URL`. Teach `openmind-desktop` to serve the directories. That change belongs in obsidian-open-mind.

**What Mate must decide.** The program name, the loopback port, and whether this process is allowed on the image beside the four pieces the plan lists. The ports already used by name are in question 31 and question 9. This note does not pick a new port.

## 8. Does the image later gain the Rust `galion-one` binary, or does Galion One on the image stay the static page?

**Recommendation.** Galion One on this image stays the static page in `site/one/`. The Rust `galion-one` binary stays off.

**Why the repositories support it.** The stack row `galion-one` is `planned`, role "Voice surface. Not started by this page." [deploy/galion-one.service](https://github.com/galion-studio/obsidian-open-mind/blob/1e6b9e5e40201469342dcfb7e133f89dc450150a/deploy/galion-one.service) starts `/opt/galion/openmind/dist/bin/galion-one`, sets `ONE_BIND` to IPv4 loopback port 8091 and `ONE_MOUTH_BIND` to IPv4 loopback port 8002, and has no `[Install]` section. The comment in that unit says it is not enabled until Slavik approves the switch. `release.yml` can copy the binary into a tarball. The desktop image plan does not. `site/one/` is the page written for `galion.app/one`. Plus is $20 / €20 per month, billing is not live, and `paid_tiers` stays false.

**Alternatives.** Add the binary later, on the unit's existing binds, after the approval that unit already names. The console still would not start it. The stack row would stay `planned` until the page changes.

**What Mate must decide.** Whether to ask for the approval the unit already withholds. Until that approval exists, the image keeps the static page.

## 9. The environment passed to hermes-research.

**Recommendation.** Pass this block, and no key.

| Variable | Recommendation | Still open because |
|---|---|---|
| `GALION_ONE_URL` | An `http` loopback URL of the static One page from question 7. | The port is unnamed until Mate names the server. |
| `GALION_RESEARCH_URL` | Unset. | The app then does not forward to a public origin. |
| `GALION_LLM` | Unset. | `canned`, `echo`, and `mock` stay off, and `hermes` is not attached. |
| `GALION_LLM_URL` | Unset. | A set URL with an empty mode attaches the client. |
| `GALION_LLM_KEY` | Unset. | The README keeps the key on the server that holds it. |
| `PORT` | Unset, so the process uses 8787. | 8787 is the port `src/server.js` already uses. |

**Why the repositories support it.** `oneTarget` in `src/server.js` sends `GET /one` to `https://galion.app/one` when the value is empty or not an `https` origin or an `http` loopback origin. `createApp` calls `oneTarget(env.GALION_ONE_URL || "https://galion.app/one")`. `configFromEnv` in `src/hermes.js` sets `attached` true only when `GALION_LLM` is `hermes`, or when `GALION_LLM` is empty and `GALION_LLM_URL` is non-empty. `canned`, `echo`, and `mock` set `attached` false. `createDesk` answers from `localKnowledge` when `attached` is false and does not call the network. `DEFAULT_URL` is loopback port 8642, path `/v1/chat/completions`, and it is used only when the client is attached. `start` binds IPv4 loopback and `Number(env.PORT || 8787)`. The stack row for Hermes is `planned` and is not started by the page. Nothing in the image plan listens on 8642.

**Alternatives.** Set `GALION_LLM=hermes` and a loopback `GALION_LLM_URL`, and run a Hermes listener. That is a third program, and the console does not start it. Leave `GALION_ONE_URL` unset and let `GET /one` open the public page. The plan already says that default leaves the machine. Set `GALION_RESEARCH_URL` to `https://galion.app`, which is the example in `.env.example` for the live desk, and which this image does not deploy.

**What Mate must decide.** The exact `GALION_ONE_URL` once question 7 has a port, and whether a Hermes listener is in scope for this image. The key stays unset either way.

## 10. Where the Node.js 22 binary comes from.

**Recommendation.** Bake Node.js 22 at image-build time and record the version in the manifest field `node`. Take it from the base image's Node.js 22 package when the base is the Ubuntu row, then leave the package manager off the running image. The bytes are the major line hermes-research CI already runs: `node-version: "22"` in `.github/workflows/ci.yml`, and `"node": ">=22"` in `package.json`.

**Why the repositories support it.** The research CI installs Node with `actions/setup-node@v4`. The repository does not vendor a Node tarball, and it does not record a sha256 for one. There is no `node_modules`. The voice note's "no package manager" rule is the voice image. Question 4 gives the desktop image its own root, so a package baked at build time and then frozen matches the single update channel.

**Alternatives.** A pinned upstream Node.js tarball, checked by sha256, with the package database never present. That is the option the plan says keeps a voice-style root free of a package database. No repository contains that checksum, so this note does not write one.

**What Mate must decide.** Which bytes, and the checksum that proves them. A recommendation of "Node.js 22" is not a tarball.

## 11. How `/one` and `/research` on the console meet the static pages and the research desk.

**Recommendation.** They stay three documents on three loopback origins. The console keeps its short entries. The static pages are the server from question 7. The research desk stays on port 8787. The console does not call the other two.

**Why the repositories support it.** The desktop README quotes the content-security policy: `default-src 'none'`, inline style and script only, `media-src data:`, `img-src data:`, `connect-src 'self'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'`. The page source contains no `http://` or `https://`. `connect-src 'self'` allows the same origin only. A browser on the console origin will not call port 8787, and it will not call the static server's port. The test named in that README is `page_stays_on_the_machine`.

**Alternatives.** A same-origin path inside `openmind-desktop` that proxies the desk and the static pages. The plan already says that change belongs in obsidian-open-mind. A person opens the three URLs by hand on the machine. That needs no crate change, and it needs Mate to accept three bookmarks.

**What Mate must decide.** Whether three loopback URLs are the console, or whether obsidian-open-mind should grow a same-origin path. This repository cannot change the policy.

## 12. Which process plays the 432 Hz boot resonance, and what the waveform, duration, level, and device are?

**Recommendation.** The console page plays the existing `wake` clip through its own audio element. The clip is the one `sound.rs` already builds.

| Property | Value in the crate | Where |
|---|---|---|
| Waveform | One sine, 8 ms fade in and out | `samples` in `sound.rs` |
| Pitch | 432 Hz, ratio 1/1 | `REFERENCE_HZ`, tone `wake` |
| Duration | 160 ms | `Tone.ms` for `wake` |
| Level | Peak amplitude 0.32 | `AMPLITUDE` |
| Rate | 16 kHz, 16-bit mono WAV | `SAMPLE_RATE`, `encode_pcm16` |
| Device | The page audio element (`data:audio/wav`) | `media-src data:` in the page policy |

**Why the repositories support it.** `wake` is the tone whose role is "The console is ready." The desktop README says the clip is in the page and the script does not call `play("wake")`. The script does call `play` for `hear`, `ask`, `close`, `deny`, and `done`. hermes-research `src/cues.js` sets `RESEARCH_A` to 432 and lists ratios, including 2:1 at 864 Hz, 3:2 at 648 Hz, 5:4 at 540 Hz, 1:2 at 216 Hz, and 1:4 at 108 Hz. The file says definitions only: no voice audio, no clones, no wav files. No repository has a player started by PID 1. The voice image's ALSA path belongs to `galion-voiced`, which this image does not start.

**Alternatives.** A sustained tone, a chord, or a hum at 216 Hz or 108 Hz. Those pitches exist as cue definitions. They are not clips. An ALSA player under init. No such player is in the desktop crate or the research app. Silence at boot, which contradicts the plan's first-boot line that 432 Hz resonance is on.

**What Mate must decide.** To ask obsidian-open-mind to call `play("wake")` once when the page loads, and to name the program that loads the HTML. No repository names that browser or webview. Until it exists, the clip is in the page and nothing plays it. The level 0.32 and the 160 ms length are the crate's values. A different level is a crate change.

## 13. Does the console's night window suppress that resonance?

**Recommendation.** Yes. The night window suppresses every tone that goes through `play`, including `wake` once `play("wake")` exists. Local hours 22:00–06:59 are that window. Outside those hours the resonance still defaults on, which is the plan's first-boot policy for a new image.

**Why the repositories support it.** The desktop README says mute and local hours 22:00–06:59 skip playback, in `night` and `play`. It does not describe a per-tone exception. The plan's §5 says the image policy is that resonance defaults on, and that the page policy skips those hours, and that the note does not merge them. The code is the page policy. There is no second player to attach a different rule to.

**Alternatives.** A boot-only exception so the first `wake` plays during those hours and later tones still skip. That exception is not in the script. Dropping the night window on the image, which would diverge from the page the crate ships.

**What Mate must decide.** Whether boot resonance is exempt from `night`. The recommendation follows the script. An exemption is a change in obsidian-open-mind.

## 14. Which control selects Silence mode, and where is the choice stored?

**Recommendation.** The control that exists is the Mute button, `#mute`, `aria-pressed` starting at `false`. The store is a file outside the page, on the writable area from question 5, read before the page is shown. The page cannot be that store.

**Why the repositories support it.** The desktop README says mute is not stored: the page has no `localStorage`, and `page_stays_on_the_machine` forbids that word in the page source. Mute skips playback for that page load. The plan's first-boot policy says Silence, once chosen, is the mode on the next boot as well. No path for that file appears in this repository, in the desktop crate, or in hermes-research. The word Silence as a sound mode appears in the packaging plan. [labs/GOVERNANCE.md](../labs/GOVERNANCE.md) uses "Silence is not acceptance" for a missed review. That sentence is about merges. It is not this mode.

**Alternatives.** A boot argument, which the plan also allows, and which still needs a name. Keeping Mute as a one-page-load control and dropping the "next boot" line. That matches the crate and drops a line of the plan.

**What Mate must decide.** The file path, the boot argument if he prefers one, and the same-origin route that lets the button write the file. The console has no such route today. Until the path exists, Silence lasts one page load, and the recommendation stays open.

## 15. What Silence covers besides the boot resonance.

**Recommendation.** The seven desktop tones. If the boot resonance is `wake`, it is already one of the seven. Research cues stay definitions, so Silence has nothing to switch off inside `cues.js`. Galion Voice audio stays off this image.

**Why the repositories support it.** `TONES` has seven ids: `wake`, `ask`, `hear`, `notice`, `done`, `deny`, `close`. Mute gates `play`, and `play` is how those clips start. `cues.js` states that it holds no wav files. The voice packaging manifest keeps `weights` at `none`. The galion-one-voice README says weights are not in git and `weights/` is gitignored. The voice profile's sounds are a different image.

**Alternatives.** Extend Silence to Galion Voice's sounds on the voice image. That image has no Silence flag in its packaging note. Extend it to the research cue table. The table is not audio.

**What Mate must decide.** Whether a later voice image shares this switch. This note keeps Silence on the seven tones the console can actually play.

## 16. The image version.

**Recommendation.** A semver git tag of this repository. The manifest field `version` matches that tag. The same rule is the voice archive's rule. The desktop crate's version stays inside the `openmind` commit pin.

**Why the repositories support it.** The voice packaging note says `version` is semver, matching the git tag. obsidian-open-mind `[workspace.package] version` is `0.1.0`, and `package-local.sh` reads that version into the desktop tarball name. This repository has no package version. `git ls-remote --tags` for this repository returned no tags on 2026-11-14. The image manifest already has separate fields for the three commits (`git`, `openmind`, `research`). One number cannot be all three.

**Alternatives.** Use `0.1.0`, the Open Mind workspace version. That number belongs to another repository and would move when that workspace moves, even if this repository did not. Invent a scheme with no tag. The voice archive would then be the only Galion image-family artifact whose version is a git tag.

**What Mate must decide.** The first tag. This note does not create one, and it does not add a release job.

## 17. The aarch64 board, firmware, and boot partition for the second image.

**Recommendation.** Publish no aarch64 disk image and no aarch64 ISO. Name no board. The root README's "ARM boards such as Snapdragon and the Raspberry Pi" and the voice note's "Raspberry Pi-class" stay class names. The second image waits until Mate names the board, the firmware, and the boot partition.

**Why the repositories support it.** Neither phrase names a board revision, a firmware file, or a boot-partition layout. The `linux-aarch64` job builds and tests the desktop crate. It does not build a disk image. The plan's channel already refuses to advertise an aarch64 file CI has not built. No image job exists.

**Alternatives.** Pick a Raspberry Pi revision or a Snapdragon part in this note. The repositories do not record one, so a pick here would be a new fact. Ship the musl binary as a tarball for aarch64 and still ship no disk image. That matches the voice archive's shape (a triple, no kernel) and is a different artifact from the desktop image.

**What Mate must decide.** The board, the firmware blob, and the boot partition. Until those three are written down, aarch64 stays roadmap, including the binary job that already exists.

## 18. musl or glibc for `openmind-desktop` on aarch64.

**Recommendation.** musl. The triple is `aarch64-unknown-linux-musl`, the target the desktop workflow already builds and tests.

**Why the repositories support it.** The `linux-aarch64` job passes `--target aarch64-unknown-linux-musl`, links with `rust-lld` from `.cargo/config.toml`, and runs the tests under qemu-user. The workflow comment says the crate has no C code, so it does not use a C cross compiler. The voice packaging note names the same triple for the three voice binaries. The x86_64 `linux` job does not pass `--target`. Its binary is the `ubuntu-latest` host triple, which is the glibc side of question 3. The two architectures already differ in the workflow. Question 18 asks only about aarch64.

**Alternatives.** A glibc aarch64 binary, to match the x86_64 host job. No job builds that triple. A fully static musl binary is what the voice note requires for its own three programs. This note does not claim the desktop binary is fully static. The workflow records the triple and the test run. It does not record a `file` or `ldd` line.

**What Mate must decide.** Whether the aarch64 image must run the musl binary the job already produces, including on a glibc root if question 3 stays Ubuntu. A dynamic glibc aarch64 build needs a new job.

## 19. Whether the image job fits a GitHub-hosted runner.

**Recommendation.** Jobs 1–3 stay on `ubuntu-latest`, because those jobs already run there. Job 4, the image build, stays unscheduled. A pull request does not run it. The runner class for job 4 stays open with the base.

**Why the repositories support it.** `openmind-desktop.yml` uses `ubuntu-latest` with a 20 minute timeout on `linux` and 25 minutes on `linux-aarch64`. hermes-research CI uses `ubuntu-latest`. This repository's link-check workflow uses `ubuntu-latest`. No workflow in these repositories builds an ISO or a disk image. The plan already says an image build may need a privilege, a device mapper, or more disk than the runner has, and no log in these repositories records that disk or that privilege. This note does not invent a disk size.

**Alternatives.** Assume a hosted runner is enough and add the job. That assumes a fact no run has shown. Use a larger runner. No repository names one.

**What Mate must decide.** The runner, after one non-publishing trial once the base exists. Until that trial, the recommendation is to leave job 4 off.

## 20. Hybrid ISO, or a separate optical image of the same root.

**Recommendation.** One root, two files. The ISO is a hybrid of that root, so the same bytes can be written to a disk. The `.img` is the raw disk image of the same root. Neither file is an installer wizard.

**Why the repositories support it.** The voice note says the production image has no installer and the owner swaps the image. The plan repeats that both files are the bootable root. No repository builds an ISO, so the hybrid shape is the reading of "the owner swaps the image," applied to optical media as well as to a raw disk.

**Alternatives.** A separate optical image of the same root, which the plan also allows. An installer wizard, which the voice note rules out for the production image.

**What Mate must decide.** Hybrid or separate optical, the first time a builder exists. The recommendation is hybrid because a swap is a disk write. No file proves a hybrid image yet.

## 21. Whether the ISO and the img are reproducible, and against which inputs.

**Recommendation.** The binaries inside the image follow the voice bar: reproducible against the recorded `rustc`, the triple, and the lockfile hash. The ISO and the img record the manifest inputs the plan already lists (`git`, `openmind`, `research`, `base`, `arch`, `node`, `weights`) and are rebuilt from those pins. Byte-identical ISO and img output stays open until a base exists and two builds have been compared. This note does not claim that comparison has happened.

**Why the repositories support it.** The voice packaging note states that bar for the three voice binaries. Open Mind records release reproducibility for its own binaries in `docs/decisions/release-repro-unify.md` and in `crates/galion-feature-pin/tests/real_release_repro.rs`. Those tests cover release binaries. They do not cover an ISO. hermes-research has no lockfile, because it has no packages. Its pin is the git commit plus the Node.js version. No image has been built in this repository.

**Alternatives.** Require bit-identical ISO bytes as a failing gate before the first publication. That is a stronger bar than any repository currently runs for a disk image. Publish images that are pinned and signed and accept that the ISO bytes may move with the base toolchain.

**What Mate must decide.** Whether a mismatched second build fails the image job. The inputs to record are the ones above. The pass/fail rule for the ISO bytes is his.

## 22. UEFI Secure Boot, and any firmware key.

**Recommendation.** The first image signs the files a person downloads, with the keyless cosign the plan already specifies. It adds no firmware key.

**Why the repositories support it.** `release.yml` signs blobs with `cosign sign-blob` over GitHub OIDC, and the verify hint uses the certificate identity regexp `https://github.com/galion-studio/obsidian-open-mind/` and the issuer `https://token.actions.githubusercontent.com`. The voice note uses the same keyless cosign for the voice archive. No path in obsidian-open-mind or galion-one-voice is named for Secure Boot, and no file read for this note names a firmware key, a PK, a KEK, or a db certificate.

**Alternatives.** Enroll a firmware key and sign the boot chain. That is a second key, held outside the keyless OIDC flow, and no repository has one.

**What Mate must decide.** Whether Secure Boot is in scope at all. A firmware key is his to create. This note does not generate one and does not name one.

## 23. A signing workflow that lives in a repository other than this one.

**Recommendation.** The image signing workflow lives in this repository. The identity regexp is `https://github.com/galion-studio/galion-operating-system/`. The issuer is `https://token.actions.githubusercontent.com`. The job asks for `id-token: write` and nothing wider. It stays off unless the owner gate is on, matching `RELEASE_ENABLED` in Open Mind.

**Why the repositories support it.** The plan already writes that regexp, because the plan lives here. Open Mind's verify hint is that repository's own identity, not a shared one. Keyless cosign writes to the public Rekor log. Open Mind's release comment says that is why the job stays off while a repository is private. This repository's gate stays off for the same reason. No workflow file is added by this note.

**Alternatives.** Move the job to another repository and change the regexp to that repository. The signature would still be keyless. The identity a person verifies would be the repository that actually ran the job.

**What Mate must decide.** A move, if he wants one. The recommendation is to keep the job beside the plan. A move changes the regexp, and the verify hint has to change with it.

## 24. The on-device signature checker, and whether `cosign` itself is on the image.

**Recommendation.** Check the bundle on the machine that holds the downloaded files, before the owner swaps the image. The voice image does not carry `cosign`. The desktop image does not add it either, until a checker is named.

**Why the repositories support it.** The voice archive's three binaries are `galion-init`, `galion-voiced`, and `galion-probe`. `cosign` is not one of them. The Open Mind size budget in `config/release/size-budget.tsv` sets `default` at 2097152 bytes, and the comment says no row may sit above 2 MiB. `cosign` has no row. The release workflow's verify hint is a command a person runs against the downloaded file. `deploy/rollback.sh` restores a systemd unit file. It does not check a sigstore bundle and it does not flip a disk slot. The voice note says the owner swaps the image.

**Alternatives.** Put `cosign` on the desktop image and run it there. Its size is not recorded in the budget file, so this note does not say whether it fits the 2 MiB bar. Put a smaller verifier on the image. No repository names one.

**What Mate must decide.** The checker binary, if the check must happen on the device. The recommendation keeps the check on the machine that already has the bundle, which is the shape `release.yml` documents.

## 25. The channel hostname, path, and index format.

**Recommendation.** Write no hostname and no path in this note. The index, when a host exists, is a signed manifest of versions: the same manifest and `SHA256SUMS` the plan already signs, one signature bundle per file. The root README is where a download is listed once an image exists. Until then the README stays as it is.

**Why the repositories support it.** [site/README.md](../site/README.md) says this repository does not deploy the pages. The root README says downloads will be listed there once the first image is ready. No file names a channel host. The voice archive and the Open Mind release both publish a checksum file beside the artifact. The plan's signing section already signs the manifest and `SHA256SUMS`.

**Alternatives.** A directory of files and no index. A person can still verify each bundle. They have no signed list of which versions exist. A host under `galion.app`. Hosting that name is an owner decision, and this repository does not change DNS.

**What Mate must decide.** The hostname and the path. The index shape can be the signed manifest without those two. This note does not register a name and does not open a listener.

## 26. The A/B slot layout, the bootloader, and rollback.

**Recommendation.** Leave A/B unimplemented. The install stays what the voice note already says: the owner swaps the whole image. No partition map, no bootloader name, and no slot-flip program is added here.

**Why the repositories support it.** The voice packaging note calls the A/B swap a design hold and says it is unimplemented. The packaging plan repeats that naming the channel does not implement the mechanism. `galion-boot` supervises services. `deploy/rollback.sh` is a dry run by default. With `--apply` it copies a backed-up unit file back into the systemd unit directory and reloads systemd. The operator restarts the unit. That is a unit-file restore, not a disk slot. No file read for this note names GRUB, systemd-boot, RAUC, Mender, or swupdate as a Galion component. The plan lists those update projects as Yocto options, and it says no Galion repository names Yocto.

**Alternatives.** Pick a bootloader and a two-slot map now. That would be the first time those names appear as a Galion choice. Adopt RAUC, Mender, or swupdate. Same gap.

**What Mate must decide.** The partition layout, the bootloader, which component flips the slot, and how a bad boot returns to the previous image. Until he writes those, the channel carries whole images and the swap stays a hold.

## 27. One channel with a profile field, or a separate channel for the voice image.

**Recommendation.** Two publications. The desktop channel carries `galion-os-<version>-x86_64.iso` and `.img`. The voice publication stays `galion-os-voice-<version>-<triple>.tar.xz`. Each manifest keeps its profile field, `desktop` or `voice`. A later shared host still must not put the tarball in the image directory.

**Why the repositories support it.** The voice archive is three binaries and no kernel. The desktop files are disk images. The plan says mixing them would make a tarball look like a disk image. The profile field is the marker the plan says it can write now. The filenames already differ. Question 25 has no host yet, so "one channel" would be one URL that does not exist.

**Alternatives.** One channel, one index, and a consumer that branches on the profile field. The files stay distinguishable if the index is honest. The risk the plan names is a directory listing that treats every file as a disk image.

**What Mate must decide.** Whether one URL lists both, once question 25 has a host. The recommendation keeps two publications so the file types stay apart even if the host is later shared.

## 28. Anything beyond whole-image updates.

**Recommendation.** Whole images only. No delta format.

**Why the repositories support it.** The plan publishes whole images and says a delta format is unspecified. Open Mind's release artifact is a whole tarball. The voice archive is a whole `tar.xz`. No file in the trees read for this note defines a delta, a binary diff, or a block map.

**Alternatives.** A delta format Mate names, applied on top of the A/B mechanism in question 26. That mechanism is still a hold, so a delta has nowhere to land.

**What Mate must decide.** Whether whole images are enough. A delta needs a format and the slot layout. Neither is in the repositories.

## 29. A `NOTICE` file for the two copyright lines.

**Recommendation.** Ship a `NOTICE` that quotes the lines and does not merge them. Each tree keeps its own `LICENSE` byte for byte. The image also carries a CycloneDX SBOM, the way Open Mind `release.yml` already builds one, so third-party licences travel with the binaries.

Quote these, and stop:

- This repository and hermes-research: the four Galion Labs lines, then `Copyright (c) 2026 Galion Labs`.
- obsidian-open-mind: `Copyright (c) 3000 Galion / galion-studio`, which is the `LICENSE` line and the `SPDX-FileCopyrightText` line on the desktop sources. `package-local.sh` copies that `LICENSE` into the desktop tarball.
- Open Mind's `LICENSES/` directory also holds Apache-2.0 and CC0 texts. The NOTICE points at that directory. It does not fold those texts into the MIT paragraph.

galion-one-voice's README line is `© 2026 Maciej Grajczyk`. That tree is not copied onto this image. Weights stay `none`. Its line stays out of this NOTICE.

**Why the repositories support it.** The three `LICENSE` files say what the bullets say. The plan already says each tree keeps its own `LICENSE` until an owner writes the notice. Rewriting either copyright line would be a change to a licence file. This note does not make that change.

**Alternatives.** Ship no NOTICE and rely on the copied `LICENSE` files alone. A person then has to open each tree to see both years. Replace the `3000` line with the 2026 line. That edits another repository's licence, which this note does not do.

**What Mate must decide.** The NOTICE wording, as a quotation he accepts. The disagreement between `2026 Galion Labs` and `3000 Galion / galion-studio` stays visible until he writes otherwise. This file does not call either line wrong.

## 30. The account that runs `openmind-desktop` and `node src/server.js`.

**Recommendation.** Both processes run as the unprivileged user `galion`. They share that account. The voice note already uses it for the voice binaries on plain Linux.

**Why the repositories support it.** [voice-profile/PACKAGING.md](voice-profile/PACKAGING.md) §7 says the plain-Linux install places the three binaries on the `PATH` of the unprivileged user `galion`, and the owner hardens the machine so work is done as that user. `deploy/galion-one.service` sets no `User=` line. It names no account. No unit file for `openmind-desktop` or for the research app exists. The desktop listener refuses a non-loopback address before a socket exists, and the research server binds IPv4 loopback in `start`. The account and the bind are separate constraints. Loopback does not choose the uid.

**Alternatives.** Omit `User=`, as the `galion-one` unit does, and leave the account to the init's default. Use two accounts, one for the console and one for Node.js. No repository names a second account.

**What Mate must decide.** The account name, if `galion` is not the one he wants on this image, and whether the two processes share it. The recommendation uses the only unprivileged name the voice note records.

## 31. The desktop listen port.

**Recommendation.** Pass no address to `--listen`. The binary uses `DEFAULT_PORT`, which is 18181, on IPv4 loopback. `--port` and `OPENMIND_DESKTOP_PORT` remain the way an image overrides it. A non-loopback address stays refused. This note does not write a different number.

**Why the repositories support it.** `lib.rs` at the commit above documents the constant: 18081 is the staging page beside the Rust console on 18080, so the desktop does not bind 18081. The desktop README repeats that, and it says the console probe stays on 18080. The packaging plan's question 31 was waiting on that change. The change is commit `1e6b9e5e40201469342dcfb7e133f89dc450150a`. hermes-research uses 8787. Those are different ports. The image does not need a new one to avoid 18081.

**Alternatives.** Pass an explicit `--listen` with another loopback port, including IPv6 loopback, which the README already allows. Pick a port in this note and freeze it even if the crate's default moves. That splits the image from the binary the CI job packages.

**What Mate must decide.** Whether 18181 is acceptable on the image. The recommendation inherits the crate. A later crate change moves the default, and the image follows, unless he pins an override.

## What this file does not do

- It does not mark any question decided, closed, or chosen.
- It does not edit [PACKAGING.md](PACKAGING.md), the voice-profile notes, the root README, the landing pages, or the brand guide.
- It does not add a workflow, an ISO, a disk image, a tag, or a release.
- It does not deploy, change DNS, or open a listener.
- It does not set `paid_tiers`, take a payment, or put a weight file in the tree.
- It does not write a firmware key, a channel hostname, a board revision, or a Node.js checksum. Those strings are absent from the repositories, and this note leaves them absent.

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
