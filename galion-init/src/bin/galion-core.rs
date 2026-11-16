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

fn main() {
    print!("{}", greeting());
}

#[cfg(test)]
mod tests {
    use super::greeting;

    #[test]
    fn one_calm_line() {
        let line = greeting();
        assert_eq!(line, "Galion OS. I'm here.\n");
        assert_eq!(line.lines().count(), 1);
        assert!(line.starts_with("Galion OS. "));
        assert!(line.contains("I'm here."));
        assert!(!line.contains("http"));
        assert!(!line.contains("://"));
        assert!(!line.contains('@'));
    }
}
