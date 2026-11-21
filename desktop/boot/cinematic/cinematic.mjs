// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// Galion OS boot. One hero at a time, on pure black, locked to the startup sound.
// Motion is the critically damped spring in motion.mjs.

import { createSim, mix } from "./motion.mjs";
import { snoise } from "./snoise.mjs";
import { coverScale, createField, fieldTime, washAmount } from "./field.mjs";

const params = new URLSearchParams(location.search);
const capture = params.get("capture") === "1";
const debug = params.get("debug") === "1";
const muted = params.get("mute") === "1" || capture;
const reduced =
  params.get("reduced") === "1" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
const desk = document.getElementById("desk");
const hud = document.getElementById("hud");
const forceReady = capture && params.get("ready") === "1";
const timeline = await fetch(new URL("./timeline.json", import.meta.url)).then((res) => {
  if (!res.ok) throw new Error("timeline missing");
  return res.json();
});

const design = timeline.design;
const sim = createSim(timeline);
const particles = timeline.particles;
const still = {
  bloom: [1, 0],
  ring: [0, 0],
  mark: [1, 0],
  word: [1, 0],
  glow: [0, 0],
  glass: [0, 0],
  field: [0, 0],
  wake: [1, 0],
};

const intervals = [];
const draws = [];
let audioStatus = muted ? "muted" : "loading";
let clock = null;
let running = false;
let stepP = 0;
let stepV = 0;
let clearP = 0;
let clearV = 0;
let statusTime = 0;
let held = 0;
let heldAt = null;
const signals = { desktop: false, apps: false };
let sealed = false;
let handed = false;

function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(1, window.innerWidth);
  const cssH = Math.max(1, window.innerHeight);
  const w = Math.floor(cssW * dpr);
  const h = Math.floor(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const scale = Math.min(cssW / design.width, cssH / design.height);
  return { dpr, cssW, cssH, scale };
}

function stateAt(t) {
  if (reduced) return still;
  return sim.at(Math.max(0, t));
}

function draw(t) {
  const view = layout();
  const { dpr, cssW, cssH, scale } = view;
  const state = stateAt(t);
  const bloom = state.bloom[0];
  const ring = state.ring[0];
  const mark = state.mark[0];
  const word = state.word[0];
  const glow = state.glow[0];
  const glass = state.glass[0];
  const field = state.field[0];
  const wakeP = state.wake[0];
  const cx = cssW / 2;
  const cy = cssH / 2 - 18 * scale;
  const iconR = ((design.mark * 6) / 64) * scale;
  const radius = design.bloomRadius * scale * bloom * (1 - mark) + iconR * mark;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cssW, cssH);

  const wash = washAmount(t, state, reduced, timeline);
  if (wash > 0.004 && light) {
    light.render(fieldTime(t, timeline.light), cssW, cssH);
    const cover = coverScale(cssW, cssH, timeline.light.tilt);
    ctx.save();
    ctx.translate(cssW / 2, cssH / 2);
    ctx.rotate((timeline.light.tilt * Math.PI) / 180);
    ctx.globalAlpha = wash;
    ctx.drawImage(light.canvas, (-cssW * cover) / 2, (-cssH * cover) / 2, cssW * cover, cssH * cover);
    ctx.restore();
  }

  if (glow > 0.004 && radius > 0.2) {
    const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, Math.max(radius * 8.5, 24 * scale));
    halo.addColorStop(0, `rgba(245, 245, 247, ${0.22 * glow})`);
    halo.addColorStop(0.42, `rgba(245, 245, 247, ${0.06 * glow})`);
    halo.addColorStop(1, "rgba(245, 245, 247, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  if (field > 0.01 && bloom > 0.02) {
    ctx.fillStyle = `rgba(245, 245, 247, ${field})`;
    const reach = design.bloomRadius * scale * Math.max(bloom, 0.2);
    for (let i = 0; i < particles; i += 1) {
      const n = snoise(mix(i) * 3, t * 0.23);
      const ang = mix(i) * Math.PI * 2 + t * 0.11 + n * 0.4;
      const dist = reach * (1.22 + mix(i + 80) * 0.8 + n * 0.16);
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist * 0.9;
      ctx.globalAlpha = 0.05 + mix(i + 160) * 0.16;
      ctx.beginPath();
      ctx.arc(px, py, (0.7 + mix(i + 240) * 0.7) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (ring > 0.01) strokeNoiseRing(cx, cy, design.bloomRadius * scale * 2.15, ring, t, scale);

  if (radius > 0.3) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#F5F5F7";
    ctx.fill();

    if (glass > 0.01) {
      const body = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.38,
        radius * 0.04,
        cx + radius * 0.1,
        cy + radius * 0.12,
        radius
      );
      body.addColorStop(0, `rgba(255, 255, 255, ${0.92 * glass})`);
      body.addColorStop(0.38, `rgba(214, 226, 232, ${0.28 * glass})`);
      body.addColorStop(0.72, `rgba(186, 198, 214, ${0.18 * glass})`);
      body.addColorStop(1, `rgba(120, 136, 150, ${0.05 * glass})`);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const shade = ctx.createRadialGradient(
        cx + radius * 0.42,
        cy + radius * 0.48,
        radius * 0.02,
        cx,
        cy,
        radius * 1.05
      );
      shade.addColorStop(0, `rgba(0, 0, 0, ${0.34 * glass})`);
      shade.addColorStop(0.55, `rgba(0, 0, 0, ${0.08 * glass})`);
      shade.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const d = 0.65 * scale * glass;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = Math.max(1, 1.15 * scale);
      ctx.strokeStyle = `rgba(255, 96, 120, ${0.1 * glass})`;
      ctx.beginPath();
      ctx.arc(cx - d, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(120, 170, 255, ${0.1 * glass})`;
      ctx.beginPath();
      ctx.arc(cx + d, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";

      const film = ctx.createConicGradient(t * 0.15, cx, cy);
      const edge = 0.55 * glass;
      film.addColorStop(0, `rgba(198, 228, 232, ${edge})`);
      film.addColorStop(0.22, `rgba(245, 245, 247, ${edge * 0.35})`);
      film.addColorStop(0.46, `rgba(214, 196, 232, ${edge})`);
      film.addColorStop(0.68, `rgba(236, 228, 206, ${edge * 0.7})`);
      film.addColorStop(0.84, `rgba(186, 214, 228, ${edge})`);
      film.addColorStop(1, `rgba(198, 228, 232, ${edge})`);
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.4 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = film;
      ctx.lineWidth = Math.max(1, 1.6 * scale);
      ctx.stroke();
    }
  }

  if (mark > 0.004) {
    const unit = (design.mark * scale) / 64;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(unit, unit);
    ctx.translate(-32, -32);
    ctx.beginPath();
    ctx.roundRect(10, 10, 44, 44, 10);
    ctx.strokeStyle = `rgba(245, 245, 247, ${mark})`;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  const wordY = cy + (22 / 64) * design.mark * scale + design.wordGap * scale;
  if (word > 0.004) {
    ctx.globalAlpha = word;
    ctx.fillStyle = "#F5F5F7";
    ctx.font = `500 ${design.wordSize * scale}px Jost, "IBM Plex Sans", sans-serif`;
    ctx.textRendering = "geometricPrecision";
    ctx.letterSpacing = "-0.02em";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Galion OS", cx, wordY + (1 - word) * design.wordRise * scale);
    ctx.globalAlpha = 1;
    ctx.letterSpacing = "0px";
  }

  drawDesk(cx, wordY, scale, wakeP);

  return state;
}

function strokeNoiseRing(cx, cy, radius, amp, t, scale) {
  if (amp < 0.02 || radius < 1) return;
  ctx.beginPath();
  const steps = 96;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const n = snoise(Math.cos(a) * 1.6 + t * 0.17, Math.sin(a) * 1.6);
    const r = radius * (1 + n * 0.012);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(214, 226, 232, ${0.34 * amp})`;
  ctx.lineWidth = Math.max(1, 1.15 * scale);
  ctx.stroke();
}

const PROBE_URL = {
  desktop: "http://127.0.0.1:18181/",
  apps: "http://127.0.0.1:8787/",
};

function springTo(p, v, target, h, omega) {
  if (!(h > 0)) return [p, v];
  const a = -omega * omega * (p - target) - 2 * omega * v;
  v += a * h;
  p += v * h;
  if (!Number.isFinite(p) || !Number.isFinite(v)) return [target, 0];
  return [p, v];
}

function timedIndex(t) {
  const steps = timeline.statuses;
  let index = 0;
  for (let i = 0; i < steps.length; i += 1) {
    if (t >= steps[i].at) index = i;
  }
  return index;
}

function signalReady(step) {
  if (!step || !step.probe) return true;
  if (capture) return true;
  return signals[step.probe] === true;
}

function liveIndex(t) {
  const steps = timeline.statuses;
  if (heldAt === null) heldAt = t;
  while (held < steps.length - 1) {
    const dwellOk = t - heldAt >= timeline.statusDwell;
    const timeOk = t >= steps[held + 1].at;
    if (dwellOk && timeOk && signalReady(steps[held])) {
      held += 1;
      heldAt = t;
    } else {
      break;
    }
  }
  return held;
}

function syncStatus(t) {
  if (t + 1e-4 < statusTime) {
    stepP = 0;
    stepV = 0;
    clearP = 0;
    clearV = 0;
    statusTime = 0;
    held = 0;
    heldAt = null;
  }
  const h = 1 / 240;
  while (statusTime + h <= t + 1e-12) {
    const nextT = statusTime + h;
    const index = forceReady && nextT >= timeline.handoff
      ? timeline.statuses.length - 1
      : capture
        ? timedIndex(nextT)
        : liveIndex(nextT);
    const stepped = springTo(stepP, stepV, index, h, timeline.statusOmega);
    stepP = stepped[0];
    stepV = stepped[1];
    const last = index === timeline.statuses.length - 1 && signalReady(timeline.statuses[index]);
    const clearing = (nextT >= timeline.resolve && last) || (forceReady && nextT >= timeline.handoff);
    const cleared = springTo(clearP, clearV, clearing ? 1 : 0, h, timeline.clearOmega);
    clearP = cleared[0];
    clearV = cleared[1];
    statusTime = nextT;
  }
}

function drawDesk(cx, wordY, scale, wakeP) {
  if (wakeP < 0.012 && !reduced) {
    if (desk.textContent) desk.textContent = "";
    return;
  }
  const steps = timeline.statuses;
  const count = steps.length;
  const rise = reduced ? 0 : (1 - wakeP) * design.wordRise * scale;
  const nameY = wordY + design.wordSize * scale * 0.55 + design.deskGap * scale + rise;
  const lineY = nameY + design.lineGap * scale;
  const stateY = lineY + design.lineGap * scale + 2 * scale;
  const span = design.lineWidth * scale;
  const x0 = cx - span / 2;
  const progress = reduced ? 1 : Math.min(1, Math.max(0, (stepP + 1) / count));
  const gone = reduced ? 1 : clearP;

  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeStyle = `rgba(245, 245, 247, ${0.34 * wakeP})`;
  ctx.beginPath();
  ctx.moveTo(x0, lineY);
  ctx.lineTo(x0 + span, lineY);
  ctx.stroke();
  if (progress > 0.004) {
    ctx.strokeStyle = `rgba(245, 245, 247, ${0.92 * wakeP})`;
    ctx.beginPath();
    ctx.moveTo(x0, lineY);
    ctx.lineTo(x0 + span * progress, lineY);
    ctx.stroke();
    if (gone < 0.92) {
      ctx.fillStyle = `rgba(245, 245, 247, ${wakeP * (1 - gone)})`;
      ctx.beginPath();
      ctx.arc(x0 + span * progress, lineY, 2.1 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#A7B6C4";
  ctx.font = `500 ${design.deskSize * scale}px Jost, "IBM Plex Sans", sans-serif`;
  ctx.textRendering = "geometricPrecision";
  ctx.letterSpacing = "-0.02em";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = wakeP;
  ctx.fillText("Obsidian Desktop", cx, nameY);

  const textAlpha = wakeP * (1 - gone);
  if (!reduced && textAlpha > 0.02) {
    const i0 = Math.max(0, Math.min(count - 1, Math.floor(stepP + 1e-6)));
    const i1 = Math.min(count - 1, i0 + 1);
    const fade = Math.min(1, Math.max(0, stepP - i0));
    ctx.font = `400 ${design.stateSize * scale}px "IBM Plex Sans", sans-serif`;
    ctx.letterSpacing = "-0.02em";
    if (fade < 0.92) {
      ctx.globalAlpha = textAlpha * (1 - fade);
      ctx.fillText(steps[i0].text, cx, stateY);
    }
    if (fade > 0.08 && i1 !== i0) {
      ctx.globalAlpha = textAlpha * fade;
      ctx.fillText(steps[i1].text, cx, stateY);
    }
  }
  ctx.globalAlpha = 1;
  ctx.letterSpacing = "0px";

  const spokenIndex = Math.max(0, Math.min(count - 1, Math.round(stepP)));
  const spoken = gone > 0.9 ? "Obsidian Desktop." : `Obsidian Desktop. ${steps[spokenIndex].text}`;
  if (desk.textContent !== spoken) desk.textContent = spoken;
}

function summarise() {
  const sorted = intervals.slice().sort((a, b) => a - b);
  const drawSorted = draws.slice().sort((a, b) => a - b);
  const pick = (list, p) => (list.length ? list[Math.min(list.length - 1, Math.floor(p * (list.length - 1)))] : 0);
  const mean = (list) => (list.length ? list.reduce((sum, n) => sum + n, 0) / list.length : 0);
  const meanInterval = mean(intervals);
  return {
    frames: intervals.length,
    meanMs: meanInterval,
    p50Ms: pick(sorted, 0.5),
    p95Ms: pick(sorted, 0.95),
    maxMs: sorted.length ? sorted[sorted.length - 1] : 0,
    fps: meanInterval > 0 ? 1000 / meanInterval : 0,
    over24Ms: intervals.filter((n) => n > 24).length,
    drawMeanMs: mean(draws),
    drawP50Ms: pick(drawSorted, 0.5),
    drawP95Ms: pick(drawSorted, 0.95),
    drawMaxMs: drawSorted.length ? drawSorted[drawSorted.length - 1] : 0,
    audio: audioStatus,
    reduced,
    field: window.__galionField || "off",
  };
}

function paintHud(t) {
  if (!debug) return;
  const stats = summarise();
  window.__galionStats = stats;
  hud.hidden = false;
  const last = intervals.length ? intervals[intervals.length - 1] : 0;
  const lastDraw = draws.length ? draws[draws.length - 1] : 0;
  hud.textContent = [
    `t ${t.toFixed(3)} s`,
    `frame ${last.toFixed(2)} ms   draw ${lastDraw.toFixed(2)} ms`,
    `p50 ${stats.p50Ms.toFixed(2)}   p95 ${stats.p95Ms.toFixed(2)}   max ${stats.maxMs.toFixed(2)}`,
    `fps ${stats.fps.toFixed(2)}   n ${stats.frames}   over 24 ms ${stats.over24Ms}`,
    `draw p95 ${stats.drawP95Ms.toFixed(2)} ms`,
    `audio ${audioStatus}`,
    `field ${stats.field}`,
  ].join("\n");
}

function frame(now) {
  if (!running) return;
  if (!sealed && frame.last) intervals.push(now - frame.last);
  frame.last = now;
  const t = Math.max(0, clock ? clock() : 0);
  if (!reduced) syncStatus(t);
  const started = performance.now();
  draw(t);
  if (!sealed) draws.push(performance.now() - started);
  paintHud(t);
  if (!sealed && t >= timeline.hold) {
    window.__galionStats = summarise();
    window.__galionDone = true;
    sealed = true;
  }
  maybeHandoff(t);
  requestAnimationFrame(frame);
}
frame.last = 0;

function maybeHandoff(t) {
  if (handed || capture || debug) return;
  if (!signals.desktop || t < timeline.hold) return;
  if (!reduced && clearP < 0.97) return;
  if (!loopbackProbe(PROBE_URL.desktop)) return;
  handed = true;
  location.assign(PROBE_URL.desktop);
}

function loopbackProbe(url) {
  try {
    const parsed = new URL(url);
    const known = parsed.href === PROBE_URL.desktop || parsed.href === PROBE_URL.apps;
    return known && parsed.protocol === "http:" && parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function watchSignals() {
  if (capture) return;
  for (const key of Object.keys(PROBE_URL)) {
    pollSignal(key, PROBE_URL[key]);
  }
}

async function pollSignal(key, url) {
  while (!signals[key] && !handed) {
    const t = clock ? clock() : 0;
    if (t >= timeline.handoff && loopbackProbe(url)) signals[key] = await probeOnce(url);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

async function probeOnce(url) {
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

window.__galionSeek = (t) => {
  const time = Number(t);
  syncStatus(time);
  draw(time);
  window.__galionReady = true;
  return time;
};

window.__galionTimeline = timeline;

async function bootAudio() {
  if (muted) return;
  try {
    const response = await fetch(new URL("../sounds/galion-os-startup.mp3", import.meta.url));
    if (!response.ok) throw new Error("sound missing");
    const bytes = await response.arrayBuffer();
    const audioCtx = new AudioContext();
    const buffer = await audioCtx.decodeAudioData(bytes.slice(0));
    await audioCtx.resume();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    const lead = 0.05;
    const startAt = audioCtx.currentTime + lead;
    source.start(startAt);
    clock = () => audioCtx.currentTime - startAt;
    audioStatus = "playing";
  } catch (error) {
    audioStatus = "unavailable";
    const origin = performance.now();
    clock = () => (performance.now() - origin) / 1000;
  }
}

const light = await createField(timeline.light, { reduced, cpu: params.get("cpu") === "1" });
window.__galionField = light.mode;

await Promise.all([
  document.fonts.load("500 28px Jost"),
  document.fonts.load("500 15px Jost"),
  document.fonts.load('400 12px "IBM Plex Sans"'),
]);
await document.fonts.ready;
draw(0);

if (capture) {
  const initial = params.get("t");
  if (initial !== null) window.__galionSeek(initial);
  window.__galionReady = true;
} else {
  await bootAudio();
  watchSignals();
  running = true;
  requestAnimationFrame(frame);
}
