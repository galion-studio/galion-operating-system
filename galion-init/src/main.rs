// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Print the same boot plans as `prototype.sh` and exit.
//!
//! No argument prints the voice plan, a blank line, then the desktop plan.
//! `voice` and `desktop` print one plan. `walk` steps the desktop plan once
//! in memory and prints that step. `--silence` selects the silenced desktop
//! tone hook. It does not read a Silence file and it does not play audio.
//! `--execute` exits 2. If this process is PID 1, exit 2.

#![forbid(unsafe_code)]

use galion_init::{desktop_plan, invocation, voice_plan, walk_desktop, Invocation, Machine};

/// Absolute path used only so the voice row can be admitted. The binary is
/// not in this repository, and the rendered line says it is absent.
const VOICED_PLANNED: &str = "/opt/galion/galion-voiced";

fn main() {
    if galion_init::running_as_host_init() {
        eprintln!(
            "galion-init: refusing to run as PID 1. This prototype does not replace the host init."
        );
        std::process::exit(2);
    }
    let args: Vec<String> = std::env::args().skip(1).collect();
    let refs: Vec<&str> = args.iter().map(String::as_str).collect();
    match invocation(refs) {
        Invocation::Refuse(message) => {
            eprintln!("{message}");
            std::process::exit(2);
        }
        Invocation::Voice => print!("{}", voice().render()),
        Invocation::Desktop { silence } => print!("{}", desktop_plan(silence, true).render()),
        Invocation::Walk { silence } => {
            if !print_walk(silence) {
                std::process::exit(2);
            }
        }
        Invocation::Both { silence } => {
            print!("{}", voice().render());
            println!();
            print!("{}", desktop_plan(silence, true).render());
        }
    }
}

fn print_walk(silence: bool) -> bool {
    let mut machine = Machine::new(0);
    let walk = walk_desktop(silence, true, &mut machine);
    let kept = walk.console_pid < walk.research_pid
        && walk.console_pid != 1
        && walk.research_pid != 1
        && walk.samples == 0
        && walk.handoff_path == "/one"
        && machine
            .procs
            .iter()
            .all(|proc| proc.name != "galion-voiced" && proc.name != "galion-one");
    if !kept {
        eprintln!("galion-init: desktop walk did not keep the boot order");
        return false;
    }
    let tone = if silence { "silenced" } else { "planned" };
    print!(
        "\
walk desktop
tone {tone}
order console then research
samples 0
handoff /one
handoff current while the console and research are alive
galion-voiced absent
runtime in-memory
"
    );
    true
}

fn voice() -> galion_init::Plan {
    voice_plan(VOICED_PLANNED).expect("the planned voice path satisfies the admit rules")
}
