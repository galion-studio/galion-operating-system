// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// Transcription of vendor/webgl-noise/noise2D.glsl for Canvas2D and the CPU
// fallback. The GLSL file is the source that the light-field shader compiles.
//
// Copyright (C) 2011 Ashima Arts (Simplex noise)
// Copyright (C) 2011-2016 Stefan Gustavson
// Distributed under the MIT License. See vendor/webgl-noise/LICENSE.

function mod289(x) {
  return x - Math.floor(x * (1 / 289)) * 289;
}

function permute(x) {
  return mod289((x * 34 + 10) * x);
}

export function snoise(xin, yin) {
  const Cx = 0.211324865405187;
  const Cy = 0.366025403784439;
  const Cz = -0.577350269189626;
  const Cw = 0.024390243902439;
  const s = (xin + yin) * Cy;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * Cx;
  const x0x = xin - i + t;
  const x0y = yin - j + t;
  const i1 = x0x > x0y ? 1 : 0;
  const j1 = x0x > x0y ? 0 : 1;
  const x12x = x0x + Cx - i1;
  const x12y = x0y + Cx - j1;
  const x12z = x0x + Cz;
  const x12w = x0y + Cz;
  const ii = mod289(i);
  const jj = mod289(j);
  const p0 = permute(permute(jj) + ii);
  const p1 = permute(permute(jj + j1) + ii + i1);
  const p2 = permute(permute(jj + 1) + ii + 1);
  let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0);
  let m1 = Math.max(0.5 - (x12x * x12x + x12y * x12y), 0);
  let m2 = Math.max(0.5 - (x12z * x12z + x12w * x12w), 0);
  m0 *= m0;
  m1 *= m1;
  m2 *= m2;
  m0 *= m0;
  m1 *= m1;
  m2 *= m2;
  const x0 = 2 * (p0 * Cw - Math.floor(p0 * Cw)) - 1;
  const x1 = 2 * (p1 * Cw - Math.floor(p1 * Cw)) - 1;
  const x2 = 2 * (p2 * Cw - Math.floor(p2 * Cw)) - 1;
  const h0 = Math.abs(x0) - 0.5;
  const h1 = Math.abs(x1) - 0.5;
  const h2 = Math.abs(x2) - 0.5;
  const a0 = x0 - Math.floor(x0 + 0.5);
  const a1 = x1 - Math.floor(x1 + 0.5);
  const a2 = x2 - Math.floor(x2 + 0.5);
  m0 *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h0 * h0);
  m1 *= 1.79284291400159 - 0.85373472095314 * (a1 * a1 + h1 * h1);
  m2 *= 1.79284291400159 - 0.85373472095314 * (a2 * a2 + h2 * h2);
  const g0 = a0 * x0x + h0 * x0y;
  const g1 = a1 * x12x + h1 * x12y;
  const g2 = a2 * x12z + h2 * x12w;
  return 130 * (m0 * g0 + m1 * g1 + m2 * g2);
}
