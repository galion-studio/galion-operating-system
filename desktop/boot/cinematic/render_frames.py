#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Write the Plymouth frame sequence from the cinematic timeline.

The springs are motion.py. The frames are what the galion theme plays
before the breathing mark. This does not boot a machine.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

from motion import HERE, at, check_timeline, load_timeline, mix, spring

ROOT = HERE.parents[2]
IMAGES = ROOT / "desktop" / "boot" / "plymouth" / "images"
JOST = ROOT / "site" / "assets" / "fonts" / "jost-500.woff2"
SANS = ROOT / "site" / "assets" / "fonts" / "ibm-plex-sans-400.woff2"
DOT = (245 / 255, 245 / 255, 247 / 255)
MIST = (167 / 255, 182 / 255, 196 / 255)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_font(woff: Path, size: int):
    try:
        from fontTools.ttLib import TTFont
        from PIL import ImageFont
    except ImportError as exc:
        fail(f"rendering frames needs pillow and fonttools ({exc})")
    cache = Path("/tmp") / f"galion-{woff.stem}.ttf"
    if not cache.is_file() or cache.stat().st_mtime < woff.stat().st_mtime:
        font = TTFont(str(woff))
        font.flavor = None
        font.save(str(cache))
    return ImageFont.truetype(str(cache), size=size)


def over(dst, rgb, alpha):
    import numpy as np

    a = alpha[..., None]
    dst[:] = rgb * a + dst * (1.0 - a)


def status_motion(tl: dict, t: float) -> tuple[float, float]:
    """Step spring and the resolve fade. Same integrator as the boot page."""
    if t <= 0:
        return 0.0, 0.0
    step = 1.0 / 240
    count = int(t / step)
    p = 0.0
    v = 0.0
    clear_p = 0.0
    clear_v = 0.0
    now = 0.0
    last = len(tl["statuses"]) - 1
    for _ in range(count):
        now += step
        index = 0
        for item in tl["statuses"]:
            if now >= float(item["at"]):
                index += 1
            else:
                break
        index = min(last, max(0, index - 1))
        p, v = spring(p, v, float(index), step, float(tl["statusOmega"]), 1.0)
        clearing = 1.0 if now >= float(tl["resolve"]) and index == last else 0.0
        clear_p, clear_v = spring(clear_p, clear_v, clearing, step, float(tl["clearOmega"]), 1.0)
    return p, clear_p


def paint(tl: dict, t: float, state: dict, width: int, height: int, fonts: dict):
    import numpy as np
    from PIL import Image, ImageDraw

    design = tl["design"]
    scale = min(width / design["width"], height / design["height"])
    bloom = state["bloom"][0]
    ring = state["ring"][0]
    mark = state["mark"][0]
    word = state["word"][0]
    glow = state["glow"][0]
    glass = state["glass"][0]
    field = state["field"][0]
    wake = state["wake"][0]
    cx = width / 2
    cy = height / 2 - 18 * scale
    icon_r = (design["mark"] * 6 / 64) * scale
    radius = design["bloomRadius"] * scale * bloom * (1 - mark) + icon_r * mark
    img = np.zeros((height, width, 3), dtype=np.float64)
    yy, xx = np.ogrid[:height, :width]
    dist = np.hypot(xx - cx, yy - cy)

    if glow > 0.004 and radius > 0.2:
        sigma = max(radius * 3.1, 8 * scale)
        halo = np.exp(-0.5 * (dist / sigma) ** 2) * (0.22 * glow)
        img += halo[..., None] * np.array(DOT)

    if field > 0.01 and bloom > 0.02:
        reach = design["bloomRadius"] * scale * max(bloom, 0.2)
        for i in range(int(tl["particles"])):
            ang = mix(i) * math.tau + t * 0.11
            span = reach * (1.28 + mix(i + 80) * 0.9)
            px = cx + math.cos(ang) * span
            py = cy + math.sin(ang) * span * 0.9
            pr = (0.7 + mix(i + 240) * 0.7) * scale
            speck = np.hypot(xx - px, yy - py) <= pr
            alpha = field * (0.05 + mix(i + 160) * 0.16)
            img[speck] = np.array(DOT) * alpha + img[speck] * (1 - alpha)

    if ring > 0.01:
        ring_r = design["bloomRadius"] * scale * 2.15
        width = max(0.8, 0.55 * scale)
        alpha = np.exp(-0.5 * ((dist - ring_r) / width) ** 2) * (0.22 * ring)
        over(img, np.array(DOT), alpha)

    if radius > 0.3:
        edge_aa = 0.75
        disc_a = np.clip((radius + edge_aa - dist) / (2 * edge_aa), 0, 1)
        img = img * (1 - disc_a[..., None]) + np.array(DOT) * disc_a[..., None]
        if glass > 0.01:
            highlight = np.hypot(xx - (cx - radius * 0.32), yy - (cy - radius * 0.38)) / max(radius, 1e-6)
            shade = np.hypot(xx - (cx + radius * 0.42), yy - (cy + radius * 0.48)) / max(radius, 1e-6)
            body = np.clip(1 - highlight, 0, 1) ** 1.4
            cool = np.array([0.78, 0.84, 0.88])
            white = np.array([1.0, 1.0, 1.0])
            glass_rgb = white * body[..., None] + cool * (1 - body[..., None])
            dark = np.clip(1 - shade, 0, 1) ** 2
            glass_rgb = glass_rgb * (1 - 0.34 * glass * dark[..., None])
            alpha = disc_a * glass * (0.35 + 0.6 * body)
            over(img, glass_rgb, alpha)
            rim = max(1.1, 1.2 * scale)
            edge_a = np.clip(1 - np.abs(dist - (radius - rim * 0.35)) / rim, 0, 1)
            ang = np.arctan2(yy - cy, xx - cx)
            film = 0.5 + 0.5 * np.cos(ang * 2 + t * 0.15)
            tint = np.array([0.78, 0.86, 0.90]) * (1 - film[..., None]) + np.array([0.86, 0.78, 0.90]) * film[..., None]
            over(img, tint, edge_a * 0.42 * glass)

    if mark > 0.004:
        unit = (design["mark"] * scale) / 64
        half = 22 * unit
        rad = 10 * unit
        stroke = 1.75 * unit
        qx = np.abs(xx - cx) - half + rad
        qy = np.abs(yy - cy) - half + rad
        sdf = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - rad
        band = np.clip(stroke / 2 + 0.45 - np.abs(sdf), 0, 1)
        over(img, np.array(DOT), band * mark)

    rgb = np.clip(img * 255, 0, 255).astype(np.uint8)
    plate = Image.fromarray(rgb, "RGB").convert("RGBA")
    draw = ImageDraw.Draw(plate)
    word_y = cy + (22 / 64) * design["mark"] * scale + design["wordGap"] * scale
    if word > 0.004:
        size = max(8, int(round(design["wordSize"] * scale)))
        font = fonts["jost"](size)
        rise = (1 - word) * design["wordRise"] * scale
        draw_tracked(draw, "Galion OS", font, cx, word_y + rise, (245, 245, 247, int(round(255 * word))), -0.02)
    if wake > 0.012:
        rise = (1 - wake) * design["wordRise"] * scale
        name_size = max(9, int(round(design["deskSize"] * scale)))
        state_size = max(8, int(round(design["stateSize"] * scale)))
        name_y = word_y + max(design["deskGap"] * scale, name_size + 6) + rise
        line_y = name_y + max(design["lineGap"] * scale, name_size * 0.7 + 8)
        state_y = line_y + max(design["lineGap"] * scale, state_size * 0.7 + 8)
        name_alpha = int(round(255 * wake))
        draw_tracked(
            draw,
            "Obsidian Desktop",
            fonts["jost"](name_size),
            cx,
            name_y,
            (167, 182, 196, name_alpha),
            -0.02,
        )
        step_p, clear_p = status_motion(tl, t)
        count = len(tl["statuses"])
        progress = min(1.0, max(0.0, (step_p + 1) / count))
        span = design["lineWidth"] * scale
        x0 = cx - span / 2
        track = int(round(86 * wake))
        draw.line([(x0, line_y), (x0 + span, line_y)], fill=(245, 245, 247, track), width=1)
        fill_alpha = int(round(235 * wake))
        draw.line([(x0, line_y), (x0 + span * progress, line_y)], fill=(245, 245, 247, fill_alpha), width=1)
        if clear_p < 0.92:
            radius = max(1.0, 2.1 * scale)
            head = x0 + span * progress
            dot_alpha = int(round(255 * wake * (1 - clear_p)))
            draw.ellipse(
                (head - radius, line_y - radius, head + radius, line_y + radius),
                fill=(245, 245, 247, dot_alpha),
            )
        text_alpha = int(round(255 * wake * (1 - clear_p)))
        if text_alpha > 4:
            i0 = max(0, min(count - 1, math.floor(step_p + 1e-6)))
            i1 = min(count - 1, i0 + 1)
            fade = min(1.0, max(0.0, step_p - i0))
            font = fonts["sans"](state_size)
            if fade < 0.92:
                draw_tracked(
                    draw,
                    tl["statuses"][i0]["text"],
                    font,
                    cx,
                    state_y,
                    (167, 182, 196, int(round(text_alpha * (1 - fade)))),
                    -0.02,
                )
            if fade > 0.08 and i1 != i0:
                draw_tracked(
                    draw,
                    tl["statuses"][i1]["text"],
                    font,
                    cx,
                    state_y,
                    (167, 182, 196, int(round(text_alpha * fade))),
                    -0.02,
                )
    flat = Image.new("RGB", plate.size, (0, 0, 0))
    flat.paste(plate, mask=plate.getchannel("A"))
    return flat


def draw_tracked(draw, text: str, font, cx: float, cy: float, fill, tracking_em: float) -> None:
    widths = [font.getlength(char) for char in text]
    tracking = tracking_em * font.size
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for char, width in zip(text, widths):
        draw.text((x, cy), char, font=font, fill=fill, anchor="lm")
        x += width + tracking


def write_sequence(tl: dict) -> None:
    spec = tl["plymouth"]
    width = int(spec["width"])
    height = int(spec["height"])
    frames = int(spec["frames"])
    fps = int(spec["fps"])
    fonts = {"jost": lambda size: load_font(JOST, size), "sans": lambda size: load_font(SANS, size)}
    IMAGES.mkdir(parents=True, exist_ok=True)
    for index in range(frames):
        t = index / fps
        plate = paint(tl, t, at(tl, t), width, height, fonts)
        path = IMAGES / f"cin-{index:03d}.png"
        plate.save(path, format="PNG", optimize=True)
        print(f"wrote {path.name}", flush=True)


def main(argv: list[str]) -> int:
    tl = load_timeline()
    if argv == ["--check"]:
        errors = check_timeline(tl)
        spec = tl["plymouth"]
        frames = int(spec["frames"])
        for index in range(frames):
            path = IMAGES / f"cin-{index:03d}.png"
            if not path.is_file():
                errors.append(f"missing {path.name}")
                break
        script = (ROOT / "desktop" / "boot" / "plymouth" / "galion.script").read_text(encoding="utf-8")
        if f"cin_count = {frames}" not in script:
            errors.append("Plymouth script frame count does not match the timeline")
        if errors:
            for error in errors:
                print(f"error: {error}", file=sys.stderr)
            return 1
        print(f"cinematic frames checked ({frames})")
        return 0
    if argv not in ([], ["--write"]):
        fail("usage: render_frames.py --check | --write")
    errors = check_timeline(tl)
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1
    write_sequence(tl)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
