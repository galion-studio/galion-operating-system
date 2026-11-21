# Galion Operating System

**Galion OS is a free, open-source operating system built on Linux and Rust. It runs on any device, from a laptop to a tiny Raspberry Pi. MIT licensed.**

One window. One gradient. One prompt field. Type or speak, then watch what happens.

## What it is

Galion OS puts Hermes, your own AI agent, at the centre of your computer. There are no menus to learn and no folders to manage. You say what you want, and Hermes and its helpers do the work in front of you, asking first before anything important.

- **Built on Linux and Rust.** Small, efficient and lightning fast.
- **Any device.** Laptops, desktops, ARM boards such as Snapdragon and the Raspberry Pi, and more over time.
- **Private by default.** It runs on your own hardware. Your data stays with you.
- **Hermes builds its own tools.** Hermes can write its own code, and even its own compilers, on top of Galion OS, so the system can grow itself.
- **The Obsidian Open Mind stack inside.** Memory, tools and agents working together.

## The look and feel

- Deep obsidian black, with slow, living gradients from amber to violet.
- A calm, warm, listening tone. No spinners: agents show up as soft glowing presences while they work.
- Gentle sounds for starting, finishing, notices and questions, which stay silent at night or when you mute them.

## Profiles

**Galion OS Voice** is the first image profile: voice-first, no display server, one dot, Hermes running off-device on the side band. The Hermes-centred GUI profile (one window + prompt field) described above is a later profile built on the same base, and both share `galion-init` and the Obsidian Open Mind contract.

| Profile | Ships | Display | Hermes | Shared base |
|---|---|---|---|---|
| Galion OS Voice | First | None: no X11, Wayland or compositor; at most one dot on `/dev/fb0` | Off-device, on the side band, never in the 80 ms audio path | `galion-init`, Obsidian Open Mind contract |
| Hermes GUI | Later | One window + prompt field | Centre of the screen | `galion-init`, Obsidian Open Mind contract |

Hermes stays the centre for knowledge and tools in both. Galion Voice, the voice model inside Galion One, also runs on plain Linux. It is not a separate product, so neither profile is required to use it. The long form is [the voice-profile notes](docs/voice-profile/README.md).

## Status

Galion OS is the direction we're building towards, starting with Open Mind and Hermes. The Galion OS Voice profile comes first. `galion-init` in this repository is an in-memory prototype of the boot plan. It refuses to be PID 1, and it is not an image. Downloads will be listed here once the first image is ready.

## Raspberry Pi 5

The short path onto a Pi 5 is [Galion on a Raspberry Pi 5](docs/PI5.md). The commands for the first boot on the board are [First real boot on the Pi 5](docs/PI5-FIRST-REAL-BOOT.md).

## Windows laptop

An Ubuntu 24.04 WSL2 guest whose disk, swap, and installer temp files stay on `G:\galion` is [the Windows-side installer](packaging/windows/wsl-on-g/README.md). It is the place for the Obsidian desktop and Galion One Voice checkouts. It does not build the Galion OS image. That image remains the Ubuntu 26.04 plan in [the packaging note](docs/PACKAGING.md), and it still waits on `galion-init`.

## How the pieces fit

Galion OS, Galion Research, the Obsidian desktop, and Galion Voice on one Linux machine, and on a Pi 5, are mapped in [Architecture](docs/ARCHITECTURE.md). That page links the notes in the other three repositories. The commit-cited piece map is [docs/STACK-MAP.md](docs/STACK-MAP.md).

## Brand, site, and Galion Labs

Branding V2, the static landing pages, and the Galion Labs community kit:

- [Brand guide](docs/brand/BRANDING-V2.md)
- [Landing pages](site/README.md) (open them locally; this repository does not deploy them)
- [Galion Labs](labs/README.md)

The GitHub organisation for Labs is created by the owner in the GitHub UI. Hosting for the pages is a separate decision.

## Licence

MIT. Free for everybody to download, use, change and share.
