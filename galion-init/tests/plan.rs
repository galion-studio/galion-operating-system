// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

use galion_init::{
    admit, check_desktop_bind, desktop_plan, invocation, one_target, running_as_host_init,
    tone_hook, tone_samples, voice_plan, walk_desktop, AdmitError, BindError, Host, Invocation,
    Machine, Phase, Profile, Restart, Service, Supervisor, ToneHook, ToneInput, BOOT_TONE_HZ,
    DESKTOP_PORT, ONE_PATH, RESEARCH_PORT, START_LIMIT_BURST, START_LIMIT_WINDOW_SEC,
};

fn fixture(name: &str, restart: Restart, restart_sec: u64) -> Service {
    Service {
        name: name.to_string(),
        argv: vec![format!("/opt/galion/fixture/{name}")],
        user: "galion".to_string(),
        workdir: None,
        restart,
        restart_sec,
        env: Vec::new(),
        after: Vec::new(),
        port: None,
        handoff: None,
    }
}

#[test]
fn this_process_is_not_pid_1() {
    let pid = std::process::id();
    println!("pid={pid}");
    assert_ne!(pid, 1, "this test process must not be the host init");
    assert!(!running_as_host_init());
}

#[test]
fn desktop_boot_order_ends_at_the_desktop_handoff() {
    let plan = desktop_plan(false, true);
    assert_eq!(plan.profile, Profile::Desktop);
    assert_eq!(
        plan.phases,
        &[
            Phase::MountFilesystems,
            Phase::Loopback,
            Phase::Clock,
            Phase::ToneHook,
            Phase::Supervise,
            Phase::HandoffDesktop,
        ]
    );
    assert!(plan.phases.contains(&Phase::Loopback));
    assert!(!plan.phases.contains(&Phase::Alsa));
}

#[test]
fn voice_boot_order_supervises_voiced_and_skips_the_desktop() {
    let plan = voice_plan("/opt/galion/fixture/galion-voiced").unwrap();
    assert_eq!(plan.profile, Profile::Voice);
    assert_eq!(
        plan.phases,
        &[
            Phase::MountFilesystems,
            Phase::Network,
            Phase::Clock,
            Phase::Alsa,
            Phase::Supervise,
        ]
    );
    assert!(plan.tone.is_none());
    assert!(plan.handoff.is_none());
    assert!(plan.service("galion-voiced").is_some());
    assert!(plan.service("openmind-desktop").is_none());
    let text = plan.render();
    assert_eq!(
        text,
        "\
profile voice
phase mount-filesystems
phase network
phase clock
phase alsa
phase supervise
service galion-voiced user galion binary absent
fb0 optional
display-server none
service-binary absent
tone none
handoff none
runtime in-memory
"
    );
    assert!(!contains_dotted_quad(&text));
}

#[test]
fn tone_hook_is_planned_at_432_hz_and_plays_nothing() {
    for playback_present in [true, false] {
        let hook = tone_hook(ToneInput {
            silence: false,
            playback_present,
        });
        assert_eq!(hook, ToneHook::Planned { hz: BOOT_TONE_HZ });
        assert_eq!(BOOT_TONE_HZ, 432);
        assert_eq!(tone_samples(hook), 0);
    }
    let plan = desktop_plan(false, false);
    assert_eq!(plan.tone, Some(ToneHook::Planned { hz: 432 }));
    assert!(plan.phases.last() == Some(&Phase::HandoffDesktop));
}

#[test]
fn silence_skips_the_tone_and_keeps_the_desktop() {
    let hook = tone_hook(ToneInput {
        silence: true,
        playback_present: true,
    });
    assert_eq!(hook, ToneHook::Silenced);
    assert_eq!(tone_samples(hook), 0);
    let plan = desktop_plan(true, true);
    assert_eq!(plan.tone, Some(ToneHook::Silenced));
    assert!(plan.service("openmind-desktop").is_some());
    let text = plan.render();
    assert!(text.contains("tone silenced samples 0\n"));
    assert!(!text.contains(".wav"));
}

#[test]
fn handoff_is_ipv4_loopback_port_18181_and_other_binds_are_refused() {
    let plan = desktop_plan(false, true);
    let handoff = plan.handoff.expect("desktop plan has a handoff");
    assert_eq!(handoff.host, Host::Ipv4Loopback);
    assert_eq!(handoff.port, DESKTOP_PORT);
    assert_eq!(handoff.path, "/");
    assert_eq!(check_desktop_bind(Host::Ipv4Loopback, 18181), Ok(()));
    assert_eq!(check_desktop_bind(Host::Ipv6Loopback, 18181), Ok(()));
    assert_eq!(
        check_desktop_bind(Host::Unspecified, 18181),
        Err(BindError::NotLoopback)
    );
    assert_eq!(
        check_desktop_bind(Host::Other, 18181),
        Err(BindError::NotLoopback)
    );
    assert_eq!(
        check_desktop_bind(Host::Ipv4Loopback, 18080),
        Err(BindError::ProbePort)
    );
    assert_eq!(
        check_desktop_bind(Host::Ipv4Loopback, 18081),
        Err(BindError::UnusedStagingPort)
    );
    assert_eq!(
        check_desktop_bind(Host::Ipv4Loopback, 8787),
        Err(BindError::NotDesktopPort)
    );
    assert_eq!(DESKTOP_PORT, 18181);
}

#[test]
fn desktop_services_match_the_packaging_handoff() {
    let plan = desktop_plan(false, true);
    let names: Vec<_> = plan
        .supervisor
        .services()
        .into_iter()
        .map(|service| service.name)
        .collect();
    assert_eq!(names, vec!["openmind-desktop", "galion-research"]);

    let desktop = plan.service("openmind-desktop").unwrap();
    assert_eq!(
        desktop.argv,
        vec!["/opt/galion/openmind-desktop/openmind-desktop", "--listen",]
    );
    assert!(desktop.env.is_empty());
    assert_eq!(desktop.user, "galion");
    assert!(desktop.after.is_empty());
    assert_eq!(desktop.port, Some(DESKTOP_PORT));
    assert!(desktop.handoff.is_none());
    assert!(desktop.argv.iter().all(|arg| !arg.contains(':')));

    let research = plan.service("galion-research").unwrap();
    assert_eq!(research.argv, vec!["/usr/bin/node", "src/server.js"]);
    assert_eq!(
        research.workdir.as_deref(),
        Some("/opt/galion/research/current")
    );
    assert_eq!(research.user, "galion");
    assert_eq!(research.after, vec!["openmind-desktop"]);
    assert_eq!(research.port, Some(RESEARCH_PORT));
    assert_eq!(research.env, vec![("PORT".to_string(), "8787".to_string())]);
    let one = research.handoff.expect("research hands off to One");
    assert_eq!(one, one_target());
    assert_eq!(one.host, Host::Ipv4Loopback);
    assert_eq!(one.port, 18181);
    assert_eq!(one.path, ONE_PATH);
    assert_eq!(ONE_PATH, "/one");
    for key in [
        "GALION_ONE_URL",
        "GALION_RESEARCH_URL",
        "GALION_LLM",
        "GALION_LLM_URL",
        "GALION_LLM_KEY",
    ] {
        assert!(research.env.iter().all(|(name, _)| name != key));
    }
    assert!(plan.service("galion-voiced").is_none());
    assert!(plan.service("galion-one").is_none());
}

#[test]
fn one_desktop_walk_starts_the_console_then_research_and_plays_nothing() {
    for silence in [false, true] {
        for playback_present in [false, true] {
            let mut machine = Machine::new(0);
            let walk = walk_desktop(silence, playback_present, &mut machine);
            assert!(walk.console_pid < walk.research_pid);
            assert_ne!(walk.console_pid, 1);
            assert_ne!(walk.research_pid, 1);
            assert_eq!(walk.samples, 0);
            assert_eq!(walk.handoff_path, "/one");
            assert!(machine.procs.iter().all(|proc| proc.alive && proc.pid != 1));
            assert!(machine
                .procs
                .iter()
                .all(|proc| proc.name != "galion-voiced" && proc.name != "galion-one"));
        }
    }
}

#[test]
fn research_starts_only_after_the_desktop_child_is_alive() {
    let mut plan = desktop_plan(false, true);
    let mut machine = Machine::new(0);
    assert!(plan.supervisor.pid_of("openmind-desktop").is_none());
    assert!(plan.supervisor.pid_of("galion-research").is_none());

    plan.supervisor.tick(&mut machine);
    let desktop_pid = plan.supervisor.pid_of("openmind-desktop").unwrap();
    let research_pid = plan.supervisor.pid_of("galion-research").unwrap();
    assert_ne!(desktop_pid, 1);
    assert_ne!(research_pid, 1);
    assert!(desktop_pid < research_pid);
    assert!(desktop_pid >= 100);
    assert!(machine.procs.iter().all(|proc| proc.alive && proc.pid != 1));
}

#[test]
fn supervisor_never_mints_pid_1() {
    let mut supervisor = Supervisor::try_new(vec![fixture("alone", Restart::No, 5)]).unwrap();
    let mut machine = Machine::with_next_pid(0, 1);
    supervisor.tick(&mut machine);
    assert_eq!(supervisor.pid_of("alone"), Some(2));
}

#[test]
fn on_failure_restarts_only_after_a_failed_exit() {
    let mut supervisor = Supervisor::try_new(vec![fixture("job", Restart::OnFailure, 5)]).unwrap();
    let mut machine = Machine::new(0);
    supervisor.tick(&mut machine);
    let pid = supervisor.pid_of("job").unwrap();
    assert!(machine.exited(pid, true));
    supervisor.tick(&mut machine);
    assert!(supervisor.is_done("job"));
    assert!(supervisor.pid_of("job").is_none());
    machine.now = 60;
    supervisor.tick(&mut machine);
    assert!(supervisor.pid_of("job").is_none());

    let mut supervisor = Supervisor::try_new(vec![fixture("job", Restart::OnFailure, 5)]).unwrap();
    let mut machine = Machine::new(0);
    supervisor.tick(&mut machine);
    let pid = supervisor.pid_of("job").unwrap();
    assert!(machine.exited(pid, false));
    supervisor.tick(&mut machine);
    assert!(supervisor.pid_of("job").is_none());
    assert_eq!(supervisor.next_start_of("job"), Some(5));
    machine.now = 5;
    supervisor.tick(&mut machine);
    let restarted = supervisor.pid_of("job").unwrap();
    assert_ne!(restarted, pid);
    assert_ne!(restarted, 1);
}

#[test]
fn restart_no_does_not_start_again() {
    let mut supervisor = Supervisor::try_new(vec![fixture("once", Restart::No, 0)]).unwrap();
    let mut machine = Machine::new(0);
    supervisor.tick(&mut machine);
    let pid = supervisor.pid_of("once").unwrap();
    assert!(machine.exited(pid, false));
    machine.now = 1_000;
    supervisor.tick(&mut machine);
    assert!(supervisor.is_done("once"));
    assert!(supervisor.pid_of("once").is_none());
}

#[test]
fn start_limit_pauses_for_300_seconds_then_allows_one_more() {
    let mut supervisor = Supervisor::try_new(vec![fixture("boom", Restart::Always, 0)]).unwrap();
    let mut machine = Machine::new(0);
    for _ in 0..START_LIMIT_BURST {
        supervisor.tick(&mut machine);
        let pid = supervisor.pid_of("boom").unwrap();
        assert_ne!(pid, 1);
        assert!(machine.exited(pid, false));
    }
    supervisor.tick(&mut machine);
    assert!(supervisor.pid_of("boom").is_none());
    assert_eq!(
        supervisor.next_start_of("boom"),
        Some(START_LIMIT_WINDOW_SEC)
    );

    let mut at_boundary = Supervisor::try_new(vec![fixture("boom", Restart::Always, 0)]).unwrap();
    let mut boundary = Machine::new(0);
    for _ in 0..START_LIMIT_BURST {
        at_boundary.tick(&mut boundary);
        let pid = at_boundary.pid_of("boom").unwrap();
        assert!(boundary.exited(pid, false));
    }
    at_boundary.tick(&mut boundary);
    boundary.now = START_LIMIT_WINDOW_SEC;
    at_boundary.tick(&mut boundary);
    assert!(
        at_boundary.pid_of("boom").is_none(),
        "starts aged exactly 300s are still inside the window"
    );

    machine.now = START_LIMIT_WINDOW_SEC + 1;
    supervisor.tick(&mut machine);
    assert!(supervisor.pid_of("boom").is_some());
    assert_ne!(supervisor.pid_of("boom"), Some(1));
}

#[test]
fn host_init_shell_and_secrets_are_refused() {
    let refused = [
        ("/sbin/init", AdmitError::HostInit { name: "bad".into() }),
        (
            "/usr/lib/systemd/systemd",
            AdmitError::HostInit { name: "bad".into() },
        ),
        (
            "/usr/bin/systemctl",
            AdmitError::HostInit { name: "bad".into() },
        ),
        ("/bin/sh", AdmitError::Shell { name: "bad".into() }),
        ("/bin/bash", AdmitError::Shell { name: "bad".into() }),
        (
            "relative-tool",
            AdmitError::RelativeProgram { name: "bad".into() },
        ),
    ];
    for (program, expected) in refused {
        let mut service = fixture("bad", Restart::No, 1);
        service.argv = vec![program.to_string()];
        assert_eq!(admit(&service), Err(expected));
    }

    let mut dotted = fixture("bad", Restart::No, 1);
    dotted.argv = vec!["/opt/galion/../sbin/init".to_string()];
    assert_eq!(
        admit(&dotted),
        Err(AdmitError::DotDot { name: "bad".into() })
    );

    let mut token = fixture("bad", Restart::No, 1);
    token.argv = vec!["/opt/galion/fixture/bad".to_string(), "--token".to_string()];
    assert_eq!(
        admit(&token),
        Err(AdmitError::SecretOnArgv { name: "bad".into() })
    );

    assert!(matches!(
        voice_plan("/sbin/init"),
        Err(AdmitError::HostInit { .. })
    ));
    assert!(matches!(
        voice_plan("galion-voiced"),
        Err(AdmitError::RelativeProgram { .. })
    ));
}

#[test]
fn render_names_the_in_memory_runtime() {
    let text = desktop_plan(false, true).render();
    assert_eq!(
        text,
        "\
profile desktop
phase mount-filesystems
phase loopback
phase clock
phase tone-hook
tone planned 432 samples 0
silence-file none
phase supervise
service openmind-desktop user galion listen none port 18181
service galion-research user galion port 8787 workdir /opt/galion/research/current
handoff desktop-console to research at /one
GALION_ONE_URL http on the IPv4 loopback interface, port 18181, path /one
console http on ipv4-loopback port 18181 path /
galion-voiced absent
galion-one absent
runtime in-memory
"
    );
    assert!(!text.contains("systemctl"));
    assert!(!text.contains("/sbin/init"));
    assert!(!contains_dotted_quad(&text));
    let sample = format!("{}.{}.{}.{}", 1, 2, 3, 4);
    assert!(contains_dotted_quad(&sample));
    assert!(!contains_dotted_quad("port 18181 path /one"));
}

#[test]
fn the_binary_refuses_execute_and_accepts_the_shell_words() {
    assert_eq!(
        invocation(["desktop"]),
        Invocation::Desktop { silence: false }
    );
    assert_eq!(
        invocation(["desktop", "--silence"]),
        Invocation::Desktop { silence: true }
    );
    assert_eq!(
        invocation(std::iter::empty()),
        Invocation::Both { silence: false }
    );
    assert_eq!(invocation(["voice"]), Invocation::Voice);
    assert_eq!(invocation(["walk"]), Invocation::Walk { silence: false });
    assert_eq!(
        invocation(["walk", "--silence"]),
        Invocation::Walk { silence: true }
    );
    assert!(matches!(
        invocation(["walk", "desktop"]),
        Invocation::Refuse(_)
    ));
    assert!(matches!(
        invocation(["--execute"]),
        Invocation::Refuse(message) if message.contains("refusing --execute")
    ));
    assert!(matches!(
        invocation(["desktop", "--execute"]),
        Invocation::Refuse(message) if message.contains("refusing --execute")
    ));
    assert!(matches!(
        invocation(["voice", "--silence"]),
        Invocation::Refuse(_)
    ));
    assert!(matches!(invocation(["--flash"]), Invocation::Refuse(_)));
}

fn contains_dotted_quad(text: &str) -> bool {
    text.split(|c: char| !c.is_ascii_digit() && c != '.')
        .any(|token| {
            let parts: Vec<&str> = token.split('.').filter(|part| !part.is_empty()).collect();
            parts.len() == 4
                && token.matches('.').count() == 3
                && parts
                    .iter()
                    .all(|part| part.chars().all(|c| c.is_ascii_digit()))
        })
}
