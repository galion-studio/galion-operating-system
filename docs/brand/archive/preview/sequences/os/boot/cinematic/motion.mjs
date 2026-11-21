// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// Critically damped boot springs. Same semi-implicit Euler step as
// desktop/boot/animations/spring.rs, substepped at substepHz so a late
// frame cannot skip the onset. Zeta is 1. No linear tweens.

export const NAMES = ["bloom", "ring", "mark", "word", "glow", "glass", "field", "wake"];

export function mix(index) {
  let x = Math.imul(index + 1, 0x9E3779B1) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7FEB352D) >>> 0;
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

export function targets(tl, t) {
  return {
    bloom: t >= tl.onset ? 1 : 0,
    ring: t >= tl.ringIn && t < tl.ringOut ? 1 : 0,
    mark: t >= tl.peak ? 1 : 0,
    word: t >= tl.release ? 1 : 0,
    glow: t >= tl.onset && t < tl.peak ? 1 : 0,
    glass: t >= tl.onset && t < tl.release ? 1 : 0,
    field: t >= tl.fieldIn && t < tl.fieldOut ? 1 : 0,
    wake: t >= tl.handoff ? 1 : 0,
  };
}

function spring(p, v, target, h, omega, zeta) {
  if (!(h > 0) || !Number.isFinite(h)) return [p, v];
  const a = -omega * omega * (p - target) - 2 * zeta * omega * v;
  v += a * h;
  p += v * h;
  if (!Number.isFinite(p) || !Number.isFinite(v)) return [target, 0];
  return [p, v];
}

export function zeros() {
  const state = {};
  for (const name of NAMES) state[name] = [0, 0];
  return state;
}

export function substep(state, t, h, tl) {
  const onset = tl.onset;
  const t1 = t + h;
  if (t < onset && t1 >= onset) {
    if (state.bloom[0] < tl.appear) {
      state.bloom[0] = tl.appear;
      state.bloom[1] = 0;
    }
    if (state.glow[0] < tl.glowKick) state.glow[0] = tl.glowKick;
    state.glow[1] = 0;
    if (state.glass[0] < tl.glassKick) state.glass[0] = tl.glassKick;
    state.glass[1] = 0;
  }
  const goal = targets(tl, t1);
  for (const name of NAMES) {
    const gain = tl.springs[name];
    const next = spring(state[name][0], state[name][1], goal[name], h, gain.omega, gain.zeta);
    state[name][0] = next[0];
    state[name][1] = next[1];
  }
}

export function at(tl, tEnd) {
  const state = zeros();
  if (!(tEnd > 0)) return state;
  const step = 1 / tl.substepHz;
  const count = Math.floor(tEnd / step);
  let t = 0;
  for (let i = 0; i < count; i += 1) {
    substep(state, t, step, tl);
    t += step;
  }
  const remain = tEnd - t;
  if (remain > 1e-12) substep(state, t, remain, tl);
  return state;
}

export function position(state) {
  const out = {};
  for (const name of NAMES) out[name] = state[name][0];
  return out;
}

export function createSim(tl) {
  let state = zeros();
  let t = 0;
  const step = 1 / tl.substepHz;
  return {
    at(target) {
      if (target + 1e-6 < t) {
        state = zeros();
        t = 0;
      }
      while (t + step <= target + 1e-12) {
        substep(state, t, step, tl);
        t += step;
      }
      return state;
    },
  };
}
