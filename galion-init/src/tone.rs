// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! Planned 432 Hz boot tone. The hook records a decision and returns no samples.

/// Frequency named for the planned boot tone.
pub const BOOT_TONE_HZ: u32 = 432;

/// Inputs to the hook. `silence` is a call flag. This module does not read
/// or write a Silence file. `playback_present` is observed and does not
/// change the result: a missing device is not fatal and still plays nothing.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ToneInput {
    pub silence: bool,
    pub playback_present: bool,
}

/// What the boot tone step decided.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToneHook {
    /// Recorded. Not played.
    Planned { hz: u32 },
    /// Silence. The planned tone is skipped.
    Silenced,
}

pub fn tone_hook(input: ToneInput) -> ToneHook {
    let _playback_present = input.playback_present;
    if input.silence {
        ToneHook::Silenced
    } else {
        ToneHook::Planned { hz: BOOT_TONE_HZ }
    }
}

/// Sample count. The prototype never synthesises a buffer.
pub fn tone_samples(hook: ToneHook) -> usize {
    match hook {
        ToneHook::Planned { .. } | ToneHook::Silenced => 0,
    }
}
