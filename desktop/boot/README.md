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

Nothing in either source tree is a checked-in boot, wake, or chime recording. The sounds are oscillators. The renders in [Session sound](#session-sound) are synthesised from those oscillators. They are not recordings.

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
- Neither source had a Plymouth theme, a Lottie file, or an SVG boot animation. The theme added in this repository is [plymouth/](plymouth/).
- The `boot` and `shutdown` ids are note lists. [generate_tones.py](sounds/generate_tones.py) synthesises them. The window bells are open, close, minimise, and settle, not an OS power chime. [sounds/galion-os-startup.mp3](sounds/galion-os-startup.mp3) is separate. It was supplied by Maciej Grajczyk for Galion OS on 2026-11-21. It is not a voice recording.

## Where Galion OS already had a hook

The 432 Hz boot tone in `galion-init` was already planned and already plays nothing. `WAKE_TONE_PATH` names the vendored wake definition. `tone_samples` is still 0.

[desktop/install.sh](../install.sh) copies this directory into the session data directory `galion/boot/` when it installs the desktop entries. It does not play a tone and it does not open a socket.

[scripts/serve_site.py](../../scripts/serve_site.py) serves this directory at `/boot/` on `127.0.0.1`. The marketing pages stay under `site/`.

The Windows installer is [Install-GalionWSL.ps1](../../packaging/windows/wsl-on-g/Install-GalionWSL.ps1). It has no splash hook, so this directory is not wired into it.

[install.sh](../install.sh) enables [galion-boot-sound.service](systemd/galion-boot-sound.service) for the next graphical session and does not play a tone. The Plymouth theme is installed separately. See [UX.md](UX.md) for the timeline.

## Plymouth theme

`galion` is a script theme. The field is black. The mark is [icon-os.svg](../../docs/brand/marks/icon-os.svg), the rounded square and the dot, rasterised by [render_mark.py](plymouth/render_mark.py) into [plymouth/images/](plymouth/images/). The dot breathes on a 3.2 second cycle, the same breath as the landing pages. A hairline under the mark follows boot progress. Shutdown and reboot use the same mark and let the dot settle over 1.6 seconds. Reboot stays a little brighter. The password and question prompts use Plymouth's built-in font, a rounded entry, and dot bullets. Jost is not in the initramfs.

```sh
sh desktop/boot/plymouth/install.sh --dry-run
sudo sh desktop/boot/plymouth/install.sh
sudo sh desktop/boot/plymouth/uninstall.sh
```

On Ubuntu, after install, rebuild the initramfs so the splash is in the boot image:

```sh
sudo update-initramfs -u
```

The install script prints that command and does not run it. WSL does not draw a Plymouth splash. The files can still be installed. Nothing in this repository has shown the theme on hardware or in a virtual machine.

[preview.py](plymouth/preview.py) writes PNG frames and a GIF for a directory you pass. It does not open a socket.

```sh
python3 desktop/boot/plymouth/preview.py --output /tmp/galion-preview
```

The first part of a normal boot is a pre-rendered film, then the breathing mark. [cinematic/render_frames.py](cinematic/render_frames.py) writes `plymouth/images/cin-000.png` through `cin-099.png` from [cinematic/timeline.json](cinematic/timeline.json). One hundred frames, 640×360, twenty frames a second, five seconds. The script shows them across the first 250 refreshes and assumes a 50 Hz splash. A faster or slower refresh changes how long those frames last. Shutdown, reboot, and a passphrase prompt skip the film and use the live mark. The film frames on disk are about 520 KB together. If Plymouth keeps every frame decoded, 640×360 RGBA for 100 frames is about 92 MB. When the film ends, the live mark is 192 px, so the mark can change size.

## Cinematic page

[cinematic/](cinematic/) is the same timeline on a canvas, with the supplied sound. [cinematic/serve.py](cinematic/serve.py) listens on `127.0.0.1` only and refuses any other host. The page clock is the audio context while the sound is playing. `?debug=1` prints measured frame intervals. `?capture=1` seeks without playing and does not ask the desktop. Reduced motion, from the query or from `prefers-reduced-motion`, shows the settled mark, the wordmark, and “Obsidian Desktop” on a full hairline. It skips the bloom and the status lines.

The field is `#000`. One element leads at a time: a point on the measured onset, a glass disc while the sound builds, one faint ring and a slow particle field, then the OS mark on the loudest window. The wordmark is the display token from [tokens.json](../ux/tokens/tokens.json): Jost 500, tracking `-0.02em`. The shipped display face is `site/assets/fonts/jost-500.woff2`. There is no lighter weight in the tree. At 4.6 s, where the sound is near silence, a small “Obsidian Desktop” label rises on the same 160 ms spring. Under it, one status line at a time, in IBM Plex Sans at the 12px label size and the same tracking: “Initialising…”, “Setting up…”, “Loading Obsidian Desktop…”, “Loading Open Mind stack…”, “Loading apps…”. A hairline fills as the line changes. The first-boot welcome in [session/wake.html](../ux/session/wake.html) still offers Galion One, Galion Research, and Desktop. The boot film does not.

The filmed sequence is the clock above, locked to the sound. On the live page, “Loading Obsidian Desktop…” also waits until `http://127.0.0.1:18181/` answers, and “Loading apps…” waits until `http://127.0.0.1:8787/` answers. Each line still keeps a 0.55 s dwell, so a fast answer cannot skip the words. This repository starts Open Mind with `--stack off` and does not record a separate stack address, so “Loading Open Mind stack…” stays on the clock. After the last line, the status fades and, once the sound has ended and the desktop has answered, the page opens `http://127.0.0.1:18181/`. Capture and debug do not open it. Plymouth cannot ask those addresses, so its frames follow the clock.

Motion is the spring in [animations/spring.rs](animations/spring.rs), critically damped, stepped at 240 Hz. [cinematic/motion.py](cinematic/motion.py) and [cinematic/motion.mjs](cinematic/motion.mjs) are the same integrator. The onset is 0.205 s. The snap is the loudest 50 ms window, starting at 2.320 s. The wordmark starts at 2.55 s. The Obsidian Desktop line starts at 4.6 s. The page holds the picture on the sound until the file ends, 7.732245 s. On the live page a probed line can stay past that until it has answered. The status then fades, and the page opens the desktop.

```sh
python3 desktop/boot/cinematic/serve.py
```

That command does not play the sound by itself. It prints the port. The page is `/boot/cinematic/` on that loopback port.

## Session sound

[generate_tones.py](sounds/generate_tones.py) reads the `boot` and `shutdown` note lists in [os-tones.js](sounds/os-tones.js) and the `wake` clip in [openmind-desktop-sound.rs](sounds/openmind-desktop-sound.rs). It writes 16 kHz 16-bit mono WAV files and a libvorbis OGG of those same samples. [PROVENANCE.txt](sounds/PROVENANCE.txt) records the parsed pitches and the SHA-256 of each file. Re-run the script to refresh them. `python3 desktop/boot/sounds/generate_tones.py --check` fails if the WAV bytes drift.

| File | What it is | Length |
|---|---|---|
| [sounds/boot.wav](sounds/boot.wav) | Page chord: 108 Hz, 216 Hz, 432 Hz, plus the hum | 0.74 s |
| [sounds/shutdown.wav](sounds/shutdown.wav) | The same chord reversed | 0.74 s |
| [sounds/wake.wav](sounds/wake.wav) | Desktop crate clip: 432 Hz sine, peak 0.32, 8 ms fade | 0.16 s |
| [sounds/galion-os-startup.mp3](sounds/galion-os-startup.mp3) | Supplied by Maciej Grajczyk for Galion OS, 2026-11-21. Not a voice recording. | 7.73 s |
| [sounds/galion-os-startup.ogg](sounds/galion-os-startup.ogg) | Libvorbis transcode of that file, for the session player | 7.73 s |

No voice recording is in these files. The three short clips are synthesised. The startup file is the supplied sound.

[galion-boot-sound](sounds/galion-boot-sound) plays `galion-os-startup.ogg` once at `start` and `shutdown.wav` once at `stop`. `GALION_BOOT_SOUND=boot` plays the synthesised chord at start. `GALION_BOOT_SOUND=wake` plays the crate clip at start. `wake` on its own plays that clip once. A second start in the same session prints `skipped: already`. The stamp lives under `XDG_RUNTIME_DIR`. The session player does not share a clock with the Plymouth film. The film is silent. The page is where the picture and the sound share a clock.

Silence is persistent. `galion-boot-sound silence on` writes `1` to `$XDG_CONFIG_HOME/galion/silence` (or `$HOME/.config/galion/silence`). Later sessions stay silent until `silence off`. Mute is this session only: `mute on` writes `$XDG_RUNTIME_DIR/galion/mute`, and `GALION_MUTE=1` does the same for one process. `GALION_SILENCE=1` silences one process without writing the file. Local hours 22:00–06:59 skip playback, which is the desktop crate's night window. `GALION_NIGHT=off` leaves that window unused. A missing player or a missing device prints `skipped: no-device` and exits 0.

[galion-init](../../galion-init/src/tone.rs) still returns no samples and does not read the Silence file. The session unit is the player.

## What this still does not do

- It does not theme the display-manager login screen. The password view is the Plymouth prompt, used when Plymouth asks for a passphrase.
- It does not play audio from the initramfs. The splash is silent. The startup sound plays when the graphical session starts, and the shutdown chord plays when the session stops. Those are not locked to the film.
- The Plymouth script does not read `prefers-reduced-motion`. The cinematic page does. The desktop GTK theme does, after login.
- It has not been watched on a booting machine. The frames and the page are previews.
- [galion-init](../../galion-init/src/tone.rs) still returns no samples and does not read the Silence file.
