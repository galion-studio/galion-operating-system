//! Print one local status screen. Loopback only. Does not start a service.

use std::env;
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Duration;

use galion_status::{check, render, services};

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.iter().any(|arg| arg == "--execute") {
        eprintln!("galion-status: refuses --execute");
        return ExitCode::from(2);
    }
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("galion-status [--root DIR] [--port NAME=PORT]");
        println!("Prints up, down, or not installed for each port in docs/ARCHITECTURE.md.");
        println!("Dials 127.0.0.1 only.");
        return ExitCode::from(0);
    }

    let mut root = PathBuf::from("/");
    let mut rows = services();
    let mut index = 0;
    while index < args.len() {
        let arg = &args[index];
        if arg == "--root" {
            let Some(value) = args.get(index + 1) else {
                eprintln!("galion-status: --root needs a directory");
                return ExitCode::from(2);
            };
            root = PathBuf::from(value);
            index += 2;
            continue;
        }
        if arg == "--port" {
            let Some(value) = args.get(index + 1) else {
                eprintln!("galion-status: --port needs NAME=PORT");
                return ExitCode::from(2);
            };
            if !apply_port(&mut rows, value) {
                eprintln!("galion-status: unknown port {value}");
                return ExitCode::from(2);
            }
            index += 2;
            continue;
        }
        eprintln!("galion-status: unknown argument {arg}");
        return ExitCode::from(2);
    }

    let lines = check(&rows, &root, Duration::from_millis(200));
    print!("{}", render(&lines));
    ExitCode::from(0)
}

fn apply_port(rows: &mut [galion_status::Service], spec: &str) -> bool {
    let Some((name, port)) = spec.split_once('=') else {
        return false;
    };
    let Ok(port) = port.parse::<u16>() else {
        return false;
    };
    if port == 0 {
        return false;
    }
    let Some(row) = rows.iter_mut().find(|row| row.name == name) else {
        return false;
    };
    row.port = port;
    true
}
