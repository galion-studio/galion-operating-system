# Boot sounds and animations

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../../LICENSE). This page does not restate it. Files copied from another repository keep the copyright header they had there. This directory does not change the repository `LICENSE`.

The pins below are the commits read for this copy.

| Source repository | Commit |
|---|---|
| [galion-studio/obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind) | `2b9c45fbdef87fe4fd944a0faa4642ce4eb36705` |
| [galion-studio/galion-one-voice](https://github.com/galion-studio/galion-one-voice) | `b8e473f063e9c5c72a3266c53c56b3ce75bb0927` |

Obsidian files in this directory keep `Copyright (c) 3000 Galion / galion-studio` and `SPDX-License-Identifier: MIT`. The one-voice excerpts keep `Galion Voice — Perpetual Open MIT License. (c) 2026 Galion Labs` or `Copyright (c) 2026 Galion Labs`. The `galion-render` Rust files had no per-file copyright line. They are byte copies. Their repository licence is MIT, copyright 2026 Galion Labs.

## Sounds

Nothing in either source tree is a checked-in boot, wake, or chime recording. The sounds are oscillators. This directory does not render new WAV files.

| File here | Source path | What it is | Licence header |
|---|---|---|---|
| [sounds/openmind-desktop-sound.rs](sounds/openmind-desktop-sound.rs) | `crates/openmind-desktop/src/sound.rs` | Seven desktop tones. `wake` is a 160 ms sine at 432 Hz, peak 0.32, 16 kHz, 8 ms fade. The others are `ask`, `hear`, `notice`, `done`, `deny`, `close`. | 3000 Galion / galion-studio, MIT |
| [sounds/console-ui-sound.rs](sounds/console-ui-sound.rs) | `crates/console-ui/src/sound.rs` | Admin cues and the four window bells: open, close, minimise, settle. Paths such as `/_ui/sound/bell-open.wav` are names of a buffer the same file synthesises. No WAV bytes are in the source. | 3000 Galion / galion-studio, MIT |
| [sounds/galion-sound.ts](sounds/galion-sound.ts) | `stack/research-agent/console-ide/src/lib/galion-sound.ts` | The same cues and bells for the TypeScript console. Oscillators in the page. | 3000 Galion / galion-studio, MIT |
| [sounds/os-tones.js](sounds/os-tones.js) | `crates/galion-console/assets/v1-screen.html` lines 323–393 | Galion OS tones: `boot`, `shutdown`, `notification`, `wake`, `done`, `approval`, `error`. Notes are 432 Hz just ratios plus a hum at 216 Hz and 108 Hz. `playSound` runs only when the page path is `/one`. | 2026 Galion Labs, MIT |

`voice-stack/local-server/ui/index.html` in galion-one-voice repeats the same note table. Its `productIsOne` also treats `/` as the One path. The excerpt here is the v1 screen copy.

The wake sine and the `boot` chord are different. [galion-init](../../galion-init/src/tone.rs) names the 432 Hz wake definition and still returns no samples.

## Animations

| File here | Source path | What it is | Licence header |
|---|---|---|---|
| [animations/om-rise.css](animations/om-rise.css) | `SURFACE_CSS` in `crates/openmind-desktop/src/surface.rs` | 160 ms rise on a console chip, and 160 ms colour transitions. Reduced motion skips them. | 3000 Galion / galion-studio, MIT |
| [animations/status-pulse.css](animations/status-pulse.css) | the `.dot.online` rule in `crates/console-ui/src/css.rs` | 1.618 s opacity and scale pulse on the console online dot. Not a boot splash. | 3000 Galion / galion-studio, MIT |
| [animations/host-splash.html](animations/host-splash.html) | `splash` in `crates/galion-origin/src/lib.rs` | Static host splash for an empty host, the word galion and “Soon online.” Not a Plymouth theme and not an animation. | 3000 Galion / galion-studio, MIT |
| [animations/one-dot.css](animations/one-dot.css) | `voice-stack/local-server/ui/dot/dot.css` | Full-viewport obsidian canvas. | 2026 Galion Labs, MIT |
| [animations/one-dot-draw.js](animations/one-dot-draw.js) | `voice-stack/local-server/ui/dot/app.js` lines 1–5, 12–14, and 23–43 | Near-white disc, `#F5F5F7` on `#0A0A0C`. `level` stays 0. | 2026 Galion Labs, MIT |
| [animations/one-dot.html](animations/one-dot.html) | the same dot page, without its socket script | Page that loads the two files above. | 2026 Galion Labs, MIT |
| [animations/dot.rs](animations/dot.rs) | `galion-render/src/dot.rs` | One-dot radius and brightness. | no per-file header; repository MIT |
| [animations/spring.rs](animations/spring.rs) | `galion-render/src/spring.rs` | The spring used by the orb. | no per-file header; repository MIT |
| [animations/orb_engine.rs](animations/orb_engine.rs) | `galion-render/src/orb_engine.rs` | Display-rate orb motion: idle, listening, thinking, speaking, offline. | no per-file header; repository MIT |
| [animations/palette.rs](animations/palette.rs) | `galion-render/src/palette.rs` | Dot pigment and the obsidian, amber, and violet wash. | no per-file header; repository MIT |
| [animations/frame.rs](animations/frame.rs) | `galion-render/src/frame.rs` | Frame type the dot renderer names. | no per-file header; repository MIT |

The Rust files are snapshots. They are not a Cargo workspace member and are not built here.

[index.html](index.html) shows the chip rise, the online pulse, and the tone ids. It does not call `playSound`.

## What was not copied

- Samantha, Jarvis, and s711 voice recordings. galion-one-voice holds those under `docs/galion-voice-v2/evals/listening-set/`. They are not in this tree.
- The Samantha one-dot client: `voice-stack/one-dot-ui/assets/samantha.js`, `samantha.css`, `dot-logic.js`, and `index.html`, and the socket, microphone, and PCM playback in `voice-stack/local-server/ui/dot/app.js` after the draw. The draw file’s comment still names that socket. The client is not here, so the disc does not breathe.
- `crates/openmind-speech/fixtures/galion_voice_tts.wav` and `piper_silence.wav`. Those are speech fixtures.
- `crates/galion-console/assets/v1-screen.html` as a whole. It is the voice screen. Only the tone block is here.
- No Plymouth theme, boot-splash theme, Lottie file, or SVG boot animation exists in either source. None was added.
- No startup or shutdown chime recording exists. The `boot` and `shutdown` ids are note lists. The window bells are open, close, minimise, and settle, not an OS power chime.

## Where Galion OS already had a hook

The 432 Hz boot tone in `galion-init` was already planned and already plays nothing. `WAKE_TONE_PATH` names the vendored wake definition. `tone_samples` is still 0.

[desktop/install.sh](../install.sh) copies this directory into the session data directory `galion/boot/` when it installs the desktop entries. It does not play a tone and it does not open a socket.

[scripts/serve_site.py](../../scripts/serve_site.py) serves this directory at `/boot/` on `127.0.0.1`. The marketing pages stay under `site/`.

The Windows one-click launcher is [Install-GalionUbuntuOnG.cmd](../../packaging/windows/wsl-on-g/Install-GalionUbuntuOnG.cmd). It has no splash hook, so this directory is not wired into it.

There is no Plymouth theme in this repository, so there is no Plymouth hook to point at these files.
