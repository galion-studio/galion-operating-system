/* Same-origin country endpoint for the landing pages.
   Reads the CF-IPCountry header the host already set and returns
   {"country":"DE"}. It does not call a geo service and it does not
   return an address. Hosting this file is the owner's decision. */

const HEADER = "cf-ipcountry";

function headerValue(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(name.toUpperCase()) || "";
  }
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].toLowerCase() === name) return headers[keys[i]];
  }
  return "";
}

export function countryFromHeaders(headers) {
  const code = String(headerValue(headers, HEADER) || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  if (code === "XX" || code === "T1") return "";
  return code;
}

export function regionBody(country) {
  return JSON.stringify({ country: country || "" });
}

export function handle(request) {
  const country = countryFromHeaders(request && request.headers);
  return new Response(regionBody(country), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function onRequest(context) {
  return handle(context.request);
}

const runningAsCli =
  typeof process !== "undefined" &&
  process.env &&
  process.env.GALION_REGION_CLI === "1";

if (runningAsCli) {
  const country = countryFromHeaders({
    "cf-ipcountry": process.env.GALION_CF_IPCOUNTRY || "",
  });
  process.stdout.write(regionBody(country));
}
