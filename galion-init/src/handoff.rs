// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Handoff from the desktop console to research at `/one`.
//! The prototype records a host class and a port. It does not bind a socket
//! and it does not store a dotted address.

/// Desktop console port. The image passes no listen address, so the desktop
/// crate keeps this default. Port 18081 is not this port.
pub const DESKTOP_PORT: u16 = 18181;

/// Research process port.
pub const RESEARCH_PORT: u16 = 8787;

/// Console path the desktop serves.
pub const DESKTOP_PATH: &str = "/";

/// Path where research reaches One, on the desktop port.
pub const ONE_PATH: &str = "/one";

/// Console probe port. Not the desktop handoff.
const PROBE_PORT: u16 = 18080;

/// Staging page port the desktop crate leaves unused.
const UNUSED_STAGING_PORT: u16 = 18081;

/// Host class. Names only. No address literal is stored.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Host {
    Ipv4Loopback,
    Ipv6Loopback,
    Unspecified,
    Other,
}

impl Host {
    pub fn name(self) -> &'static str {
        match self {
            Host::Ipv4Loopback => "ipv4-loopback",
            Host::Ipv6Loopback => "ipv6-loopback",
            Host::Unspecified => "unspecified",
            Host::Other => "other",
        }
    }

    pub fn is_loopback(self) -> bool {
        matches!(self, Host::Ipv4Loopback | Host::Ipv6Loopback)
    }
}

/// One recorded endpoint: scheme words, host class, port, path.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Endpoint {
    pub scheme: &'static str,
    pub host: Host,
    pub port: u16,
    pub path: &'static str,
}

/// Desktop console on IPv4 loopback, port 18181, path `/`.
pub fn desktop_handoff() -> Endpoint {
    Endpoint {
        scheme: "http",
        host: Host::Ipv4Loopback,
        port: DESKTOP_PORT,
        path: DESKTOP_PATH,
    }
}

/// Research reaches One on that same console, path `/one`.
pub fn one_target() -> Endpoint {
    Endpoint {
        scheme: "http",
        host: Host::Ipv4Loopback,
        port: DESKTOP_PORT,
        path: ONE_PATH,
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BindError {
    NotLoopback,
    ProbePort,
    UnusedStagingPort,
    NotDesktopPort,
}

/// Accept only a loopback host class on the desktop port.
pub fn check_desktop_bind(host: Host, port: u16) -> Result<(), BindError> {
    if !host.is_loopback() {
        return Err(BindError::NotLoopback);
    }
    if port == PROBE_PORT {
        return Err(BindError::ProbePort);
    }
    if port == UNUSED_STAGING_PORT {
        return Err(BindError::UnusedStagingPort);
    }
    if port != DESKTOP_PORT {
        return Err(BindError::NotDesktopPort);
    }
    Ok(())
}

pub fn describe(endpoint: &Endpoint) -> String {
    format!(
        "{} on {} port {} path {}",
        endpoint.scheme,
        endpoint.host.name(),
        endpoint.port,
        endpoint.path
    )
}
