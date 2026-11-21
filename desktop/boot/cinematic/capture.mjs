// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.
//
// Headless capture of the boot page. It only talks to 127.0.0.1.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const port = Number(argValue("--port", "8766"));
const outDir = argValue("--out", "/tmp/galion-boot-capture");
const mode = args.includes("--measure") ? "measure" : args.includes("--film") ? "film" : "stills";
const readyQuery = args.includes("--ready") ? "&ready=1" : "";

function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1 || !args[index + 1]) return fallback;
  return args[index + 1];
}

const userData = `/tmp/galion-chrome-${process.pid}`;
const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--allow-insecure-localhost",
    "--autoplay-policy=no-user-gesture-required",
    "--disable-frame-rate-limit",
    "--disable-gpu-vsync",
    `--user-data-dir=${userData}`,
    "--window-size=1920,1080",
    "--remote-allow-origins=*",
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);
process.on("exit", () => {
  try {
    chrome.kill("SIGTERM");
  } catch {
    // The browser is already gone.
  }
});
let chromeLog = "";
chrome.stderr.on("data", (chunk) => {
  chromeLog += chunk.toString();
});
chrome.stdout.on("data", (chunk) => {
  chromeLog += chunk.toString();
});

const debugPort = await waitForPort();
const page = await openPage(`http://127.0.0.1:${port}/boot/cinematic/?capture=1&mute=1`);
const ws = new WebSocket(page.webSocketDebuggerUrl);
const exceptions = [];
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", () => reject(new Error("devtools socket failed")));
});
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  } else if (message.method === "Runtime.exceptionThrown") {
    exceptions.push(message.params.exceptionDetails.text || "exception");
  } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    exceptions.push(message.params.args.map((item) => item.value || item.description || "").join(" "));
  }
});

function send(method, params = {}) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 20000);
    pending.set(id, (message) => {
      clearTimeout(timer);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result || {});
    });
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false,
});

await mkdir(outDir, { recursive: true });

if (mode === "measure") {
  await send("Page.navigate", {
    url: `http://127.0.0.1:${port}/boot/cinematic/?debug=1`,
  });
  await waitFor("window.__galionDone === true", 20000);
  const stats = await evaluate("window.__galionStats");
  await writeFile(`${outDir}/frametimes.json`, JSON.stringify(stats, null, 2));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${outDir}/measure.png`, Buffer.from(shot.data, "base64"));
  console.log(JSON.stringify(stats, null, 2));
} else if (mode === "film") {
  await send("Page.navigate", {
    url: `http://127.0.0.1:${port}/boot/cinematic/?capture=1&mute=1${readyQuery}`,
  });
  await waitFor("typeof window.__galionSeek === 'function'", 10000);
  const hold = await evaluate("window.__galionTimeline.hold");
  const frames = Math.round(hold * 60);
  for (let index = 0; index < frames; index += 1) {
    const t = index / 60;
    await evaluate(`window.__galionSeek(${t})`);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(`${outDir}/frame-${String(index).padStart(4, "0")}.png`, Buffer.from(shot.data, "base64"));
    if (index % 30 === 0) console.log(`frame ${index} t ${t.toFixed(3)}`);
  }
  console.log(`frames ${frames}`);
} else {
  await send("Page.navigate", {
    url: `http://127.0.0.1:${port}/boot/cinematic/?capture=1&mute=1${readyQuery}`,
  });
  await waitFor("typeof window.__galionSeek === 'function'", 10000);
  const times = [0, 0.21, 1.6, 2.5, 4.2, 4.85, 5.4, 5.95, 6.5, 7.1, 7.6];
  for (const t of times) {
    await evaluate(`window.__galionSeek(${t})`);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const name = `t-${t.toFixed(2)}.png`;
    await writeFile(`${outDir}/${name}`, Buffer.from(shot.data, "base64"));
    console.log(name);
  }
}

if (exceptions.length) {
  console.error(exceptions.join("\n"));
  process.exitCode = 1;
}
ws.close();
chrome.kill("SIGTERM");

async function waitForPort() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const fromProc = portFromCommand();
    const candidates = [fromProc, "9399"].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const version = await fetch(`http://127.0.0.1:${candidate}/json/version`);
        if (version.ok) return candidate;
      } catch {
        // The port is not open yet.
      }
    }
    await delay(100);
  }
  throw new Error(`chrome did not open a devtools port\n${chromeLog.slice(-2000)}`);
}

function portFromCommand() {
  try {
    const raw = readFileSync(`/proc/${chrome.pid}/cmdline`);
    const text = raw.toString().replaceAll("\u0000", " ");
    const match = text.match(/remote-debugging-port=(\d+)/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

async function openPage(url) {
  const created = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  if (!created.ok) throw new Error(`devtools new tab ${created.status}`);
  return created.json();
}

async function waitFor(expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await evaluate(expression);
    if (value) return value;
    await delay(40);
  }
  const body = await evaluate("document.body && document.body.innerText");
  throw new Error(`timed out waiting for ${expression} body=${body} ${exceptions.join(" | ")}`);
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "evaluate failed");
  }
  return result.result ? result.result.value : undefined;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
