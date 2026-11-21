#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Critically damped boot springs. The same step as desktop/boot/animations/spring.rs.

display frames are substepped at timeline["substep"] so a late frame cannot
skip the onset. Each substep is the semi-implicit Euler step in spring.rs.
Zeta is 1. There is no linear tween.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TIMELINE_PATH = HERE / "timeline.json"
NAMES = ("bloom", "ring", "mark", "word", "glow", "glass", "field", "wake")


def load_timeline(path: Path = TIMELINE_PATH) -> dict:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("timeline is not an object")
    return data


def mix(index: int) -> float:
    x = ((index + 1) * 0x9E3779B1) & 0xFFFFFFFF
    x ^= x >> 16
    x = (x * 0x7FEB352D) & 0xFFFFFFFF
    x ^= x >> 15
    return (x & 0xFFFFFFFF) / 4294967296


def targets(tl: dict, t: float) -> dict[str, float]:
    return {
        "bloom": 1.0 if t >= tl["onset"] else 0.0,
        "ring": 1.0 if tl["ringIn"] <= t < tl["ringOut"] else 0.0,
        "mark": 1.0 if t >= tl["peak"] else 0.0,
        "word": 1.0 if t >= tl["release"] else 0.0,
        "glow": 1.0 if tl["onset"] <= t < tl["peak"] else 0.0,
        "glass": 1.0 if tl["onset"] <= t < tl["release"] else 0.0,
        "field": 1.0 if tl["fieldIn"] <= t < tl["fieldOut"] else 0.0,
        "wake": 1.0 if t >= tl["handoff"] else 0.0,
    }


def spring(p: float, v: float, target: float, h: float, omega: float, zeta: float) -> tuple[float, float]:
    if not math.isfinite(h) or h <= 0.0:
        return p, v
    a = -omega * omega * (p - target) - 2.0 * zeta * omega * v
    v = v + a * h
    p = p + v * h
    if not math.isfinite(p) or not math.isfinite(v):
        return target, 0.0
    return p, v


def zeros() -> dict[str, list[float]]:
    return {name: [0.0, 0.0] for name in NAMES}


def substep(state: dict[str, list[float]], t: float, h: float, tl: dict) -> None:
    onset = float(tl["onset"])
    t1 = t + h
    if t < onset <= t1:
        if state["bloom"][0] < tl["appear"]:
            state["bloom"][0] = float(tl["appear"])
            state["bloom"][1] = 0.0
        state["glow"][0] = max(state["glow"][0], float(tl["glowKick"]))
        state["glow"][1] = 0.0
        state["glass"][0] = max(state["glass"][0], float(tl["glassKick"]))
        state["glass"][1] = 0.0
    goal = targets(tl, t1)
    gains = tl["springs"]
    for name in NAMES:
        gain = gains[name]
        p, v = spring(
            state[name][0],
            state[name][1],
            goal[name],
            h,
            float(gain["omega"]),
            float(gain["zeta"]),
        )
        state[name][0] = p
        state[name][1] = v


def at(tl: dict, t_end: float) -> dict[str, list[float]]:
    state = zeros()
    if t_end <= 0.0:
        return state
    step = 1.0 / float(tl["substepHz"])
    count = int(t_end / step)
    t = 0.0
    for _ in range(count):
        substep(state, t, step, tl)
        t += step
    remain = t_end - t
    if remain > 1e-12:
        substep(state, t, remain, tl)
    return state


def position(state: dict[str, list[float]]) -> dict[str, float]:
    return {name: state[name][0] for name in NAMES}


def check_timeline(tl: dict) -> list[str]:
    errors: list[str] = []
    for name, gain in tl["springs"].items():
        if float(gain["zeta"]) != 1.0:
            errors.append(f"{name} zeta is not 1")
        if float(gain["omega"]) <= 0:
            errors.append(f"{name} omega is not positive")
    if abs(float(tl["onset"]) - float(tl["measured"]["onset"])) > 1e-9:
        errors.append("onset does not match the measurement")
    if abs(float(tl["peak"]) - float(tl["measured"]["peak"])) > 1e-9:
        errors.append("peak does not match the measurement")
    before = at(tl, 0.20)
    if before["bloom"][0] != 0.0 or before["glow"][0] != 0.0:
        errors.append("light is visible before the onset")
    crossed = at(tl, 0.21)
    if crossed["bloom"][0] + 1e-9 < float(tl["appear"]):
        errors.append("the point does not appear on the onset")
    pre = at(tl, 2.31)
    if pre["mark"][0] > 0.02:
        errors.append("the mark moves before the peak")
    snapped = at(tl, 2.42)
    if snapped["mark"][0] < 0.9 or snapped["mark"][0] > 1.02:
        errors.append("the mark does not snap on the peak")
    settled = at(tl, 4.2)
    if settled["word"][0] < 0.93 or settled["glow"][0] > 0.2 or settled["glass"][0] > 0.12:
        errors.append("the release does not settle")
    wake = at(tl, 4.76)
    if wake["wake"][0] < 0.97 or wake["wake"][0] > 1.02:
        errors.append("the wake rise is not the 160 ms spring")
    steps = tl.get("statuses")
    expected = (
        "Initialising…",
        "Setting up…",
        "Loading Obsidian Desktop…",
        "Loading Open Mind stack…",
        "Loading apps…",
    )
    if not isinstance(steps, list) or [item.get("text") for item in steps] != list(expected):
        errors.append("the status sequence is not the five Obsidian Desktop lines")
    else:
        times = [float(item["at"]) for item in steps]
        if times[0] != float(tl["handoff"]) or times != sorted(times):
            errors.append("status lines do not start at the handoff")
        if any(times[i + 1] - times[i] < float(tl["statusDwell"]) - 1e-9 for i in range(len(times) - 1)):
            errors.append("a status line is shorter than the minimum dwell")
        if not (times[-1] < float(tl["resolve"]) < float(tl["hold"])):
            errors.append("the status resolve is not inside the sound")
        if steps[2].get("probe") != "desktop" or steps[4].get("probe") != "apps":
            errors.append("desktop and apps are not the probed status lines")
        if any(item.get("probe") for item in (steps[0], steps[1], steps[3])):
            errors.append("a timed status line has a probe")
    return errors


def main(argv: list[str]) -> int:
    tl = load_timeline()
    if argv == ["--check"]:
        errors = check_timeline(tl)
        if errors:
            for error in errors:
                print(f"error: {error}", file=sys.stderr)
            return 1
        print("cinematic springs checked")
        return 0
    if argv == ["--samples"]:
        times = [0, 0.2, 0.205, 0.21, 1.0, 1.2, 2.31, 2.32, 2.45, 2.6, 3.5, 4.2, 4.5, 4.7, 5.0]
        payload = {f"{t:.3f}": position(at(tl, t)) for t in times}
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 0
    print("usage: motion.py --check | --samples", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
