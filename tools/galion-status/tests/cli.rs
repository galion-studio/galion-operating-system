use std::io::{Read, Write};
use std::net::{Ipv4Addr, TcpListener};
use std::process::Command;
use std::thread;

fn bin() -> Command {
    Command::new(env!("CARGO_BIN_EXE_galion-status"))
}

fn closed_port() -> u16 {
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
    listener.local_addr().unwrap().port()
}

#[test]
fn execute_is_refused_before_a_probe() {
    let output = bin().arg("--execute").output().unwrap();
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty());
    let err = String::from_utf8(output.stderr).unwrap();
    assert!(err.contains("refuses --execute"));
}

#[test]
fn stub_listener_and_a_marker_print_the_three_states() {
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
    let open = listener.local_addr().unwrap().port();
    thread::spawn(move || {
        if let Ok((mut sock, _)) = listener.accept() {
            let mut buf = [0_u8; 256];
            let _ = sock.read(&mut buf);
            let _ = sock.write_all(b"ok");
        }
    });
    let closed = closed_port();
    let root =
        std::env::temp_dir().join(format!("galion-status-cli-{}-{}", std::process::id(), open));
    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(root.join("etc/systemd/system")).unwrap();
    std::fs::write(
        root.join("etc/systemd/system/galion-welcome.service"),
        b"\n",
    )
    .unwrap();

    let mut command = bin();
    command.arg("--root").arg(&root);
    for row in galion_status::services() {
        let port = if row.name == "openmind-desktop" {
            open
        } else {
            closed
        };
        command.arg("--port").arg(format!("{}={port}", row.name));
    }
    let output = command.output().unwrap();
    let text = String::from_utf8(output.stdout).unwrap();
    assert_eq!(output.status.code(), Some(0), "{text}{:?}", output.stderr);
    assert!(
        text.contains(&format!("{:<18} {open:>5}  up\n", "openmind-desktop")),
        "{text}"
    );
    assert!(
        text.contains(&format!("{:<18} {closed:>5}  down\n", "galion-welcome")),
        "{text}"
    );
    assert!(text.contains("voice-screen"), "{text}");
    assert!(text.contains("not installed"), "{text}");
    assert!(text.contains("This reading is this machine."));
    assert!(!text.contains("10."));
    std::fs::remove_dir_all(&root).unwrap();
}
