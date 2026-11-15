// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Boot orders. The kernel is already running before these phases.
//! Recording a phase does not perform it.

use crate::handoff::desktop_handoff;
use crate::handoff::Handoff;
use crate::supervise::{desktop_services, voice_service, AdmitError, Service, Supervisor};
use crate::tone::{tone_hook, ToneHook, ToneInput};

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
    pub handoff: Option<Handoff>,
    pub supervisor: Supervisor,
}

impl Plan {
    pub fn render(&self) -> String {
        let mut out = String::new();
        match self.profile {
            Profile::Voice => out.push_str("profile voice\n"),
            Profile::Desktop => out.push_str("profile desktop\n"),
        }
        for phase in self.phases {
            out.push_str(&format!("phase {}\n", phase_name(*phase)));
        }
        match self.tone {
            Some(ToneHook::Planned { hz }) => {
                out.push_str(&format!("tone planned {hz} samples 0\n"));
            }
            Some(ToneHook::Silenced) => out.push_str("tone silenced samples 0\n"),
            None => out.push_str("tone none\n"),
        }
        for service in self.supervisor.services() {
            out.push_str(&format!("service {} user {}\n", service.name, service.user));
        }
        match self.handoff {
            Some(handoff) => out.push_str(&format!(
                "handoff http://{}:{}{}\n",
                handoff.host, handoff.port, handoff.path
            )),
            None => out.push_str("handoff none\n"),
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
