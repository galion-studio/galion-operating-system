#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Rasterise the Galion OS mark for the Plymouth theme.

The geometry is read from docs/brand/marks/icon-os.svg. The ring and the
dot are separate PNGs so the dot can breathe. This is a build step, not
a recording of a boot.
"""

from __future__ import annotations

import math
import struct
import sys
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SVG = ROOT / "docs" / "brand" / "marks" / "icon-os.svg"
IMAGES = Path(__file__).resolve().parent / "images"

MARK = 192
DOT_FRAMES = 24
SCALE_MIN = 1.0
SCALE_MAX = 1.12
SAMPLES = 4
DOT = (0xF5, 0xF5, 0xF7)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_mark(path: Path) -> dict[str, float]:
    if not path.is_file():
        fail(f"missing {path}")
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        fail(f"icon-os.svg is not XML: {exc}")
    rect = None
    circle = None
    for element in tree.getroot().iter():
        name = local(element.tag)
        if name == "rect":
            rect = element
        elif name == "circle":
            circle = element
    if rect is None or circle is None:
        fail("icon-os.svg needs one rect and one circle")
    stroke = rect.attrib.get("stroke", "")
    fill = circle.attrib.get("fill", "")
    if stroke.upper() != "#F5F5F7" or fill.upper() != "#F5F5F7":
        fail("icon-os.svg mark is not the dot colour #F5F5F7")
    try:
        parsed = {
            "x": float(rect.attrib["x"]),
            "y": float(rect.attrib["y"]),
            "width": float(rect.attrib["width"]),
            "height": float(rect.attrib["height"]),
            "rx": float(rect.attrib["rx"]),
            "stroke": float(rect.attrib["stroke-width"]),
            "cx": float(circle.attrib["cx"]),
            "cy": float(circle.attrib["cy"]),
            "r": float(circle.attrib["r"]),
        }
    except (KeyError, ValueError) as exc:
        fail(f"icon-os.svg geometry is incomplete: {exc}")
    view = tree.getroot().attrib.get("viewBox", "")
    if view.split() != ["0", "0", "64", "64"]:
        fail("icon-os.svg viewBox is not 0 0 64 64")
    return parsed


def write_png(path: Path, width: int, height: int, rgba: bytes) -> None:
    if len(rgba) != width * height * 4:
        fail(f"png buffer for {path.name} has the wrong size")

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def blank(width: int, height: int) -> bytearray:
    return bytearray(width * height * 4)


def put(buf: bytearray, width: int, x: int, y: int, coverage: float) -> None:
    if coverage <= 0:
        return
    if coverage > 1:
        coverage = 1
    alpha = int(round(coverage * 255))
    index = (y * width + x) * 4
    buf[index] = DOT[0]
    buf[index + 1] = DOT[1]
    buf[index + 2] = DOT[2]
    buf[index + 3] = alpha


def cover_disk(width: int, height: int, cx: float, cy: float, radius: float) -> bytes:
    buf = blank(width, height)
    step = 1.0 / SAMPLES
    radius2 = radius * radius
    for y in range(height):
        for x in range(width):
            hit = 0
            for sy in range(SAMPLES):
                py = y + (sy + 0.5) * step
                for sx in range(SAMPLES):
                    px = x + (sx + 0.5) * step
                    dx = px - cx
                    dy = py - cy
                    if dx * dx + dy * dy <= radius2:
                        hit += 1
            if hit:
                put(buf, width, x, y, hit / (SAMPLES * SAMPLES))
    return bytes(buf)


def sd_round_rect(px: float, py: float, cx: float, cy: float, half_w: float, half_h: float, radius: float) -> float:
    qx = abs(px - cx) - half_w + radius
    qy = abs(py - cy) - half_h + radius
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - radius


def cover_stroke(
    width: int,
    height: int,
    cx: float,
    cy: float,
    half_w: float,
    half_h: float,
    radius: float,
    stroke: float,
) -> bytes:
    buf = blank(width, height)
    step = 1.0 / SAMPLES
    half = stroke / 2
    for y in range(height):
        for x in range(width):
            hit = 0
            for sy in range(SAMPLES):
                py = y + (sy + 0.5) * step
                for sx in range(SAMPLES):
                    px = x + (sx + 0.5) * step
                    if abs(sd_round_rect(px, py, cx, cy, half_w, half_h, radius)) <= half:
                        hit += 1
            if hit:
                put(buf, width, x, y, hit / (SAMPLES * SAMPLES))
    return bytes(buf)


def render_images(mark: dict[str, float]) -> dict[str, tuple[int, int, bytes]]:
    scale = MARK / 64.0
    images: dict[str, tuple[int, int, bytes]] = {}
    ring = cover_stroke(
        MARK,
        MARK,
        mark["cx"] * scale,
        mark["cy"] * scale,
        mark["width"] * scale / 2,
        mark["height"] * scale / 2,
        mark["rx"] * scale,
        mark["stroke"] * scale,
    )
    images["mark-ring.png"] = (MARK, MARK, ring)
    for index in range(DOT_FRAMES):
        blend = index / (DOT_FRAMES - 1)
        factor = SCALE_MIN + (SCALE_MAX - SCALE_MIN) * blend
        dot = cover_disk(MARK, MARK, mark["cx"] * scale, mark["cy"] * scale, mark["r"] * scale * factor)
        images[f"dot-{index:02d}.png"] = (MARK, MARK, dot)
    images["entry.png"] = (280, 44, cover_stroke(280, 44, 140, 22, 138, 20, 10, 1.5))
    images["bullet.png"] = (8, 8, cover_disk(8, 8, 4, 4, 3.2))
    bar = blank(MARK, 2)
    for y in range(2):
        for x in range(MARK):
            put(bar, MARK, x, y, 1)
    images["bar.png"] = (MARK, 2, bytes(bar))
    return images


def write_images(directory: Path, images: dict[str, tuple[int, int, bytes]]) -> None:
    for name, (width, height, rgba) in images.items():
        write_png(directory / name, width, height, rgba)


def check(mark: dict[str, float]) -> None:
    images = render_images(mark)
    if len(list(IMAGES.glob("dot-*.png"))) != DOT_FRAMES:
        fail("dot frame count is not 24")
    for name, (width, height, rgba) in images.items():
        path = IMAGES / name
        if not path.is_file():
            fail(f"missing {path}. Re-run render_mark.py")
        fresh = path.with_suffix(".check.png")
        write_png(fresh, width, height, rgba)
        try:
            if fresh.read_bytes() != path.read_bytes():
                fail(f"{name} does not match a fresh render of icon-os.svg")
        finally:
            fresh.unlink(missing_ok=True)
    print("mark pngs match icon-os.svg")


def main(argv: list[str]) -> int:
    checking = False
    if argv == ["--check"]:
        checking = True
    elif argv:
        fail("usage: render_mark.py [--check]")
    mark = parse_mark(SVG)
    if checking:
        check(mark)
        return 0
    write_images(IMAGES, render_images(mark))
    print(f"wrote mark images in {IMAGES}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
