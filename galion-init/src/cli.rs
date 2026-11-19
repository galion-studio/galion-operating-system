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

/// An argument the boot greeting can show when it is not text.
pub const ARGUMENT_NOT_TEXT: &str = "an argument is not text";

/// Copy arguments that are text. A value that is not Unicode is refused.
///
/// # Errors
///
/// Returns [`ARGUMENT_NOT_TEXT`] when an argument is not Unicode text.
pub fn decode_args<I, S>(args: I) -> Result<Vec<String>, &'static str>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let mut out = Vec::new();
    for arg in args {
        match arg.as_ref().to_str() {
            Some(text) => out.push(text.to_string()),
            None => return Err(ARGUMENT_NOT_TEXT),
        }
    }
    Ok(out)
}

/// Read arguments after the program name.
pub fn invocation<'a, I>(args: I) -> Invocation
where
    I: IntoIterator<Item = &'a str>,
{
    let args: Vec<&str> = args.into_iter().collect();
    if args.contains(&"--execute") {
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

#[cfg(test)]
mod tests {
    use super::{decode_args, ARGUMENT_NOT_TEXT};

    #[test]
    fn text_arguments_are_kept() {
        assert_eq!(
            decode_args(["desktop", "--silence"]),
            Ok(vec!["desktop".to_string(), "--silence".to_string()])
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_non_text_argument_is_a_plain_sentence() {
        use std::os::unix::ffi::OsStrExt;

        let raw = std::ffi::OsStr::from_bytes(b"desktop\xff");
        assert_eq!(decode_args([raw]), Err(ARGUMENT_NOT_TEXT));
        assert!(!ARGUMENT_NOT_TEXT.contains("unwrap"));
        assert!(!ARGUMENT_NOT_TEXT.contains("panic"));
        assert!(!ARGUMENT_NOT_TEXT.contains('\n'));
    }
}
