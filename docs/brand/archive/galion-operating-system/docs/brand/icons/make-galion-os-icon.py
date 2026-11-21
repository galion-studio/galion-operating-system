#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
"""Build an iOS-style Galion OS app icon from the official icon-os.svg mark.
Outputs a 1024 PNG master and a multi-size ICO. Default output is this
script's directory (docs/brand/icons). Override with GALION_ROOT or
GALION_ICON_OUT. Temporary files stay under GALION_ICON_TMP or GALION_ROOT/tmp/icon.
"""
from pathlib import Path
from math import pi
from PIL import Image, ImageDraw, ImageFilter

import os
HERE = Path(__file__).resolve().parent
# Default: write next to this script (docs/brand/icons in the repo).
# Override with GALION_ICON_OUT, or GALION_ROOT/assets when that is set.
_root = os.environ.get("GALION_ROOT", "")
_out = os.environ.get("GALION_ICON_OUT", "")
if _out:
    OUT_DIR = Path(_out)
elif _root:
    OUT_DIR = Path(_root) / "assets"
else:
    OUT_DIR = HERE
_tmp = os.environ.get("GALION_ICON_TMP", "")
if _tmp:
    TMP = Path(_tmp)
elif _root:
    TMP = Path(_root) / "tmp" / "icon"
else:
    TMP = HERE / "tmp"
MASTER = OUT_DIR / "galion-os-icon-1024.png"
ICO = OUT_DIR / "galion-os.ico"
SIZES = (16, 24, 32, 48, 64, 128, 256)
MASTER_SIZE = 1024

# Brand colours from galion-operating-system site/assets/tokens.css
INK = (11, 15, 20, 255)        # --om-ink #0B0F14
OBSIDIAN = (5, 7, 10, 255)     # --om-obsidian #05070A
SURFACE = (19, 26, 34, 255)    # --om-surface #131A22
MARK = (245, 245, 247, 255)    # official icon-os.svg #F5F5F7

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))

def squircle_mask(size, radius_frac=0.22):
    """Continuous rounded square: iOS-like corner radius ~22% of side."""
    img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(img)
    r = int(round(size * radius_frac))
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=255)
    return img

def gradient(size, top, bottom):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        c = lerp(top, bottom, y / max(size - 1, 1))
        for x in range(size):
            px[x, y] = c
    return img

def draw_official_mark(draw, box, color, width_frac=1.75 / 64.0):
    """Recreate docs/brand/marks/icon-os.svg: rounded-rect outline + centre dot."""
    x0, y0, x1, y1 = box
    side = x1 - x0
    # Official viewBox 0 0 64 64: rect 10,10 44x44 rx=10, circle r=6 at 32,32
    def m(v):
        return x0 + side * (v / 64.0)
    stroke = max(1, int(round(side * width_frac)))
    rx = side * (10 / 64.0)
    draw.rounded_rectangle((m(10), m(10), m(54), m(54)), radius=rx, outline=color, width=stroke)
    cr = side * (6 / 64.0)
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    draw.ellipse((cx - cr, cy - cr, cx + cr, cy + cr), fill=color)

def build_master():
    # Leave a little transparent padding so a soft shadow can sit outside the squircle.
    pad = int(MASTER_SIZE * 0.06)
    inner = MASTER_SIZE - 2 * pad
    canvas = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))

    face = gradient(inner, SURFACE, OBSIDIAN)
    mask = squircle_mask(inner, 0.22)
    squircle = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    squircle.paste(face, (0, 0))
    squircle.putalpha(mask)

    # Soft drop shadow of the squircle, still inside the 1024 canvas.
    shadow = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    sh = Image.new("L", (inner, inner), 0)
    sh.paste(mask, (0, 0))
    sh = sh.point(lambda p: int(p * 0.45))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=max(2, pad * 0.45)))
    shadow_col = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    shadow_layer = Image.new("RGBA", (inner, inner), (0, 0, 0, 255))
    shadow_layer.putalpha(sh)
    # Offset slightly down
    off = max(1, pad // 6)
    shadow.paste(shadow_layer, (pad, pad + off), shadow_layer)

    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(squircle, (pad, pad), squircle)

    # Official mark, centred, inset so it sits inside the squircle.
    mark_layer = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(mark_layer)
    inset = pad + int(inner * 0.14)
    draw_official_mark(draw, (inset, inset, MASTER_SIZE - inset, MASTER_SIZE - inset), MARK)
    canvas = Image.alpha_composite(canvas, mark_layer)
    return canvas

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    master = build_master()
    master.save(MASTER, "PNG")
    icons = []
    for s in SIZES:
        im = master.resize((s, s), Image.Resampling.LANCZOS)
        path = TMP / ("galion-os-%d.png" % s)
        im.save(path, "PNG")
        icons.append(im)
    # ICO: first image plus the rest
    write_ico(ICO, icons)
    print("WROTE", MASTER, MASTER.stat().st_size)
    print("WROTE", ICO, ICO.stat().st_size)

def write_ico(path, images):
    """Write a multi-size ICO. Each entry is a PNG (supported by Windows Vista+)."""
    import io, struct
    blobs = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        blobs.append((im.size[0], im.size[1], buf.getvalue()))
    count = len(blobs)
    offset = 6 + 16 * count
    out = bytearray()
    out += struct.pack("<HHH", 0, 1, count)
    for w, h, data in blobs:
        # 0 means 256 in the width/height bytes
        wb = 0 if w >= 256 else w
        hb = 0 if h >= 256 else h
        out += struct.pack("<BBBBHHII", wb, hb, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    for _, _, data in blobs:
        out += data
    path.write_bytes(out)


if __name__ == "__main__":
    main()
