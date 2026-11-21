# Galion OS session

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../../LICENSE). This page does not restate it.

This directory is the shared look for the Galion OS session. The colours, type, radii, motion, and sound map live in one file, [tokens/tokens.json](tokens/tokens.json). [tokens/export.py](tokens/export.py) writes the CSS variables, the GTK export, the page script, the wallpaper, and the cursors. The Open Mind names match `brand/tokens.css` in obsidian-open-mind and [site/assets/tokens.css](../../site/assets/tokens.css). The OS ground stays `#0A0A0C`. The console ground stays `#0B0F14`. The Galion OS mark is the rounded square and the flat dot in [icon-os.svg](../../docs/brand/marks/icon-os.svg): a 10px corner on a 44px square, which is the radius `22.727%`.

| Token | Value | Where it already lived |
|---|---|---|
| Wake motion | 160ms `ease`, 4px rise | `desktop/boot/animations/om-rise.css` |
| Colour motion | 160ms `ease` | the same file |
| Breath | 3.2s `ease-in-out` | `site/assets/site.css`, the presence dot |
| Pulse | 1.618s `cubic-bezier(.23,1,.32,1)` | `desktop/boot/animations/status-pulse.css` |
| Wake tone | 432 Hz sine, 160ms, peak 0.32, 8ms fade, 16 kHz | `desktop/boot/sounds/openmind-desktop-sound.rs`, the `WAKE_TONE_PATH` hook |

The sound map also names the other six desktop tones, the Galion One note lists in `desktop/boot/sounds/os-tones.js`, and the four window bells. The session plays the desktop `wake` sine. It does not play the One chord. Nothing here is a recording.

```sh
python3 desktop/ux/tokens/export.py
python3 desktop/ux/tokens/export.py --check
sh desktop/ux/validate.sh
sh desktop/ux/test-install.sh
```

[desktop/install.sh](../install.sh) runs [install.sh](install.sh) with the same scope. `--dry-run` writes nothing. The script does not start a display manager.

## Greeter

The desktop image is Ubuntu 26.04. Its greeter is GDM, so the theme is [greeter/galion-gdm.css](greeter/galion-gdm.css), not a LightDM slick-greeter. The ground is obsidian. Amber and violet are the wash behind the mark. The mark stays flat `#F5F5F7`.

`--system` copies [greeter/10-galion.dconf](greeter/10-galion.dconf) to `/etc/dconf/db/gdm.d/10-galion` and points the login logo at the installed OS mark. It does not replace Ubuntu's `gnome-shell-theme.gresource`. [greeter/galion.gresource.xml](greeter/galion.gresource.xml) is the manifest an image build can compile. Until that build runs, GDM keeps Ubuntu's theme and the logo file is what this install adds.

[preview/greeter.html](preview/greeter.html) is the same ground and the same field, for a local look. The field does not submit.

## Wake

After login, [session/wake.sh](session/wake.sh) runs from the autostart entry. It synthesises the wake sine and plays it with `paplay`, `pw-play`, or `aplay` when one of those is present. It then opens [session/wake.html](session/wake.html). The page fades in with `om-rise`.

The first start for a user shows one screen with three choices:

| Choice | Opens |
|---|---|
| Galion One | `http://127.0.0.1:18181/one` |
| Galion Research | `http://127.0.0.1:8787/` |
| Desktop | `http://127.0.0.1:18181/` |

A later start fades in and opens the desktop address. The marker is `$XDG_STATE_HOME/galion/welcomed`, or `$HOME/.local/state/galion/welcomed`. It is written only after the page opens. `GALION_WELCOME=always` shows the choices again. `GALION_WELCOME=skip` opens the desktop. `GALION_SILENCE=1` skips the tone. `GALION_WAKE_DRY=1` prints the plan and does not open, play, or write the marker.

The addresses are loopback. The hook refuses any other shape. On that first open, when `gsettings` is present, the wallpaper is set to [wallpaper/galion-wallpaper.png](wallpaper/galion-wallpaper.png). A later start leaves the person's wallpaper alone.

`prefers-reduced-motion: reduce` drops the rise. The page still opens.

## Native apps

The GTK theme, the icon theme, and the cursor theme are named Galion. [../gtk/settings.ini](../gtk/settings.ini) names them and does not pin `gtk-application-prefer-dark-theme` or `gtk-enable-animations`. Dark is the theme default. Light follows `prefers-color-scheme`. Widget colour moves in 160ms. The 3.2s breath stays on the presence dot.

Icons are the brand marks. The cursor set is an arrow, an I-beam, a dot for links, and a crosshair, at 24, 32, and 48 px. IBM Plex and Jost are named and not copied. The WOFF2 files stay on the site. The preview links those files so a local render can use them.

## What this directory does not do

- It does not edit Plymouth, and it does not add a Plymouth theme. That theme is a separate change.
- It does not change `galion-init`. `tone_samples` is still 0. The session plays the sine. PID 1 does not.
- It does not render a WAV into the tree. The tone is an oscillator. There is no voice recording.
- It does not wire the Windows one-click launcher.
- It does not start Open Mind, Research, or a browser by itself when the dry flag is set. A real start opens the wake page, and that page opens the loopback address.
- The GTK theme is the console palette on the common widgets. It is not a full replacement for every Libadwaita control.
- Compiling the GDM resource over Ubuntu's packaged theme is left to the image build.
