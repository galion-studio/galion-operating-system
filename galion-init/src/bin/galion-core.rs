// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Print the Galion OS boot greeting and exit.
//!
//! The line is the short greeting already used for Galion: one calm
//! sentence, then stop. Nothing is opened. Nothing is resolved.
//! Built with `galion-init` so the Pi 5 packager, which copies every
//! release executable, ships this binary for aarch64 and the seed
//! workflow also builds it for x86_64.

#![forbid(unsafe_code)]

/// One sentence. A trailing newline so a console and a journal each
/// keep it as a single record.
fn greeting() -> &'static str {
    "Galion OS. I'm here.\n"
}

/// One sentence the boot greeting can print when a step is refused.
/// A line break in `reason` becomes a space, so the journal keeps one record.
fn refusal(reason: &str) -> String {
    let flat = reason.replace(['\n', '\r'], " ");
    let flat = flat.trim();
    if flat.is_empty() {
        return "Galion OS. This step did not finish.\n".to_string();
    }
    format!("Galion OS. {flat}\n")
}

fn main() {
    use std::io::Write;
    let mut stdout = std::io::stdout().lock();
    if stdout.write_all(greeting().as_bytes()).is_err() {
        let line = refusal("The greeting could not be written.");
        let _ = std::io::stderr().write_all(line.as_bytes());
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::{greeting, refusal};
    use galion_init::{AdmitError, BootError};

    fn plain_record(line: &str) {
        assert_eq!(line.lines().count(), 1, "{line}");
        assert!(line.starts_with("Galion OS. "), "{line}");
        assert!(line.ends_with('\n'), "{line}");
        let lower = line.to_ascii_lowercase();
        assert!(!lower.contains("unwrap"), "{line}");
        assert!(!lower.contains("panic"), "{line}");
        assert!(!line.contains("http"), "{line}");
        assert!(!line.contains("://"), "{line}");
        assert!(!line.contains('@'), "{line}");
    }

    #[test]
    fn one_calm_line() {
        let line = greeting();
        assert_eq!(line, "Galion OS. I'm here.\n");
        plain_record(line);
        assert!(line.contains("I'm here."));
    }

    #[test]
    fn a_boot_or_service_refusal_is_one_plain_sentence() {
        let boot = refusal(&BootError::OutOfOrder.to_string());
        plain_record(&boot);
        assert!(boot.contains("before the step"));

        let service = refusal(
            &AdmitError::EmptyArgv {
                name: "openmind-desktop".into(),
            }
            .to_string(),
        );
        plain_record(&service);
        assert!(service.contains("empty argument list"));
        assert!(service.contains("openmind-desktop"));

        let broken = refusal("the clock\nstep did not run");
        plain_record(&broken);
        assert_eq!(broken, "Galion OS. the clock step did not run\n");

        let empty = refusal(" \n\r ");
        plain_record(&empty);
        assert_eq!(empty, "Galion OS. This step did not finish.\n");

        let resting = refusal(&galion_init::failing_status(
            "openmind-desktop",
            galion_init::START_LIMIT_WINDOW_SEC,
        ));
        plain_record(&resting);
        assert!(resting.contains("keeps failing"));
        assert!(resting.contains("openmind-desktop"));
    }
}
