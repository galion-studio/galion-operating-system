# galion-init

*Swarm 9, lane galion-init. 2026-11-15T15:25:56+01:00 (Europe/Zagreb, CET).*

## Checked

- `docs/voice-profile/` on `main` (`b9517e92815dd72196b435613ad9130abaa68336`): README, voice-first, hermes-later, FB0-SURFACE, PACKAGING. Shared init is `galion-init`. Voice boot is kernel, then init, then ALSA, then `galion-voiced`.
- Draft pull request #13 (`cursor/os-packaging-plan-3946`, head `3adee77f86c3dfb8cd32f9070ad045f018e9b046` when read). D2 waits for `galion-init` and does not boot through `galion-boot` or systemd. D3 keeps the 432 Hz boot tone and persistent Silence planned. The desktop handoff is loopback port 18181.
- Open pulls on this repository at 2026-11-15T15:22:24+01:00: #17, #13, #6. No pull request titled "Swarm 9 os plan".
- `crates/` on obsidian-open-mind `main`, GitHub contents API: 75 directories. The only init/boot/supervisor name is `galion-boot`. No `galion-init`. `docs/crate-index.md` lists `openmind-boot`; that path returned 404 on `main`.
- `galion-boot` `Cargo.toml` and `src/lib.rs`, `supervise.rs`, `config.rs`, `main.rs`. It renders systemd units, restores secrets, and falls back to a plain supervisor. It is not PID 1. `supervise` prefers units when `/run/systemd/system` exists.
- GitHub code search for this repo returned `incomplete_results` and zero items, so the crate list above is the contents listing, not the search index.
- Link check on `main` was already green: run 43659226573, success, 2026-11-15T00:39:04Z. This change does not edit `site/` or the brand marks.

## Changed

- `docs/galion-init.md` — boot order, supervision, planned 432 Hz hook and Silence, handoff to the Open Mind desktop on loopback 18181.
- `init/` — in-memory Rust prototype. No fork, no mount, no socket, no sample. Exit 2 if the process id is 1.
- `.github/workflows/galion-init.yml` — `cargo test --manifest-path init/Cargo.toml --locked` on `ubuntu-latest`.
- This notes file.

Not edited: voice-profile notes, draft #13, `galion-boot`, host init.

## Tests

Host: `rustc 1.83.0 (90b35a623 2024-11-26)`, `cargo 1.83.0`. Working directory `/agent/repos/galion-operating-system`.

`cargo test --manifest-path init/Cargo.toml -- --nocapture`

```
running 14 tests
test desktop_boot_order_ends_at_the_desktop_handoff ... ok
test handoff_is_loopback_18181_and_other_binds_are_refused ... ok
test desktop_services_match_the_packaging_handoff ... ok
test host_init_shell_and_secrets_are_refused ... ok
test on_failure_restarts_only_after_a_failed_exit ... ok
test research_starts_only_after_the_desktop_child_is_alive ... ok
test render_names_the_in_memory_runtime ... ok
test restart_no_does_not_start_again ... ok
test silence_skips_the_tone_and_keeps_the_desktop ... ok
pid=2341
test this_process_is_not_pid_1 ... ok
test start_limit_pauses_for_300_seconds_then_allows_one_more ... ok
test supervisor_never_mints_pid_1 ... ok
test voice_boot_order_supervises_voiced_and_skips_the_desktop ... ok
test tone_hook_is_planned_at_432_hz_and_plays_nothing ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

The same 14 tests passed again under `cargo test --manifest-path init/Cargo.toml --locked`. `cargo clippy --manifest-path init/Cargo.toml --locked --all-targets -- -D warnings` finished with no warnings. `cargo fmt --manifest-path init/Cargo.toml -- --check` exited 0.

`./init/target/debug/galion-init` exited 0 and printed `tone planned 432 samples 0` and `handoff http://127.0.0.1:18181/`. `./init/target/debug/galion-init --silence` exited 0 and printed `tone silenced samples 0`. The shell pid at 2026-11-15T15:25:56+01:00 was 2434. Neither process was pid 1.

A release musl build was not run. Image build was not run. The link-check workflow was not re-run locally.

## Open for Maciej

- Confirm `galion-init` stays separate from `galion-boot`, as draft #13 D2 already says.
- The voice image path for `galion-voiced` is still unnamed. The prototype takes a caller path.
- The voice boot order has no 432 Hz hook. Say if that image should share the desktop hook.
- No Swarm 9 os plan pull request was open at the start of this lane.
