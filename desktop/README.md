# Linux desktop entries

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../LICENSE). This page does not restate it.

Three freedesktop entries describe how Galion apps already named in this repository start on a local machine. They do not install those apps, start them, or open a socket. A green run of the check below is not a Raspberry Pi 5 result.

| Entry | What it launches | Icon |
|---|---|---|
| [galion-research.desktop](applications/galion-research.desktop) | `/opt/galion/research/current/galion-research`, the Pi 5 seed binary, with `PORT` set to the seed unit's value. Working directory `/opt/galion/research/current`. | [icon-research.svg](../docs/brand/marks/icon-research.svg) |
| [openmind-desktop.desktop](applications/openmind-desktop.desktop) | `/opt/galion/openmind-desktop/openmind-desktop --listen --stack off`, the flags from [openmind-desktop.service](../scripts/symphony/openmind-desktop.service) without the listen address. | [icon-os.svg](../docs/brand/marks/icon-os.svg) |
| [galion-voice.desktop](applications/galion-voice.desktop) | `galion-voiced` on `PATH`. [The voice packaging note](../docs/voice-profile/PACKAGING.md) names no install directory, so this entry does not invent one. | [icon-voice.svg](../docs/brand/marks/icon-voice.svg) |

The brand guide has no separate Obsidian desktop mark. The Open Mind shard stays in the Open Mind repository. The console entry uses the Galion OS icon, the rounded square and the dot.

`TryExec` is the same command. A desktop hides the entry when that command is not installed. The binaries are not in this repository. `galion-voiced` and `galion-probe` are not in the Pi 5 seed.

```sh
sh desktop/validate.sh
```

The command runs `desktop-file-validate` from `desktop-file-utils` and checks that the icon files are the brand marks above. It exits 2 if it is given an argument. It does not install the entries.

[install.sh](install.sh) copies those entries, the icon set, and the opt-in GTK session defaults, or removes them with `--uninstall`. `--user` writes entries and icons under `XDG_DATA_HOME`, or `$HOME/.local/share` when that variable is unset, and GTK files under `XDG_CONFIG_HOME`, or `$HOME/.config`. `--system` writes entries and icons under `/usr/local/share` and GTK files under `/etc/xdg`. Raspberry Pi OS Bookworm and Ubuntu already search those places. `--dry-run` prints the paths and writes nothing. The script does not start the apps.

The session defaults are [gtk/settings.ini](gtk/settings.ini) and [gtk/gtk.css](gtk/gtk.css), copied for GTK 3 and GTK 4. Dark is the token default. Light follows `prefers-color-scheme`. The font name is IBM Plex Sans at the 16px body size. The bundled faces are WOFF2 web subsets, so they are not copied into a font directory. Controls use the 160ms console rise. The 3.2s breath stays on the presence dot, and `prefers-reduced-motion` removes animation and transition. `gtk-application-prefer-dark-theme` and `gtk-enable-animations` are left unset so the desktop's own dark, light, and reduced-motion choices stay in charge. The theme, icon, and cursor name are Galion. [ux/](ux/README.md) is that theme, the greeter, and the wake hook.

```sh
sh desktop/install.sh --user
sh desktop/install.sh --system --dry-run
sh desktop/install.sh --user --uninstall
```

[test-install.sh](test-install.sh) runs that script in a temporary XDG home. A green run is not a Raspberry Pi 5 result.

The boot splash and the session tones are described in [boot/README.md](boot/README.md). The timeline is [boot/UX.md](boot/UX.md). [install.sh](install.sh) copies them and enables the user sound unit for the next graphical session. It does not play a tone. The Plymouth theme is a separate install and does not rebuild the initramfs. WSL does not show that splash.

The same install copies [boot/](boot/) into `galion/boot/` under the data directory. Those files are the vendored sounds and animations, the Plymouth theme sources, and the cinematic boot page.

The same install runs [ux/install.sh](ux/install.sh). That script copies the session look. It does not start a display manager and it does not play a tone.
The workflow is [.github/workflows/desktop-entries.yml](../.github/workflows/desktop-entries.yml). Permissions are `contents: read`. It does not upload an artifact and it does not publish a release.
