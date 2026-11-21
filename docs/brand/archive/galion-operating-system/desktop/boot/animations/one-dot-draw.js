// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Galion Labs

// One dot. No caption, no second control. Tap the mark to listen.
// The socket is galion-samantha-ws/1.

const canvas = document.getElementById("s");
const ctx2d = canvas.getContext("2d");
let level = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
}
window.addEventListener("resize", resize);
resize();

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx2d.fillStyle = "#0A0A0C";
  ctx2d.fillRect(0, 0, w, h);
  const radius = Math.min(w, h) * (0.07 + Math.min(1, level) * 0.03);
  ctx2d.beginPath();
  ctx2d.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
  ctx2d.fillStyle = "#F5F5F7";
  ctx2d.fill();
  requestAnimationFrame(draw);
}
draw();
