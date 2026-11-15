# Swarm 8, group B, agent B1 — packaging decisions

*Maciej Grajczyk · 2026-11-15 (Europe/Zagreb, CET, UTC+1).*

**Decided 2026-11-15, 15:00 CET.** The five choices below were the list offered to Maciej. He decided them in [PACKAGING.md](../../PACKAGING.md) §10: Ubuntu 26.04 LTS; wait for `galion-init`; follow the desktop crate; static pages stay files and Research points at the console's `/one` on port 18181; a [NOTICE](../../../NOTICE) that says "perpetual open MIT licence — Galion Labs" with the four G.A.L.I.O.N. lines. The grant stays the MIT text in LICENSE. Pricing is outside that plan. The text under this line is the earlier reading.

Draft PR [#13](https://github.com/galion-studio/galion-operating-system/pull/13) listed 31 open questions in `docs/PACKAGING.md`. This note is the working record of how those questions were grouped. The list Maciej answers is [PACKAGING.md](../../PACKAGING.md) §10. The earlier reading, which left every question open, stays at [PACKAGING-DECISIONS.md](../../PACKAGING-DECISIONS.md).

No image is built. No workflow is added. Nothing is published. Billing is unchanged.

## Pricing

Planned prices are still planned. `paid_tiers` stays false. This change does not edit a price, a page, or a checkout.

| Where | What it says |
|---|---|
| [docs/brand/BRANDING-V2.md](../../brand/BRANDING-V2.md) §8 | Plus $20 / €20 per month. Ultra $220 / €220 per month. "Billing is not live." "`paid_tiers` stays false." |
| [site/assets/prices.js](../../../site/assets/prices.js) | `plus` 20 / 20, `ultra` 220 / 220. Free forever has no amount. |
| [site/README.md](../../../site/README.md) | "Billing is not live. `paid_tiers` stays false." |
| `site/index.html`, `site/one/index.html`, `site/research/index.html`, `site/operating-system/index.html`, `site/voice/index.html`, `site/labs/index.html` | The same sentence, and the same amounts. |
| [labs/README.md](../../../labs/README.md), [labs/GOVERNANCE.md](../../../labs/GOVERNANCE.md), [labs/CONTRIBUTING.md](../../../labs/CONTRIBUTING.md) | `paid_tiers` stays false. A governance change does not switch it to true. |

A search of this repository for `paid_tiers` found no assignment to true.

## What was read

| Tree | Commit | Used for |
|---|---|---|
| This repository, `main` after the regional-price merge | the packaging branch, including `b9517e9` | Prices, brand guide, voice notes, site README |
| [obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind) `main` | `de7480e71ce98191d2ee11f018fa15be6c5a1707` | Desktop port, workflow, stack, sound, `galion-boot`, `galion-one.service` |
| [hermes-research](https://github.com/galion-studio/hermes-research) `main` | `ed3ce9993f58ec655af4f23c2438eb83cd7ea844` | `package.json`, `src/server.js`, `src/hermes.js`, `src/cues.js`, CI, `galion-research.service`, `.env.example` |

Two sentences in the original plan were already false against that Open Mind commit. The plan now says them as they are.

- `openmind-desktop.yml` has four jobs. `linux-aarch64` builds and tests `aarch64-unknown-linux-musl` under qemu-user. It does not write a tarball. `windows` and `macos` do not package.
- `DEFAULT_PORT` is 18181. The comment in `lib.rs` says 18081 is the staging page beside the Rust console on 18080.

`crates/galion-init` is not in that Open Mind tree (the path returns 404). `galion-init` remains a name in the voice notes.

`src/cues.js` says "Definitions only" and holds no wav files. It also defines `audible(silence)`, which returns false when silence is true, `"on"`, or `"1"`. The earlier plan said Silence does not switch anything inside `cues.js`. That sentence is dropped. The function marks a definition quiet. It plays nothing.

## How the 31 were grouped

Settled from a file or from ordinary image practice, and written into the plan:

| Old numbers | Answer |
|---|---|
| 2 | Third boot. The console is not the Hermes GUI. |
| 4 | Two roots. |
| 5 | Base kernel and firmware, unnumbered. Squashfs root. A state file only if decision 3 option 3 is picked. |
| 6 | Four payloads plus the boot set. Updater off. |
| 8 | `galion-one` stays off. The unit has no `[Install]`. |
| 9, except `GALION_ONE_URL` | Unset. `PORT=8787`. |
| 10 | `/usr/bin/node` from the base, major 22. No invented checksum. |
| 15 | Seven desktop tones. Research cues are definitions. Voice audio is the other image. |
| 16 | Semver git tag of this repository. No tag is created. |
| 17 | No aarch64 image and no board. |
| 18 | `aarch64-unknown-linux-musl`, the triple CI already tests. |
| 19 | No workflow. Job 4 does not run. |
| 20 | Hybrid ISO plus raw img. No installer. |
| 21 | Record the pins. Do not claim bit-identical disk images. |
| 22 | No firmware key. |
| 23 | Signing stays in this repository. |
| 24 | Check before the swap. `cosign` is not on the image. |
| 25 | No hostname and no path. |
| 26 | A/B stays the unimplemented hold in the voice note §6. |
| 27 | Two publications. |
| 28 | Whole images only. |
| 30 | User `galion`. |
| 31 | Port 18181, the crate default. |

Five choices remain. Each has a recommended default in [PACKAGING.md](../../PACKAGING.md) §10.

1. **Base.** Ubuntu 26.04 LTS, whose archive Node.js is 22.22.1 ([packages.ubuntu.com/resolute/nodejs](https://packages.ubuntu.com/resolute/nodejs)). Alternatives: Debian stable (trixie), whose archive Node.js is 20.19.2 ([packages.debian.org/stable/nodejs](https://packages.debian.org/stable/nodejs)) and is below the research app's line, or Alpine 3.22, whose x86_64 Node.js package is 22.23.5-r0 ([pkgs.alpinelinux.org](https://pkgs.alpinelinux.org/packages?name=nodejs&branch=v3.22&arch=x86_64)) and which still needs a musl rebuild of the console.
2. **What starts the processes.** systemd. Alternatives: wait for `galion-init`, or `galion-boot`'s supervisor with no systemd.
3. **First-boot sound.** Follow the crate. Alternatives: play the existing `wake` clip once, or add persistent Silence and a boot player.
4. **How One and Research are reached.** Files on disk, and `GALION_ONE_URL` points at the console's own `/one`. Alternatives: a new static server, or the public `https://galion.app/one` from `.env.example`.
5. **Copyright lines.** No NOTICE now. Alternatives: a later NOTICE that quotes both lines and merges neither, or one line written with counsel before any image exists.

Fedora bootc, NixOS, and Yocto are not on that list. No Galion repository names them. Buildroot stays the unchosen voice-image builder in the voice note.

## What this note does not do

- It does not add a GitHub Actions workflow, an ISO, a disk image, a tag, or a release.
- It does not deploy, change DNS, or open a listener.
- It does not change `paid_tiers`, a price, or a payment form.
- It does not put a weight file in the tree.
- It does not edit `SOUL.md`, `config.yaml`, `LOCKS.toml`, `voices/`, `weights/`, or `runtimes/`.
- It does not rewrite a `LICENSE` file. The copyright lines stay the lines those files already have.

## Licence

The four Galion Labs lines, then the MIT licence text from this repository's [LICENSE](../../../LICENSE).

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
