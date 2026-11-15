// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Boot orders. The kernel is already running before these phases.
//! Recording a phase does not perform it.

use crate::early::EarlyBoot;
use crate::handoff::{describe, desktop_handoff, Endpoint, ONE_PATH};
use crate::supervise::{desktop_services, voice_service, AdmitError, Machine, Service, Supervisor};
use crate::tone::{tone_hook, tone_samples, ToneHook, ToneInput};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Profile {
    Voice,
    Desktop,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Phase {
    MountFilesystems,
    Loopback,
    Network,
    Clock,
    Alsa,
    ToneHook,
    Supervise,
    HandoffDesktop,
}

const VOICE_ORDER: &[Phase] = &[
    Phase::MountFilesystems,
    Phase::Network,
    Phase::Clock,
    Phase::Alsa,
    Phase::Supervise,
];

const DESKTOP_ORDER: &[Phase] = &[
    Phase::MountFilesystems,
    Phase::Loopback,
    Phase::Clock,
    Phase::ToneHook,
    Phase::Supervise,
    Phase::HandoffDesktop,
];

pub struct Plan {
    pub profile: Profile,
    pub phases: &'static [Phase],
    pub tone: Option<ToneHook>,
    pub handoff: Option<Endpoint>,
    pub supervisor: Supervisor,
}

impl Plan {
    /// Print the plan in the same order as `prototype.sh`.
    ///
    /// The runtime line stays `in-memory`. The desktop print also names the
    /// console. The voice print also says the service binary is absent.
    /// `phase handoff-desktop` stays on the plan and is printed as the handoff
    /// lines, not as a phase line.
    pub fn render(&self) -> String {
        let mut out = String::new();
        match self.profile {
            Profile::Voice => out.push_str("profile voice\n"),
            Profile::Desktop => out.push_str("profile desktop\n"),
        }
        for phase in self.phases {
            if matches!(phase, Phase::Supervise | Phase::HandoffDesktop) {
                continue;
            }
            out.push_str(&format!("phase {}\n", phase_name(*phase)));
        }
        if self.profile == Profile::Desktop {
            out.push_str(&tone_line(self.tone));
            out.push_str("silence-file none\n");
        }
        if self.phases.contains(&Phase::Supervise) {
            out.push_str("phase supervise\n");
        }
        for service in self.supervisor.services() {
            out.push_str(&service_line(service));
        }
        match self.profile {
            Profile::Voice => {
                out.push_str("fb0 optional\n");
                out.push_str("display-server none\n");
                out.push_str("service-binary absent\n");
                out.push_str(&tone_line(self.tone));
                out.push_str("handoff none\n");
            }
            Profile::Desktop => {
                if let Some(handoff) = self.handoff {
                    out.push_str("handoff desktop-console to research at /one\n");
                    out.push_str(
                        "GALION_ONE_URL http on the IPv4 loopback interface, port 18181, path /one\n",
                    );
                    out.push_str("handoff current while the console and research are alive\n");
                    out.push_str(&format!("console {}\n", describe(&handoff)));
                }
                out.push_str("galion-voiced absent\n");
                out.push_str("galion-one absent\n");
            }
        }
        out.push_str("runtime in-memory\n");
        out
    }

    pub fn service(&self, name: &str) -> Option<Service> {
        self.supervisor
            .services()
            .into_iter()
            .find(|service| service.name == name)
    }
}

/// Desktop image plan. `silence` selects the silenced hook and does not
/// read a file. `playback_present` does not drop later phases.
pub fn desktop_plan(silence: bool, playback_present: bool) -> Plan {
    let supervisor = Supervisor::try_new(desktop_services())
        .expect("desktop service list satisfies the admit rules");
    Plan {
        profile: Profile::Desktop,
        phases: DESKTOP_ORDER,
        tone: Some(tone_hook(ToneInput {
            silence,
            playback_present,
        })),
        handoff: Some(desktop_handoff()),
        supervisor,
    }
}

/// One in-memory step of the desktop boot. PIDs are rows in `machine`.
/// Nothing is forked. The tone sample count is zero.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DesktopWalk {
    pub console_pid: u32,
    pub research_pid: u32,
    pub samples: usize,
    pub handoff_path: &'static str,
}

struct Stepped {
    plan: Plan,
    boot: EarlyBoot,
    walk: DesktopWalk,
}

fn step_desktop(silence: bool, playback_present: bool, machine: &mut Machine) -> Stepped {
    let mut plan = desktop_plan(silence, playback_present);
    let mut boot = EarlyBoot::new();
    boot.mount().expect("desktop mounts");
    boot.loopback().expect("loopback");
    boot.clock().expect("clock");
    let samples = tone_samples(plan.tone.expect("desktop plan has a tone hook"));
    boot.tone(samples).expect("tone");
    plan.supervisor.tick(machine);
    boot.supervise().expect("supervise");
    let ready = handoff_ready(&plan, machine);
    let handoff_path = if boot.handoff(ready).is_ok() {
        ONE_PATH
    } else {
        ""
    };
    let walk = DesktopWalk {
        console_pid: plan
            .supervisor
            .pid_of("openmind-desktop")
            .expect("console row"),
        research_pid: plan
            .supervisor
            .pid_of("galion-research")
            .expect("research row"),
        samples: boot.samples(),
        handoff_path,
    };
    Stepped { plan, boot, walk }
}

/// Step the desktop plan once. The console is recorded before research.
/// The handoff path is `/one` only after both rows are alive. `galion-voiced`
/// is not started.
pub fn walk_desktop(silence: bool, playback_present: bool, machine: &mut Machine) -> DesktopWalk {
    step_desktop(silence, playback_present, machine).walk
}

/// The same desktop step, then a recorded stop. Research is first, the
/// console is still up, then the console is recorded. Neither row restarts.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DownWalk {
    pub up: DesktopWalk,
    pub first: &'static str,
    pub second: &'static str,
    pub console_still_up: bool,
    pub restarted: bool,
}

pub fn walk_down(silence: bool, playback_present: bool, machine: &mut Machine) -> DownWalk {
    let Stepped {
        mut plan,
        mut boot,
        walk,
    } = step_desktop(silence, playback_present, machine);
    plan.supervisor.request_stop();
    plan.supervisor.tick(machine);
    let research_down = plan.supervisor.pid_of("galion-research").is_none();
    let console_still_up = child_alive(&plan, machine, "openmind-desktop");
    let dropped = boot.release(handoff_ready(&plan, machine)).is_ok() && !boot.handed_off();
    plan.supervisor.tick(machine);
    let console_down = plan.supervisor.is_done("openmind-desktop")
        && plan.supervisor.pid_of("openmind-desktop").is_none();
    let rows = machine.procs.len();
    machine.now = 10_000;
    plan.supervisor.tick(machine);
    let restarted = machine.procs.len() != rows || machine.procs.iter().any(|proc| proc.alive);
    DownWalk {
        up: walk,
        first: if research_down && console_still_up && dropped {
            "galion-research"
        } else {
            ""
        },
        second: if console_down && !restarted {
            "openmind-desktop"
        } else {
            ""
        },
        console_still_up,
        restarted,
    }
}

/// The desktop handoff is current only while the console and research rows
/// are both alive. A voice plan has no handoff.
pub fn handoff_ready(plan: &Plan, machine: &Machine) -> bool {
    plan.profile == Profile::Desktop
        && plan.service("galion-research").is_some_and(|service| {
            service
                .handoff
                .is_some_and(|endpoint| endpoint.path == ONE_PATH)
        })
        && child_alive(plan, machine, "openmind-desktop")
        && child_alive(plan, machine, "galion-research")
}

fn child_alive(plan: &Plan, machine: &Machine, name: &str) -> bool {
    plan.supervisor.pid_of(name).is_some_and(|pid| {
        machine
            .procs
            .iter()
            .any(|proc| proc.pid == pid && proc.alive)
    })
}

/// Voice image plan. `voiced_program` is the absolute path of `galion-voiced`.
pub fn voice_plan(voiced_program: &str) -> Result<Plan, AdmitError> {
    let supervisor = Supervisor::try_new(vec![voice_service(voiced_program)])?;
    Ok(Plan {
        profile: Profile::Voice,
        phases: VOICE_ORDER,
        tone: None,
        handoff: None,
        supervisor,
    })
}

fn tone_line(tone: Option<ToneHook>) -> String {
    match tone {
        Some(ToneHook::Planned { hz }) => format!("tone planned {hz} samples 0\n"),
        Some(ToneHook::Silenced) => "tone silenced samples 0\n".to_string(),
        None => "tone none\n".to_string(),
    }
}

fn service_line(service: crate::supervise::Service) -> String {
    let mut line = format!("service {} user {}", service.name, service.user);
    if service.name == "galion-voiced" {
        line.push_str(" binary absent");
    }
    if service.argv.iter().any(|arg| arg == "--listen") {
        line.push_str(" listen none");
    }
    if let Some(port) = service.port {
        line.push_str(&format!(" port {port}"));
    }
    if let Some(dir) = &service.workdir {
        line.push_str(&format!(" workdir {dir}"));
    }
    line.push('\n');
    line
}

fn phase_name(phase: Phase) -> &'static str {
    match phase {
        Phase::MountFilesystems => "mount-filesystems",
        Phase::Loopback => "loopback",
        Phase::Network => "network",
        Phase::Clock => "clock",
        Phase::Alsa => "alsa",
        Phase::ToneHook => "tone-hook",
        Phase::Supervise => "supervise",
        Phase::HandoffDesktop => "handoff-desktop",
    }
}
