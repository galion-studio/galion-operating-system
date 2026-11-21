# Boot sequence inventory

Survey date: 2026-11-21. This file lists every boot, startup, intro, splash, loading, wake, and gatekeeper sequence found across galion-studio repositories, and whether the offline preview plays it.

The preview is `docs/brand/archive/preview/`. Boot sequences are the first section. On Windows, `START-PREVIEW.cmd` serves that folder on `127.0.0.1` port 8790. `python3 serve-preview.py` does the same. No install step and no CDN.

## Count

| | Count |
|---|---|
| Sequences in the preview | 61 |
| Sequences found that are not in the preview | 9 |
| Repos searched with no visual boot sequence | see below |

A sequence is in the preview when it has its own gallery card, a replay control, and plays its own sound when the original had one.

## In the preview

| Name | Repo | Date | Source | Player |
|---|---|---|---|---|
| Galion OS cinematic boot | `galion-operating-system` | 2026-11-21 | `desktop/boot/cinematic/index.html` | frame |
| Plymouth boot film | `galion-operating-system` | 2026-11-21 | `desktop/boot/plymouth/galion.script` | frame |
| Plymouth shutdown | `galion-operating-system` | 2026-11-21 | `desktop/boot/plymouth/galion.script` | frame |
| Plymouth reboot | `galion-operating-system` | 2026-11-21 | `desktop/boot/plymouth/galion.script` | frame |
| One-dot canvas | `galion-operating-system` | 2026-11-21 | `desktop/boot/animations/one-dot.html` | frame |
| Host splash | `galion-operating-system` | 2026-11-21 | `desktop/boot/animations/host-splash.html` | frame |
| Boot asset rise | `galion-operating-system` | 2026-11-21 | `desktop/boot/index.html` | frame |
| First-boot welcome | `galion-operating-system` | 2026-11-21 | `desktop/ux/session/wake.html` | frame |
| Desktop wake | `galion-operating-system` | 2026-11-21 | `desktop/ux/session/wake.html` | frame |
| GDM greeter | `galion-operating-system` | 2026-11-21 | `desktop/ux/preview/greeter.html` | frame |
| Obsidian wake disc | `obsidian-open-mind` | 2026-11-21 | `crates/openmind-desktop/src/page.rs` | frame |
| Galion One dot surface | `galion-one-voice` | 2026-11-08 | `voice-stack/one-dot-ui/assets/index.html` | frame |
| Unified Boot Sequence | `galion-app` | 2026-01-20 | `src/components/boot/UnifiedBootSequence.tsx` | react |
| Unified returning wake | `galion-app` | 2026-01-20 | `src/components/boot/UnifiedBootSequence.tsx` | react |
| Void phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/VoidPhase.tsx` | react |
| Galion boot phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/GalionBootPhase.tsx` | react |
| System boot phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/SystemBootPhase.tsx` | react |
| Consent phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/ConsentPhase.tsx` | react |
| Birth phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/BirthPhase.tsx` | react |
| Wake phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/WakePhase.tsx` | react |
| Greeting phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/GreetingPhase.tsx` | react |
| Orbing phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/OrbingPhase.tsx` | react |
| Welcome phase | `galion-app` | 2026-01-20 | `src/components/boot/phases/WelcomePhase.tsx` | react |
| GalionOSBoot | `galion-app` | 2026-01-20 | `src/components/boot/GalionOSBoot.tsx` | react |
| GalionOSBoot v2 | `galion-app` | 2026-01-20 | `src/components/boot/GalionOSBootV2.tsx` | react |
| GalionOSBoot v3 | `galion-app` | 2026-01-20 | `src/components/boot/GalionOSBootV3.tsx` | react |
| Enhanced GalionOSBoot | `galion-app` | 2026-01-20 | `src/components/boot/EnhancedGalionOSBoot.tsx` | react |
| GalionOSBoot v5.4.2 | `galion-app` | 2026-01-20 | `src/components/boot/GalionOSBootV542.tsx` | react |
| Galion Ultimate Boot | `galion-app` | 2026-01-20 | `src/components/boot/GalionUltimateBoot.tsx` | react |
| Gatekeeper v2 | `galion-app` | 2025-12-10 | `src/components/gatekeeper/GalionGatekeeperV2.tsx` | react |
| GalionOSBoot v7 | `galion-app` | 2026-01-20 | `src/components/boot/orb-v7/GalionOSBootV7.tsx` | react |
| Orb birth sequence | `galion-app` | 2026-01-20 | `src/components/boot/orb-v7/birth/OrbBirthSequence.tsx` | react |
| Galion orb v7 | `galion-app` | 2026-01-20 | `src/components/boot/orb-v7/GalionOrbV7.tsx` | react |
| Galion orb v7.2 | `galion-app` | 2026-01-20 | `src/components/boot/orb-v7/GalionOrbV7Enhanced.tsx` | react |
| Orb wake-up | `galion-app` | 2026-01-20 | `src/components/boot/WakeUp.tsx` | react |
| Birth of a star | `galion-app` | 2026-01-20 | `src/components/boot/BirthOfAStar.tsx` | react |
| Welcome questions | `galion-app` | 2026-01-20 | `src/components/boot/WelcomeQuestions.tsx` | react |
| Lottie boot component | `galion-app` | 2026-01-20 | `src/components/boot/LottieBootAnimation.tsx` | react |
| First interaction celebration | `galion-app` | 2026-01-20 | `src/components/boot/FirstInteractionCelebration.tsx` | react |
| Lottie galion-os-boot | `galion-app` | 2026-01-20 | `public/animations/galion-os-boot.json` | lottie |
| Lottie wake-up | `galion-app` | 2026-01-20 | `public/animations/wake-up.json` | lottie |
| Lottie wake-up premium | `galion-app` | 2026-01-20 | `public/animations/wake-up-premium.json` | lottie |
| Lottie orb birth | `galion-app` | 2026-01-20 | `public/animations/orb-birth.json` | lottie |
| Lottie orb celebration | `galion-app` | 2026-01-20 | `public/animations/orb-celebration.json` | lottie |
| Workspace unified boot | `galion-workspace3d` | 2026-01-20 | `src/components/boot/UnifiedBootSequence.tsx` | react |
| Workspace returning wake | `galion-workspace3d` | 2026-01-20 | `src/components/boot/UnifiedBootSequence.tsx` | react |
| Workspace void | `galion-workspace3d` | 2026-01-20 | `src/components/boot/phases/VoidPhase.tsx` | react |
| Workspace welcome | `galion-workspace3d` | 2026-01-20 | `src/components/boot/phases/WelcomePhase.tsx` | react |
| Workspace birth | `galion-workspace3d` | 2026-01-20 | `src/components/boot/phases/BirthPhase.tsx` | react |
| Workspace consent | `galion-workspace3d` | 2026-01-20 | `src/components/boot/phases/ConsentPhase.tsx` | react |
| Workspace 3D boot | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/boot/WorkspaceBootScreen.tsx` | react |
| Workspace terminal boot | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/boot/GalionTerminalBoot.tsx` | react |
| Premium boot screen | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/boot/PremiumBootScreen.tsx` | react |
| Stark Hub boot | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/stark-hub/boot/StarkHubBootSequence.tsx` | react |
| Stark ironman boot | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/ironman/boot/StarkBootSequence.tsx` | react |
| Organic 3D GalionOSBoot | `galion-workspace3d` | 2026-01-20 | `src/components/workspace3d/orb/GalionOSBoot.tsx` | react |
| Cosmos | `galion-app` | 2026-01-20 | `src/components/boot/cosmos/CosmosBackground.tsx` | react |
| Titan console logo | `project-mc.galion.studio` | 2025-11-10 | `console_logo.py` | terminal |
| Grok console chat banner | `project-mc.galion.studio` | 2025-11-10 | `console-chat.py` | terminal |
| Rupod startup banner | `galion-universal-downloader` | 2026-11-15 | `index.js` | terminal |
| Guardian boot sequence | `galion-backend` | 2025-12-08 | `services/guardian/boot_manager.py` | terminal |

Notes on how a few of these play:

- The cinematic boot copy sets `preview=1`, which skips the loopback probes to ports 18181 and 8787 so the film stays on screen. The startup sound is the file the page already fetches, `desktop/boot/sounds/galion-os-startup.mp3`. The welcome page uses the same flag so it does not hand off to those ports.
- Plymouth boot, shutdown, and reboot play the PNG film from `desktop/boot/plymouth/images` at the script's frame step. The theme script itself is silent. The preview plays `boot.wav` with the boot film and `shutdown.wav` with shutdown, which are the OS chords from the same tree.
- The Guardian terminal is the phase log from `galion-backend` `boot_manager.py`. With no boot function registered, each phase reports started in 0.0s. The preview keeps that text and spaces the lines 90 ms apart so they can be read.
- Titan is `print_startup_screen()` from `project-mc.galion.studio` `console_logo.py`, captured with `random.seed(1)`. Colorama codes are stripped.
- `@react-three/drei` `Environment` returns nothing in this build. The night preset downloads an HDR, and that request is not made.
- `PremiumBootScreen` still contains the class name that points at `grainy-gradients.vercel.app`. Tailwind does not emit that class, and the browser does not request it.
- Playback copies, not the full upstream files: `useDeviceCapabilities` returns a high tier immediately; `jarvisStore` keeps the mood API the boot calls; `useStarkWorkspace` keeps the four hooks the boot uses; `useHUDSounds` keeps the sound-bank calls; `LightDoor3D` is the seam the 3D boot opens. `StarkSoundBank.ts` has a duplicate `volume` key in the original source. The later key wins.
- Orb v7 `birth`, `core`, `effects`, and `background` were missing from the earlier archive checkout. They are copied from `galion-app` `master` and the v7 boot, birth, orb, and enhanced orb each have a card.

## Found, not in the preview

| Sequence | Repo / path | Why it is not a card |
|---|---|---|
| Nebula startup renderer | `galion-one-voice` `apps/nebula-voice-v2/web/boot.js`, commit `e2960f6e761bdbe3f8ab4825ebadb9315ee45890`, 2026-11-14 | `samantha.html` and `jarvis.html` import `./pkg/nebula_voice_v2.js`. That wasm package is not committed, so the page cannot boot offline. |
| Gatekeeper GalionOSBoot | `galion-app` `src/components/gatekeeper/GalionOSBoot.tsx` | Deprecated by `index.ts` in favor of Gatekeeper v2, which is in the preview. This file also uses a styled-jsx scrollbar block. It was not given a second card. |
| Welcome screen | `galion-app` `src/components/gatekeeper/WelcomeScreen.tsx` | Deprecated sibling of Gatekeeper v2. Not mounted. |
| Welcome back | `galion-app` `src/components/gatekeeper/WelcomeBack.tsx` | Renders nothing until the document has been hidden and shown again for at least five seconds. It is a tab-return overlay, not a load-time boot. |
| Welcome back v2 | `galion-app` `src/components/gatekeeper/WelcomeBackV2.tsx` | Same visibility gate as Welcome back. Not a load-time boot. |
| Dev-console widget motion | `project-mc.galion.studio` `dev-console/ui/animations.py`, commit `edb159d0d289cddcbe86772e31e1d76e6258454a`, 2025-11-11 | Tk and CustomTk fade, slide, pulse, shake, and spinner helpers. There is no standalone sequence to play. |
| First-run wizard | `galion-universal-downloader` `galion-v2/src/components/onboarding/first-run-wizard.tsx` | Multi-step settings wizard. Nothing else in that tree imports it. |
| One-dot voice screen | `galion-one-voice` `crates/galion-console/assets/v1-screen.html` | Persistent 60 fps voice surface, not a one-shot boot. The archived one-dot UI that is a startup surface is in the preview. |
| Rust orb engine | `galion-operating-system` `desktop/boot/animations/orb_engine.rs` | Integrator for a future thread. Not a screen. |

Service launchers that are not visual sequences: `obsidian-open-mind` `crates/galion-boot` (systemd supervision), `galion-backend` `startup.sh` and `admin_boot.py` (process start; the visual log is `boot_manager.py`, which is in the preview), Plymouth `preview.py` (writes a GIF at runtime; the preview plays the PNG film instead), and `desktop/boot/cinematic/capture.mjs` (a capture harness).

Duplicate copies are one card. The 2D `GalionOSBoot`, wake-up, wake phase, greeting, and orbing phase are byte-identical in `galion-app` and `galion-workspace3d`. The 3D `GalionOSBoot` matches across those trees. Lottie JSON also exists under the platform archive copies; the player uses the `galion-app` `public/animations` files. `LottieBootAnimation` asks for `/animations/galion-boot.json`; the repo file is `galion-os-boot.json`, and the preview serves both names.

## Repos with no Galion boot sequence

Public trees checked at HEAD, including history for filenames: Corpus-Nova, Galion-Deep-Mr-Fake-v2, SentiaLink, Teglenica-TSO-36, cargen, coming-soon, community, forge, galion-agi-web, galion-initiative-web, galion-knowledge, galion-marine, galion-studio, helium, hermes-research, merlin, merlin-element-showcase, mmee, nexuslang-v2. Hits in those trees were generic spinners, textbook pages, marketing video loops, or the word boot in docs.

Private trees checked by filename: `voice-backend` and `nexuslang` had no boot, splash, wake, or gatekeeper filenames. `galion-app` and `galion-workspace3d` are the sources of the React cards. `galion-backend` supplied the Guardian log.

## Left out on purpose

Voice recordings, secrets, `.env` files, and machine addresses are not in the preview. The `cp` repo was not searched and nothing was copied from it. Client-brand repositories (adriatic-padel, tactical-belts, tactical-belts-pro, villapenava, maivirtue, slaviknomad, and the same kind of client tree) were not copied. GitHub Pages is not enabled.

## Servers

`serve-preview.py` and `serve-preview.ps1` bind `127.0.0.1` only. Both map `.mp3`, `.wav`, `.ogg`, `.mp4`, `.webm`, `.gif`, `.gltf`, `.glb`, and `.wasm`.


