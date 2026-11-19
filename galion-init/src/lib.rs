// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! In-memory model of `galion-init`.
//!
//! The image binary is planned as PID 1. This crate records the boot order,
//! the supervision rules, the planned 432 Hz tone hook, and the desktop
//! handoff. It does not mount filesystems, set the host clock, open a
//! socket, play audio, spawn a process, or replace the host init.
//!
//! `galion-welcome` is a second binary in this package. It serves one local
//! page. This library only renders that page. The `galion-init` binary does
//! not serve it.

#![forbid(unsafe_code)]

mod boot;
mod cli;
mod early;
mod handoff;
mod supervise;
mod tone;
mod welcome;

pub use boot::{
    desktop_plan, handoff_ready, voice_plan, walk_desktop, walk_down, DesktopWalk, DownWalk, Phase,
    Plan, Profile, WalkError,
};
pub use cli::{decode_args, invocation, Invocation, ARGUMENT_NOT_TEXT};
pub use early::{BootError, EarlyBoot, MountSpec, DESKTOP_MOUNTS};
pub use handoff::{
    check_desktop_bind, describe, desktop_handoff, one_target, BindError, Endpoint, Host,
    DESKTOP_PATH, DESKTOP_PORT, ONE_PATH, RESEARCH_PORT,
};
pub use supervise::{
    admit, desktop_services, voice_service, AdmitError, Machine, Proc, Restart, Service,
    Supervisor, START_LIMIT_BURST, START_LIMIT_WINDOW_SEC,
};
pub use tone::{tone_hook, tone_samples, ToneHook, ToneInput, BOOT_TONE_HZ};
pub use welcome::{answer, rows_from_snapshot, ServiceRow, UnitSnapshot, WELCOME_PORT};

/// True only when this process is PID 1. The prototype treats that as the
/// host init and refuses to continue.
pub fn running_as_host_init() -> bool {
    std::process::id() == 1
}
