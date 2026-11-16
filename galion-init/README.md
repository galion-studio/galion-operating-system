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

## Early boot

`walk_desktop` records these steps before it supervises, and it records them in this order. None of them call the host.

| Step | What is recorded |
|---|---|
| Mounts | `/proc` (`proc`), `/sys` (`sysfs`), `/dev` (`devtmpfs`), `/run` (`tmpfs`). The squashfs root is already mounted by the kernel and is not in this list. |
| Loopback | The interface is recorded as up. No socket is opened. |
| Clock | The step is recorded. The host clock is not read or set. |
| Tone | The sample count is stored. It is zero. Nothing is played. |
| Supervise | The console row, then research. |
| Handoff | `/one`, and only while both rows are alive. |

A step out of that order is refused. A mount outside that table is refused. Supervision does not start until the clock step has been recorded.

## Stop

`request_stop` records a stop. It does not signal a process. The next tick records the last live child as exited, and the tick after that records the one before it. Research comes down before the console. The handoff is not current once research is down. Neither row starts again, including after the clock moves forward. A stop before the first tick starts nothing.

`release` records that drop on the early boot. It is refused before the handoff, and it is refused while the handoff is still current. After the drop, the stage is supervised again. A later handoff can be recorded when both rows are alive. A stop does not bring them back, so that later handoff stays refused. A console exit does come back: once the console row is alive again, the handoff can be recorded again.

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

`walk_desktop` steps that desktop plan once on an in-memory machine. The console row is recorded before research, the handoff path is `/one`, and the tone sample count is zero. It does not fork. `walk_down` takes that same step and then records the stop: research first, while the console is still up, then the console, and neither row restarts. The binary command `walk` prints both orders and does not print process ids. `--silence` still plays nothing. The handoff stays current only while the console row and the research row are both alive. After the console exits, it is not current again until that row is alive. If research exits while the console is down, it does not return until the console row is alive again. A recorded stop does not bring either row back.

## Static build

The release profile in `Cargo.toml` is opt-level 3, fat LTO, one codegen unit, and stripped symbols. Both musl triples link with `rust-lld`. That binary is not on `PATH` until the Rust sysroot's `lib/rustlib/<host>/bin` directory is prepended. The Pi 5 seed packages the aarch64 binary only. See [PI5-SEED.md](../docs/PI5-SEED.md).

```sh
sysroot=$(rustc --print sysroot)
host=$(rustc -vV | sed -n 's/^host: //p')
PATH="$sysroot/lib/rustlib/$host/bin:$PATH"
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
export CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=rust-lld
cargo build --manifest-path galion-init/Cargo.toml --locked --release --target aarch64-unknown-linux-musl
cargo build --manifest-path galion-init/Cargo.toml --locked --release --target x86_64-unknown-linux-musl
```

The binary still refuses PID 1 and `--execute`. The seed runs it under Raspberry Pi OS systemd. It does not become the host init.

## Licence

The repository [LICENSE](../LICENSE). This note does not restate it.
