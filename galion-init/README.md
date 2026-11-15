# galion-init

*Swarm 9, lane galion-init. 2026-11-15T15:31:43+01:00 (Europe/Zagreb, CET).*

`galion-init` is the shared init named in [voice-first.md](../docs/voice-profile/voice-first.md) and in [voice-profile/PACKAGING.md](../docs/voice-profile/PACKAGING.md) §3 and §6. Those notes stay the contract. This directory is the dry-run. It does not draw a screen, and it does not add a palette or a wordmark. Names and colours stay in [Branding V2](../docs/brand/BRANDING-V2.md).

The image binary is planned as a static musl PID 1. It mounts filesystems, brings the network up far enough that loopback exists, sets the clock, and supervises. The production voice image has no shell. Nothing here replaces the host init.

`galion-boot` in obsidian-open-mind is a different program. It renders systemd units. Draft #13 D2 does not boot the image through it. This prototype does not depend on it.

## Boot the prototype prints

`galion-init/prototype.sh` prints a plan and exits. It does not open a socket, install a unit, play a tone, or write a Silence file.

Voice, from the voice notes: mount, network, clock, ALSA, then `galion-voiced`. The binary is absent. A missing `/dev/fb0` is a normal boot. There is no display server.

Desktop, from draft #13 D2 and D4: mount, loopback, clock, then the tone hook, then two supervised processes and one handoff.

| Order | What is recorded |
|---|---|
| 1 | `openmind-desktop`, user `galion`, argv has `--listen` and no address. The crate default is port 18181. |
| 2 | `/usr/bin/node src/server.js` in `/opt/galion/research/current`, user `galion`, `PORT` 8787. |
| 3 | One handoff from that console to research at `/one`. `GALION_ONE_URL` is http on the IPv4 loopback interface, port 18181, path `/one`. |

`galion-voiced` and the Rust `galion-one` binary stay off the desktop plan. `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` stay unset.

The 432 Hz boot tone stays planned. Silence stays planned. The first image plays nothing and has no Silence file. A missing playback device does not stop the later lines. The hook records zero samples.

## Commands

```
sh galion-init/prototype.sh voice
sh galion-init/prototype.sh desktop
sh galion-init/prototype.sh
sh galion-init/prototype.sh --execute
```

The first three exit 0. No argument prints both plans. `--execute` exits 2.

The Rust files next to this note are the same plan as an in-memory model. `cargo test --manifest-path galion-init/Cargo.toml --locked` runs on the CPU. The model does not fork, bind, or mint PID 1. If the `galion-init` binary's process id is 1, it exits 2.

The binary takes the same words as the shell plan. No argument prints the voice plan, a blank line, then the desktop plan. `voice` and `desktop` print one plan. `--silence` selects the silenced desktop tone hook and does not read a file. `--execute` exits 2 and prints no plan. The printed lines follow the shell plan. The runtime line stays `in-memory`. The desktop print also names the console. The voice print also says the service binary is absent.

`walk_desktop` steps that desktop plan once on an in-memory machine. The console row is recorded before research, the handoff path is `/one`, and the tone sample count is zero. It does not fork.

## Licence

The repository [LICENSE](../LICENSE). This note does not restate it.
