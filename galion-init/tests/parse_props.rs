// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Property checks for the readers in this crate.
//!
//! The argument reader, the welcome request line, and the systemd text
//! are all pure functions of the bytes they are given. These tests feed
//! a fixed stream of inputs and check the result, including inputs that
//! are not in the examples.

use galion_init::{
    answer, invocation, rows_from_snapshot, voice_plan, AdmitError, Invocation, ServiceRow,
    UnitSnapshot,
};

const CASES: usize = 256;

fn mix(state: &mut u64) -> u64 {
    let mut x = *state;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    if x == 0 {
        x = 0xA5A5_A5A5_A5A5_A5A5;
    }
    *state = x;
    x
}

fn pick<'a>(state: &mut u64, items: &'a [&'a str]) -> &'a str {
    let len = u64::try_from(items.len()).unwrap_or(1);
    let index = usize::try_from(mix(state) % len.max(1)).unwrap_or(0);
    items.get(index).copied().unwrap_or("")
}

fn alphabet_char(state: &mut u64) -> char {
    let alphabet =
        b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \n\r\t<>&\"/?._-=*:";
    let len = u64::try_from(alphabet.len()).unwrap_or(1);
    let index = usize::try_from(mix(state) % len.max(1)).unwrap_or(0);
    char::from(alphabet.get(index).copied().unwrap_or(b'a'))
}

fn messy(state: &mut u64, len: usize) -> String {
    (0..len).map(|_| alphabet_char(state)).collect()
}

fn check_response(request: &str, response: &[u8]) {
    let text = match std::str::from_utf8(response) {
        Ok(text) => text,
        Err(err) => panic!("response is not utf-8: {err}"),
    };
    let Some((head, body)) = text.split_once("\r\n\r\n") else {
        panic!("response has no header end");
    };
    let mut lines = head.split("\r\n");
    let status = lines.next().unwrap_or("");
    assert!(status.starts_with("HTTP/1.1 "), "{status}");
    let code = status
        .split_whitespace()
        .nth(1)
        .and_then(|part| part.parse::<u16>().ok())
        .unwrap_or(0);
    assert!(matches!(code, 200 | 404 | 405), "{status}");
    let mut length = None;
    for line in lines {
        if let Some(value) = line.strip_prefix("Content-Length: ") {
            length = value.parse::<usize>().ok();
        }
    }
    let Some(length) = length else {
        panic!("response has no content length: {status}");
    };
    let method = request
        .split_whitespace()
        .next()
        .unwrap_or("")
        .to_ascii_uppercase();
    if method == "HEAD" {
        assert!(body.is_empty(), "HEAD carried a body");
    } else {
        assert_eq!(body.len(), length);
    }
    assert!(!body.to_ascii_lowercase().contains("<script"));
    assert!(!body.contains("http://"));
    assert!(!body.contains("https://"));
}

fn known_name(name: &str) -> bool {
    matches!(
        name,
        "Galion OS" | "Init" | "Welcome" | "Open Mind" | "Research" | "Voice" | "Other units"
    )
}

fn galion_unit(name: &str) -> bool {
    const SUFFIXES: &[&str] = &[
        ".service", ".target", ".socket", ".timer", ".path", ".mount", ".slice",
    ];
    name.starts_with("galion-")
        && name.len() > "galion-".len()
        && SUFFIXES.iter().any(|suffix| name.ends_with(suffix))
}

fn known_state(state: &str) -> bool {
    matches!(
        state,
        "Up" | "Finished" | "Coming up" | "Down" | "Not on this machine" | "Not read"
    )
}

fn check_rows(rows: &[ServiceRow]) {
    assert!(rows.len() <= 39, "row cap {}", rows.len());
    assert!(rows.len() >= 6, "known services missing");
    for row in rows {
        assert!(known_state(row.state), "{}", row.state);
        assert!(
            known_name(&row.name) || galion_unit(&row.name),
            "unexpected row {}",
            row.name
        );
    }
    let page = answer("GET / HTTP/1.1\r\n\r\n", rows);
    check_response("GET / HTTP/1.1\r\n\r\n", &page);
    let text = match std::str::from_utf8(&page) {
        Ok(text) => text,
        Err(err) => panic!("page is not utf-8: {err}"),
    };
    for row in rows {
        if row.name.contains(['<', '>', '&', '"']) {
            let escaped = row
                .name
                .replace('&', "&amp;")
                .replace('<', "&lt;")
                .replace('>', "&gt;")
                .replace('"', "&quot;");
            assert!(text.contains(&escaped), "missing escape for {}", row.name);
            assert!(
                !text.contains(&row.name),
                "raw name reached the page: {}",
                row.name
            );
        }
    }
}

fn check_invocation(args: &[&str]) {
    let got = invocation(args.iter().copied());
    if args.iter().any(|arg| *arg == "--execute") {
        match got {
            Invocation::Refuse(message) => assert!(message.contains("refusing --execute")),
            other => panic!("--execute was accepted: {other:?}"),
        }
        return;
    }
    let profiles: Vec<&str> = args
        .iter()
        .copied()
        .filter(|arg| matches!(*arg, "voice" | "desktop" | "walk"))
        .collect();
    let silence = args.iter().any(|arg| *arg == "--silence");
    let unknown = args
        .iter()
        .any(|arg| !matches!(*arg, "--silence" | "voice" | "desktop" | "walk"));
    let voice_and_silence =
        silence && profiles.first().copied() == Some("voice") && profiles.len() == 1;
    if unknown || profiles.len() > 1 || voice_and_silence {
        match got {
            Invocation::Refuse(message) => assert!(message.contains("unknown argument")),
            other => panic!("bad arguments were accepted: {other:?} from {args:?}"),
        }
        return;
    }
    match (profiles.first().copied(), silence) {
        (None, silence) => assert_eq!(got, Invocation::Both { silence }),
        (Some("voice"), false) => assert_eq!(got, Invocation::Voice),
        (Some("desktop"), silence) => assert_eq!(got, Invocation::Desktop { silence }),
        (Some("walk"), silence) => assert_eq!(got, Invocation::Walk { silence }),
        other => panic!("unclassified arguments {args:?} -> {other:?}"),
    }
}

fn base_name(path: &str) -> &str {
    match path.rsplit('/').next() {
        Some(name) => name,
        None => path,
    }
}

fn program_is_safe(program: &str) -> bool {
    const SHELLS: &[&str] = &["sh", "bash", "dash", "ash", "busybox"];
    const HOSTS: &[&str] = &["init", "systemd", "systemctl", "telinit"];
    const HOST_PATHS: &[&str] = &[
        "/sbin/init",
        "/usr/sbin/init",
        "/lib/systemd/systemd",
        "/usr/lib/systemd/systemd",
        "/bin/systemctl",
        "/usr/bin/systemctl",
        "/bin/telinit",
        "/usr/bin/telinit",
    ];
    let lower = program.to_ascii_lowercase();
    program.starts_with('/')
        && !program.split('/').any(|part| part == "..")
        && !SHELLS.contains(&base_name(program))
        && !HOSTS.contains(&base_name(program))
        && !HOST_PATHS.contains(&program)
        && !lower.contains("--token")
        && !lower.contains("lock-secrets")
        && !lower.contains("private key")
        && !lower.contains("begin ")
}

#[test]
fn request_lines_keep_a_length_and_a_status() {
    let rows = rows_from_snapshot(&UnitSnapshot::default());
    let fixed = [
        "",
        "GET",
        "GET /",
        "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n",
        "get / HTTP/1.1\r\n\r\n",
        "HEAD /index.html HTTP/1.1\r\n\r\n",
        "head / HTTP/1.0\r\n\r\n",
        "GET /?x=1 HTTP/1.1\r\n\r\n",
        "GET /nope?x=1 HTTP/1.1\r\n\r\n",
        "POST / HTTP/1.1\r\n\r\n",
        "PUT / HTTP/1.1\r\n\r\n",
        "OPTIONS * HTTP/1.1\r\n\r\n",
        "GET /../etc HTTP/1.1\r\n\r\n",
        "GET /<script> HTTP/1.1\r\n\r\n",
    ];
    for request in fixed {
        check_response(request, &answer(request, &rows));
    }
    let mut state = 0x00C0_FFEE_u64;
    for _ in 0..CASES {
        let method = pick(
            &mut state,
            &["GET", "get", "HEAD", "POST", "PUT", "FETCH", "", "G"],
        );
        let path_len = usize::try_from(mix(&mut state) % 48).unwrap_or(0);
        let path = messy(&mut state, path_len);
        let request = format!("{method} /{path} HTTP/1.1\r\n\r\n");
        check_response(&request, &answer(&request, &rows));
        let raw_len = usize::try_from(mix(&mut state) % 80).unwrap_or(0);
        let raw = messy(&mut state, raw_len);
        check_response(&raw, &answer(&raw, &rows));
    }
}

#[test]
fn systemd_text_only_names_galion_units() {
    let finished = UnitSnapshot {
        list_units: Some("galion-init.service loaded active exited plan\n".to_string()),
        list_files: Some("galion-init.service enabled\n".to_string()),
        desktop_show: None,
    };
    let rows = rows_from_snapshot(&finished);
    check_rows(&rows);
    assert_eq!(rows[1].name, "Init");
    assert_eq!(rows[1].state, "Finished");

    let absent = UnitSnapshot {
        list_units: Some("galion-welcome.service not-found inactive dead x\n".to_string()),
        list_files: Some("galion-research.service disabled\n".to_string()),
        desktop_show: Some("Id=openmind-desktop.service\nLoadState=not-found\n".to_string()),
    };
    let rows = rows_from_snapshot(&absent);
    check_rows(&rows);
    assert_eq!(rows[2].state, "Not on this machine");
    assert_eq!(rows[3].state, "Not on this machine");
    assert_eq!(rows[4].state, "Down");

    let mut lines = String::new();
    for index in 0..40 {
        lines.push_str(&format!(
            "galion-extra{index}.service loaded active running extra\n"
        ));
    }
    lines.push_str("not-galion.service loaded active running skip\n");
    lines.push_str("galion-<b>.service loaded active running nasty\n");
    let crowded = UnitSnapshot {
        list_units: Some(lines),
        list_files: None,
        desktop_show: None,
    };
    let rows = rows_from_snapshot(&crowded);
    check_rows(&rows);
    assert_eq!(
        rows.last().map(|row| row.name.as_str()),
        Some("Other units")
    );
    assert!(rows.iter().any(|row| row.name == "galion-<b>.service"));

    let mut state = 0x51_u64;
    for _ in 0..CASES {
        let units_len = usize::try_from(mix(&mut state) % 200).unwrap_or(0);
        let files_len = usize::try_from(mix(&mut state) % 120).unwrap_or(0);
        let show_len = usize::try_from(mix(&mut state) % 120).unwrap_or(0);
        let units = messy(&mut state, units_len);
        let files = messy(&mut state, files_len);
        let show = messy(&mut state, show_len);
        let snapshot = UnitSnapshot {
            list_units: Some(units),
            list_files: Some(files),
            desktop_show: Some(show),
        };
        check_rows(&rows_from_snapshot(&snapshot));
        let blank = UnitSnapshot {
            list_units: None,
            list_files: None,
            desktop_show: None,
        };
        check_rows(&rows_from_snapshot(&blank));
    }
}

#[test]
fn arguments_follow_the_prototype_words() {
    let words = [
        "voice",
        "desktop",
        "walk",
        "--silence",
        "--execute",
        "--flash",
        "",
        "VOICE",
        "desktop ",
    ];
    check_invocation(&[]);
    check_invocation(&["--silence"]);
    check_invocation(&["desktop", "--silence"]);
    check_invocation(&["--silence", "walk"]);
    check_invocation(&["voice"]);
    check_invocation(&["voice", "--silence"]);
    check_invocation(&["--execute"]);
    check_invocation(&["desktop", "--execute"]);
    check_invocation(&["voice", "desktop"]);
    let mut state = 0xBEEF_u64;
    for _ in 0..CASES {
        let count = usize::try_from(mix(&mut state) % 4).unwrap_or(0);
        let chosen: Vec<&str> = (0..count).map(|_| pick(&mut state, &words)).collect();
        check_invocation(&chosen);
    }
}

#[test]
fn a_voice_program_is_admitted_only_when_the_path_is_plain() {
    let good = [
        "/opt/galion/galion-voiced",
        "/opt/galion/bin/tool",
        "/usr/local/bin/galion-voiced",
    ];
    for program in good {
        let plan = match voice_plan(program) {
            Ok(plan) => plan,
            Err(err) => panic!("{program} was refused: {err:?}"),
        };
        let Some(service) = plan.service("galion-voiced") else {
            panic!("voice plan dropped galion-voiced");
        };
        let Some(argv0) = service.argv.first() else {
            panic!("admitted service has no program");
        };
        assert_eq!(argv0, program);
        assert!(program_is_safe(argv0), "{argv0}");
    }

    let refused = [
        (
            "sh",
            AdmitError::RelativeProgram {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/bin/sh",
            AdmitError::Shell {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/bin/bash",
            AdmitError::Shell {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/usr/sbin/init",
            AdmitError::HostInit {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/opt/init",
            AdmitError::HostInit {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/opt/galion/../bin/tool",
            AdmitError::DotDot {
                name: "galion-voiced".into(),
            },
        ),
        (
            "/opt/galion/--token",
            AdmitError::SecretOnArgv {
                name: "galion-voiced".into(),
            },
        ),
    ];
    for (program, expected) in refused {
        match voice_plan(program) {
            Ok(_) => panic!("{program} was admitted"),
            Err(err) => assert_eq!(err, expected),
        }
    }

    let mut state = 0x1234_u64;
    for _ in 0..CASES {
        let kind = mix(&mut state) % 5;
        let program = match kind {
            0 => messy(&mut state, 12),
            1 => format!("/opt/galion/{}", messy(&mut state, 8).replace('/', "x")),
            2 => format!("/opt/{}/bin", messy(&mut state, 6)),
            3 => format!("/tmp/{}", pick(&mut state, &["sh", "init", "bash", "tool"])),
            _ => format!(
                "/opt/galion/{}/bin",
                pick(&mut state, &["..", "ok", "--token"])
            ),
        };
        if let Ok(plan) = voice_plan(&program) {
            let Some(service) = plan.service("galion-voiced") else {
                panic!("voice plan dropped galion-voiced");
            };
            let Some(argv0) = service.argv.first() else {
                panic!("admitted service has no program");
            };
            assert!(program_is_safe(argv0), "admitted unsafe path {argv0}");
        }
    }
}
