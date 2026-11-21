// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

#![allow(clippy::unwrap_used, clippy::expect_used)]

use galion_init::{
    admit, check_desktop_bind, desktop_plan, handoff_ready, invocation, one_target,
    running_as_host_init, tone_hook, tone_samples, voice_plan, walk_desktop, walk_down, AdmitError,
    BindError, BootError, EarlyBoot, Host, Invocation, Machine, Phase, Profile, Restart, Service,
    Supervisor, ToneHook, ToneInput, BOOT_TONE_HZ, DESKTOP_MOUNTS, DESKTOP_PORT, ONE_PATH,
    RESEARCH_PORT, START_LIMIT_BURST, START_LIMIT_WINDOW_SEC, WAKE_TONE_PATH,
};

fn admitted_desktop(silence: bool, playback_present: bool) -> galion_init::Plan {
    desktop_plan(silence, playback_present).expect("desktop services admit")
}

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
        calm: false,
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
    let plan = admitted_desktop(false, true);
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
    let wake = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join(WAKE_TONE_PATH);
    let text = std::fs::read_to_string(&wake).expect("vendored wake definition");
    assert!(text.contains("Copyright (c) 3000 Galion / galion-studio"));
    assert!(text.contains("id: \"wake\""));
    assert!(!text.contains("samantha"));
    assert!(!text.contains("jarvis"));
    let plan = admitted_desktop(false, false);
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
    let plan = admitted_desktop(true, true);
    assert_eq!(plan.tone, Some(ToneHook::Silenced));
    assert!(plan.service("openmind-desktop").is_some());
    let text = plan.render();
    assert!(text.contains("tone silenced samples 0\n"));
    assert!(!text.contains(".wav"));
}

#[test]
fn handoff_is_ipv4_loopback_port_18181_and_other_binds_are_refused() {
    let plan = admitted_desktop(false, true);
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
    let plan = admitted_desktop(false, true);
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
    assert!(desktop.calm);
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
    assert!(research.calm);
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
            let walk = walk_desktop(silence, playback_present, &mut machine).expect("desktop walk");
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
fn the_down_walk_records_research_before_the_console_and_does_not_restart() {
    for silence in [false, true] {
        let mut machine = Machine::new(0);
        let down = walk_down(silence, true, &mut machine).expect("desktop walk down");
        assert!(down.up.console_pid < down.up.research_pid);
        assert_ne!(down.up.console_pid, 1);
        assert_ne!(down.up.research_pid, 1);
        assert_eq!(down.up.samples, 0);
        assert_eq!(down.up.handoff_path, "/one");
        assert_eq!(down.first, "galion-research");
        assert_eq!(down.second, "openmind-desktop");
        assert!(down.console_still_up);
        assert!(!down.restarted);
        assert!(machine.procs.iter().all(|proc| {
            !proc.alive
                && proc.pid != 1
                && proc.name != "galion-voiced"
                && proc.name != "galion-one"
        }));
    }
}

#[test]
fn the_handoff_is_current_only_while_the_console_is_alive() {
    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    assert!(!handoff_ready(&plan, &machine));
    plan.supervisor.tick(&mut machine);
    assert!(handoff_ready(&plan, &machine));

    let console = plan.supervisor.pid_of("openmind-desktop").unwrap();
    assert!(machine.exited(console, false));
    assert!(!handoff_ready(&plan, &machine));
    let research = plan.supervisor.pid_of("galion-research").unwrap();
    assert!(machine
        .procs
        .iter()
        .any(|proc| proc.pid == research && proc.alive));

    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.pid_of("openmind-desktop").is_none());
    assert!(!handoff_ready(&plan, &machine));

    machine.now = 5;
    plan.supervisor.tick(&mut machine);
    assert!(handoff_ready(&plan, &machine));

    let voice = voice_plan("/opt/galion/fixture/galion-voiced").unwrap();
    assert!(!handoff_ready(&voice, &machine));
}

#[test]
fn a_stop_brings_research_down_before_the_console_and_does_not_restart() {
    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    plan.supervisor.tick(&mut machine);
    assert!(handoff_ready(&plan, &machine));
    let console = plan.supervisor.pid_of("openmind-desktop").unwrap();
    let research = plan.supervisor.pid_of("galion-research").unwrap();
    let rows = machine.procs.len();

    plan.supervisor.request_stop();
    assert!(plan.supervisor.stopping());
    plan.supervisor.tick(&mut machine);
    assert!(machine
        .procs
        .iter()
        .any(|proc| { proc.pid == research && !proc.alive && proc.code_ok == Some(true) }));
    assert!(machine
        .procs
        .iter()
        .any(|proc| proc.pid == console && proc.alive));
    assert!(plan.supervisor.pid_of("galion-research").is_none());
    assert_eq!(plan.supervisor.pid_of("openmind-desktop"), Some(console));
    assert!(!handoff_ready(&plan, &machine));

    plan.supervisor.tick(&mut machine);
    assert!(machine
        .procs
        .iter()
        .any(|proc| proc.pid == console && !proc.alive && proc.code_ok == Some(true)));
    assert!(plan.supervisor.pid_of("openmind-desktop").is_none());
    assert!(plan.supervisor.is_done("openmind-desktop"));
    assert!(plan.supervisor.is_done("galion-research"));

    machine.now = 10_000;
    plan.supervisor.tick(&mut machine);
    assert_eq!(machine.procs.len(), rows);
    assert!(machine
        .procs
        .iter()
        .all(|proc| !proc.alive && proc.pid != 1));
}

#[test]
fn a_stop_before_the_first_tick_starts_nothing() {
    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    plan.supervisor.request_stop();
    plan.supervisor.tick(&mut machine);
    assert!(machine.procs.is_empty());
    assert!(plan.supervisor.is_done("openmind-desktop"));
    assert!(plan.supervisor.is_done("galion-research"));
    machine.now = 10_000;
    plan.supervisor.tick(&mut machine);
    assert!(machine.procs.is_empty());
}

fn supervised_boot() -> EarlyBoot {
    let mut boot = EarlyBoot::new();
    boot.mount().unwrap();
    boot.loopback().unwrap();
    boot.clock().unwrap();
    boot.tone(0).unwrap();
    boot.supervise().unwrap();
    boot
}

#[test]
fn the_handoff_drops_when_research_comes_down_and_stays_down() {
    let mut boot = supervised_boot();
    assert_eq!(boot.release(false), Err(BootError::OutOfOrder));

    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    plan.supervisor.tick(&mut machine);
    boot.handoff(handoff_ready(&plan, &machine)).unwrap();
    assert!(boot.handed_off());
    assert_eq!(boot.release(true), Err(BootError::HandoffStillCurrent));
    assert!(boot.handed_off());

    plan.supervisor.request_stop();
    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.pid_of("openmind-desktop").is_some());
    assert!(!handoff_ready(&plan, &machine));
    boot.release(handoff_ready(&plan, &machine)).unwrap();
    assert!(!boot.handed_off());
    assert_eq!(
        boot.handoff(handoff_ready(&plan, &machine)),
        Err(BootError::HandoffNotReady)
    );

    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.is_done("openmind-desktop"));
    assert!(plan.supervisor.is_done("galion-research"));
    assert!(!boot.handed_off());
}

#[test]
fn a_dropped_handoff_can_be_recorded_again_after_the_console_returns() {
    let mut boot = supervised_boot();
    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    plan.supervisor.tick(&mut machine);
    boot.handoff(handoff_ready(&plan, &machine)).unwrap();

    let console = plan.supervisor.pid_of("openmind-desktop").unwrap();
    assert!(machine.exited(console, false));
    boot.release(handoff_ready(&plan, &machine)).unwrap();
    assert!(!boot.handed_off());

    plan.supervisor.tick(&mut machine);
    machine.now = 5;
    plan.supervisor.tick(&mut machine);
    boot.handoff(handoff_ready(&plan, &machine)).unwrap();
    assert!(boot.handed_off());
}

#[test]
fn research_does_not_return_while_the_console_is_down() {
    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    plan.supervisor.tick(&mut machine);
    let console = plan.supervisor.pid_of("openmind-desktop").unwrap();
    let research = plan.supervisor.pid_of("galion-research").unwrap();

    assert!(machine.exited(research, false));
    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.pid_of("galion-research").is_none());
    assert_eq!(plan.supervisor.next_start_of("galion-research"), Some(5));

    machine.now = 1;
    assert!(machine.exited(console, false));
    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.pid_of("openmind-desktop").is_none());
    assert_eq!(plan.supervisor.next_start_of("openmind-desktop"), Some(6));

    machine.now = 5;
    plan.supervisor.tick(&mut machine);
    assert!(plan.supervisor.pid_of("openmind-desktop").is_none());
    assert!(plan.supervisor.pid_of("galion-research").is_none());
    assert!(!handoff_ready(&plan, &machine));

    machine.now = 6;
    plan.supervisor.tick(&mut machine);
    let console_again = plan.supervisor.pid_of("openmind-desktop").unwrap();
    let research_again = plan.supervisor.pid_of("galion-research").unwrap();
    assert!(console_again < research_again);
    assert_ne!(console_again, console);
    assert_ne!(research_again, research);
    assert!(handoff_ready(&plan, &machine));
}

#[test]
fn early_boot_mounts_loopback_and_clock_before_supervision() {
    assert_eq!(
        DESKTOP_MOUNTS
            .iter()
            .map(|spec| (spec.target, spec.kind))
            .collect::<Vec<_>>(),
        vec![
            ("/proc", "proc"),
            ("/sys", "sysfs"),
            ("/dev", "devtmpfs"),
            ("/run", "tmpfs"),
        ]
    );
    let mut boot = EarlyBoot::new();
    assert_eq!(boot.supervise(), Err(BootError::OutOfOrder));
    assert!(boot.mounted().is_empty());
    assert!(!boot.loopback_up());

    boot.mount().unwrap();
    assert_eq!(boot.mount(), Err(BootError::OutOfOrder));
    assert_eq!(boot.mounted(), ["/proc", "/sys", "/dev", "/run"]);
    boot.loopback().unwrap();
    assert!(boot.loopback_up());
    assert!(!boot.clock_stepped());
    boot.clock().unwrap();
    assert!(boot.clock_stepped());
    boot.tone(0).unwrap();
    assert_eq!(boot.samples(), 0);

    let mut plan = admitted_desktop(false, true);
    let mut machine = Machine::new(0);
    assert!(machine.procs.is_empty());
    plan.supervisor.tick(&mut machine);
    boot.supervise().unwrap();
    let console = plan.supervisor.pid_of("openmind-desktop").unwrap();
    machine.exited(console, false);
    assert_eq!(
        boot.handoff(handoff_ready(&plan, &machine)),
        Err(BootError::HandoffNotReady)
    );
    assert!(!boot.handed_off());

    machine.now = 5;
    plan.supervisor.tick(&mut machine);
    assert_eq!(
        boot.handoff(handoff_ready(&plan, &machine)),
        Err(BootError::HandoffNotReady)
    );
    machine.now = 10;
    plan.supervisor.tick(&mut machine);
    boot.handoff(handoff_ready(&plan, &machine)).unwrap();
    assert!(boot.handed_off());
    assert_ne!(plan.supervisor.pid_of("openmind-desktop").unwrap(), 1);
    assert_ne!(plan.supervisor.pid_of("galion-research").unwrap(), 1);
}

#[test]
fn research_starts_only_after_the_desktop_child_is_alive() {
    let mut plan = admitted_desktop(false, true);
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
fn a_calm_desktop_service_backs_off_and_says_so() {
    let mut service = fixture("openmind-desktop", Restart::Always, 5);
    service.calm = true;
    let mut supervisor = Supervisor::try_new(vec![service]).unwrap();
    let mut machine = Machine::new(0);
    let mut previous = 0u64;
    let mut saw_line = false;
    for _ in 0..8 {
        supervisor.tick(&mut machine);
        let pid = supervisor.pid_of("openmind-desktop").unwrap();
        assert!(machine.exited(pid, false));
        let started = machine.now;
        supervisor.tick(&mut machine);
        let next = supervisor.next_start_of("openmind-desktop").unwrap();
        let wait = next - started;
        assert!(wait <= START_LIMIT_WINDOW_SEC);
        if previous == 0 {
            assert_eq!(wait, 5);
            assert!(supervisor.status_line("openmind-desktop").is_none());
        } else if wait < START_LIMIT_WINDOW_SEC {
            assert_eq!(wait, previous * 2);
            assert!(supervisor.status_line("openmind-desktop").is_none());
        } else {
            assert_eq!(wait, START_LIMIT_WINDOW_SEC);
            let line = supervisor.status_line("openmind-desktop").unwrap();
            assert_eq!(line.lines().count(), 1);
            assert!(line.contains("openmind-desktop keeps failing"));
            assert!(line.contains("seconds"));
            assert!(!line.to_ascii_lowercase().contains("unwrap"));
            assert!(!line.to_ascii_lowercase().contains("panic"));
            saw_line = true;
        }
        previous = wait;
        machine.now = next;
    }
    assert!(saw_line);

    supervisor.tick(&mut machine);
    let pid = supervisor.pid_of("openmind-desktop").unwrap();
    assert!(machine.exited(pid, true));
    supervisor.tick(&mut machine);
    assert!(supervisor.status_line("openmind-desktop").is_none());
    assert_eq!(
        supervisor.next_start_of("openmind-desktop").unwrap() - machine.now,
        5
    );
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

    let mut empty = fixture("job", Restart::No, 1);
    empty.argv.clear();
    let Err(err) = admit(&empty) else {
        panic!("empty argv was admitted");
    };
    assert_eq!(err, AdmitError::EmptyArgv { name: "job".into() });
    let text = err.to_string();
    assert_eq!(text, "service job has an empty argument list");
    assert!(!text.to_ascii_lowercase().contains("unwrap"));
    assert!(!text.to_ascii_lowercase().contains("panic"));
}

#[test]
fn render_names_the_in_memory_runtime() {
    let text = admitted_desktop(false, true).render();
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
handoff current while the console and research are alive
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

#[test]
fn refusals_name_the_reason() {
    let messages = [
        BootError::OutOfOrder.to_string(),
        BootError::HandoffNotReady.to_string(),
        BootError::HandoffStillCurrent.to_string(),
        BootError::RefusedMount.to_string(),
        BindError::NotLoopback.to_string(),
        BindError::ProbePort.to_string(),
        BindError::UnusedStagingPort.to_string(),
        BindError::NotDesktopPort.to_string(),
        AdmitError::EmptyArgv { name: "job".into() }.to_string(),
        AdmitError::RelativeProgram { name: "job".into() }.to_string(),
        AdmitError::HostInit { name: "job".into() }.to_string(),
        AdmitError::Shell { name: "job".into() }.to_string(),
        AdmitError::BadName { name: "job".into() }.to_string(),
        AdmitError::EmptyUser { name: "job".into() }.to_string(),
        AdmitError::SecretOnArgv { name: "job".into() }.to_string(),
        AdmitError::DotDot { name: "job".into() }.to_string(),
        AdmitError::RelativeWorkdir { name: "job".into() }.to_string(),
        galion_init::WalkError::MissingTone.to_string(),
        galion_init::WalkError::MissingRow("openmind-desktop").to_string(),
        galion_init::WalkError::Boot(BootError::OutOfOrder).to_string(),
        galion_init::WalkError::Admit(AdmitError::Shell { name: "job".into() }).to_string(),
    ];
    let needles = [
        "before the step",
        "both be alive",
        "still current",
        "desktop table",
        "loopback",
        "18080",
        "18081",
        "18181",
        "empty argument list",
        "absolute path",
        "host init",
        "shell",
        "service name",
        "empty user",
        "secret marker",
        "contains ..",
        "workdir",
        "tone hook",
        "openmind-desktop",
        "before the step",
        "shell",
    ];
    assert_eq!(messages.len(), needles.len());
    for (text, needle) in messages.iter().zip(needles) {
        assert!(text.contains(needle), "{text} missing {needle}");
        assert!(!text.to_ascii_lowercase().contains("unwrap"), "{text}");
        assert!(!text.to_ascii_lowercase().contains("panic"), "{text}");
    }
}
