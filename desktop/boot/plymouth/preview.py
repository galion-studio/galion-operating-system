#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Render the Galion Plymouth theme to PNG frames and a GIF.

This does not boot a machine and it does not start a server. WSL does
not show Plymouth. The frames are how the splash can be seen anyway.
"""

from __future__ import annotations

import math
import struct
import sys
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
IMAGES = HERE / "images"
MARK = 192
DOT_FRAMES = 24
BREATH_S = 3.2
SETTLE_S = 1.6
BAR_GAP = 28

FONT = {
    " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
    "E": ["#####", "#....", "####.", "#....", "#....", "#....", "#####"],
    "a": [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
    "e": [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
    "h": ["#....", "#....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
    "n": [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
    "p": [".....", ".....", "#.##.", "#...#", "#.##.", "#....", "#...."],
    "r": [".....", ".....", "#.##.", "##...", "#....", "#....", "#...."],
    "s": [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
    "t": ["..#..", "..#..", "#####", "..#..", "..#..", "..#..", "...#."],
}


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def paeth(left: int, up: int, upper_left: int) -> int:
    estimate = left + up - upper_left
    da = abs(estimate - left)
    db = abs(estimate - up)
    dc = abs(estimate - upper_left)
    if da <= db and da <= dc:
        return left
    if db <= dc:
        return up
    return upper_left


def read_png(path: Path) -> tuple[int, int, bytes]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        fail(f"{path.name} is not a PNG")
    pos = 8
    width = height = 0
    idat = bytearray()
    while pos + 8 <= len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        tag = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if tag == b"IHDR":
            width, height, bit, color, _comp, _filt, inter = struct.unpack(">IIBBBBB", chunk)
            if bit != 8 or color != 6 or inter != 0:
                fail(f"{path.name} is not 8-bit RGBA")
        elif tag == b"IDAT":
            idat.extend(chunk)
        elif tag == b"IEND":
            break
    raw = zlib.decompress(bytes(idat))
    stride = width * 4
    out = bytearray(height * stride)
    src = 0
    previous = bytearray(stride)
    for y in range(height):
        kind = raw[src]
        src += 1
        row = bytearray(raw[src : src + stride])
        src += stride
        for i in range(stride):
            left = row[i - 4] if i >= 4 else 0
            up = previous[i]
            upper_left = previous[i - 4] if i >= 4 else 0
            if kind == 0:
                predictor = 0
            elif kind == 1:
                predictor = left
            elif kind == 2:
                predictor = up
            elif kind == 3:
                predictor = (left + up) // 2
            elif kind == 4:
                predictor = paeth(left, up, upper_left)
            else:
                fail(f"{path.name} has an unknown PNG filter")
            row[i] = (row[i] + predictor) & 255
        out[y * stride : (y + 1) * stride] = row
        previous = row
    return width, height, bytes(out)


def write_png_rgb(path: Path, width: int, height: int, rgb: bytes) -> None:
    if len(rgb) != width * height * 3:
        fail(f"frame {path.name} has the wrong size")

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + tag + payload + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)

    raw = bytearray()
    stride = width * 3
    for y in range(height):
        raw.append(0)
        raw.extend(rgb[y * stride : (y + 1) * stride])
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def lzw(indices: bytes) -> bytes:
    clear = 256
    end = 257
    size = 9
    next_code = 258
    table = {bytes([i]): i for i in range(256)}
    bits = 0
    count = 0
    packed = bytearray()

    def emit(code: int) -> None:
        nonlocal bits, count, size
        bits |= code << count
        count += size
        while count >= 8:
            packed.append(bits & 255)
            bits >>= 8
            count -= 8

    emit(clear)
    if not indices:
        emit(end)
    else:
        word = bytes([indices[0]])
        for value in indices[1:]:
            nxt = word + bytes([value])
            if nxt in table:
                word = nxt
                continue
            emit(table[word])
            if next_code < 4096:
                table[nxt] = next_code
                next_code += 1
                # The new width applies to the next code, once next_code
                # no longer fits in the current width.
                if next_code > (1 << size) and size < 12:
                    size += 1
            else:
                emit(clear)
                table = {bytes([i]): i for i in range(256)}
                size = 9
                next_code = 258
            word = bytes([value])
        emit(table[word])
        emit(end)
    if count:
        packed.append(bits & 255)
    blocks = bytearray([8])
    for offset in range(0, len(packed), 255):
        piece = packed[offset : offset + 255]
        blocks.append(len(piece))
        blocks.extend(piece)
    blocks.append(0)
    return bytes(blocks)


def write_gif(path: Path, frames: list[bytes], width: int, height: int, delay_cs: int) -> None:
    palette = bytearray()
    for index in range(256):
        palette.extend((index, index, index))
    header = bytearray(b"GIF89a")
    header.extend(struct.pack("<HHBBB", width, height, 0xF7, 0, 0))
    header.extend(palette)
    header.extend(b"\x21\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00")
    for frame in frames:
        indices = bytearray(width * height)
        for pixel in range(width * height):
            base = pixel * 3
            indices[pixel] = (frame[base] + frame[base + 1] + frame[base + 2]) // 3
        header.extend(b"\x21\xf9\x04\x04")
        header.extend(struct.pack("<H", delay_cs))
        header.extend(b"\x00\x00")
        header.extend(b"\x2c")
        header.extend(struct.pack("<HHHHB", 0, 0, width, height, 0))
        header.extend(lzw(bytes(indices)))
    header.extend(b"\x3b")
    path.write_bytes(header)


def blit(frame: bytearray, width: int, src: bytes, sw: int, sh: int, x: int, y: int, opacity: float) -> None:
    height = len(frame) // (width * 3)
    for sy in range(sh):
        dy = y + sy
        if dy < 0 or dy >= height:
            continue
        for sx in range(sw):
            dx = x + sx
            if dx < 0 or dx >= width:
                continue
            si = (sy * sw + sx) * 4
            alpha = src[si + 3] / 255 * opacity
            if alpha <= 0:
                continue
            di = (dy * width + dx) * 3
            for channel in range(3):
                frame[di + channel] = int(round(src[si + channel] * alpha))


def find_font() -> Path | None:
    candidates = (
        "/usr/share/fonts/truetype/macos/Inter-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    )
    for candidate in candidates:
        path = Path(candidate)
        if path.is_file():
            return path
    return None


def draw_text(frame: bytearray, width: int, text: str, x: int, y: int, scale: int) -> None:
    cursor = x
    for char in text:
        rows = FONT.get(char)
        if rows is None:
            fail(f"preview font has no glyph for {char!r}")
        for row_index, row in enumerate(rows):
            for col, bit in enumerate(row):
                if bit != "#":
                    continue
                for sy in range(scale):
                    for sx in range(scale):
                        px = cursor + col * scale + sx
                        py = y + row_index * scale + sy
                        if px < 0 or py < 0 or px >= width:
                            continue
                        di = (py * width + px) * 3
                        if di + 3 > len(frame):
                            continue
                        frame[di] = 0xF5
                        frame[di + 1] = 0xF5
                        frame[di + 2] = 0xF7
        cursor += 6 * scale


def draw_label(frame: bytearray, width: int, text: str, center_x: int, top: int) -> None:
    font_path = find_font()
    if font_path is not None:
        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            font_path = None
    if font_path is not None:
        font = ImageFont.truetype(str(font_path), 18)
        probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        box = probe.textbbox((0, 0), text, font=font)
        text_w = box[2] - box[0]
        text_h = box[3] - box[1]
        image = Image.new("RGB", (text_w + 2, text_h + 2), (0, 0, 0))
        ImageDraw.Draw(image).text((-box[0], -box[1]), text, font=font, fill=(0xF5, 0xF5, 0xF7))
        pixels = image.load()
        origin_x = center_x - image.width // 2
        height = len(frame) // (width * 3)
        for py in range(image.height):
            for px in range(image.width):
                red, green, blue = pixels[px, py]
                if red + green + blue < 24:
                    continue
                dx = origin_x + px
                dy = top + py
                if dx < 0 or dy < 0 or dx >= width or dy >= height:
                    continue
                di = (dy * width + dx) * 3
                frame[di] = red
                frame[di + 1] = green
                frame[di + 2] = blue
        return
    label_w = len(text) * 6 * 2
    draw_text(frame, width, text, center_x - label_w // 2, top, 2)


def load_assets() -> dict[str, tuple[int, int, bytes]]:
    names = ["mark-ring.png", "entry.png", "bullet.png"]
    names.extend(f"dot-{index:02d}.png" for index in range(DOT_FRAMES))
    assets: dict[str, tuple[int, int, bytes]] = {}
    for name in names:
        path = IMAGES / name
        if not path.is_file():
            fail(f"missing {path}. Run render_mark.py first")
        assets[name] = read_png(path)
    return assets


def dot_index(eased: float) -> int:
    index = math.floor(eased * (DOT_FRAMES - 1) + 0.001)
    if index < 0:
        return 0
    if index > DOT_FRAMES - 1:
        return DOT_FRAMES - 1
    return index


def compose(
    assets: dict[str, tuple[int, int, bytes]],
    width: int,
    height: int,
    eased: float,
    opacity: float,
    progress: float,
    password: bool,
) -> bytes:
    frame = bytearray(width * height * 3)
    ring_w, ring_h, ring = assets["mark-ring.png"]
    mark_x = (width - ring_w) // 2
    mark_y = (height - ring_h) // 2 - 36
    blit(frame, width, ring, ring_w, ring_h, mark_x, mark_y, 1)
    dot_name = f"dot-{dot_index(eased):02d}.png"
    dot_w, dot_h, dot = assets[dot_name]
    blit(frame, width, dot, dot_w, dot_h, mark_x, mark_y, opacity)
    if password:
        entry_w, entry_h, entry = assets["entry.png"]
        entry_x = (width - entry_w) // 2
        entry_y = mark_y + ring_h + 36
        blit(frame, width, entry, entry_w, entry_h, entry_x, entry_y, 1)
        bullet_w, bullet_h, bullet = assets["bullet.png"]
        count = 4
        gap = 10
        row = count * bullet_w + (count - 1) * gap
        bx = (width - row) // 2
        by = entry_y + (entry_h - bullet_h) // 2
        for _ in range(count):
            blit(frame, width, bullet, bullet_w, bullet_h, bx, by, 1)
            bx += bullet_w + gap
        draw_label(frame, width, "Enter passphrase", width // 2, entry_y - 28)
        return bytes(frame)
    bar_y = mark_y + ring_h + BAR_GAP
    fill_w = int(round(progress * MARK))
    for y in range(bar_y, bar_y + 2):
        if y < 0 or y >= height:
            continue
        for x in range(mark_x, mark_x + MARK):
            if x < 0 or x >= width:
                continue
            di = (y * width + x) * 3
            if x < mark_x + fill_w:
                frame[di] = 0xF5
                frame[di + 1] = 0xF5
                frame[di + 2] = 0xF7
            else:
                frame[di] = 0x2C
                frame[di + 1] = 0x2C
                frame[di + 2] = 0x33
    return bytes(frame)


def boot_eased(frame: int, count: int) -> tuple[float, float, float]:
    phase = frame / count
    breath = 0.5 - 0.5 * math.cos(2 * math.pi * phase)
    opacity = 0.78 + 0.22 * breath
    return breath, opacity, phase


def settle_eased(frame: int, count: int, reboot: bool) -> tuple[float, float, float]:
    if count <= 1:
        eased = 0.0
    else:
        eased = 1 - (frame / (count - 1))
    if reboot:
        opacity = 0.90 + 0.10 * eased
    else:
        opacity = 0.72 + 0.28 * eased
    progress = eased
    return eased, opacity, progress


def render(output: Path, width: int, height: int, boot_frames: int, settle_frames: int) -> None:
    assets = load_assets()
    output.mkdir(parents=True, exist_ok=True)
    boot: list[bytes] = []
    for index in range(boot_frames):
        eased, opacity, progress = boot_eased(index, boot_frames)
        frame = compose(assets, width, height, eased, opacity, progress, False)
        write_png_rgb(output / f"boot-{index:03d}.png", width, height, frame)
        boot.append(frame)
    delay = max(2, int(round(BREATH_S * 100 / boot_frames)))
    write_gif(output / "boot.gif", boot, width, height, delay)
    shutdown: list[bytes] = []
    reboot: list[bytes] = []
    for index in range(settle_frames):
        eased, opacity, progress = settle_eased(index, settle_frames, False)
        frame = compose(assets, width, height, eased, opacity, progress, False)
        write_png_rgb(output / f"shutdown-{index:03d}.png", width, height, frame)
        shutdown.append(frame)
        eased, opacity, progress = settle_eased(index, settle_frames, True)
        reboot_frame = compose(assets, width, height, eased, opacity, progress, False)
        write_png_rgb(output / f"reboot-{index:03d}.png", width, height, reboot_frame)
        reboot.append(reboot_frame)
    settle_delay = max(2, int(round(SETTLE_S * 100 / settle_frames)))
    write_gif(output / "shutdown.gif", shutdown, width, height, settle_delay)
    write_gif(output / "reboot.gif", reboot, width, height, settle_delay)
    password = compose(assets, width, height, 0.35, 1, 0, True)
    write_png_rgb(output / "password.png", width, height, password)
    print(f"wrote preview frames in {output}")


def main(argv: list[str]) -> int:
    output: Path | None = None
    width = 1280
    height = 720
    boot_frames = 32
    settle_frames = 16
    index = 0
    while index < len(argv):
        arg = argv[index]
        if arg == "--output":
            index += 1
            if index >= len(argv):
                fail("--output needs a directory")
            output = Path(argv[index])
        elif arg == "--width":
            index += 1
            width = int(argv[index])
        elif arg == "--height":
            index += 1
            height = int(argv[index])
        elif arg == "--boot-frames":
            index += 1
            boot_frames = int(argv[index])
        elif arg == "--settle-frames":
            index += 1
            settle_frames = int(argv[index])
        else:
            fail(f"unknown argument: {arg}")
        index += 1
    if output is None:
        fail("pass --output DIR")
    if width < 320 or height < 240 or boot_frames < 2 or settle_frames < 2:
        fail("preview size or frame count is too small")
    render(output, width, height, boot_frames, settle_frames)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
