import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prices = require(path.join(root, "site/assets/prices.js"));
const endpoint = await import(path.join(root, "functions/api/region.js"));

const EUROPE = new Set([
  "BY", "BG", "CZ", "HU", "PL", "MD", "RO", "RU", "SK", "UA",
  "AX", "DK", "EE", "FO", "FI", "GG", "IS", "IE", "IM", "JE", "LV", "LT", "NO", "SJ", "SE", "GB",
  "AL", "AD", "BA", "HR", "GI", "GR", "VA", "IT", "MT", "ME", "MK", "PT", "SM", "RS", "SI", "ES",
  "AT", "BE", "FR", "DE", "LI", "LU", "MC", "NL", "CH",
]);

const HTML_PAGES = [
  "site/index.html",
  "site/one/index.html",
  "site/research/index.html",
  "site/operating-system/index.html",
  "site/voice/index.html",
  "site/labs/index.html",
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("amounts are the written Plus and Ultra prices", () => {
  assert.deepEqual(prices.amounts.plus, { usd: 20, eur: 20 });
  assert.deepEqual(prices.amounts.ultra, { usd: 220, eur: 220 });
  assert.equal(prices.formatAmount("plus", "usd"), "$20");
  assert.equal(prices.formatAmount("plus", "eur"), "€20");
  assert.equal(prices.formatAmount("ultra", "usd"), "$220");
  assert.equal(prices.formatAmount("ultra", "eur"), "€220");
  assert.equal(prices.formatAmount("plus", "eur").includes("£"), false);
  assert.equal(prices.formatAmount("free", "usd"), "");
});

test("named USD countries and UN M49 Europe stay disjoint", () => {
  assert.deepEqual(prices.usdCountries, ["US", "CA", "AU", "NZ"]);
  assert.equal(prices.eurCountries.length, EUROPE.size);
  assert.deepEqual(new Set(prices.eurCountries), EUROPE);
  for (const code of prices.usdCountries) {
    assert.equal(EUROPE.has(code), false);
    assert.equal(prices.currencyForCountry(code), "usd");
  }
  for (const code of EUROPE) {
    assert.equal(prices.currencyForCountry(code), "eur");
  }
});

test("country mapping follows the region rule", () => {
  assert.equal(prices.currencyForCountry("us"), "usd");
  assert.equal(prices.currencyForCountry(" CA "), "usd");
  assert.equal(prices.currencyForCountry("AU"), "usd");
  assert.equal(prices.currencyForCountry("NZ"), "usd");
  assert.equal(prices.currencyForCountry("GB"), "eur");
  assert.equal(prices.currencyForCountry("UK"), "eur");
  assert.equal(prices.currencyForCountry("IE"), "eur");
  assert.equal(prices.currencyForCountry("DE"), "eur");
  assert.equal(prices.currencyForCountry("FR"), "eur");
  assert.equal(prices.currencyForCountry("CH"), "eur");
  assert.equal(prices.currencyForCountry("NO"), "eur");
  assert.equal(prices.currencyForCountry("JP"), "usd");
  assert.equal(prices.currencyForCountry("BR"), "usd");
  assert.equal(prices.currencyForCountry("IN"), "usd");
  assert.equal(prices.currencyForCountry("MX"), "usd");
  assert.equal(prices.currencyForCountry("ZA"), "usd");
  assert.equal(prices.currencyForCountry("SG"), "usd");
  assert.equal(prices.currencyForCountry("CY"), "usd");
  assert.equal(prices.currencyForCountry("TR"), "usd");
  assert.equal(prices.currencyForCountry("GE"), "usd");
  assert.equal(prices.currencyForCountry(""), "");
  assert.equal(prices.currencyForCountry("XX"), "");
  assert.equal(prices.currencyForCountry("T1"), "");
  assert.equal(prices.currencyForCountry("USA"), "");
  assert.equal(prices.currencyForCountry("U"), "");
  assert.equal(prices.currencyForCountry(null), "");
});

test("Intl locales use the region subtag and otherwise USD", () => {
  const cases = [
    ["en-US", "usd"],
    ["en-CA", "usd"],
    ["fr-CA", "usd"],
    ["en-AU", "usd"],
    ["en-NZ", "usd"],
    ["en-GB", "eur"],
    ["en-gb", "eur"],
    ["en_GB", "eur"],
    ["en-IE", "eur"],
    ["ga-IE", "eur"],
    ["de-DE", "eur"],
    ["fr-FR", "eur"],
    ["sv-SE", "eur"],
    ["sr-Latn-RS", "eur"],
    ["pt-BR", "usd"],
    ["es-MX", "usd"],
    ["ja-JP", "usd"],
    ["zh-Hant-TW", "usd"],
    ["en", ""],
    ["de", ""],
    ["", ""],
  ];
  for (const [locale, currency] of cases) {
    assert.equal(prices.currencyForLocale(locale), currency, locale);
  }
  assert.equal(prices.currencyFromLocales(["de", "en-GB"]), "eur");
  assert.equal(prices.currencyFromLocales(["en-US", "en-GB"]), "usd");
  assert.equal(prices.currencyFromLocales(["de", "fr"]), "usd");
  assert.equal(prices.currencyFromLocales([]), "usd");
});

test("preview query locks the currency ahead of the edge and the locale", () => {
  assert.deepEqual(
    prices.resolveCurrency({ search: "?currency=eur", locales: ["en-US"], country: "US" }),
    { currency: "eur", locked: true, source: "preview" },
  );
  assert.deepEqual(
    prices.resolveCurrency({ search: "?currency=usd", locales: ["de-DE"], country: "FR" }),
    { currency: "usd", locked: true, source: "preview" },
  );
  assert.equal(
    prices.resolveCurrency({ search: "?country=DE", locales: ["en-US"], country: "US" }).currency,
    "eur",
  );
  assert.equal(prices.resolveCurrency({ search: "?country=uk" }).currency, "eur");
  assert.equal(prices.resolveCurrency({ search: "?country=NZ" }).currency, "usd");
  assert.equal(prices.resolveCurrency({ search: "?currency=gbp", country: "GB" }).currency, "eur");
  assert.equal(prices.resolveCurrency({ search: "?country=XX", locales: ["en-GB"] }).currency, "eur");
  assert.equal(
    prices.resolveCurrency({ search: "", locales: ["en-US"], country: "DE" }).currency,
    "eur",
  );
  assert.equal(
    prices.resolveCurrency({ search: "", locales: ["de-DE"], country: "AU" }).currency,
    "usd",
  );
  assert.equal(
    prices.resolveCurrency({ search: "", locales: ["en-GB"], country: "XX" }).currency,
    "eur",
  );
  assert.equal(
    prices.resolveCurrency({ search: "", locales: ["en"], country: "" }).currency,
    "usd",
  );
});

test("locale reader keeps the browser list ahead of the resolved Intl locale", () => {
  const locales = prices.readLocales({
    navigator: { languages: ["de-DE", "en-US"], language: "de-DE" },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ locale: "en-US" }) }) },
  });
  assert.deepEqual(locales, ["de-DE", "en-US", "de-DE", "en-US"]);
  assert.equal(prices.currencyFromLocales(locales), "eur");
});

test("same-origin endpoint echoes only a country code", async () => {
  const fromDe = endpoint.countryFromHeaders(new Headers({ "CF-IPCountry": "de" }));
  assert.equal(fromDe, "DE");
  assert.equal(endpoint.countryFromHeaders({ "cf-ipcountry": " IE " }), "IE");
  assert.equal(endpoint.countryFromHeaders({ "CF-IPCountry": "GB" }), "GB");
  assert.equal(endpoint.countryFromHeaders({ "CF-IPCountry": "AU" }), "AU");
  assert.equal(endpoint.countryFromHeaders({ "CF-IPCountry": "XX" }), "");
  assert.equal(endpoint.countryFromHeaders({ "CF-IPCountry": "T1" }), "");
  assert.equal(endpoint.countryFromHeaders({ "CF-IPCountry": "UK" }), "UK");
  assert.equal(endpoint.countryFromHeaders({}), "");

  const response = await endpoint.onRequest({
    request: { headers: new Headers({ "CF-IPCountry": "FR" }) },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-type"), /^application\/json/);
  const body = await response.json();
  assert.deepEqual(body, { country: "FR" });
  assert.deepEqual(Object.keys(body), ["country"]);
  assert.equal(JSON.stringify(body).includes("."), false);

  const empty = await endpoint.handle({ headers: new Headers() });
  assert.deepEqual(await empty.json(), { country: "" });
});

test("client reads the endpoint country and ignores anything else", async () => {
  const calls = [];
  const country = await prices.countryFromEndpoint("/api/region", async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      json: async () => ({ country: "gb" }),
    };
  });
  assert.equal(country, "GB");
  assert.equal(calls[0].url, "/api/region");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.credentials, "same-origin");

  const missing = await prices.countryFromEndpoint("/api/region", async () => ({ ok: false }));
  assert.equal(missing, "");
  const unknown = await prices.countryFromEndpoint("/api/region", async () => ({
    ok: true,
    json: async () => ({ country: "XX" }),
  }));
  assert.equal(unknown, "");
  const refused = await prices.countryFromEndpoint("https://example.com/geo", async () => {
    throw new Error("must not fetch");
  });
  assert.equal(refused, "");
  const protocolRelative = await prices.countryFromEndpoint("//example.com/geo", async () => {
    throw new Error("must not fetch");
  });
  assert.equal(protocolRelative, "");
});

test("planned prices stay labelled and the pages do not check out", () => {
  const banned = ["checkout", "add to cart", "subscribe now", "buy now", "<form"];
  for (const rel of HTML_PAGES) {
    const text = read(rel);
    const badges = text.match(/<p class="badge">Planned<\/p>/g) || [];
    assert.equal(badges.length, 2, rel);
    assert.equal(text.includes("paid_tiers"), true, rel);
    assert.equal(text.includes('src="/assets/nav.js"'), true, rel);
    for (const phrase of banned) {
      assert.equal(text.toLowerCase().includes(phrase), false, `${rel} ${phrase}`);
    }
  }
  const nav = read("site/assets/nav.js");
  assert.equal(nav.includes("https://"), false);
  assert.equal(nav.includes("http://"), false);
});

test("pages show one configured amount per currency and load the scripts", () => {
  const span = /<span class="(money-usd|money-eur)" data-price="(plus|ultra)">([^<]*)<\/span>/g;
  const regionJs = read("site/assets/region.js");
  const pricesJs = read("site/assets/prices.js");
  const css = read("site/assets/site.css");
  assert.match(regionJs, /countryFromEndpoint\("\/api\/region"\)/);
  assert.equal(regionJs.includes("https://"), false);
  assert.equal(regionJs.includes("http://"), false);
  assert.equal(pricesJs.includes("https://"), false);
  assert.equal(pricesJs.includes("http://"), false);
  assert.match(css, /html\[data-currency="eur"\] \.money-usd/);
  assert.match(css, /html\[data-currency="eur"\] \.money-eur/);

  const banned = [
    "ipapi",
    "ipinfo",
    "ip-api",
    "geojs",
    "ipwho",
    "cdn-cgi",
    "geolocation",
  ];
  for (const rel of HTML_PAGES) {
    const text = read(rel);
    assert.equal(text.includes('src="/assets/prices.js"'), true, rel);
    assert.equal(text.includes('src="/assets/region.js"'), true, rel);
    assert.equal(text.includes("$20 / €20"), false, rel);
    assert.equal(text.includes("$220 / €220"), false, rel);
    const found = [...text.matchAll(span)];
    assert.ok(found.length >= 4, rel);
    const seen = new Map();
    for (const match of found) {
      const key = `${match[2]}:${match[1] === "money-eur" ? "eur" : "usd"}`;
      const expected = prices.formatAmount(match[2], match[1] === "money-eur" ? "eur" : "usd");
      assert.equal(match[3], expected, `${rel} ${key}`);
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    for (const key of ["plus:usd", "plus:eur", "ultra:usd", "ultra:eur"]) {
      assert.ok(seen.get(key) >= 1, `${rel} missing ${key}`);
    }
    const bundle = `${text}\n${regionJs}\n${pricesJs}`;
    for (const name of banned) {
      assert.equal(bundle.toLowerCase().includes(name), false, `${rel} ${name}`);
    }
  }
});

test("local server echoes CF-IPCountry and does not invent a country", async () => {
  const server = spawn("python3", [path.join(root, "scripts/serve_site.py"), "--port", "0"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let port = 0;
  let stdout = "";
  try {
    port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("server did not print a port")), 8000);
      server.stdout.on("data", (chunk) => {
        stdout += chunk.toString("utf8");
        const match = stdout.match(/PORT (\d+)/);
        if (match) {
          clearTimeout(timer);
          resolve(Number(match[1]));
        }
      });
      server.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`server exited ${code}`));
      });
    });

    async function region(headers) {
      const response = await fetch(`http://127.0.0.1:${port}/api/region`, { headers });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(body), ["country"]);
      return body.country;
    }

    assert.equal(await region({ "CF-IPCountry": "DE" }), "DE");
    assert.equal(await region({ "CF-IPCountry": "US" }), "US");
    assert.equal(await region({ "CF-IPCountry": "GB" }), "GB");
    assert.equal(await region({ "CF-IPCountry": "IE" }), "IE");
    assert.equal(await region({ "CF-IPCountry": "NZ" }), "NZ");
    assert.equal(await region({ "CF-IPCountry": "XX" }), "");
    assert.equal(await region({}), "");

    const home = await fetch(`http://127.0.0.1:${port}/?currency=eur`);
    const html = await home.text();
    assert.equal(home.status, 200);
    assert.equal(html.includes('data-price="plus"'), true);
    assert.equal(html.includes("€20"), true);
    assert.equal(html.includes("$20"), true);
  } finally {
    server.kill("SIGTERM");
  }
});
