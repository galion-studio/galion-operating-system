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
        eprintln!("galion-welcome: refusing to run as PID 1.");
        std::process::exit(2);
    }
    let Some(port) = welcome_port() else {
        let _ = writeln!(
            io::stderr(),
            "galion-welcome: GALION_WELCOME_PORT is not a port"
        );
        std::process::exit(2);
    };
    let v4 = match TcpListener::bind((Ipv4Addr::LOCALHOST, port)) {
        Ok(listener) => listener,
        Err(err) => {
            eprintln!("galion-welcome: the IPv4 loopback port is not available ({err})");
            std::process::exit(1);
        }
    };
    if !v4
        .local_addr()
        .map(|addr| addr.ip().is_loopback())
        .unwrap_or(false)
    {
        eprintln!("galion-welcome: refusing a socket that is not loopback");
        std::process::exit(1);
    }
    let bound = v4.local_addr().map(|addr| addr.port()).unwrap_or(port);
    match TcpListener::bind((Ipv6Addr::LOCALHOST, bound)) {
        Ok(v6)
            if v6
                .local_addr()
                .map(|addr| addr.ip().is_loopback())
                .unwrap_or(false) =>
        {
            thread::spawn(move || accept_loop(v6));
        }
        _ => eprintln!("galion-welcome: IPv6 loopback is not available"),
    }
    eprintln!("galion-welcome: listening on the loopback interface, port {bound}");
    accept_loop(v4);
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
    thread::spawn(move || {
        let mut text = String::new();
        let _ = stdout.read_to_string(&mut text);
        let _ = tx.send(text);
    });
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
