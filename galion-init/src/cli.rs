// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Arguments for the in-memory prototype.
//!
//! The same words as `prototype.sh`: `voice`, `desktop`, or neither.
//! `--execute` is refused. Nothing here starts a process.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Invocation {
    Desktop { silence: bool },
    Voice,
    Both { silence: bool },
    Walk { silence: bool },
    Refuse(&'static str),
}

const REFUSE_EXECUTE: &str =
    "galion-init: refusing --execute. This prototype does not replace the host init.";
const UNKNOWN: &str = "galion-init: unknown argument";

/// Read arguments after the program name.
pub fn invocation<'a, I>(args: I) -> Invocation
where
    I: IntoIterator<Item = &'a str>,
{
    let args: Vec<&str> = args.into_iter().collect();
    if args.iter().any(|arg| *arg == "--execute") {
        return Invocation::Refuse(REFUSE_EXECUTE);
    }
    let mut silence = false;
    let mut profile: Option<&str> = None;
    for arg in args {
        match arg {
            "--silence" => silence = true,
            "desktop" | "voice" | "walk" => {
                if profile.is_some() {
                    return Invocation::Refuse(UNKNOWN);
                }
                profile = Some(arg);
            }
            _ => return Invocation::Refuse(UNKNOWN),
        }
    }
    match profile {
        Some("voice") if silence => Invocation::Refuse(UNKNOWN),
        Some("voice") => Invocation::Voice,
        Some("desktop") => Invocation::Desktop { silence },
        Some("walk") => Invocation::Walk { silence },
        None => Invocation::Both { silence },
        Some(_) => Invocation::Refuse(UNKNOWN),
    }
}
