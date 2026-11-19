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

The workflow is [.github/workflows/desktop-entries.yml](../.github/workflows/desktop-entries.yml). Permissions are `contents: read`. It does not upload an artifact and it does not publish a release.
