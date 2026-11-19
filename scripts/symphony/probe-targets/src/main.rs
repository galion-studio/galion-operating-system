// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Loopback stand-ins for the six services `openmind-desktop` probes.
//!
//! Ports and paths match `ProbeConfig::defaults` in obsidian-open-mind at
//! `b26ad02e1b1e9084815bb56d3aff9a02888ca8d8` (pull request 100). Each
//! answer is HTTP 200. These are not nerve, cortex, the console, Hermes,
//! voice, or desk. A PASS here is an emulator reading. It is not a
//! Raspberry Pi 5 result.

use std::io::{Read, Write};
use std::net::{Ipv4Addr, Ipv6Addr, TcpListener};
use std::thread;
use std::time::Duration;

struct Target {
    name: &'static str,
    port: u16,
    path: &'static str,
    body: &'static str,
}

const TARGETS: &[Target] = &[
    Target {
        name: "nerve",
        port: 8670,
        path: "/health",
        body: r#"{"ok":true,"service":"nerve"}"#,
    },
    Target {
        name: "cortex",
        port: 8674,
        path: "/health",
        body: r#"{"ok":true,"mode":"dry-run","service":"cortex"}"#,
    },
    Target {
        name: "console",
        port: 18080,
        path: "/api/v1/health",
        body: r#"{"ok":true,"service":"console"}"#,
    },
    Target {
        name: "hermes",
        port: 8642,
        path: "/health",
        body: r#"{"ok":true,"service":"hermes"}"#,
    },
    Target {
        name: "voice",
        port: 8002,
        path: "/health",
        body: r#"{"ok":true,"service":"voice"}"#,
    },
    Target {
        name: "desk",
        port: 8646,
        path: "/health",
        body: r#"{"ok":true,"service":"desk"}"#,
    },
];

fn main() {
    let mut threads = Vec::new();
    for target in TARGETS {
        match TcpListener::bind((Ipv4Addr::LOCALHOST, target.port)) {
            Ok(listener) => threads.push(thread::spawn(move || serve(listener, target))),
            Err(err) => {
                eprintln!(
                    "probe-targets: {} port {} is not available ({err})",
                    target.name, target.port
                );
                std::process::exit(1);
            }
        }
        match TcpListener::bind((Ipv6Addr::LOCALHOST, target.port)) {
            Ok(listener) => threads.push(thread::spawn(move || serve(listener, target))),
            Err(err) => {
                eprintln!(
                    "probe-targets: {} IPv6 port {} is not available ({err})",
                    target.name, target.port
                );
            }
        }
    }
    let mut err = std::io::stderr();
    let _ = writeln!(err, "probe-targets: listening");
    let _ = err.flush();
    for thread in threads {
        let _ = thread.join();
    }
}

fn serve(listener: TcpListener, target: &'static Target) {
    for conn in listener.incoming() {
        let Ok(mut stream) = conn else {
            continue;
        };
        let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
        let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
        let mut buf = [0u8; 2048];
        let n = stream.read(&mut buf).unwrap_or(0);
        let request = String::from_utf8_lossy(&buf[..n]);
        let _ = stream.write_all(&answer(&request, target));
    }
}

fn answer(request: &str, target: &Target) -> Vec<u8> {
    let line = request.lines().next().unwrap_or("");
    let mut parts = line.split_whitespace();
    let method = parts.next().unwrap_or("").to_ascii_uppercase();
    let raw = parts.next().unwrap_or("/");
    let path = raw.split('?').next().unwrap_or("/");
    match method.as_str() {
        "GET" | "HEAD" if path == target.path => response(200, "OK", target.body, method == "HEAD"),
        "GET" | "HEAD" => response(404, "Not Found", "", method == "HEAD"),
        _ => response(405, "Method Not Allowed", "", false),
    }
}

fn response(status: u16, reason: &str, body: &str, head: bool) -> Vec<u8> {
    let headers = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: application/json\r\nContent-Length: {len}\r\nConnection: close\r\n\r\n",
        len = body.len(),
    );
    let mut bytes = headers.into_bytes();
    if !head {
        bytes.extend_from_slice(body.as_bytes());
    }
    bytes
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::TcpStream;

    #[test]
    fn six_defaults_match_the_desktop_probe() {
        let expected = [
            ("nerve", 8670u16, "/health"),
            ("cortex", 8674, "/health"),
            ("console", 18080, "/api/v1/health"),
            ("hermes", 8642, "/health"),
            ("voice", 8002, "/health"),
            ("desk", 8646, "/health"),
        ];
        assert_eq!(TARGETS.len(), expected.len());
        for (target, (name, port, path)) in TARGETS.iter().zip(expected) {
            assert_eq!(target.name, name);
            assert_eq!(target.port, port);
            assert_eq!(target.path, path);
            let page =
                String::from_utf8(answer(&format!("GET {path} HTTP/1.1\r\n\r\n"), target)).unwrap();
            assert!(page.starts_with("HTTP/1.1 200 OK\r\n"), "{name}: {page}");
            assert!(page.contains(&format!("\"service\":\"{name}\"")), "{page}");
        }
        let cortex =
            String::from_utf8(answer("GET /health HTTP/1.1\r\n\r\n", &TARGETS[1])).unwrap();
        assert!(cortex.contains("\"mode\":\"dry-run\""));
        let missing =
            String::from_utf8(answer("GET /other HTTP/1.1\r\n\r\n", &TARGETS[0])).unwrap();
        assert!(missing.starts_with("HTTP/1.1 404 Not Found\r\n"));
        let denied =
            String::from_utf8(answer("POST /health HTTP/1.1\r\n\r\n", &TARGETS[0])).unwrap();
        assert!(denied.starts_with("HTTP/1.1 405 Method Not Allowed\r\n"));
    }

    #[test]
    fn a_live_get_returns_the_health_body() {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = thread::spawn(move || {
            let Ok((mut stream, _addr)) = listener.accept() else {
                return;
            };
            let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
            let mut buf = [0u8; 2048];
            let n = stream.read(&mut buf).unwrap_or(0);
            let request = String::from_utf8_lossy(&buf[..n]);
            let _ = stream.write_all(&answer(&request, &TARGETS[0]));
        });
        let mut stream = TcpStream::connect(addr).unwrap();
        stream
            .write_all(b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
            .unwrap();
        let mut body = Vec::new();
        stream.read_to_end(&mut body).unwrap();
        handle.join().unwrap();
        let text = String::from_utf8(body).unwrap();
        assert!(text.starts_with("HTTP/1.1 200 OK\r\n"), "{text}");
        assert!(text.contains("\"service\":\"nerve\""));
    }
}
