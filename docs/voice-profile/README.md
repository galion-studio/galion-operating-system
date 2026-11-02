# Galion OS voice profiles

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1).*

Galion Operating System (Galion OS) ships as image profiles on one shared base. **Galion OS Voice** is the first profile. The **Hermes GUI** is a later profile. These notes are the long form of that split. The root README stays the short public page; the one-paragraph profile line for that page is the open README change in [pull request #1](https://github.com/galion-studio/galion-operating-system/pull/1).

Galion Voice, the voice program, also runs on plain Linux. Neither OS image is required to use it.

## The two profiles

| Profile | Ships | What you see | Where Hermes sits | Shared base |
|---|---|---|---|---|
| [Galion OS Voice](voice-first.md) | First | No display server. At most one dot on `/dev/fb0`. | Off the device, on the side band, outside the 80 ms audio path. | `galion-init`, Obsidian Open Mind contract |
| [Hermes GUI](hermes-later.md) | Later | One window, one gradient, one prompt field. | Centre of the screen for knowledge and tools. | `galion-init`, Obsidian Open Mind contract |

Hermes stays the centre for knowledge and tools in both profiles. The difference is where that centre is drawn, and whether a Hermes process is on the image at all.

## What every profile keeps

- **Free download.** Galion OS is MIT. Galion Voice is a free download. There is no paid tier, account, or licence key for the voice program.
- **One family of names.** Write "Galion Operating System" once, then "Galion OS". Write "Galion Voice" for the program and `galion-voice` for its crates. Obsidian Open Mind names the model layer in this family, a different project from the Obsidian note-taking app. The name Galion One belongs to a separate product.
- **One gradient.** Deep obsidian black (`#0A0A0C`), a slow wash from amber (`#F5A524`) to violet (`#7C3AED`), deeper toward the edges.
- **One clock.** The 80 ms frame is the scheduling quantum: you, me, and feeling. A late frame is a pause.
- **One init.** Both profiles boot through `galion-init` and speak the Obsidian Open Mind contract.

## What these notes leave open

No Galion OS image is published from this repository yet. Downloads belong on the root README once the first image exists.

Which Hermes build serves the side band — the Rust gateway or the published Python line — is still an owner pick. These notes describe the profile. They leave the Hermes binary to that pick.

— Maciej Grajczyk
