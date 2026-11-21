/**
 * Pixel check for the offline boot preview.
 *
 * A clean console is not enough: lottie-web swallows a missing-font throw and
 * leaves an empty SVG. This loads every boot card in headless Chrome and
 * compares a frame at 0.5s with a frame at 1.5s after the stage has mounted.
 *
 * A Lottie card fails unless a drawn path or glyph appears and the next frames differ.
 * Sampling starts when that paint exists, so a shape that is still scaled to nothing
 * at t=0 is not mistaken for a frozen file.
 * Any other card fails when the stage below the gallery chrome is near-blank and a
 * later pair, after a long black opening, is still blank.
 * A painted hold — a finished terminal, a splash whose rise already landed, the
 * one-dot disc at rest — passes.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const preview = path.join(repo, "docs/brand/archive/preview");
const port = process.env.PREVIEW_PORT || "8790";
const origin = process.env.PREVIEW_URL || `http://127.0.0.1:${port}`;
const shotDir = process.env.SHOT_DIR || "";

const INK = 36;
const CHANNEL = 18;
const LOTTIE_DIFF = 40;
const BLANK_DIFF = 80;
const STAGE_INK = 40;

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return "/usr/bin/google-chrome";
}

function measure(buf) {
  const png = PNG.sync.read(Buffer.from(buf));
  let ink = 0;
  let stage = 0;
  const chrome = 96 * png.width * 4;
  for (let i = 0; i < png.data.length; i += 4) {
    const sum = png.data[i] + png.data[i + 1] + png.data[i + 2];
    if (sum > INK) ink++;
    if (i >= chrome && sum > 12) stage++;
  }
  return { ink, stage, data: png.data };
}

function pixelDiff(a, b) {
  let n = 0;
  const len = Math.min(a.data.length, b.data.length);
  for (let i = 0; i < len; i += 4) {
    const d =
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > CHANNEL) n++;
  }
  return n;
}

function judge(id, a, b, drawn) {
  const diff = pixelDiff(a, b);
  const ink = Math.max(a.ink, b.ink);
  const stage = Math.max(a.stage, b.stage);
  if (id.startsWith("lottie")) {
    const painted = drawn.paths > 0 || drawn.texts > 0;
    if (diff < LOTTIE_DIFF || !painted || stage < STAGE_INK) {
      return { ok: false, reason: "lottie", diff, ink, stage, drawn };
    }
    return { ok: true, reason: "playing", diff, ink, stage, drawn };
  }
  if (diff < BLANK_DIFF && stage < STAGE_INK) {
    return { ok: false, reason: "blank", diff, ink, stage };
  }
  return { ok: true, reason: diff >= BLANK_DIFF ? "moving" : "painted", diff, ink, stage };
}

async function contentType(url) {
  const response = await fetch(url, { method: "HEAD" });
  return (response.headers.get("content-type") || "").split(";")[0].trim();
}

function assertMap(source, label) {
  const required = [
    [".json", "application/json"],
    [".js", "text/javascript"],
    [".mjs", "text/javascript"],
    [".wasm", "application/wasm"],
    [".lottie", "application/zip"],
  ];
  for (const [ext, type] of required) {
    if (!source.includes(`"${ext}"`) || !source.includes(type)) {
      throw new Error(`${label} is missing ${ext} -> ${type}`);
    }
  }
}

async function waitForServer(child) {
  const deadline = Date.now() + 8000;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin + "/");
      if (response.ok) return;
      last = String(response.status);
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (child) child.kill();
  throw new Error(`preview server did not answer at ${origin} (${last})`);
}

async function bootIds(page) {
  await page.goto(origin + "/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector('a[href^="#/"]', { timeout: 15000 });
  const ids = await page.evaluate(() => {
    const section = document.querySelector("section");
    return [...section.querySelectorAll('a[href^="#/"]')].map((link) =>
      link.getAttribute("href").slice(2)
    );
  });
  if (ids.length < 61) {
    throw new Error(`expected 61 boot entries, found ${ids.length}`);
  }
  return ids;
}

async function drawn(page) {
  return page.evaluate(() => {
    const svg = document.querySelector("svg");
    const paths = svg
      ? [...svg.querySelectorAll("path")].filter((node) => (node.getAttribute("d") || "").length > 8).length
      : 0;
    const texts = svg ? svg.querySelectorAll("text").length : 0;
    return { paths, texts };
  });
}

async function checkOne(page, id) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  try {
    await page.goto("about:blank");
    await page.goto(origin + "/index.html#/" + id, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForFunction(() => {
      const root = document.getElementById("root");
      return root && root.childElementCount > 0;
    }, { timeout: 15000 });
    if (id.startsWith("lottie")) {
      await page.waitForFunction(() => {
        const path = [...document.querySelectorAll("svg path")].some(
          (node) => (node.getAttribute("d") || "").length > 8
        );
        const text = document.querySelectorAll("svg text").length > 0;
        return path || text;
      }, { timeout: 8000 });
    }
    const earlyA = await shoot(page, id.startsWith("lottie") ? 40 : 500);
    const earlyB = await shoot(page, id.startsWith("lottie") ? 400 : 1000);
    let verdict = judge(id, earlyA, earlyB, id.startsWith("lottie") ? await drawn(page) : { paths: 0, texts: 0 });
    let buf = earlyB.buf;
    if (!verdict.ok && verdict.reason === "blank") {
      const lateA = await shoot(page, 2200);
      const lateB = await shoot(page, 1000);
      verdict = judge(id, lateA, lateB, { paths: 0, texts: 0 });
      verdict.reason = verdict.ok ? `${verdict.reason}-late` : "blank";
      buf = lateB.buf;
    }
    if (errors.length) {
      verdict = { ...verdict, ok: false, reason: "pageerror", error: errors[0] };
    }
    return { id, ...verdict, buf };
  } finally {
    page.off("pageerror", onError);
  }
}

async function shoot(page, waitMs) {
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const buf = await page.screenshot({ type: "png" });
  return { buf, ...measure(buf) };
}

async function main() {
  const py = await readFile(path.join(preview, "serve-preview.py"), "utf8");
  const ps1 = await readFile(path.join(preview, "serve-preview.ps1"), "utf8");
  assertMap(py, "serve-preview.py");
  assertMap(ps1, "serve-preview.ps1");

  let child = null;
  if (!process.env.PREVIEW_URL) {
    child = spawn("python3", ["serve-preview.py", port], {
      cwd: preview,
      stdio: ["ignore", "inherit", "inherit"],
    });
  }
  await waitForServer(child);

  const index = await fetch(origin + "/").then((response) => response.text());
  const js = index.match(/assets\/index-[^"]+\.js/)?.[0];
  const css = index.match(/assets\/index-[^"]+\.css/)?.[0];
  if (!js || !css) throw new Error("preview index has no built assets");
  const types = {
    json: await contentType(origin + "/animations/galion-os-boot.json"),
    js: await contentType(origin + "/" + js),
    css: await contentType(origin + "/" + css),
    wav: await contentType(origin + "/sequences/os/boot/sounds/boot.wav"),
    svg: await contentType(origin + "/media/logos/app-g.svg"),
  };
  const expected = {
    json: "application/json",
    js: "text/javascript",
    css: "text/css",
    wav: "audio/wav",
    svg: "image/svg+xml",
  };
  for (const [key, type] of Object.entries(expected)) {
    if (types[key] !== type) {
      throw new Error(`${key} Content-Type is ${types[key] || "(missing)"}, expected ${type}`);
    }
  }
  const fonts = await fetch(origin + "/animations/galion-os-boot.json").then((response) => response.json());
  if (fonts?.fonts?.list?.[0]?.fName !== "Inter" || !fonts.fonts.list[0].fStyle) {
    throw new Error("galion-os-boot.json is missing the Inter fonts.list entry");
  }
  console.log("content-types", types);

  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const ids = await bootIds(page);
  if (shotDir) await mkdir(shotDir, { recursive: true });

  const rows = [];
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    const row = await checkOne(page, id).catch((error) => ({
      id,
      ok: false,
      reason: "error",
      ink: 0,
      diff: 0,
      error: error instanceof Error ? error.message : String(error),
      buf: null,
    }));
    if (shotDir && row.buf) {
      const name = String(index + 1).padStart(2, "0") + "-" + id + ".png";
      await writeFile(path.join(shotDir, name), row.buf);
    }
    rows.push(row);
    const mark = row.ok ? "ok" : "FAIL";
    console.log(
      `${mark}\t${id}\tink=${row.ink}\tstage=${row.stage}\tdiff=${row.diff}\t${row.reason}` +
        (row.drawn ? `\tpaths=${row.drawn.paths}\ttexts=${row.drawn.texts}` : "") +
        (row.error ? `\t${row.error}` : "")
    );
  }

  await browser.close();
  if (child) child.kill();

  const failed = rows.filter((row) => !row.ok);
  console.log(`boots ${rows.length} failed ${failed.length}`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
