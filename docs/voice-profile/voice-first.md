# Galion OS Voice — the first profile

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1).*

Galion OS Voice is the first image profile of Galion Operating System. It is voice-first. The machine boots into the voice, and the screen, when there is one, shows a single dot.

This is the profile that ships before the [Hermes GUI](hermes-later.md).

## What the image is

The planned boot is short: Linux, then a static musl `galion-init` as PID 1, then ALSA, then `galion-voiced`. The production image has a read-only root and no shell. No image is built in this repository; this note records the profile, not a build.

There is no display server on this image. No X11, no Wayland, no compositor. If a framebuffer is present, the only user surface is one dot on `/dev/fb0`.

Galion Voice remains usable on plain Linux without this image. The profile is the Galion OS shape of the program, and the program does not require it.

## The interface is one dot

The interface is one dot. Nothing else is on screen.

The dot is the voice. It rests, it listens, and it speaks. It changes only in size and in one uniform brightness, on the 80 ms heartbeat:

- **Idle.** A slow pulse, about 1.6 seconds, slightly dimmed.
- **Listening.** A little larger, nearly still, a gentle breathe.
- **Speaking.** A faster rhythmic scale, one step per 80 ms frame.

The developer console is a developer tool. It is not this interface.

### Gradient is background only

The Galion OS gradient is the background and only the background.

| Token | Value | Role |
|---|---|---|
| `obsidian` | `#0A0A0C` | Background base and edges |
| `amber` | `#F5A524` | Gradient start |
| `violet` | `#7C3AED` | Gradient end |
| `dot` | `#F5F5F7` | The dot, solid, in front |

The background may drift. The dot stays one flat neutral colour for the whole frame. The outer edge may be antialiased. The gradient does not fill the dot, tint it, or show through it, and the dot does not wear a glow in amber or violet.

## Hermes on this profile

Hermes is off the device. It lives on the side band: knowledge, tools, and memory, reached from the host. It is outside the 80 ms audio path. The voice loop owns turn-taking and speech. Hermes owns looking things up and taking actions.

When the side band answers, it answers as a side stream. When it is late or absent, the voice says so in plain words and continues the conversation. Retrieval waits at most about three seconds, then an honest filler. The voice does not invent a figure to cover a missing answer.

Actions go through Hermes's own approval. The voice does not unlock a privileged action by itself. Money is denied.

The first image does not carry a Hermes process. Putting Hermes at the centre of a window is the [later profile](hermes-later.md).

## Name

Call this profile **Galion OS Voice**. Call the program **Galion Voice**. The name Galion One belongs to a separate product.

— Maciej Grajczyk
