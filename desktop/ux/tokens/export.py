#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2026 Galion Labs
"""Write the CSS, GTK, JS, and cursor files from tokens.json.

The JSON file is the source. This script does not fetch a font, a host,
or a recording. Run it from the repository root or from anywhere:

    python3 desktop/ux/tokens/export.py
    python3 desktop/ux/tokens/export.py --check
"""

from __future__ import annotations

import json
import math
import struct
import sys
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
UX = HERE.parent
ROOT = UX.parent.parent
JSON_PATH = HERE / "tokens.json"

GENERATED = "Generated from tokens.json by export.py. Do not edit."


def load() -> dict:
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))


def px(value: float) -> str:
    if float(value).is_integer():
        return f"{int(value)}px"
    return f"{value}px"


def tokens_css(data: dict) -> str:
    voice = data["color"]["voice"]
    om = data["color"]["openMind"]
    type_ = data["type"]
    scale = type_["scale"]
    space = data["space"]
    radius = data["radius"]
    motion = data["motion"]
    lines = [
        f"/* {GENERATED}",
        "   Voice ground and the Open Mind console share one family.",
        "   The OS surface keeps #0A0A0C. The console keeps #0B0F14.",
        "   This file does not fetch a font. */",
        "",
        ":root {",
        "  /* Galion OS, the voice ground */",
        f"  --galion-obsidian: {voice['obsidian']};",
        f"  --galion-panel: {voice['panel']};",
        f"  --galion-hairline: {voice['hairline']};",
        f"  --galion-dot: {voice['dot']};",
        f"  --galion-amber: {voice['amber']};",
        f"  --galion-violet: {voice['violet']};",
        f"  --galion-heather: {voice['heather']};",
        f"  --galion-mist: {voice['mist']};",
        f"  --galion-text: {voice['text']};",
        "",
        "  /* Obsidian Open Mind, the same names as brand/tokens.css */",
        f"  --om-obsidian: {om['obsidian']};",
        f"  --om-ink: {om['ink']};",
        f"  --om-surface: {om['surface']};",
        f"  --om-glass: {om['glass']};",
        f"  --om-line: {om['line']};",
        f"  --om-slate: {om['slate']};",
        f"  --om-mist: {om['mist']};",
        f"  --om-text: {om['text']};",
        f"  --om-sky: {om['sky']};",
        f"  --om-ice: {om['ice']};",
        f"  --om-ocean: {om['ocean']};",
        f"  --om-paper: {om['paper']};",
        f"  --om-muted-paper: {om['mutedPaper']};",
        "",
        "  --om-bg: var(--om-ink);",
        "  --om-bg-deep: var(--om-obsidian);",
        "  --om-panel: var(--om-surface);",
        "  --om-fg: var(--om-text);",
        "  --om-fg-muted: var(--om-mist);",
        "  --om-accent: var(--om-sky);",
        "  --om-accent-fg: var(--om-ink);",
        "  --om-border: var(--om-line);",
        "  --om-focus: var(--om-sky);",
        "  color-scheme: dark;",
        "",
        "  /* type */",
        f"  --galion-font-display: {type_['display']['stack']};",
        f"  --galion-font-sans: {type_['sans']['stack']};",
        f"  --galion-font-mono: {type_['mono']['stack']};",
        f"  --galion-size-label: {px(scale['label'])};",
        f"  --galion-size-meta: {px(scale['meta'])};",
        f"  --galion-size-body: {px(scale['body'])};",
        f"  --galion-size-title: {px(scale['title'])};",
        f"  --galion-size-heading: {px(scale['heading'])};",
        f"  --galion-size-display: {px(scale['displayMin'])};",
        f"  --galion-leading: {type_['leading']['ui']};",
        f"  --galion-tracking-display: {type_['tracking']['display']};",
        f"  --galion-tracking-byline: {type_['tracking']['byline']};",
        "",
        "  /* space, the console steps */",
        f"  --galion-space-2: {px(space['2'])};",
        f"  --galion-space-3: {px(space['3'])};",
        f"  --galion-space-4: {px(space['4'])};",
        f"  --galion-space-5: {px(space['5'])};",
        f"  --galion-space-6: {px(space['6'])};",
        "",
        "  /* shape. icon is the Galion OS mark: rx 10 on a 44px square */",
        f"  --galion-radius-sm: {px(radius['sm'])};",
        f"  --galion-radius-md: {px(radius['md'])};",
        f"  --galion-radius-card: {px(radius['card'])};",
        f"  --galion-radius-pill: {px(radius['pill'])};",
        f"  --galion-radius-icon: {radius['icon']};",
        "",
        "  /* motion */",
        f"  --galion-wake-duration: {motion['wake']['ms']}ms;",
        f"  --galion-wake-easing: {motion['wake']['easing']};",
        f"  --galion-color-duration: {motion['color']['ms']}ms;",
        f"  --galion-color-easing: {motion['color']['easing']};",
        f"  --galion-breath-duration: {motion['breath']['ms']}ms;",
        f"  --galion-breath-easing: {motion['breath']['easing']};",
        f"  --galion-pulse-duration: {motion['pulse']['css']};",
        f"  --galion-pulse-easing: {motion['pulse']['easing']};",
        "}",
        "",
        "@media (prefers-color-scheme: light) {",
        "  :root {",
        "    --om-bg: var(--om-paper);",
        "    --om-bg-deep: var(--om-paper);",
        f"    --om-panel: {om['panelLight']};",
        "    --om-fg: var(--om-ink);",
        "    --om-fg-muted: var(--om-muted-paper);",
        "    --om-accent: var(--om-ocean);",
        f"    --om-accent-fg: {om['onAccent']};",
        f"    --om-border: {om['lineLight']};",
        "    --om-focus: var(--om-ocean);",
        "    color-scheme: light;",
        "  }",
        "}",
        "",
    ]
    return "\n".join(lines)


def gtk_css(data: dict) -> str:
    om = data["color"]["openMind"]
    voice = data["color"]["voice"]
    motion = data["motion"]
    radius = data["radius"]
    sans = data["type"]["sans"]["stack"]
    return f"""/* {GENERATED}
   GTK export of the Open Mind console colours.
   Focus on dark is sky. Focus on light is ocean.
   Violet is a wash on the OS surface and is not an error colour.
   The {motion['breath']['ms']}ms breath stays on the presence dot.
   Controls use the {motion['color']['ms']}ms console rise. */

@define-color theme_bg_color {om['ink']};
@define-color theme_fg_color {om['text']};
@define-color theme_base_color {om['surface']};
@define-color theme_text_color {om['text']};
@define-color theme_selected_bg_color {om['sky']};
@define-color theme_selected_fg_color {om['ink']};
@define-color theme_unfocused_fg_color {om['mist']};
@define-color borders {om['line']};
@define-color warning_color {voice['amber']};
@define-color error_color {om['text']};
@define-color galion_dot {voice['dot']};
@define-color galion_obsidian {voice['obsidian']};

* {{
  font-family: {sans};
}}

window,
.background {{
  background-color: @theme_bg_color;
  color: @theme_fg_color;
}}

headerbar,
.titlebar,
.toolbar {{
  background-color: @theme_base_color;
  color: @theme_fg_color;
  border-bottom: 1px solid @borders;
}}

button,
entry,
.entry {{
  border-radius: {radius['md']}px;
  border: 1px solid @borders;
  background-color: @theme_base_color;
  color: @theme_fg_color;
  padding: 8px 16px;
  transition: background-color {motion['color']['ms']}ms {motion['color']['easing']},
    color {motion['color']['ms']}ms {motion['color']['easing']},
    border-color {motion['color']['ms']}ms {motion['color']['easing']};
}}

button:hover {{
  border-color: @theme_selected_bg_color;
}}

entry:focus,
button:focus {{
  border-color: @theme_selected_bg_color;
  outline: none;
}}

selection,
:selected {{
  background-color: @theme_selected_bg_color;
  color: @theme_selected_fg_color;
}}

menu,
popover,
tooltip {{
  background-color: @theme_base_color;
  color: @theme_fg_color;
  border: 1px solid @borders;
  border-radius: {radius['sm']}px;
}}

scrollbar trough {{
  background-color: {om['obsidian']};
}}

scrollbar slider {{
  background-color: {om['glass']};
  border-radius: {radius['pill']}px;
  min-width: 6px;
  min-height: 6px;
}}

@media (prefers-color-scheme: light) {{
  @define-color theme_bg_color {om['paper']};
  @define-color theme_fg_color {om['ink']};
  @define-color theme_base_color {om['panelLight']};
  @define-color theme_text_color {om['ink']};
  @define-color theme_selected_bg_color {om['ocean']};
  @define-color theme_selected_fg_color {om['onAccent']};
  @define-color theme_unfocused_fg_color {om['mutedPaper']};
  @define-color borders {om['lineLight']};
}}

@media (prefers-reduced-motion: reduce) {{
  * {{
    animation: none;
    transition: none;
  }}
}}
"""


def tokens_js(data: dict) -> str:
    body = json.dumps(data, indent=2, ensure_ascii=False)
    return f"/* {GENERATED} */\nwindow.GALION_TOKENS = {body};\n"


def session_env(data: dict) -> str:
    sound = data["sound"]
    session = data["session"]
    wake = next(tone for tone in sound["tones"] if tone["id"] == "wake")
    hz = sound["referenceHz"] * wake["num"] // wake["den"]
    lines = [
        f"# {GENERATED}",
        f"GALION_DESKTOP_URL={session['desktop']}",
        f"GALION_ONE_URL={session['one']}",
        f"GALION_RESEARCH_URL={session['research']}",
        f"GALION_WAKE_TONE_PATH={session['wakeTonePath']}",
        f"GALION_WAKE_ANIMATION_PATH={session['wakeAnimationPath']}",
        f"GALION_WAKE_HZ={hz}",
        f"GALION_WAKE_MS={wake['ms']}",
        f"GALION_WAKE_AMPLITUDE={sound['amplitude']}",
        f"GALION_WAKE_FADE_MS={sound['fadeMs']}",
        f"GALION_WAKE_RATE={sound['sampleRate']}",
        "",
    ]
    return "\n".join(lines)


def _png(width: int, height: int, rgba: bytes) -> bytes:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def _hex(value: str) -> tuple[int, int, int]:
    text = value.removeprefix("#")
    return int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16)


def wallpaper_svg(data: dict) -> str:
    voice = data["color"]["voice"]
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!-- {GENERATED} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" role="img" aria-labelledby="title">
  <title id="title">Galion</title>
  <rect width="1920" height="1080" fill="{voice['obsidian']}"/>
  <defs>
    <radialGradient id="amber" cx="12%" cy="0%" r="42%">
      <stop offset="0%" stop-color="{voice['amber']}" stop-opacity="0.16"/>
      <stop offset="58%" stop-color="{voice['amber']}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="violet" cx="100%" cy="0%" r="36%">
      <stop offset="0%" stop-color="{voice['violet']}" stop-opacity="0.20"/>
      <stop offset="52%" stop-color="{voice['violet']}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#amber)"/>
  <rect width="1920" height="1080" fill="url(#violet)"/>
  <circle cx="960" cy="540" r="18" fill="{voice['dot']}"/>
</svg>
"""


def wallpaper_png(data: dict) -> bytes:
    voice = data["color"]["voice"]
    width, height = 1920, 1080
    bg = _hex(voice["obsidian"])
    amber = _hex(voice["amber"])
    violet = _hex(voice["violet"])
    dot = _hex(voice["dot"])
    pixels = bytearray(width * height * 4)
    cx, cy, radius = 960, 540, 18
    for y in range(height):
        row = y * width * 4
        ny = y / height
        for x in range(width):
            nx = x / width
            # Elliptical washes. Amber sits high on the left. Violet sits on the top right.
            adx = (nx - 0.12) / 0.36
            ady = (ny - 0.0) / 0.24
            amber_t = max(0.0, 1.0 - (adx * adx + ady * ady))
            amber_a = 0.16 * amber_t * amber_t
            vdx = (nx - 1.0) / 0.28
            vdy = (ny - 0.0) / 0.21
            violet_t = max(0.0, 1.0 - (vdx * vdx + vdy * vdy))
            violet_a = 0.20 * violet_t * violet_t
            r, g, b = bg
            r = r * (1 - amber_a) + amber[0] * amber_a
            g = g * (1 - amber_a) + amber[1] * amber_a
            b = b * (1 - amber_a) + amber[2] * amber_a
            r = r * (1 - violet_a) + violet[0] * violet_a
            g = g * (1 - violet_a) + violet[1] * violet_a
            b = b * (1 - violet_a) + violet[2] * violet_a
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= radius:
                cover = 1.0 if dist <= radius - 1 else radius - dist
                r = r * (1 - cover) + dot[0] * cover
                g = g * (1 - cover) + dot[1] * cover
                b = b * (1 - cover) + dot[2] * cover
            off = row + x * 4
            pixels[off] = int(r)
            pixels[off + 1] = int(g)
            pixels[off + 2] = int(b)
            pixels[off + 3] = 255
    return _png(width, height, bytes(pixels))


def _argb(color: tuple[int, int, int, int]) -> int:
    r, g, b, a = color
    return (a << 24) | (r << 16) | (g << 8) | b


def _mask_image(mask: set[tuple[int, int]], size: int, fill: tuple[int, int, int], outline: tuple[int, int, int], hot: tuple[int, int]) -> tuple:
    pixels: dict[tuple[int, int], tuple[int, int, int, int]] = {}
    for x, y in mask:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                px, py = x + dx, y + dy
                if 0 <= px < size and 0 <= py < size:
                    pixels[(px, py)] = (*outline, 255)
    for x, y in mask:
        pixels[(x, y)] = (*fill, 255)
    argb = []
    for y in range(size):
        for x in range(size):
            argb.append(_argb(pixels.get((x, y), (0, 0, 0, 0))))
    return size, size, hot[0], hot[1], argb


def _scale_mask(mask: set[tuple[int, int]], src: int, dest: int) -> set[tuple[int, int]]:
    out: set[tuple[int, int]] = set()
    for y in range(dest):
        sy = min(src - 1, y * src // dest)
        for x in range(dest):
            sx = min(src - 1, x * src // dest)
            if (sx, sy) in mask:
                out.add((x, y))
    return out


def _arrow_mask() -> set[tuple[int, int]]:
    # A 16px pointer, drawn at 2x so the 32px image stays crisp.
    shape = (
        "#...............",
        "##..............",
        "#.#.............",
        "#..#............",
        "#...#...........",
        "#....#..........",
        "#.....#.........",
        "#......#........",
        "#.......#.......",
        "#....#####......",
        "#...#...........",
        "#..#............",
        "#.#.............",
        "##..............",
        "#...............",
        "................",
    )
    mask: set[tuple[int, int]] = set()
    for y, row in enumerate(shape):
        for x, cell in enumerate(row):
            if cell != "#":
                continue
            for dy in (0, 1):
                for dx in (0, 1):
                    mask.add((x * 2 + dx, y * 2 + dy))
    return mask


def _beam_mask() -> set[tuple[int, int]]:
    mask: set[tuple[int, int]] = set()
    for y in range(6, 26):
        mask.add((15, y))
        mask.add((16, y))
    for x in range(10, 22):
        mask.add((x, 6))
        mask.add((x, 7))
        mask.add((x, 24))
        mask.add((x, 25))
    return mask


def _dot_mask() -> set[tuple[int, int]]:
    mask: set[tuple[int, int]] = set()
    for y in range(32):
        for x in range(32):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 25:
                mask.add((x, y))
    return mask


def _cross_mask() -> set[tuple[int, int]]:
    mask: set[tuple[int, int]] = set()
    for i in range(8, 24):
        mask.add((15, i))
        mask.add((16, i))
        mask.add((i, 15))
        mask.add((i, 16))
    return mask


def cursor_files(data: dict) -> dict[str, bytes]:
    voice = data["color"]["voice"]
    fill = _hex(voice["dot"])
    outline = _hex(voice["obsidian"])
    specs = {
        "left_ptr": (_arrow_mask(), (1, 1)),
        "xterm": (_beam_mask(), (16, 16)),
        "hand2": (_dot_mask(), (8, 8)),
        "crosshair": (_cross_mask(), (16, 16)),
    }
    files: dict[str, bytes] = {}
    for name, (base_mask, base_hot) in specs.items():
        images = []
        for size in (24, 32, 48):
            mask = base_mask if size == 32 else _scale_mask(base_mask, 32, size)
            hot = (base_hot[0] * size // 32, base_hot[1] * size // 32)
            nominal, width, height, xhot, yhot, argb = (
                size,
                *_mask_image(mask, size, fill, outline, hot),
            )
            images.append((nominal, width, height, xhot, yhot, argb))
        files[name] = _xcursor(images)
    return files


def _xcursor(images: list[tuple]) -> bytes:
    ntoc = len(images)
    position = 16 + 12 * ntoc
    tocs = []
    chunks = []
    for nominal, width, height, xhot, yhot, argb in images:
        chunk = struct.pack("<IIIIIII", 1, nominal, width, height, xhot, yhot, 0)
        chunk += b"".join(struct.pack("<I", pixel) for pixel in argb)
        tocs.append(struct.pack("<III", 0xFFFD0002, nominal, position))
        chunks.append(chunk)
        position += len(chunk)
    header = struct.pack("<IIII", 0x72756358, 16, 0x00010000, ntoc)
    return header + b"".join(tocs) + b"".join(chunks)


def outputs(data: dict) -> dict[Path, bytes | str]:
    gtk = gtk_css(data)
    files: dict[Path, bytes | str] = {
        HERE / "tokens.css": tokens_css(data),
        HERE / "tokens.js": tokens_js(data),
        HERE / "gtk.css": gtk,
        HERE / "session.env": session_env(data),
        UX / "gtk" / "Galion" / "gtk-3.0" / "gtk.css": gtk,
        UX / "gtk" / "Galion" / "gtk-4.0" / "gtk.css": gtk,
        UX / "wallpaper" / "galion-wallpaper.svg": wallpaper_svg(data),
        UX / "wallpaper" / "galion-wallpaper.png": wallpaper_png(data),
    }
    for name, blob in cursor_files(data).items():
        files[UX / "icons" / "Galion" / "cursors" / name] = blob
    return files


def write_all(data: dict) -> None:
    for path, content in outputs(data).items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, str):
            path.write_text(content, encoding="utf-8")
        else:
            path.write_bytes(content)


def check(data: dict) -> int:
    mismatches = []
    for path, content in outputs(data).items():
        if not path.is_file():
            mismatches.append(f"missing {path.relative_to(ROOT)}")
            continue
        current = path.read_text(encoding="utf-8") if isinstance(content, str) else path.read_bytes()
        if current != content:
            mismatches.append(f"stale {path.relative_to(ROOT)}")
    if mismatches:
        print("\n".join(mismatches), file=sys.stderr)
        print("run: python3 desktop/ux/tokens/export.py", file=sys.stderr)
        return 1
    print("tokens export matches")
    return 0


def main(argv: list[str]) -> int:
    if argv[1:] not in ([], ["--check"]):
        print("refused: pass nothing, or --check", file=sys.stderr)
        return 2
    data = load()
    if argv[1:] == ["--check"]:
        return check(data)
    write_all(data)
    print("tokens export wrote")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
