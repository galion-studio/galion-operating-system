// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! The welcome binary on the loopback interface.
//! This is not a Raspberry Pi 5 result.

use std::io::{Read, Write};
use std::net::{Ipv4Addr, TcpListener, TcpStream};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

struct ChildGuard(std::process::Child);

impl Drop for ChildGuard {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn free_port() -> u16 {
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
    listener.local_addr().unwrap().port()
}

fn fake_systemctl_at(name: &str, script: &str) -> String {
    let dir =
        std::env::temp_dir().join(format!("galion-welcome-test-{}-{name}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    let path = dir.join("systemctl");
    std::fs::write(&path, script).unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&path, perms).unwrap();
    }
    path.to_string_lossy().into_owned()
}

fn fake_systemctl() -> String {
    fake_systemctl_at(
        "down",
        "#!/bin/sh\ncase \"$1\" in\n  list-units)\n    printf '%s\\n' \\\n      'galion-os.target loaded active active Galion OS' \\\n      'galion-init.service loaded active exited Galion OS init plan' \\\n      'galion-welcome.service loaded active running Galion OS welcome'\n    ;;\n  list-unit-files)\n    printf '%s\\n' \\\n      'galion-os.target enabled enabled' \\\n      'galion-init.service enabled enabled' \\\n      'galion-welcome.service enabled enabled'\n    ;;\n  show)\n    printf '%s\\n' 'Id=openmind-desktop.service' 'LoadState=not-found' 'ActiveState=inactive' 'SubState=dead'\n    ;;\n  *)\n    exit 1\n    ;;\nesac\nexit 0\n",
    )
}

fn get(port: u16, request: &str) -> String {
    let mut stream = TcpStream::connect((Ipv4Addr::LOCALHOST, port)).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(3)))
        .unwrap();
    stream
        .set_write_timeout(Some(Duration::from_secs(3)))
        .unwrap();
    stream.write_all(request.as_bytes()).unwrap();
    let mut body = String::new();
    let _ = stream.read_to_string(&mut body);
    body
}

#[test]
fn welcome_binary_serves_the_loopback_page() {
    let port = free_port();
    let systemctl = fake_systemctl();
    let child = Command::new(env!("CARGO_BIN_EXE_galion-welcome"))
        .env("GALION_WELCOME_PORT", port.to_string())
        .env("GALION_SYSTEMCTL", &systemctl)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .expect("galion-welcome");
    let mut child = ChildGuard(child);
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        if Instant::now() >= deadline {
            panic!("welcome binary did not accept a connection");
        }
        match child.0.try_wait() {
            Ok(Some(status)) => panic!("welcome binary exited {status}"),
            Ok(None) => {}
            Err(err) => panic!("welcome binary wait failed: {err}"),
        }
        if TcpStream::connect((Ipv4Addr::LOCALHOST, port)).is_ok() {
            break;
        }
        thread::sleep(Duration::from_millis(20));
    }
    let page = get(
        port,
        "GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
    );
    assert!(page.starts_with("HTTP/1.1 200 OK\r\n"), "{page}");
    for word in [
        "Galion OS",
        "Welcome.",
        "<h2>Init</h2>",
        "<h2>Welcome</h2>",
        "<h2>Open Mind</h2>",
        "<h2>Research</h2>",
        "<h2>Voice</h2>",
        "Up",
        "Finished",
        "Not on this machine",
    ] {
        assert!(page.contains(word), "missing {word}");
    }
    assert!(!page.contains("http://"));
    assert!(!page.contains("https://"));
    assert!(!page.to_ascii_lowercase().contains("<script"));
    let dotted = page
        .split(|ch: char| !ch.is_ascii_digit() && ch != '.')
        .any(|part| {
            let octets: Vec<_> = part.split('.').collect();
            octets.len() == 4
                && octets
                    .iter()
                    .all(|octet| !octet.is_empty() && octet.chars().all(|ch| ch.is_ascii_digit()))
        });
    assert!(!dotted, "page contains a dotted address");
    assert!(page.contains("--om-ink"), "missing Open Mind tokens");
    let _ = std::fs::remove_dir_all(std::path::Path::new(&systemctl).parent().unwrap());
}

#[test]
fn welcome_binary_links_research_and_the_desktop_when_up() {
    let port = free_port();
    let systemctl = fake_systemctl_at(
        "up",
        "#!/bin/sh\ncase \"$1\" in\n  list-units)\n    printf '%s\\n' \\\n      'galion-os.target loaded active active Galion OS' \\\n      'galion-init.service loaded active exited Galion OS init plan' \\\n      'galion-welcome.service loaded active running Galion OS welcome' \\\n      'galion-research.service loaded active running Galion Research'\n    ;;\n  list-unit-files)\n    printf '%s\\n' \\\n      'galion-research.service enabled enabled'\n    ;;\n  show)\n    printf '%s\\n' 'Id=openmind-desktop.service' 'LoadState=loaded' 'ActiveState=active' 'SubState=running'\n    ;;\n  *)\n    exit 1\n    ;;\nesac\nexit 0\n",
    );
    let child = Command::new(env!("CARGO_BIN_EXE_galion-welcome"))
        .env("GALION_WELCOME_PORT", port.to_string())
        .env("GALION_SYSTEMCTL", &systemctl)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("galion-welcome");
    let mut child = ChildGuard(child);
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        if Instant::now() >= deadline {
            panic!("welcome binary did not accept a connection");
        }
        match child.0.try_wait() {
            Ok(Some(status)) => panic!("welcome binary exited {status}"),
            Ok(None) => {}
            Err(err) => panic!("welcome binary wait failed: {err}"),
        }
        if TcpStream::connect((Ipv4Addr::LOCALHOST, port)).is_ok() {
            break;
        }
        thread::sleep(Duration::from_millis(20));
    }
    let page = get(
        port,
        "GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
    );
    assert!(page.contains("href=\"http://127.0.0.1:8787/\""), "{page}");
    assert!(page.contains("href=\"http://127.0.0.1:18181/\""), "{page}");
    assert!(page.contains("Not on this machine"), "{page}");
    assert!(!page.to_ascii_lowercase().contains("<script"));
    let _ = std::fs::remove_dir_all(std::path::Path::new(&systemctl).parent().unwrap());
}
