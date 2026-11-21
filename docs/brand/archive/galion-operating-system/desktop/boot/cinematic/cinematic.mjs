// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// Galion OS boot. One hero at a time, on pure black, locked to the startup sound.
// Motion is the critically damped spring in motion.mjs.

import { createSim, mix } from "./motion.mjs";

const params = new URLSearchParams(location.search);
const capture = params.get("capture") === "1";
const debug = params.get("debug") === "1";
const muted = params.get("mute") === "1" || capture;
const reduced =
  params.get("reduced") === "1" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
const wake = document.getElementById("wake");
const hud = document.getElementById("hud");
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
      const ang = mix(i) * Math.PI * 2 + t * 0.11;
      const dist = reach * (1.28 + mix(i + 80) * 0.9);
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist * 0.9;
      ctx.globalAlpha = 0.05 + mix(i + 160) * 0.16;
      ctx.beginPath();
      ctx.arc(px, py, (0.7 + mix(i + 240) * 0.7) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (ring > 0.01) {
    ctx.beginPath();
    ctx.arc(cx, cy, design.bloomRadius * scale * 2.15, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 245, 247, ${0.28 * ring})`;
    ctx.lineWidth = Math.max(1, 1.15 * scale);
    ctx.stroke();
  }

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

  const choiceY = wordY + design.wordSize * scale + 36 * scale;
  wake.hidden = wakeP < 0.012 && !reduced;
  wake.style.opacity = String(reduced ? 1 : wakeP);
  wake.style.left = `${cx}px`;
  wake.style.top = `${choiceY}px`;
  wake.style.gap = `${design.choiceGap * scale}px`;
  wake.style.setProperty("--choice-size", `${design.choiceSize * scale}px`);
  wake.style.transform = reduced
    ? "translate(-50%, 0)"
    : `translate(-50%, ${(1 - wakeP) * design.choiceRise * scale}px)`;
  wake.style.pointerEvents = wakeP > 0.9 || reduced ? "auto" : "none";

  return state;
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
  ].join("\n");
}

function finish(t) {
  running = false;
  window.__galionStats = summarise();
  window.__galionDone = true;
  paintHud(t);
}

function frame(now) {
  if (!running) return;
  if (frame.last) intervals.push(now - frame.last);
  frame.last = now;
  const t = Math.max(0, clock ? clock() : 0);
  const started = performance.now();
  draw(t);
  draws.push(performance.now() - started);
  paintHud(t);
  if (t >= timeline.hold) {
    finish(t);
    return;
  }
  requestAnimationFrame(frame);
}
frame.last = 0;

window.__galionSeek = (t) => {
  const time = Number(t);
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

await document.fonts.ready;
draw(0);

if (capture) {
  const initial = params.get("t");
  if (initial !== null) window.__galionSeek(initial);
  window.__galionReady = true;
} else {
  await bootAudio();
  running = true;
  requestAnimationFrame(frame);
}
