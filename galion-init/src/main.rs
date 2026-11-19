// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Print the same boot plans as `prototype.sh` and exit.
//!
//! No argument prints the voice plan, a blank line, then the desktop plan.
//! `voice` and `desktop` print one plan. `walk` steps the desktop plan once
//! in memory, brings that desktop down, and prints both orders. `--silence` selects the silenced desktop
//! tone hook. It does not read a Silence file and it does not play audio.
//! `--execute` exits 2. If this process is PID 1, exit 2.

#![forbid(unsafe_code)]

use std::io::{self, Write};

use galion_init::{desktop_plan, invocation, voice_plan, walk_down, Invocation, Machine, Plan};

/// Absolute path used only so the voice row can be admitted. The binary is
/// not in this repository, and the rendered line says it is absent.
const VOICED_PLANNED: &str = "/opt/galion/galion-voiced";

fn main() {
    if galion_init::running_as_host_init() {
        refuse("refusing to run as PID 1. This prototype does not replace the host init.");
    }
    let args: Vec<String> = std::env::args().skip(1).collect();
    let refs: Vec<&str> = args.iter().map(String::as_str).collect();
    match invocation(refs) {
        Invocation::Refuse(message) => refuse_line(message),
        Invocation::Voice => emit(&require_voice().render()),
        Invocation::Desktop { silence } => emit(&require_desktop(silence).render()),
        Invocation::Walk { silence } => {
            if !print_walk(silence) {
                std::process::exit(2);
            }
        }
        Invocation::Both { silence } => {
            emit(&require_voice().render());
            emit("\n");
            emit(&require_desktop(silence).render());
        }
    }
}

fn print_walk(silence: bool) -> bool {
    let mut machine = Machine::new(0);
    let down = match walk_down(silence, true, &mut machine) {
        Ok(down) => down,
        Err(err) => {
            let _ = writeln!(io::stderr(), "galion-init: {err}");
            return false;
        }
    };
    let kept = down.up.console_pid < down.up.research_pid
        && down.up.console_pid != 1
        && down.up.research_pid != 1
        && down.up.samples == 0
        && down.up.handoff_path == "/one"
        && down.first == "galion-research"
        && down.second == "openmind-desktop"
        && down.console_still_up
        && !down.restarted
        && machine
            .procs
            .iter()
            .all(|proc| proc.name != "galion-voiced" && proc.name != "galion-one");
    if !kept {
        let _ = writeln!(
            io::stderr(),
            "galion-init: desktop walk did not keep the boot order"
        );
        return false;
    }
    let tone = if silence { "silenced" } else { "planned" };
    emit(&format!(
        "\
walk desktop
tone {tone}
order console then research
samples 0
handoff /one
handoff current while the console and research are alive
down research then console
handoff dropped while the console was still up
neither row restarted
galion-voiced absent
runtime in-memory
"
    ));
    true
}

fn require_voice() -> Plan {
    match voice_plan(VOICED_PLANNED) {
        Ok(plan) => plan,
        Err(err) => refuse(&err.to_string()),
    }
}

fn require_desktop(silence: bool) -> Plan {
    match desktop_plan(silence, true) {
        Ok(plan) => plan,
        Err(err) => refuse(&err.to_string()),
    }
}

fn emit(text: &str) {
    if io::stdout().write_all(text.as_bytes()).is_err() {
        refuse("could not write the plan");
    }
}

fn refuse(reason: &str) -> ! {
    refuse_line(&format!("galion-init: {reason}"));
}

fn refuse_line(message: &str) -> ! {
    let _ = writeln!(io::stderr(), "{message}");
    std::process::exit(2);
}
