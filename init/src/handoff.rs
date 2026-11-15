// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Handoff to the Open Mind desktop. The prototype records the address.
//! It does not bind a socket.

/// IPv4 loopback, the desktop crate's `DEFAULT_BIND` host.
pub const DESKTOP_HOST: &str = "127.0.0.1";

/// `DEFAULT_PORT` in openmind-desktop. Port 18081 is not this port.
pub const DESKTOP_PORT: u16 = 18181;

/// Console path the desktop serves at `GET /`.
pub const DESKTOP_PATH: &str = "/";

/// `GALION_ONE_URL` for the research process: the console's `/one` on the
/// desktop port, http on IPv4 loopback.
pub const ONE_URL: &str = "http://127.0.0.1:18181/one";

/// Console probe port. Not the desktop handoff.
const PROBE_PORT: u16 = 18080;

/// Staging page port the desktop crate leaves unused.
const UNUSED_STAGING_PORT: u16 = 18081;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Handoff {
    pub host: &'static str,
    pub port: u16,
    pub path: &'static str,
}

pub fn desktop_handoff() -> Handoff {
    Handoff {
        host: DESKTOP_HOST,
        port: DESKTOP_PORT,
        path: DESKTOP_PATH,
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BindError {
    NotLoopback,
    ProbePort,
    UnusedStagingPort,
    NotDesktopPort,
}

/// Accept only loopback on the desktop port.
pub fn check_desktop_bind(host: &str, port: u16) -> Result<(), BindError> {
    if host != DESKTOP_HOST && host != "::1" {
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
