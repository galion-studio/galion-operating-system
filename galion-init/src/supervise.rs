// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! In-memory supervisor.
//!
//! The restart rule and the start limit match `galion-boot`'s plain
//! supervisor (10 starts in a 300 second window, then a 300 second pause;
//! `always`, `on-failure`, or `no`; no shell; absolute program path).
//! This module does not fork, signal a process, call systemctl, or write
//! a pid file. Every child is a row in [`Machine`].

use crate::handoff::{one_target, Endpoint, RESEARCH_PORT};

/// Starts allowed inside [`START_LIMIT_WINDOW_SEC`] before a pause.
pub const START_LIMIT_BURST: usize = 10;

/// Window and pause length, in seconds. A start is inside the window while
/// its age is less than or equal to this value. The pause is the same length.
pub const START_LIMIT_WINDOW_SEC: u64 = 300;

const HOST_INIT_PATHS: &[&str] = &[
    "/sbin/init",
    "/usr/sbin/init",
    "/lib/systemd/systemd",
    "/usr/lib/systemd/systemd",
    "/bin/systemctl",
    "/usr/bin/systemctl",
    "/bin/telinit",
    "/usr/bin/telinit",
];

const HOST_INIT_BASES: &[&str] = &["init", "systemd", "systemctl", "telinit"];

const SHELL_BASES: &[&str] = &["sh", "bash", "dash", "ash", "busybox"];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Restart {
    Always,
    OnFailure,
    No,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Service {
    pub name: String,
    pub argv: Vec<String>,
    pub user: String,
    pub workdir: Option<String>,
    pub restart: Restart,
    pub restart_sec: u64,
    pub env: Vec<(String, String)>,
    pub after: Vec<String>,
    /// Port the image expects. `None` means this service does not listen.
    /// The desktop argv still carries no address; the port is the crate default.
    pub port: Option<u16>,
    /// Where this service sends a person onward. The desktop research row
    /// points at One on the console.
    pub handoff: Option<Endpoint>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AdmitError {
    EmptyArgv { name: String },
    RelativeProgram { name: String },
    HostInit { name: String },
    Shell { name: String },
    BadName { name: String },
    EmptyUser { name: String },
    SecretOnArgv { name: String },
    DotDot { name: String },
    RelativeWorkdir { name: String },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Proc {
    pub pid: u32,
    pub name: String,
    pub alive: bool,
    pub code_ok: Option<bool>,
}

/// Fake process table. PIDs start at 100 unless [`Machine::with_next_pid`]
/// says otherwise. PID 1 is never issued.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Machine {
    pub now: u64,
    next_pid: u32,
    pub procs: Vec<Proc>,
}

impl Machine {
    pub fn new(now: u64) -> Self {
        Self::with_next_pid(now, 100)
    }

    /// `next_pid` of 0 or 1 is raised to 2 before any child is recorded.
    pub fn with_next_pid(now: u64, next_pid: u32) -> Self {
        Self {
            now,
            next_pid: if next_pid <= 1 { 2 } else { next_pid },
            procs: Vec::new(),
        }
    }

    /// Mark one of our children exited. An unknown or already-dead pid is
    /// left alone and returns false.
    pub fn exited(&mut self, pid: u32, ok: bool) -> bool {
        match self.procs.iter_mut().find(|p| p.pid == pid && p.alive) {
            Some(proc) => {
                proc.alive = false;
                proc.code_ok = Some(ok);
                true
            }
            None => false,
        }
    }

    fn alloc_pid(&mut self) -> u32 {
        if self.next_pid <= 1 {
            self.next_pid = 2;
        }
        let pid = self.next_pid;
        self.next_pid = self.next_pid.saturating_add(1);
        pid
    }
}

struct Slot {
    svc: Service,
    pid: Option<u32>,
    starts: Vec<u64>,
    next_start: u64,
    done: bool,
}

pub struct Supervisor {
    slots: Vec<Slot>,
    stopping: bool,
}

impl Supervisor {
    pub fn try_new(services: Vec<Service>) -> Result<Self, AdmitError> {
        for service in &services {
            admit(service)?;
        }
        Ok(Self {
            slots: services
                .into_iter()
                .map(|svc| Slot {
                    svc,
                    pid: None,
                    starts: Vec::new(),
                    next_start: 0,
                    done: false,
                })
                .collect(),
            stopping: false,
        })
    }

    /// True after [`Self::request_stop`]. A stop does not signal a process.
    pub fn stopping(&self) -> bool {
        self.stopping
    }

    /// Record a stop. Later ticks bring live children down from the last
    /// row to the first and do not start replacements.
    pub fn request_stop(&mut self) {
        self.stopping = true;
    }

    pub fn services(&self) -> Vec<Service> {
        self.slots.iter().map(|slot| slot.svc.clone()).collect()
    }

    pub fn pid_of(&self, name: &str) -> Option<u32> {
        self.slots
            .iter()
            .find(|slot| slot.svc.name == name)
            .and_then(|slot| slot.pid)
    }

    pub fn next_start_of(&self, name: &str) -> Option<u64> {
        self.slots
            .iter()
            .find(|slot| slot.svc.name == name)
            .map(|slot| slot.next_start)
    }

    pub fn is_done(&self, name: &str) -> bool {
        self.slots
            .iter()
            .find(|slot| slot.svc.name == name)
            .is_some_and(|slot| slot.done)
    }

    /// Reap dead children, then start what is due, in list order.
    /// A service with `after` waits until each named service has a live child.
    /// After [`Self::request_stop`], one live child is recorded exited per
    /// tick, last row first, and nothing is started.
    pub fn tick(&mut self, machine: &mut Machine) {
        if self.stopping {
            self.bring_down(machine);
            return;
        }
        for index in 0..self.slots.len() {
            self.reap(index, machine);
            if self.slots[index].pid.is_some() || self.slots[index].done {
                continue;
            }
            if machine.now < self.slots[index].next_start {
                continue;
            }
            if !self.deps_ready(index, machine) {
                continue;
            }
            self.maybe_start(index, machine);
        }
    }

    fn bring_down(&mut self, machine: &mut Machine) {
        for slot in &mut self.slots {
            if slot.pid.is_none() {
                slot.done = true;
            }
        }
        let Some(index) = self.slots.iter().rposition(|slot| {
            slot.pid.is_some_and(|pid| {
                machine
                    .procs
                    .iter()
                    .any(|proc| proc.pid == pid && proc.alive)
            })
        }) else {
            return;
        };
        let pid = self.slots[index].pid.expect("live child");
        machine.exited(pid, true);
        self.slots[index].pid = None;
        self.slots[index].done = true;
    }

    fn reap(&mut self, index: usize, machine: &Machine) {
        let Some(pid) = self.slots[index].pid else {
            return;
        };
        let Some(proc) = machine.procs.iter().find(|proc| proc.pid == pid) else {
            return;
        };
        if proc.alive {
            return;
        }
        let ok = proc.code_ok.unwrap_or(false);
        let restart = self.slots[index].svc.restart;
        let restart_sec = self.slots[index].svc.restart_sec;
        self.slots[index].pid = None;
        let delay = match (restart, ok) {
            (Restart::Always, _) => Some(restart_sec),
            (Restart::OnFailure, false) => Some(restart_sec),
            (Restart::OnFailure, true) | (Restart::No, _) => None,
        };
        match delay {
            Some(sec) => {
                self.slots[index].next_start = machine.now.saturating_add(sec);
            }
            None => self.slots[index].done = true,
        }
    }

    fn deps_ready(&self, index: usize, machine: &Machine) -> bool {
        self.slots[index].svc.after.iter().all(|dep| {
            self.slots.iter().any(|other| {
                other.svc.name == *dep
                    && other.pid.is_some_and(|pid| {
                        machine
                            .procs
                            .iter()
                            .any(|proc| proc.pid == pid && proc.alive)
                    })
            })
        })
    }

    fn maybe_start(&mut self, index: usize, machine: &mut Machine) {
        let now = machine.now;
        self.slots[index]
            .starts
            .retain(|started| now.saturating_sub(*started) <= START_LIMIT_WINDOW_SEC);
        if self.slots[index].starts.len() >= START_LIMIT_BURST {
            self.slots[index].next_start = now.saturating_add(START_LIMIT_WINDOW_SEC);
            return;
        }
        let name = self.slots[index].svc.name.clone();
        let pid = machine.alloc_pid();
        self.slots[index].starts.push(now);
        self.slots[index].pid = Some(pid);
        machine.procs.push(Proc {
            pid,
            name,
            alive: true,
            code_ok: None,
        });
    }
}

pub fn admit(service: &Service) -> Result<(), AdmitError> {
    if service.name.is_empty()
        || !service
            .name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
    {
        return Err(AdmitError::BadName {
            name: service.name.clone(),
        });
    }
    if service.user.is_empty() {
        return Err(AdmitError::EmptyUser {
            name: service.name.clone(),
        });
    }
    if service.argv.is_empty() {
        return Err(AdmitError::EmptyArgv {
            name: service.name.clone(),
        });
    }
    let program = &service.argv[0];
    if !program.starts_with('/') {
        return Err(AdmitError::RelativeProgram {
            name: service.name.clone(),
        });
    }
    if path_has_dotdot(program) || service.argv.iter().any(|arg| path_has_dotdot(arg)) {
        return Err(AdmitError::DotDot {
            name: service.name.clone(),
        });
    }
    if is_shell(program) {
        return Err(AdmitError::Shell {
            name: service.name.clone(),
        });
    }
    if service.argv.iter().any(|arg| is_host_init(arg)) {
        return Err(AdmitError::HostInit {
            name: service.name.clone(),
        });
    }
    if let Some(dir) = &service.workdir {
        if !dir.starts_with('/') {
            return Err(AdmitError::RelativeWorkdir {
                name: service.name.clone(),
            });
        }
        if path_has_dotdot(dir) {
            return Err(AdmitError::DotDot {
                name: service.name.clone(),
            });
        }
        if is_host_init(dir) {
            return Err(AdmitError::HostInit {
                name: service.name.clone(),
            });
        }
    }
    let joined = service.argv.join(" ");
    if has_secret_marker(&joined)
        || service
            .env
            .iter()
            .any(|(key, value)| has_secret_marker(key) || has_secret_marker(value))
    {
        return Err(AdmitError::SecretOnArgv {
            name: service.name.clone(),
        });
    }
    Ok(())
}

/// Desktop services from the packaging plan. `openmind-desktop` is first.
/// Research starts after that child is alive. `galion-voiced` is absent.
pub fn desktop_services() -> Vec<Service> {
    vec![
        Service {
            name: "openmind-desktop".to_string(),
            argv: vec![
                "/opt/galion/openmind-desktop/openmind-desktop".to_string(),
                "--listen".to_string(),
            ],
            user: "galion".to_string(),
            workdir: None,
            restart: Restart::Always,
            restart_sec: 5,
            env: Vec::new(),
            after: Vec::new(),
            port: Some(crate::handoff::DESKTOP_PORT),
            handoff: None,
        },
        Service {
            name: "galion-research".to_string(),
            argv: vec!["/usr/bin/node".to_string(), "src/server.js".to_string()],
            user: "galion".to_string(),
            workdir: Some("/opt/galion/research/current".to_string()),
            restart: Restart::Always,
            restart_sec: 5,
            env: vec![("PORT".to_string(), RESEARCH_PORT.to_string())],
            after: vec!["openmind-desktop".to_string()],
            port: Some(RESEARCH_PORT),
            handoff: Some(one_target()),
        },
    ]
}

/// Voice-image service. The caller supplies the absolute program path.
/// The voice packaging note names `bin/galion-voiced` in the archive and
/// does not name an installed path.
pub fn voice_service(program: &str) -> Service {
    Service {
        name: "galion-voiced".to_string(),
        argv: vec![program.to_string()],
        user: "galion".to_string(),
        workdir: None,
        restart: Restart::Always,
        restart_sec: 5,
        env: Vec::new(),
        after: Vec::new(),
        port: None,
        handoff: None,
    }
}

fn base_name(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

fn is_host_init(path: &str) -> bool {
    HOST_INIT_PATHS.contains(&path) || HOST_INIT_BASES.contains(&base_name(path))
}

fn is_shell(path: &str) -> bool {
    SHELL_BASES.contains(&base_name(path))
}

fn path_has_dotdot(path: &str) -> bool {
    path.split('/').any(|part| part == "..")
}

fn has_secret_marker(text: &str) -> bool {
    let lower = text.to_ascii_lowercase();
    lower.contains("--token")
        || lower.contains("lock-secrets")
        || lower.contains("private key")
        || lower.contains("begin ")
}
