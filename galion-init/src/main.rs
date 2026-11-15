// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Print the desktop boot plan and exit.
//!
//! If this process is PID 1, exit 2. The prototype does not replace the
//! host init. `--silence` selects the silenced tone hook. It does not read
//! a Silence file and it does not play audio.

#![forbid(unsafe_code)]

fn main() {
    if galion_init::running_as_host_init() {
        eprintln!(
            "galion-init: refusing to run as PID 1. This prototype does not replace the host init."
        );
        std::process::exit(2);
    }
    let silence = std::env::args().any(|arg| arg == "--silence");
    let plan = galion_init::desktop_plan(silence, true);
    print!("{}", plan.render());
}
