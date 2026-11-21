// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// One frame of the vendored coaurora curtain field, at a time from the boot
// clock. The upstream renderer keeps its own requestAnimationFrame. This file
// does not call it. WebGL1 is required because the upstream shaders are
// GLSL ES 1.00. Without WebGL, curtainAt from the same library paints a
// small canvas.

import { VERTEX, fsCurtains, FS_COMPOSE } from "./vendor/coaurora/src/shaders.js";
import { curtainAt } from "./vendor/coaurora/src/curtains.js";
import { snoise } from "./snoise.mjs";

export function fieldTime(t, spec) {
  return t * 0.4 * spec.speed;
}

export function washAmount(t, state, reduced, tl) {
  if (reduced || !(t >= tl.onset - 0.004)) return 0;
  const weights = tl.light.wash;
  const amount =
    state.bloom[0] * weights.bloom +
    state.glow[0] * weights.glow +
    state.glass[0] * weights.glass +
    state.mark[0] * weights.mark;
  return Math.min(1, Math.max(0, amount));
}

export function coverScale(width, height, tilt) {
  const rad = (tilt * Math.PI) / 180;
  const aspect = Math.max(width / height, height / width);
  return Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)) * aspect;
}

function fixed(n) {
  return Number(n).toFixed(8);
}

function curtainSource(spec, noiseSrc) {
  const base = fsCurtains(spec.curtains);
  const precision = "precision highp float;\n";
  if (!base.includes(precision) || !base.includes("return col;")) {
    throw new Error("curtain shader shape changed");
  }
  const shimmer =
    `return col * (${fixed(spec.shimmerFloor)} + ${fixed(spec.shimmerGain)} * ` +
    `(snoise(uv * ${fixed(spec.shimmerScale)} + vec2(uT * ${fixed(spec.shimmerTime)}, ${fixed(spec.shimmerShift)})) * 0.5 + 0.5));`;
  const grade =
    `vec3 raw = curtains(gl_FragCoord.xy / uRes, uT);\n` +
    `float lum = dot(raw, vec3(0.213, 0.715, 0.072));\n` +
    `raw = mix(vec3(lum), raw, ${fixed(spec.saturate)});\n` +
    `raw *= ${fixed(spec.brighten)};\n` +
    `float tt = fract(uT * 50.0);\n` +
    `float ig = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + tt);\n` +
    `float ig2 = fract(52.9829189 * fract(dot(gl_FragCoord.xy + vec2(97.0, 71.0), vec2(0.06711056, 0.00583715))) + tt + 0.5);\n` +
    `raw += (ig + ig2 - 1.0) * 1.1 / 255.0;\n` +
    `gl_FragColor = vec4(clamp(raw, 0.0, 1.0), 1.0);`;
  return base
    .replace(precision, precision + noiseSrc + "\n")
    .replace("return col;", shimmer)
    .replace("void main() { gl_FragColor = vec4(curtains(gl_FragCoord.xy / uRes, uT), 1.0); }", `void main() {\n${grade}\n}`);
}

function fit(cssW, cssH, edge) {
  const cap = edge / Math.max(cssW, cssH);
  const scale = Math.min(1, cap);
  return [Math.max(2, Math.round(cssW * scale)), Math.max(2, Math.round(cssH * scale))];
}

function startGL(spec, noiseSrc) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false,
  });
  if (!gl) return null;

  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || "shader";
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  };
  const link = (fs) => {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    const fragment = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return program;
  };

  let curtains;
  let compose;
  try {
    curtains = link(curtainSource(spec, noiseSrc));
    compose = link(FS_COMPOSE);
  } catch {
    return null;
  }
  if (!curtains || !compose) return null;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attrib = (program) => {
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  };

  let curW = 0;
  let curH = 0;
  const cu = (name) => gl.getUniformLocation(curtains, name);
  const c = {
    res: cu("uRes"),
    t: cu("uT"),
    floor: cu("uFloor"),
    hueC: cu("uHueC"),
    hueA: cu("uHueA"),
    thick: cu("uThick"),
    bright: cu("uBright"),
  };
  const hueC = (spec.hueLo + spec.hueHi) / 2;
  const hueA = (spec.hueHi - spec.hueLo) / 2;
  // The compose program is linked so a broken upstream shader fails closed.
  // It is not drawn. Its 3x3 blur misses 60 fps on software GL at this size,
  // and scaling the field up to the page is the blur.

  return {
    canvas,
    mode: "webgl",
    render(time, cssW, cssH) {
      const [w, h] = fit(cssW, cssH, spec.maxEdge);
      if (w !== curW || h !== curH) {
        canvas.width = w;
        canvas.height = h;
        curW = w;
        curH = h;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(curtains);
      attrib(curtains);
      gl.uniform2f(c.res, w, h);
      gl.uniform1f(c.t, time);
      gl.uniform3f(c.floor, 0, 0, 0);
      gl.uniform1f(c.hueC, hueC);
      gl.uniform1f(c.hueA, hueA);
      gl.uniform1f(c.thick, spec.thickness);
      gl.uniform1f(c.bright, spec.brightness);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

function startCPU(spec) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hueC = (spec.hueLo + spec.hueHi) / 2;
  const hueA = (spec.hueHi - spec.hueLo) / 2;
  const opts = {
    curtains: spec.curtains,
    thickness: spec.thickness,
    brightness: spec.brightness,
    _floor: [0, 0, 0],
  };
  return {
    canvas,
    mode: "cpu",
    render(time, cssW, cssH) {
      const [w, h] = fit(cssW, cssH, spec.cpuEdge);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const image = ctx.createImageData(w, h);
      const data = image.data;
      let p = 0;
      for (let y = 0; y < h; y += 1) {
        const v = (y + 0.5) / h;
        for (let x = 0; x < w; x += 1) {
          const u = (x + 0.5) / w;
          const col = curtainAt([u, v], time, opts, hueC, hueA);
          const n = snoise(u * spec.shimmerScale + time * spec.shimmerTime, v * spec.shimmerScale + spec.shimmerShift);
          const gain = spec.shimmerFloor + spec.shimmerGain * (n * 0.5 + 0.5);
          let r = col[0] * gain;
          let g = col[1] * gain;
          let b = col[2] * gain;
          const lum = 0.213 * r + 0.715 * g + 0.072 * b;
          const sat = spec.saturate;
          r = lum * (1 - sat) + r * sat;
          g = lum * (1 - sat) + g * sat;
          b = lum * (1 - sat) + b * sat;
          const bright = spec.brighten;
          data[p] = Math.max(0, Math.min(255, r * bright * 255));
          data[p + 1] = Math.max(0, Math.min(255, g * bright * 255));
          data[p + 2] = Math.max(0, Math.min(255, b * bright * 255));
          data[p + 3] = 255;
          p += 4;
        }
      }
      ctx.putImageData(image, 0, 0);
    },
  };
}

export async function createField(spec, { reduced, cpu }) {
  if (reduced) {
    return { canvas: document.createElement("canvas"), mode: "off", render() {} };
  }
  if (cpu) return startCPU(spec);
  try {
    const response = await fetch(new URL("./vendor/webgl-noise/noise2D.glsl", import.meta.url));
    if (!response.ok) throw new Error("noise missing");
    const noise = await response.text();
    const gpu = startGL(spec, noise);
    if (gpu) return gpu;
  } catch {
    // The CPU path is the no-WebGL fallback.
  }
  return startCPU(spec);
}
