// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

use std::process::Command;

fn run(args: &[&str]) -> std::process::Output {
    Command::new(env!("CARGO_BIN_EXE_galion-init"))
        .args(args)
        .output()
        .expect("galion-init binary")
}

#[test]
fn execute_exits_2_and_prints_no_plan() {
    let out = run(&["--execute"]);
    assert_eq!(out.status.code(), Some(2));
    assert!(out.stdout.is_empty());
    let err = String::from_utf8(out.stderr).unwrap();
    assert!(err.contains("refusing --execute"));
}

#[test]
fn desktop_names_the_console_and_research() {
    let out = run(&["desktop"]);
    assert!(out.status.success());
    let text = String::from_utf8(out.stdout).unwrap();
    assert!(text.contains("profile desktop\n"));
    assert!(text.contains("service openmind-desktop user galion listen none port 18181\n"));
    assert!(text.contains(
        "service galion-research user galion port 8787 workdir /opt/galion/research/current\n"
    ));
    assert!(text.contains("runtime in-memory\n"));
    assert!(!text.contains("profile voice\n"));
    assert!(!has_dotted_quad(&text));
}

fn has_dotted_quad(text: &str) -> bool {
    text.split_whitespace().any(|word| {
        let parts: Vec<&str> = word.split('.').collect();
        parts.len() == 4
            && parts
                .iter()
                .all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()))
    })
}

#[test]
fn no_arguments_prints_voice_then_desktop() {
    let out = run(&[]);
    assert!(out.status.success());
    let text = String::from_utf8(out.stdout).unwrap();
    let voice = text.find("profile voice\n").expect("voice");
    let desktop = text.find("profile desktop\n").expect("desktop");
    assert!(voice < desktop);
    assert!(text.contains("service galion-voiced user galion binary absent\n"));
    assert!(text.contains("handoff desktop-console to research at /one\n"));
}

#[test]
fn an_unknown_argument_exits_2() {
    let out = run(&["--flash"]);
    assert_eq!(out.status.code(), Some(2));
    assert!(out.stdout.is_empty());
    let err = String::from_utf8(out.stderr).unwrap();
    assert!(err.contains("unknown argument"));
}
