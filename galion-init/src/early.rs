// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Early desktop boot, recorded in order.
//!
//! The kernel has already mounted the squashfs root. These steps record the
//! virtual filesystems, loopback, and the clock. They do not call mount, open
//! a socket, or read the host clock.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Stage {
    Start,
    Mounted,
    Loopback,
    Clock,
    Tone,
    Supervised,
    HandedOff,
}

/// One virtual filesystem the desktop init records before it supervises.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct MountSpec {
    pub target: &'static str,
    pub kind: &'static str,
}

/// Virtual filesystems for the desktop root. The squashfs root itself is
/// already mounted by the kernel and is not in this list.
pub const DESKTOP_MOUNTS: &[MountSpec] = &[
    MountSpec {
        target: "/proc",
        kind: "proc",
    },
    MountSpec {
        target: "/sys",
        kind: "sysfs",
    },
    MountSpec {
        target: "/dev",
        kind: "devtmpfs",
    },
    MountSpec {
        target: "/run",
        kind: "tmpfs",
    },
];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BootError {
    OutOfOrder,
    HandoffNotReady,
    RefusedMount,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EarlyBoot {
    stage: Stage,
    mounted: Vec<&'static str>,
    samples: usize,
}

impl Default for EarlyBoot {
    fn default() -> Self {
        Self::new()
    }
}

impl EarlyBoot {
    pub fn new() -> Self {
        Self {
            stage: Stage::Start,
            mounted: Vec::new(),
            samples: 0,
        }
    }

    pub fn mounted(&self) -> &[&'static str] {
        &self.mounted
    }

    pub fn loopback_up(&self) -> bool {
        rank(self.stage) >= rank(Stage::Loopback)
    }

    pub fn clock_stepped(&self) -> bool {
        rank(self.stage) >= rank(Stage::Clock)
    }

    pub fn samples(&self) -> usize {
        self.samples
    }

    pub fn supervised(&self) -> bool {
        rank(self.stage) >= rank(Stage::Supervised)
    }

    pub fn handed_off(&self) -> bool {
        self.stage == Stage::HandedOff
    }

    /// Record the desktop virtual filesystems. A target outside the table,
    /// a relative path, or `..` is refused and nothing is recorded.
    pub fn mount(&mut self) -> Result<(), BootError> {
        self.advance(Stage::Start, Stage::Start)?;
        if !DESKTOP_MOUNTS.iter().all(mount_ok) {
            return Err(BootError::RefusedMount);
        }
        self.mounted
            .extend(DESKTOP_MOUNTS.iter().map(|spec| spec.target));
        self.stage = Stage::Mounted;
        Ok(())
    }

    /// Record that loopback exists. No socket is opened.
    pub fn loopback(&mut self) -> Result<(), BootError> {
        self.advance(Stage::Mounted, Stage::Loopback)
    }

    /// Record that the clock step ran. The host clock is not read or set.
    pub fn clock(&mut self) -> Result<(), BootError> {
        self.advance(Stage::Loopback, Stage::Clock)
    }

    /// Record the tone sample count. The count is stored and not played.
    pub fn tone(&mut self, samples: usize) -> Result<(), BootError> {
        self.advance(Stage::Clock, Stage::Clock)?;
        self.samples = samples;
        self.stage = Stage::Tone;
        Ok(())
    }

    /// Record that supervision may start. The caller starts the rows.
    pub fn supervise(&mut self) -> Result<(), BootError> {
        self.advance(Stage::Tone, Stage::Supervised)
    }

    /// Record the desktop handoff. If `ready` is false the stage stays put.
    pub fn handoff(&mut self, ready: bool) -> Result<(), BootError> {
        self.advance(Stage::Supervised, Stage::Supervised)?;
        if !ready {
            return Err(BootError::HandoffNotReady);
        }
        self.stage = Stage::HandedOff;
        Ok(())
    }

    fn advance(&mut self, from: Stage, to: Stage) -> Result<(), BootError> {
        if self.stage != from {
            return Err(BootError::OutOfOrder);
        }
        self.stage = to;
        Ok(())
    }
}

fn rank(stage: Stage) -> u8 {
    match stage {
        Stage::Start => 0,
        Stage::Mounted => 1,
        Stage::Loopback => 2,
        Stage::Clock => 3,
        Stage::Tone => 4,
        Stage::Supervised => 5,
        Stage::HandedOff => 6,
    }
}

fn mount_ok(spec: &MountSpec) -> bool {
    let target = spec.target;
    let kind = spec.kind;
    !target.is_empty()
        && target.starts_with('/')
        && !target.contains("..")
        && !target.contains('\0')
        && kind.chars().all(|c| c.is_ascii_alphanumeric())
        && !has_dotted_quad(target)
        && !has_dotted_quad(kind)
}

fn has_dotted_quad(text: &str) -> bool {
    text.split(|c: char| !c.is_ascii_digit() && c != '.')
        .any(|token| {
            let parts: Vec<&str> = token.split('.').filter(|part| !part.is_empty()).collect();
            parts.len() == 4 && token.matches('.').count() == 3
        })
}
