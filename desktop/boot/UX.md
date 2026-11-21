# Boot experience

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../../LICENSE). This page does not restate it.

This is the timeline from power on to the desktop, and back. The timings that are fixed are the breath, the settle, and the tones. Plymouth's own progress is the machine's, not a clock. Nothing here was timed on hardware.

| Moment | What you see | What you hear | Time |
|---|---|---|---|
| Power on | Black. The firmware's own screen, if it has one. | Silence. | 0 |
| Plymouth | Black. For a normal boot the first 100 frames are the cinematic film, then the Galion OS mark with the dot breathing and a hairline. A passphrase, shutdown, or reboot skips the film. | Silence. The initramfs splash does not play audio. | The film is 100 frames at 20 fps, shown across 250 refreshes. That is 5 s only if the splash refreshes at about 50 Hz. The breath after that repeats every 3.2 s. |
| Passphrase, if Plymouth asks | The same mark, the prompt in Plymouth's font, a rounded entry, dot bullets. | Silence. | Until the passphrase is accepted. |
| Login | The display manager's own screen. This theme does not draw it. | Silence. | Until the session starts. |
| Desktop wake | The session. The GTK defaults from `desktop/gtk/` apply here, including the 3.2 s breath and reduced motion. The cinematic page, when it is the thing on screen, ends on the same mark and raises Galion One, Galion Research, and Desktop on the 160 ms spring. | `galion-os-startup.ogg` once, 7.73 s. Supplied by Maciej Grajczyk for Galion OS, 2026-11-21. Not a voice recording. `GALION_BOOT_SOUND=boot` plays the 0.74 s chord. `GALION_BOOT_SOUND=wake` plays the 0.16 s 432 Hz crate clip. | Once, at session start. The page locks the picture to this sound. The session player does not. |
| Session stop | The session ends, then the Plymouth shutdown or reboot splash: the dot settles and the hairline recedes. | `shutdown.wav` once, 0.74 s, as the session stops. The splash after that is silent. | The settle is 1.6 s. Reboot holds the dot a little brighter than shutdown. |

Silence, once chosen, is the mode on the next session as well. The file is `$XDG_CONFIG_HOME/galion/silence`. Mute lasts for the session. Local hours 22:00–06:59 skip the tones, matching the desktop crate. `galion-init` still plays nothing and does not read the Silence file.

WSL does not show the Plymouth splash. [preview.py](plymouth/preview.py) renders the frames without booting.
