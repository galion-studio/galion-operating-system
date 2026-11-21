#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Plymouth light field for the cinematic frames.

The curtain formula is the GLSL in vendor/coaurora/src/shaders.js
(Copyright (c) 2026 Arseniy Seroka, MIT). The shimmer is a transcription of
vendor/webgl-noise/noise2D.glsl (Copyright (C) 2011 Ashima Arts, Copyright
(C) 2011-2016 Stefan Gustavson, MIT). Upstream files are not rewritten here.
"""

from __future__ import annotations

import math


def mod289(x: float) -> float:
    return x - math.floor(x * (1.0 / 289.0)) * 289.0


def permute(x: float) -> float:
    return mod289((x * 34.0 + 10.0) * x)


def snoise(xin: float, yin: float) -> float:
    """2D simplex noise. The same steps as noise2D.glsl and snoise.mjs."""
    cx = 0.211324865405187
    cy = 0.366025403784439
    cz = -0.577350269189626
    cw = 0.024390243902439
    s = (xin + yin) * cy
    i = math.floor(xin + s)
    j = math.floor(yin + s)
    t = (i + j) * cx
    x0x = xin - i + t
    x0y = yin - j + t
    i1 = 1.0 if x0x > x0y else 0.0
    j1 = 0.0 if x0x > x0y else 1.0
    x12x = x0x + cx - i1
    x12y = x0y + cx - j1
    x12z = x0x + cz
    x12w = x0y + cz
    ii = mod289(i)
    jj = mod289(j)
    p0 = permute(permute(jj) + ii)
    p1 = permute(permute(jj + j1) + ii + i1)
    p2 = permute(permute(jj + 1.0) + ii + 1.0)
    m0 = max(0.5 - (x0x * x0x + x0y * x0y), 0.0)
    m1 = max(0.5 - (x12x * x12x + x12y * x12y), 0.0)
    m2 = max(0.5 - (x12z * x12z + x12w * x12w), 0.0)
    m0 *= m0
    m1 *= m1
    m2 *= m2
    m0 *= m0
    m1 *= m1
    m2 *= m2
    gx0 = 2.0 * (p0 * cw - math.floor(p0 * cw)) - 1.0
    gx1 = 2.0 * (p1 * cw - math.floor(p1 * cw)) - 1.0
    gx2 = 2.0 * (p2 * cw - math.floor(p2 * cw)) - 1.0
    h0 = abs(gx0) - 0.5
    h1 = abs(gx1) - 0.5
    h2 = abs(gx2) - 0.5
    a0 = gx0 - math.floor(gx0 + 0.5)
    a1 = gx1 - math.floor(gx1 + 0.5)
    a2 = gx2 - math.floor(gx2 + 0.5)
    m0 *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h0 * h0)
    m1 *= 1.79284291400159 - 0.85373472095314 * (a1 * a1 + h1 * h1)
    m2 *= 1.79284291400159 - 0.85373472095314 * (a2 * a2 + h2 * h2)
    g0 = a0 * x0x + h0 * x0y
    g1 = a1 * x12x + h1 * x12y
    g2 = a2 * x12z + h2 * x12w
    return 130.0 * (m0 * g0 + m1 * g1 + m2 * g2)


def field_time(t: float, spec: dict) -> float:
    """coaurora's clock is milliseconds * 0.0004 * speed. Ours is the sound."""
    return t * 0.4 * float(spec["speed"])


def wash_amount(t: float, state: dict, tl: dict) -> float:
    if t < float(tl["onset"]) - 0.004:
        return 0.0
    weights = tl["light"]["wash"]
    amount = (
        state["bloom"][0] * float(weights["bloom"])
        + state["glow"][0] * float(weights["glow"])
        + state["glass"][0] * float(weights["glass"])
        + state["mark"][0] * float(weights["mark"])
    )
    return max(0.0, min(1.0, amount))


def _hash(n: float) -> float:
    value = math.sin(n * 127.1 + 311.7) * 43758.5453
    return value - math.floor(value)


def _hsl(h, s, l):
    import numpy as np

    def channel(offset):
        x = np.mod(h * 6.0 + offset, 6.0)
        return np.clip(np.abs(x - 3.0) - 1.0, 0.0, 1.0)

    span = 1.0 - np.abs(2.0 * l - 1.0)
    return (
        l + s * (channel(0.0) - 0.5) * span,
        l + s * (channel(4.0) - 0.5) * span,
        l + s * (channel(2.0) - 0.5) * span,
    )


def _snoise_grid(x, y):
    import numpy as np

    cx = np.float64(0.211324865405187)
    cy = np.float64(0.366025403784439)
    cz = np.float64(-0.577350269189626)
    cw = np.float64(0.024390243902439)
    spread = (x + y) * cy
    i = np.floor(x + spread)
    j = np.floor(y + spread)
    t = (i + j) * cx
    x0x = x - i + t
    x0y = y - j + t
    i1 = np.where(x0x > x0y, 1.0, 0.0)
    j1 = np.where(x0x > x0y, 0.0, 1.0)
    x12x = x0x + cx - i1
    x12y = x0y + cx - j1
    x12z = x0x + cz
    x12w = x0y + cz

    def mod(v):
        return v - np.floor(v * (1.0 / 289.0)) * 289.0

    def perm(v):
        return mod((v * 34.0 + 10.0) * v)

    ii = mod(i)
    jj = mod(j)
    p0 = perm(perm(jj) + ii)
    p1 = perm(perm(jj + j1) + ii + i1)
    p2 = perm(perm(jj + 1.0) + ii + 1.0)
    m0 = np.maximum(0.5 - (x0x * x0x + x0y * x0y), 0.0)
    m1 = np.maximum(0.5 - (x12x * x12x + x12y * x12y), 0.0)
    m2 = np.maximum(0.5 - (x12z * x12z + x12w * x12w), 0.0)
    m0 = (m0 * m0) ** 2
    m1 = (m1 * m1) ** 2
    m2 = (m2 * m2) ** 2
    gx0 = 2.0 * (p0 * cw - np.floor(p0 * cw)) - 1.0
    gx1 = 2.0 * (p1 * cw - np.floor(p1 * cw)) - 1.0
    gx2 = 2.0 * (p2 * cw - np.floor(p2 * cw)) - 1.0
    h0 = np.abs(gx0) - 0.5
    h1 = np.abs(gx1) - 0.5
    h2 = np.abs(gx2) - 0.5
    a0 = gx0 - np.floor(gx0 + 0.5)
    a1 = gx1 - np.floor(gx1 + 0.5)
    a2 = gx2 - np.floor(gx2 + 0.5)
    m0 *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h0 * h0)
    m1 *= 1.79284291400159 - 0.85373472095314 * (a1 * a1 + h1 * h1)
    m2 *= 1.79284291400159 - 0.85373472095314 * (a2 * a2 + h2 * h2)
    g0 = a0 * x0x + h0 * x0y
    g1 = a1 * x12x + h1 * x12y
    g2 = a2 * x12z + h2 * x12w
    return 130.0 * (m0 * g0 + m1 * g1 + m2 * g2)


def cover_scale(width: int, height: int, tilt: float) -> float:
    rad = math.radians(tilt)
    aspect = max(width / height, height / width)
    return abs(math.cos(rad)) + abs(math.sin(rad)) * aspect


def paint_field(width: int, height: int, time: float, spec: dict):
    """Curtain field, desaturated and tilted, as the page composites it."""
    import numpy as np
    from PIL import Image

    count = int(spec["curtains"])
    hue_c = (float(spec["hueLo"]) + float(spec["hueHi"])) / 2.0
    hue_a = (float(spec["hueHi"]) - float(spec["hueLo"])) / 2.0
    thick = float(spec["thickness"])
    bright = float(spec["brightness"])
    ys, xs = np.mgrid[0:height, 0:width]
    u = (xs + 0.5) / width
    v = (ys + 0.5) / height
    col = np.zeros((height, width, 3), dtype=np.float64)
    for index in range(count):
        fi = index / (count - 1)
        depth = _hash(index + 0.3)
        base = -0.05 + 1.10 * fi + 0.05 * (_hash(index * 1.7) - 0.5)
        am = (0.028 + 0.03 * _hash(index * 2.3)) * (0.6 + 0.4 * math.sin(time * 0.5 + fi * 3.0))
        fr = (0.35 + 0.5 * _hash(index * 0.7)) * 6.2831853
        ph = time * 0.6 + _hash(index * 3.1) * 6.2831853
        radius = (0.0112 + 0.0308 * depth) * thick
        cx = base + am * np.sin(v * fr + ph) + am * 0.22 * np.sin(v * fr * 1.7 - time * 0.7 + fi * 3.1)
        gauss = np.exp(-((u - cx) ** 2) / (2.0 * radius * radius))
        hue = hue_c + hue_a * np.sin(time * 0.35 + fi * 2.0 + v * 2.5)
        fold = 0.5 + 0.5 * np.sin(v * 7.0 - time * 1.3 + fi * 4.0)
        alpha = (0.11 + 0.17 * depth) * (0.3 + 0.7 * fold * fold) * gauss * bright
        red, green, blue = _hsl(hue / 360.0, 0.9, 0.6)
        col[..., 0] += red * alpha
        col[..., 1] += green * alpha
        col[..., 2] += blue * alpha
    shimmer = _snoise_grid(
        u * float(spec["shimmerScale"]) + time * float(spec["shimmerTime"]),
        v * float(spec["shimmerScale"]) + float(spec["shimmerShift"]),
    )
    gain = float(spec["shimmerFloor"]) + float(spec["shimmerGain"]) * (shimmer * 0.5 + 0.5)
    col *= gain[..., None]
    lum = 0.213 * col[..., 0] + 0.715 * col[..., 1] + 0.072 * col[..., 2]
    sat = float(spec["saturate"])
    col = lum[..., None] * (1.0 - sat) + col * sat
    col *= float(spec["brighten"])
    col = np.clip(col, 0.0, 1.0)
    plate = Image.fromarray(np.rint(col * 255.0).astype(np.uint8), "RGB")
    cover = cover_scale(width, height, float(spec["tilt"]))
    big = plate.resize((max(1, round(width * cover)), max(1, round(height * cover))), Image.BILINEAR)
    turned = big.rotate(-float(spec["tilt"]), resample=Image.BILINEAR, expand=False, fillcolor=(0, 0, 0))
    left = max(0, (turned.width - width) // 2)
    top = max(0, (turned.height - height) // 2)
    cropped = turned.crop((left, top, left + width, top + height))
    return np.asarray(cropped).astype(np.float64) / 255.0
