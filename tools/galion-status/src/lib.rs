//! Local status for the ports named in `docs/ARCHITECTURE.md`.
//!
//! Every probe uses `127.0.0.1`. Nothing is started.

use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::path::Path;
use std::time::Duration;

/// The only address this tool dials.
pub const LOCAL: IpAddr = IpAddr::V4(Ipv4Addr::LOCALHOST);

const RESEARCH_HEALTH: &str =
    "{\"ok\":true,\"service\":\"galion-research\",\"bind\":\"127.0.0.1\"}";

/// One row from the architecture port table, plus the cortex stand-in.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Service {
    pub name: &'static str,
    pub port: u16,
    /// Paths relative to the machine root. An existing file or directory means installed.
    pub markers: &'static [&'static str],
    /// `GET` this path when the port accepts a connection. `None` means the connection is enough.
    pub health_path: Option<&'static str>,
    /// When set, the response must contain this text. Redirects are not followed.
    pub health_body: Option<&'static str>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Verdict {
    Up,
    Down,
    NotInstalled,
}

impl Verdict {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Up => "up",
            Self::Down => "down",
            Self::NotInstalled => "not installed",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Answer {
    /// Nothing accepted the connection, or the wait expired.
    Closed,
    /// The port accepted a connection, and any required health check matched.
    Open,
    /// The port accepted a connection, and the health check did not match.
    Mismatch,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct NotLocal;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Line {
    pub name: &'static str,
    pub port: u16,
    pub verdict: Verdict,
}

/// Ports and install files the architecture page names.
///
/// Rows with an empty marker list are `not installed` when the port is closed.
/// `galion-one` and its mouth share the binary path in `docs/PACKAGING.md`.
pub fn services() -> Vec<Service> {
    vec![
        Service {
            name: "galion-welcome",
            port: 18711,
            markers: &[
                "etc/systemd/system/galion-welcome.service",
                "opt/galion/bin/galion-welcome",
            ],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "openmind-desktop",
            port: 18181,
            markers: &[
                "etc/systemd/system/openmind-desktop.service",
                "opt/galion/openmind-desktop/openmind-desktop",
            ],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "galion-research",
            port: 8787,
            markers: &[
                "etc/systemd/system/galion-research.service",
                "etc/systemd/system/galion-research-pi5.service",
                "opt/galion/research/current",
            ],
            health_path: Some("/health"),
            health_body: Some(RESEARCH_HEALTH),
        },
        Service {
            name: "voice-screen",
            port: 7878,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "galion-one",
            port: 8091,
            markers: &[
                "etc/systemd/system/galion-one.service",
                "opt/galion/openmind/dist/bin/galion-one",
            ],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "galion-one-mouth",
            port: 8002,
            markers: &[
                "etc/systemd/system/galion-one.service",
                "opt/galion/openmind/dist/bin/galion-one",
            ],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "galion-desk",
            port: 8646,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "hermes-gateway",
            port: 8642,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "console",
            port: 18080,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "openmind-memory",
            port: 8420,
            markers: &[],
            health_path: Some("/health"),
            health_body: None,
        },
        Service {
            name: "openmind-nerve",
            port: 8670,
            markers: &["etc/systemd/system/galion-nerve.service"],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "tuner",
            port: 8650,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "room",
            port: 4020,
            markers: &[],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "ollama",
            port: 11434,
            markers: &["usr/bin/ollama", "usr/local/bin/ollama"],
            health_path: None,
            health_body: None,
        },
        Service {
            name: "cortex-stand-in",
            port: 8674,
            markers: &[],
            health_path: None,
            health_body: None,
        },
    ]
}

pub fn installed(root: &Path, markers: &[&str]) -> bool {
    markers.iter().any(|marker| root.join(marker).exists())
}

pub fn verdict(answer: Answer, present: bool) -> Verdict {
    match answer {
        Answer::Open => Verdict::Up,
        Answer::Mismatch | Answer::Closed if present => Verdict::Down,
        Answer::Mismatch | Answer::Closed => Verdict::NotInstalled,
    }
}

/// Dial `addr` when it is `127.0.0.1`. Any other address returns [`NotLocal`] and is not dialed.
pub fn probe(
    addr: SocketAddr,
    health_path: Option<&str>,
    health_body: Option<&str>,
    timeout: Duration,
) -> Result<Answer, NotLocal> {
    if addr.ip() != LOCAL {
        return Err(NotLocal);
    }
    let mut stream = match TcpStream::connect_timeout(&addr, timeout) {
        Ok(stream) => stream,
        Err(_) => return Ok(Answer::Closed),
    };
    let Some(path) = health_path else {
        return Ok(Answer::Open);
    };
    if http_matches(&mut stream, path, health_body, timeout) {
        Ok(Answer::Open)
    } else {
        Ok(Answer::Mismatch)
    }
}

pub fn check(rows: &[Service], root: &Path, timeout: Duration) -> Vec<Line> {
    rows.iter()
        .map(|row| {
            let addr = SocketAddr::new(LOCAL, row.port);
            let answer = probe(addr, row.health_path, row.health_body, timeout)
                .expect("probe address is 127.0.0.1");
            Line {
                name: row.name,
                port: row.port,
                verdict: verdict(answer, installed(root, row.markers)),
            }
        })
        .collect()
}

pub fn render(lines: &[Line]) -> String {
    let mut out = String::from("Galion local status\n127.0.0.1 only.\n\n");
    for line in lines {
        out.push_str(&format!(
            "{:<18} {:>5}  {}\n",
            line.name,
            line.port,
            line.verdict.as_str()
        ));
    }
    out.push_str("This reading is this machine.\n");
    out
}

/// One JSON array. `name`, `port`, and `state` are the fields other scripts read.
pub fn render_json(lines: &[Line]) -> String {
    let mut out = String::from("[\n");
    for (i, line) in lines.iter().enumerate() {
        if i > 0 {
            out.push_str(",\n");
        }
        out.push_str(&format!(
            "  {{\"name\":\"{}\",\"port\":{},\"state\":\"{}\"}}",
            line.name,
            line.port,
            line.verdict.as_str()
        ));
    }
    if !lines.is_empty() {
        out.push('\n');
    }
    out.push_str("]\n");
    out
}

fn http_matches(
    stream: &mut TcpStream,
    path: &str,
    body_has: Option<&str>,
    timeout: Duration,
) -> bool {
    let _ = stream.set_read_timeout(Some(timeout));
    let _ = stream.set_write_timeout(Some(timeout));
    let request = format!("GET {path} HTTP/1.0\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }
    let mut buf = [0_u8; 1024];
    let mut got = Vec::new();
    loop {
        if got.len() >= 4096 {
            break;
        }
        match stream.read(&mut buf) {
            Ok(0) | Err(_) => break,
            Ok(n) => got.extend_from_slice(&buf[..n]),
        }
    }
    let text = String::from_utf8_lossy(&got);
    let Some(status) = text.lines().next() else {
        return false;
    };
    let Some(code) = status
        .split_whitespace()
        .nth(1)
        .and_then(|token| token.parse::<u16>().ok())
    else {
        return false;
    };
    if !(200..300).contains(&code) {
        return false;
    }
    match body_has {
        Some(needle) => text.contains(needle),
        None => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::thread;

    fn timeout() -> Duration {
        Duration::from_millis(500)
    }

    fn closed_port() -> u16 {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
        listener.local_addr().unwrap().port()
    }

    fn tcp_port() -> u16 {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        thread::spawn(move || {
            let _ = listener.accept();
        });
        port
    }

    fn http_port(status: &str, body: &str) -> u16 {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        let status = status.to_string();
        let body = body.to_string();
        thread::spawn(move || {
            let (mut sock, _) = listener.accept().expect("accept");
            let mut buf = [0_u8; 2048];
            let _ = sock.read(&mut buf);
            let response = format!(
                "HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            let _ = sock.write_all(response.as_bytes());
        });
        port
    }

    #[test]
    fn documented_ports_are_the_table() {
        let ports: Vec<u16> = services().iter().map(|row| row.port).collect();
        assert_eq!(
            ports,
            vec![
                18711, 18181, 8787, 7878, 8091, 8002, 8646, 8642, 18080, 8420, 8670, 8650, 4020,
                11434, 8674,
            ]
        );
        assert!(!ports.contains(&18081));
        assert_eq!(services().len(), 15);
        let names: Vec<&str> = services().iter().map(|row| row.name).collect();
        assert_eq!(
            names.len(),
            names.iter().collect::<std::collections::HashSet<_>>().len()
        );
    }

    #[test]
    fn other_addresses_are_not_dialed() {
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)), 9);
        let err = probe(addr, None, None, Duration::from_millis(20)).unwrap_err();
        assert_eq!(err, NotLocal);
        let v6 = SocketAddr::new(IpAddr::V6(std::net::Ipv6Addr::LOCALHOST), 9);
        assert_eq!(
            probe(v6, None, None, Duration::from_millis(20)),
            Err(NotLocal)
        );
    }

    #[test]
    fn stub_listener_is_up() {
        let port = tcp_port();
        let addr = SocketAddr::new(LOCAL, port);
        assert_eq!(probe(addr, None, None, timeout()).unwrap(), Answer::Open);
    }

    #[test]
    fn research_health_matches_the_documented_body() {
        let body = RESEARCH_HEALTH;
        let port = http_port("200 OK", body);
        let addr = SocketAddr::new(LOCAL, port);
        assert_eq!(
            probe(addr, Some("/health"), Some(body), timeout()).unwrap(),
            Answer::Open
        );
    }

    #[test]
    fn research_health_rejects_a_different_body_and_a_redirect() {
        let port = http_port("200 OK", "{\"ok\":false}");
        let addr = SocketAddr::new(LOCAL, port);
        assert_eq!(
            probe(addr, Some("/health"), Some(RESEARCH_HEALTH), timeout()).unwrap(),
            Answer::Mismatch
        );
        let redirect = http_port("302 Found", RESEARCH_HEALTH);
        let addr = SocketAddr::new(LOCAL, redirect);
        assert_eq!(
            probe(addr, Some("/health"), Some(RESEARCH_HEALTH), timeout()).unwrap(),
            Answer::Mismatch
        );
    }

    #[test]
    fn memory_health_is_any_2xx() {
        let port = http_port("204 No Content", "");
        let addr = SocketAddr::new(LOCAL, port);
        assert_eq!(
            probe(addr, Some("/health"), None, timeout()).unwrap(),
            Answer::Open
        );
    }

    #[test]
    fn closed_port_is_down_when_a_marker_exists_and_not_installed_otherwise() {
        let dir = std::env::temp_dir().join(format!("galion-status-unit-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join("etc/systemd/system")).unwrap();
        std::fs::write(dir.join("etc/systemd/system/galion-welcome.service"), b"\n").unwrap();
        let mut rows = services();
        let closed = closed_port();
        for row in &mut rows {
            row.port = closed;
        }
        let lines = check(&rows, &dir, timeout());
        assert_eq!(lines[0].verdict, Verdict::Down);
        assert_eq!(lines[0].name, "galion-welcome");
        let voice = lines
            .iter()
            .find(|line| line.name == "voice-screen")
            .unwrap();
        assert_eq!(voice.verdict, Verdict::NotInstalled);
        let screen = render(&lines);
        assert!(screen.contains(&format!("{:<18} {:>5}  down\n", "galion-welcome", closed)));
        assert!(screen.contains(&format!(
            "{:<18} {:>5}  not installed\n",
            "voice-screen", closed
        )));
        assert!(screen.contains("127.0.0.1 only."));
        assert!(!screen.contains("192.0.2."));
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn open_port_is_up_without_a_marker() {
        let port = tcp_port();
        let mut row = services()[0];
        row.port = port;
        let lines = check(&[row], Path::new("/no/such/galion-status-root"), timeout());
        assert_eq!(lines[0].verdict, Verdict::Up);
        assert!(render(&lines).contains("up"));
    }

    #[test]
    fn json_names_and_ports_follow_the_service_table() {
        let lines: Vec<Line> = services()
            .iter()
            .map(|row| Line {
                name: row.name,
                port: row.port,
                verdict: Verdict::NotInstalled,
            })
            .collect();
        let json = render_json(&lines);
        assert!(json.starts_with("[\n"));
        assert!(json.ends_with("]\n"));
        for row in services() {
            let entry = format!(
                "{{\"name\":\"{}\",\"port\":{},\"state\":\"not installed\"}}",
                row.name, row.port
            );
            assert!(json.contains(&entry), "{json}");
        }
        assert!(!json.contains("18081"));
        assert!(!json.contains("Galion local status"));
    }
}
