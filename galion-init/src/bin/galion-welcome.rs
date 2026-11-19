// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Serve the Galion OS welcome page on the loopback interface.
//!
//! One HTML page. No other hosts. The process stays in the foreground so
//! systemd can keep `galion-welcome.service` running.

#![forbid(unsafe_code)]

use std::env;
use std::io::{self, Read, Write};
use std::net::{Ipv4Addr, Ipv6Addr, TcpListener, TcpStream};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use galion_init::{answer, rows_from_snapshot, running_as_host_init, UnitSnapshot, WELCOME_PORT};

fn main() {
    if running_as_host_init() {
        note(PID1_REFUSAL);
        std::process::exit(2);
    }
    let Some(port) = welcome_port() else {
        note(PORT_REFUSAL);
        std::process::exit(2);
    };
    let v4 = match TcpListener::bind((Ipv4Addr::LOCALHOST, port)) {
        Ok(listener) => listener,
        Err(err) => {
            note(&ipv4_refusal(&err));
            std::process::exit(1);
        }
    };
    if !v4.local_addr().is_ok_and(|addr| addr.ip().is_loopback()) {
        note(NOT_LOOPBACK);
        std::process::exit(1);
    }
    let bound = v4.local_addr().map_or(port, |addr| addr.port());
    match TcpListener::bind((Ipv6Addr::LOCALHOST, bound)) {
        Ok(v6) if v6.local_addr().is_ok_and(|addr| addr.ip().is_loopback()) => {
            if thread::Builder::new()
                .spawn(move || accept_loop(v6))
                .is_err()
            {
                note(IPV6_UNAVAILABLE);
            }
        }
        _ => note(IPV6_UNAVAILABLE),
    }
    note(&listen_line(bound));
    accept_loop(v4);
}

const PID1_REFUSAL: &str = "galion-welcome: refusing to run as PID 1.";
const PORT_REFUSAL: &str = "galion-welcome: GALION_WELCOME_PORT is not a port";
const NOT_LOOPBACK: &str = "galion-welcome: refusing a socket that is not loopback";
const IPV6_UNAVAILABLE: &str = "galion-welcome: IPv6 loopback is not available";

fn ipv4_refusal(err: &std::io::Error) -> String {
    format!("galion-welcome: the IPv4 loopback port is not available ({err})")
}

fn listen_line(port: u16) -> String {
    format!("galion-welcome: listening on the loopback interface, port {port}")
}

/// Write one line. A closed stderr is reported as a failed write and does not panic.
fn note(line: &str) {
    let _ = writeln!(io::stderr(), "{line}");
}

fn welcome_port() -> Option<u16> {
    let Ok(value) = env::var("GALION_WELCOME_PORT") else {
        return Some(WELCOME_PORT);
    };
    if value.is_empty() {
        None
    } else {
        value.parse().ok()
    }
}

/// Owns `listener` for the life of the process. `incoming` only borrows it,
/// and the IPv6 thread needs that ownership to move.
#[allow(clippy::needless_pass_by_value)]
fn accept_loop(listener: TcpListener) {
    for conn in listener.incoming() {
        let Ok(mut stream) = conn else {
            continue;
        };
        let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
        let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
        let request = read_request(&mut stream);
        let rows = rows_from_snapshot(&snapshot());
        let _ = stream.write_all(&answer(&request, &rows));
    }
}

fn read_request(stream: &mut TcpStream) -> String {
    let mut buf = [0u8; 8192];
    let mut filled = 0;
    while filled < buf.len() {
        match stream.read(&mut buf[filled..]) {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                filled += n;
                if buf[..filled].windows(4).any(|window| window == b"\r\n\r\n") {
                    break;
                }
            }
        }
    }
    String::from_utf8_lossy(&buf[..filled]).into_owned()
}

fn snapshot() -> UnitSnapshot {
    let program = env::var("GALION_SYSTEMCTL").unwrap_or_else(|_| "systemctl".to_string());
    UnitSnapshot {
        list_units: capture(
            &program,
            &[
                "list-units",
                "--all",
                "--plain",
                "--no-legend",
                "--no-pager",
                "galion-*",
            ],
        ),
        list_files: capture(
            &program,
            &[
                "list-unit-files",
                "--plain",
                "--no-legend",
                "--no-pager",
                "galion-*",
            ],
        ),
        desktop_show: capture(
            &program,
            &[
                "show",
                "-p",
                "Id",
                "-p",
                "LoadState",
                "-p",
                "ActiveState",
                "-p",
                "SubState",
                "--",
                "openmind-desktop.service",
            ],
        ),
    }
}

fn capture(program: &str, args: &[&str]) -> Option<String> {
    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    let mut stdout = child.stdout.take()?;
    let (tx, rx) = std::sync::mpsc::channel();
    if thread::Builder::new()
        .spawn(move || {
            let mut text = String::new();
            let _ = stdout.read_to_string(&mut text);
            let _ = tx.send(text);
        })
        .is_err()
    {
        let _ = child.kill();
        let _ = child.wait();
        return None;
    }
    let deadline = Instant::now() + Duration::from_secs(2);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let text = rx.recv_timeout(Duration::from_secs(1)).unwrap_or_default();
                if status.success() {
                    return Some(text);
                }
                return None;
            }
            Ok(None) if Instant::now() >= deadline => {
                let _ = child.kill();
                let _ = child.wait();
                return None;
            }
            Ok(None) => thread::sleep(Duration::from_millis(20)),
            Err(_) => return None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        ipv4_refusal, listen_line, IPV6_UNAVAILABLE, NOT_LOOPBACK, PID1_REFUSAL, PORT_REFUSAL,
    };

    fn plain(line: &str) {
        assert_eq!(line.lines().count(), 1, "{line}");
        assert!(line.starts_with("galion-welcome: "), "{line}");
        let lower = line.to_ascii_lowercase();
        assert!(!lower.contains("unwrap"), "{line}");
        assert!(!lower.contains("panic"), "{line}");
    }

    #[test]
    fn refusals_are_one_plain_sentence() {
        plain(PID1_REFUSAL);
        plain(PORT_REFUSAL);
        plain(NOT_LOOPBACK);
        plain(IPV6_UNAVAILABLE);
        assert!(PID1_REFUSAL.contains("PID 1"));
        assert!(PORT_REFUSAL.contains("not a port"));
        assert!(NOT_LOOPBACK.contains("not loopback"));
        assert!(IPV6_UNAVAILABLE.contains("not available"));

        let busy = ipv4_refusal(&std::io::Error::new(
            std::io::ErrorKind::AddrInUse,
            "the port is in use",
        ));
        plain(&busy);
        assert!(busy.contains("the port is in use"));

        let listening = listen_line(18711);
        plain(&listening);
        assert!(listening.contains("18711"));
        assert!(listening.contains("loopback"));
    }
}
