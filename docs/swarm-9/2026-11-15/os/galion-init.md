# galion-init

*Swarm 9, lane galion-init. 2026-11-15T15:31:43+01:00 (Europe/Zagreb, CET). Updated the same day after the orchestrator review on pull request #19.*

## Checked

- Voice-profile notes on `main` (`b9517e92815dd72196b435613ad9130abaa68336`): `galion-init` is PID 1. Voice boot is kernel, init, ALSA, `galion-voiced`.
- Draft #13 head `3adee77f86c3dfb8cd32f9070ad045f018e9b046`, decision D2: wait for `galion-init`, do not boot through `galion-boot` or systemd. D3: 432 Hz tone and persistent Silence stay planned. D4: research reaches One at `/one` on port 18181, http on the IPv4 loopback interface, and research `PORT` is 8787.
- Swarm 9 os plan, pull request #18, head `1da9100`, file `docs/swarm-9/2026-11-15/os/PLAN.md`, read 2026-11-15 after the review. This lane owns `galion-init/**` and this notes file. `.github/**` is outside every lane. The plan's prototype is `galion-init/prototype.sh`.
- obsidian-open-mind `crates/` on `main`: 75 directories. The only init, boot, or supervisor name is `galion-boot`. No `galion-init` crate. `docs/crate-index.md` lists `openmind-boot`; that path returned 404.
- `galion-boot` renders systemd units and is not PID 1. This lane does not depend on it.
- No Swarm 9 os plan pull request was open at 2026-11-15T15:22:24+01:00. #18 was the plan when the review arrived.

## Changed

- Moved the prototype from `init/` to `galion-init/`.
- `galion-init/README.md` is the design. `galion-init/prototype.sh` prints the voice plan, the desktop plan, or both. `--execute` exits 2.
- Folded `docs/galion-init.md` into this note and the README, then removed that file so it is not a second contract beside `docs/voice-profile/`.
- Removed `.github/workflows/galion-init.yml`. Repository CI stays `link-check`.
- Removed dotted address literals and the IPv6 loopback literal. The handoff is described as http on the IPv4 loopback interface, port 18181, path `/one`.

Not edited: voice-profile notes, draft #13, `galion-boot`, host init, site, packaging.

## Prototype

Working directory `/agent/repos/galion-operating-system`. `sh galion-init/prototype.sh voice` exited 0. `sh galion-init/prototype.sh desktop` exited 0. `sh galion-init/prototype.sh` exited 0 and printed both plans. `sh galion-init/prototype.sh --execute` exited 2 and printed `galion-init: refusing --execute. This prototype does not replace the host init.`

Desktop plan:

```
profile desktop
phase mount-filesystems
phase loopback
phase clock
phase tone-hook
tone planned 432 samples 0
silence-file none
phase supervise
service openmind-desktop user galion listen none port 18181
service galion-research user galion port 8787 workdir /opt/galion/research/current
handoff desktop-console to research at /one
GALION_ONE_URL http on the IPv4 loopback interface, port 18181, path /one
galion-voiced absent
galion-one absent
runtime print-only
```

Voice plan ends with `service galion-voiced user galion binary absent`, `fb0 optional`, `display-server none`, `handoff none`.

## Tests

`rustc 1.83.0 (90b35a623 2024-11-26)`. After the move:

`cargo test --manifest-path galion-init/Cargo.toml --locked`

```
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

An earlier nocapture run of the same 14 tests printed `pid=2975` from `this_process_is_not_pid_1`. `cargo clippy --manifest-path galion-init/Cargo.toml --locked --all-targets -- -D warnings` finished with no warnings.

`python3 scripts/check_links.py` printed `Checked 6 HTML pages and 15 SVG files. No broken links.` Exit 0.

`node --test scripts/test_region_prices.mjs` printed `# pass 10` and `# fail 0`. Exit 0.

`vnu.jar` was not run locally. The `link-check` workflow runs it. Musl and the image were not built.

## Open for Maciej

- The installed path of `galion-voiced` is still unnamed. The voice plan says the binary is absent.
- The voice plan has no 432 Hz hook. The desktop plan keeps that hook planned.
- This branch is not yet updated from a `main` that contains the Swarm 9 plan. The plan's merge order puts that update after #18 merges.
