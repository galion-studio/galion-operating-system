#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Synthesise the Galion boot, shutdown, and wake tones.

boot and shutdown come from the note list in os-tones.js (432 Hz just
ratios, the page's scheduleSine envelope, and the hum). wake is the
desktop crate clip: one 160 ms sine at 432 Hz. Nothing here is a
recording.

WAV bytes are the deterministic artifact. OGG is a libvorbis encode of
those same samples. Re-run this script to refresh both.
"""

from __future__ import annotations

import hashlib
import math
import re
import shutil
import struct
import subprocess
import sys
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
TONES_JS = HERE / "os-tones.js"
WAKE_RS = HERE / "openmind-desktop-sound.rs"
FLOOR = 0.0001


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def need(pattern: str, text: str, label: str) -> re.Match[str]:
    found = re.search(pattern, text)
    if found is None:
        fail(f"{label} is missing from the tone source")
    return found


def eval_hz(expr: str, fund: float) -> float:
    token = expr.replace(" ", "")
    if token == "FUND":
        return fund
    whole = re.fullmatch(r"FUND/(\d+)", token)
    if whole:
        return fund / int(whole.group(1))
    ratio = re.fullmatch(r"FUND\*\((\d+)/(\d+)\)", token)
    if ratio:
        return fund * (int(ratio.group(1)) / int(ratio.group(2)))
    times = re.fullmatch(r"FUND\*(\d+)", token)
    if times:
        return fund * int(times.group(1))
    fail(f"unparsed note expression: {expr}")
    raise AssertionError


def seconds(text: str) -> float:
    value = Decimal(text)
    return float(value)


def parse_page(text: str) -> dict[str, object]:
    fund = float(need(r"const FUND=(\d+)", text, "FUND").group(1))
    hum_src = need(r"const HUM=\[([^\]]+)\]", text, "HUM").group(1)
    hum = [eval_hz(part, fund) for part in hum_src.split(",") if part.strip()]
    chords: dict[str, list[float]] = {}
    for tone_id in ("boot", "shutdown"):
        notes = need(
            r'\{id:"' + tone_id + r'",\s*notes:\[([^\]]+)\]\}',
            text,
            tone_id,
        ).group(1)
        chords[tone_id] = [eval_hz(part, fund) for part in notes.split(",") if part.strip()]
    step = seconds(need(r"step=([0-9.]+)", text, "step").group(1))
    note_extra = seconds(
        need(
            r"scheduleSine\(ctx,hz,t\+i\*step,step\+([0-9.]+),([0-9.]+)\)",
            text,
            "note schedule",
        ).group(1)
    )
    note_peak = float(
        need(
            r"scheduleSine\(ctx,hz,t\+i\*step,step\+[0-9.]+,([0-9.]+)\)",
            text,
            "note peak",
        ).group(1)
    )
    hum_tail = seconds(
        need(
            r"tone\.notes\.length\*step\+([0-9.]+)",
            text,
            "hum length",
        ).group(1)
    )
    hum_peak = float(
        need(
            r"for\(const hz of HUM\) scheduleSine\(ctx,hz,t,dur,([0-9.]+)\)",
            text,
            "hum peak",
        ).group(1)
    )
    attack = seconds(
        need(
            r"exponentialRampToValueAtTime\(peak, start\+([0-9.]+)\)",
            text,
            "attack",
        ).group(1)
    )
    release = seconds(
        need(r"o\.stop\(start\+dur\+([0-9.]+)\)", text, "release").group(1)
    )
    return {
        "fund": fund,
        "hum": hum,
        "chords": chords,
        "step": step,
        "note_extra": note_extra,
        "note_peak": note_peak,
        "hum_tail": hum_tail,
        "hum_peak": hum_peak,
        "attack": attack,
        "release": release,
    }


def parse_wake(text: str) -> dict[str, float | int]:
    rate = int(need(r"SAMPLE_RATE: u32 = ([0-9_]+)", text, "sample rate").group(1).replace("_", ""))
    amplitude = float(need(r"AMPLITUDE: f32 = ([0-9.]+)", text, "amplitude").group(1))
    fade_ms = int(need(r"FADE_MS: u32 = (\d+)", text, "fade").group(1))
    reference = int(need(r"REFERENCE_HZ: u32 = (\d+)", text, "reference").group(1))
    wake = need(
        r'id: "wake",\s*role: "[^"]*",\s*num: \d+,\s*den: \d+,\s*ms: (\d+)',
        text,
        "wake length",
    )
    return {
        "rate": rate,
        "amplitude": amplitude,
        "fade_ms": fade_ms,
        "hz": reference,
        "ms": int(wake.group(1)),
    }


def page_gain(t: float, start: float, dur: float, peak: float, attack: float, release: float) -> float:
    stop = start + dur + release
    if t < start or t >= stop:
        return 0.0
    peak_at = start + attack
    floor_at = start + max(0.05, dur)
    if t <= peak_at:
        if peak_at <= start:
            return peak
        frac = (t - start) / (peak_at - start)
        return FLOOR * (peak / FLOOR) ** frac
    if t <= floor_at and floor_at > peak_at:
        frac = (t - peak_at) / (floor_at - peak_at)
        return peak * (FLOOR / peak) ** frac
    return FLOOR


def mix_chord(page: dict[str, object], tone_id: str, rate: int) -> list[float]:
    chords = page["chords"]
    assert isinstance(chords, dict)
    notes = chords[tone_id]
    assert isinstance(notes, list)
    step = float(page["step"])
    extra = float(page["note_extra"])
    attack = float(page["attack"])
    release = float(page["release"])
    note_peak = float(page["note_peak"])
    hum_peak = float(page["hum_peak"])
    hum = page["hum"]
    assert isinstance(hum, list)
    hum_dur = len(notes) * step + float(page["hum_tail"])
    stop = hum_dur + release
    count = int(Decimal(str(stop)) * rate)
    # str(float) can be long; the inputs are exact hundredths, so count
    # from integer milliseconds instead when the stop lands on one.
    stop_ms = int(round(stop * 1000))
    if abs(stop - (stop_ms / 1000)) < 1e-9:
        count = stop_ms * rate // 1000
    out = [0.0] * count
    partials: list[tuple[float, float, float, float]] = []
    for index, hz in enumerate(notes):
        partials.append((float(hz), index * step, step + extra, note_peak))
    for hz in hum:
        partials.append((float(hz), 0.0, hum_dur, hum_peak))
    for index in range(count):
        t = index / rate
        sample = 0.0
        for hz, start, dur, peak in partials:
            gain = page_gain(t, start, dur, peak, attack, release)
            if gain == 0.0:
                continue
            sample += math.sin(2 * math.pi * hz * t) * gain
        out[index] = sample
    return out


def wake_samples(spec: dict[str, float | int]) -> list[float]:
    rate = int(spec["rate"])
    count = int(spec["ms"]) * rate // 1000
    fade = int(spec["fade_ms"]) * rate // 1000
    fade = min(fade, count // 2)
    hz = float(spec["hz"])
    amp = float(spec["amplitude"])
    step = 2 * math.pi * hz / rate
    out: list[float] = []
    for index in range(count):
        if fade == 0:
            env = 1.0
        elif index < fade:
            x = index / fade
            env = 0.5 - 0.5 * math.cos(math.pi * x)
        elif index + fade >= count:
            x = (count - 1 - index) / fade
            env = 0.5 - 0.5 * math.cos(math.pi * x)
        else:
            env = 1.0
        out.append(math.sin(step * index) * amp * env)
    return out


def to_i16(sample: float) -> int:
    value = sample * 32767.0
    if value > 32767.0:
        value = 32767.0
    if value < -32768.0:
        value = -32768.0
    if value >= 0:
        return int(value)
    return -int(-value)


def encode_wav(samples: list[float], rate: int) -> bytes:
    data_len = len(samples) * 2
    header = bytearray()
    header.extend(b"RIFF")
    header.extend(struct.pack("<I", 36 + data_len))
    header.extend(b"WAVEfmt ")
    header.extend(struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16))
    header.extend(b"data")
    header.extend(struct.pack("<I", data_len))
    body = bytearray()
    for sample in samples:
        body.extend(struct.pack("<h", to_i16(sample)))
    return bytes(header) + bytes(body)


def encode_ogg(wav_path: Path, ogg_path: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        fail("ffmpeg is required to write the OGG files")
    result = subprocess.run(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-c:a",
            "libvorbis",
            "-q:a",
            "2",
            "-map_metadata",
            "-1",
            "-fflags",
            "+bitexact",
            "-flags",
            "+bitexact",
            str(ogg_path),
        ],
        check=False,
        capture_output=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr.decode("utf-8", "replace"))
        fail(f"ffmpeg could not encode {ogg_path.name}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def band_energy(samples: list[float], hz: float, rate: int) -> float:
    step = 2 * math.pi * hz / rate
    real = 0.0
    imag = 0.0
    for index, sample in enumerate(samples):
        phase = step * index
        real += sample * math.cos(phase)
        imag += sample * math.sin(phase)
    return real * real + imag * imag


def render_all(page: dict[str, object], wake: dict[str, float | int]) -> dict[str, list[float]]:
    rate = int(wake["rate"])
    return {
        "boot": mix_chord(page, "boot", rate),
        "shutdown": mix_chord(page, "shutdown", rate),
        "wake": wake_samples(wake),
    }


def assert_tones(clips: dict[str, list[float]], page: dict[str, object], wake: dict[str, float | int]) -> None:
    rate = int(wake["rate"])
    wake_clip = clips["wake"]
    if len(wake_clip) != int(wake["ms"]) * rate // 1000:
        fail("wake length does not match the desktop crate")
    peak = max(abs(sample) for sample in wake_clip)
    if peak > float(wake["amplitude"]) + 1e-6:
        fail("wake peak is above the desktop crate amplitude")
    at_432 = band_energy(wake_clip, 432.0, rate)
    at_440 = band_energy(wake_clip, 440.0, rate)
    if at_432 <= at_440 * 4:
        fail("wake energy is not at 432 Hz")
    chords = page["chords"]
    assert isinstance(chords, dict)
    for tone_id in ("boot", "shutdown"):
        clip = clips[tone_id]
        if max(abs(sample) for sample in clip) >= 1:
            fail(f"{tone_id} clips the mix")
        notes = chords[tone_id]
        assert isinstance(notes, list)
        for hz in notes:
            own = band_energy(clip, float(hz), rate)
            other = band_energy(clip, float(hz) + 20.0, rate)
            if own <= other * 2:
                fail(f"{tone_id} is missing the {hz} Hz partial")


def provenance(page: dict[str, object], wake: dict[str, float | int], hashes: dict[str, str]) -> str:
    chords = page["chords"]
    hum = page["hum"]
    assert isinstance(chords, dict)
    assert isinstance(hum, list)
    lines = [
        "G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network",
        "Developed and distributed by Galion Labs",
        "Perpetual Open MIT License",
        "Copyright © 2026 Galion Labs. All rights reserved.",
        "",
        "The licence text is LICENSE at the repository root. This file does not restate it.",
        "",
        "Synthesised tones. Not a recording. No voice is in these files.",
        "",
        "Sources:",
        "- desktop/boot/sounds/os-tones.js boot and shutdown note lists, hum, and scheduleSine",
        "- desktop/boot/sounds/openmind-desktop-sound.rs wake clip (sine, fade, rate, peak, length)",
        "",
        "The page oscillator runs in an AudioContext. These files use the desktop",
        "crate rate, 16 kHz, 16-bit mono, so the clips stay small. The pitches and",
        "the scheduleSine envelope are the page's. The wake envelope is the crate's.",
        "",
        f"fund_hz: {page['fund']}",
        f"boot_hz: {', '.join(str(hz) for hz in chords['boot'])}",
        f"shutdown_hz: {', '.join(str(hz) for hz in chords['shutdown'])}",
        f"hum_hz: {', '.join(str(hz) for hz in hum)}",
        f"step_s: {page['step']}",
        f"note_peak: {page['note_peak']}",
        f"hum_peak: {page['hum_peak']}",
        f"wake_hz: {wake['hz']}",
        f"wake_ms: {wake['ms']}",
        f"wake_peak: {wake['amplitude']}",
        f"wake_fade_ms: {wake['fade_ms']}",
        f"sample_rate: {wake['rate']}",
        "wav: PCM 16-bit little-endian, 44-byte header",
        "ogg: libvorbis quality 2 of the same WAV, metadata stripped",
        "",
        "sha256:",
    ]
    for name in ("boot.wav", "boot.ogg", "shutdown.wav", "shutdown.ogg", "wake.wav", "wake.ogg"):
        lines.append(f"  {name} {hashes[name]}")
    lines.extend(
        [
            "",
            "Supplied startup sound. Not a voice recording.",
            "Supplied by Maciej Grajczyk for Galion OS, 2026-11-21.",
            "galion-os-startup.mp3 is that file, unchanged.",
            "galion-os-startup.ogg is a libvorbis transcode of the same file.",
            "The container metadata on the transcode is stripped.",
            "duration_s: 7.732245",
            "sample_rate: 44100",
            "channels: 2",
            "mp3_kbps: 256",
            "peak_dbfs: -11.13",
            "sha256:",
        ]
    )
    for name in ("galion-os-startup.mp3", "galion-os-startup.ogg"):
        lines.append(f"  {name} {hashes[name]}")
    lines.append("")
    return "\n".join(lines)


def write_outputs(directory: Path, clips: dict[str, list[float]], rate: int) -> dict[str, str]:
    directory.mkdir(parents=True, exist_ok=True)
    hashes: dict[str, str] = {}
    for name, samples in clips.items():
        wav_path = directory / f"{name}.wav"
        ogg_path = directory / f"{name}.ogg"
        wav_path.write_bytes(encode_wav(samples, rate))
        encode_ogg(wav_path, ogg_path)
        hashes[f"{name}.wav"] = sha256(wav_path)
        hashes[f"{name}.ogg"] = sha256(ogg_path)
    return hashes


def hashes_on_disk(directory: Path) -> dict[str, str]:
    names = (
        "boot.wav",
        "boot.ogg",
        "shutdown.wav",
        "shutdown.ogg",
        "wake.wav",
        "wake.ogg",
        "galion-os-startup.mp3",
        "galion-os-startup.ogg",
    )
    found: dict[str, str] = {}
    for name in names:
        path = directory / name
        if not path.is_file():
            fail(f"missing {path}")
        found[name] = sha256(path)
    return found


def check(page: dict[str, object], wake: dict[str, float | int]) -> None:
    clips = render_all(page, wake)
    assert_tones(clips, page, wake)
    rate = int(wake["rate"])
    for name, samples in clips.items():
        committed = HERE / f"{name}.wav"
        if not committed.is_file():
            fail(f"missing {committed}")
        if encode_wav(samples, rate) != committed.read_bytes():
            fail(f"{name}.wav does not match a fresh render. Re-run generate_tones.py")
    text = provenance(page, wake, hashes_on_disk(HERE))
    current = (HERE / "PROVENANCE.txt").read_text(encoding="utf-8") if (HERE / "PROVENANCE.txt").is_file() else ""
    if current != text:
        fail("PROVENANCE.txt does not match the committed tones. Re-run generate_tones.py")
    for name in ("boot.ogg", "shutdown.ogg", "wake.ogg"):
        header = (HERE / name).read_bytes()[:4]
        if header != b"OggS":
            fail(f"{name} is not an Ogg file")
    print("tones match the note lists and the wake clip")


def main(argv: list[str]) -> int:
    output = HERE
    checking = False
    index = 0
    while index < len(argv):
        arg = argv[index]
        if arg == "--check":
            checking = True
        elif arg == "--output":
            index += 1
            if index >= len(argv):
                fail("--output needs a directory")
            output = Path(argv[index])
        else:
            fail(f"unknown argument: {arg}")
        index += 1
    if not TONES_JS.is_file() or not WAKE_RS.is_file():
        fail("tone sources are not beside this script")
    page = parse_page(TONES_JS.read_text(encoding="utf-8"))
    wake = parse_wake(WAKE_RS.read_text(encoding="utf-8"))
    if int(wake["rate"]) != 16000 or int(wake["hz"]) != 432:
        fail("desktop wake rate or pitch is not the crate's 16 kHz / 432 Hz")
    chords = page["chords"]
    assert isinstance(chords, dict)
    if chords["boot"] != [108.0, 216.0, 432.0] or chords["shutdown"] != [432.0, 216.0, 108.0]:
        fail("boot or shutdown notes are not the 432 Hz list in os-tones.js")
    if checking:
        check(page, wake)
        return 0
    clips = render_all(page, wake)
    assert_tones(clips, page, wake)
    hashes = write_outputs(output, clips, int(wake["rate"]))
    text = provenance(page, wake, hashes)
    (output / "PROVENANCE.txt").write_text(text, encoding="utf-8")
    print(f"wrote tones in {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
