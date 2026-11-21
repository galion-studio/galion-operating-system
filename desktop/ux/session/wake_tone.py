#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2026 Galion Labs
"""Play the desktop wake sine. Oscillator only. No recording is read or written."""

from __future__ import annotations

import math
import shutil
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TOKENS = HERE.parent / "tokens" / "tokens.json"
RUST = ROOT / "desktop" / "boot" / "sounds" / "openmind-desktop-sound.rs"


def samples(ms: int, hz: int, amplitude: float, fade_ms: int, rate: int) -> list[float]:
    count = ms * rate // 1000
    fade = min(fade_ms * rate // 1000, count // 2)
    step = math.tau * hz / rate
    out: list[float] = []
    for index in range(count):
        if fade == 0:
            env = 1.0
        elif index < fade:
            env = 0.5 - 0.5 * math.cos(math.pi * (index / fade))
        elif index + fade >= count:
            env = 0.5 - 0.5 * math.cos(math.pi * ((count - 1 - index) / fade))
        else:
            env = 1.0
        out.append(math.sin(step * index) * amplitude * env)
    return out


def band_energy(frames: list[float], hz: float, rate: int) -> float:
    step = math.tau * hz / rate
    real = 0.0
    imag = 0.0
    for index, sample in enumerate(frames):
        angle = step * index
        real += sample * math.cos(angle)
        imag += sample * math.sin(angle)
    return real * real + imag * imag


def load_wake() -> tuple[int, int, float, int, int]:
    import json

    data = json.loads(TOKENS.read_text(encoding="utf-8"))
    sound = data["sound"]
    wake = next(tone for tone in sound["tones"] if tone["id"] == "wake")
    hz = sound["referenceHz"] * wake["num"] // wake["den"]
    return wake["ms"], hz, float(sound["amplitude"]), int(sound["fadeMs"]), int(sound["sampleRate"])


def check() -> int:
    text = RUST.read_text(encoding="utf-8")
    needles = (
        "pub const REFERENCE_HZ: u32 = 432;",
        "pub const SAMPLE_RATE: u32 = 16_000;",
        "const AMPLITUDE: f32 = 0.32;",
        "const FADE_MS: u32 = 8;",
        'id: "wake"',
        "num: 1,",
        "den: 1,",
        "ms: 160,",
    )
    missing = [needle for needle in needles if needle not in text]
    if missing:
        print("wake definition drifted: " + ", ".join(missing), file=sys.stderr)
        return 1
    ms, hz, amplitude, fade_ms, rate = load_wake()
    frames = samples(ms, hz, amplitude, fade_ms, rate)
    if len(frames) != 2560 or hz != 432 or ms != 160:
        print("wake samples do not match the vendored sine", file=sys.stderr)
        return 1
    peak = max(abs(sample) for sample in frames)
    if peak > amplitude + 0.001:
        print("wake peak is above 0.32", file=sys.stderr)
        return 1
    own = band_energy(frames, 432.0, rate)
    other = band_energy(frames, 440.0, rate)
    if own <= other * 4:
        print("wake energy is not at 432 Hz", file=sys.stderr)
        return 1
    print("wake tone matches the vendored sine")
    return 0


def write_wav(path: Path, frames: list[float], rate: int) -> None:
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        pcm = bytearray()
        for sample in frames:
            value = max(-32768, min(32767, int(sample * 32767.0)))
            pcm.extend(struct.pack("<h", value))
        handle.writeframes(pcm)


def play(path: Path) -> bool:
    for command in (["paplay", str(path)], ["pw-play", str(path)], ["aplay", "-q", str(path)]):
        if shutil.which(command[0]) is None:
            continue
        result = subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode == 0:
            return True
    return False


def main(argv: list[str]) -> int:
    if argv[1:] == ["--check"]:
        return check()
    if argv[1:]:
        print("refused: pass nothing, or --check", file=sys.stderr)
        return 2
    ms, hz, amplitude, fade_ms, rate = load_wake()
    frames = samples(ms, hz, amplitude, fade_ms, rate)
    with tempfile.TemporaryDirectory(prefix="galion-wake-") as directory:
        wav_path = Path(directory) / "wake.wav"
        write_wav(wav_path, frames, rate)
        played = play(wav_path)
    print("played" if played else "unplayed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
