// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! In-memory model of `galion-init`.
//!
//! The image binary is planned as PID 1. This crate records the boot order,
//! the supervision rules, the planned 432 Hz tone hook, and the desktop
//! handoff. It does not mount filesystems, set the host clock, open a
//! socket, play audio, spawn a process, or replace the host init.

#![forbid(unsafe_code)]

mod boot;
mod cli;
mod handoff;
mod supervise;
mod tone;

pub use boot::{desktop_plan, voice_plan, walk_desktop, DesktopWalk, Phase, Plan, Profile};
pub use cli::{invocation, Invocation};
pub use handoff::{
    check_desktop_bind, describe, desktop_handoff, one_target, BindError, Endpoint, Host,
    DESKTOP_PATH, DESKTOP_PORT, ONE_PATH, RESEARCH_PORT,
};
pub use supervise::{
    admit, desktop_services, voice_service, AdmitError, Machine, Proc, Restart, Service,
    Supervisor, START_LIMIT_BURST, START_LIMIT_WINDOW_SEC,
};
pub use tone::{tone_hook, tone_samples, ToneHook, ToneInput, BOOT_TONE_HZ};

/// True only when this process is PID 1. The prototype treats that as the
/// host init and refuses to continue.
pub fn running_as_host_init() -> bool {
    std::process::id() == 1
}
