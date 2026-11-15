/* Galion prices. Edit the amounts in this file.
   Plus is Galion One. Ultra is Galion Research.
   Free forever is Galion OS and has no amount.

   A visitor in Europe sees euros. Europe is UN M49 geographic Europe
   (region 150), which includes the United Kingdom (GB) and Ireland (IE).
   The United States, Canada, Australia, New Zealand, and everywhere else
   see US dollars. Cyprus is Western Asia in UN M49, so it is not in the
   Europe list. */
(function (root) {
  "use strict";

  var amounts = {
    plus: { usd: 20, eur: 20 },
    ultra: { usd: 220, eur: 220 },
  };

  /* Named so the rule is easy to read. Any country outside Europe is also USD. */
  var usdCountries = ["US", "CA", "AU", "NZ"];

  var eurCountries = [
    /* Eastern Europe */
    "BY", "BG", "CZ", "HU", "PL", "MD", "RO", "RU", "SK", "UA",
    /* Northern Europe */
    "AX", "DK", "EE", "FO", "FI", "GG", "IS", "IE", "IM", "JE", "LV", "LT", "NO", "SJ", "SE", "GB",
    /* Southern Europe */
    "AL", "AD", "BA", "HR", "GI", "GR", "VA", "IT", "MT", "ME", "MK", "PT", "SM", "RS", "SI", "ES",
    /* Western Europe */
    "AT", "BE", "FR", "DE", "LI", "LU", "MC", "NL", "CH",
  ];

  var europe = new Set(eurCountries);

  function normalizeCountry(value) {
    if (typeof value !== "string") return "";
    var code = value.trim().toUpperCase();
    /* UK is the common name. The ISO 3166-1 alpha-2 code is GB. */
    if (code === "UK") code = "GB";
    if (!/^[A-Z]{2}$/.test(code)) return "";
    /* Cloudflare uses XX when the country is unknown, and T1 for Tor. */
    if (code === "XX" || code === "T1") return "";
    return code;
  }

  function currencyForCountry(value) {
    var code = normalizeCountry(value);
    if (!code) return "";
    return europe.has(code) ? "eur" : "usd";
  }

  function regionFromLocale(locale) {
    if (typeof locale !== "string" || !locale.trim()) return "";
    var tag = locale.trim().replace(/_/g, "-");
    try {
      if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
        var parsed = new Intl.Locale(tag);
        if (parsed.region) return String(parsed.region);
      }
    } catch (error) {
      /* Try the subtag split below. */
    }
    var parts = tag.split("-");
    for (var i = 1; i < parts.length; i += 1) {
      if (/^[A-Za-z]{2}$/.test(parts[i]) || /^[0-9]{3}$/.test(parts[i])) {
        return parts[i].toUpperCase();
      }
    }
    return "";
  }

  function currencyForLocale(locale) {
    var region = regionFromLocale(locale);
    if (!region) return "";
    return currencyForCountry(region);
  }

  function currencyFromLocales(locales) {
    var list = Array.isArray(locales) ? locales : [];
    for (var i = 0; i < list.length; i += 1) {
      var currency = currencyForLocale(list[i]);
      if (currency) return currency;
    }
    return "usd";
  }

  function readLocales(scope) {
    var locales = [];
    var nav = scope && scope.navigator;
    if (nav && nav.languages && typeof nav.languages.length === "number") {
      for (var i = 0; i < nav.languages.length; i += 1) locales.push(nav.languages[i]);
    }
    if (nav && nav.language) locales.push(nav.language);
    try {
      var intl = (scope && scope.Intl) || Intl;
      locales.push(intl.DateTimeFormat().resolvedOptions().locale);
    } catch (error) {
      /* No locale. The caller falls through to USD. */
    }
    return locales;
  }

  function formatAmount(tier, currency) {
    var row = amounts[tier];
    if (!row) return "";
    var code = currency === "eur" ? "eur" : "usd";
    var symbol = code === "eur" ? "€" : "$";
    return symbol + String(row[code]);
  }

  function currencyFromSearch(search) {
    var query = typeof search === "string" ? search : "";
    if (query.charAt(0) === "?") query = query.slice(1);
    var params = new URLSearchParams(query);
    var currency = String(params.get("currency") || "").trim().toLowerCase();
    if (currency === "usd" || currency === "eur") {
      return { currency: currency, locked: true, source: "preview" };
    }
    var country = params.get("country");
    if (country && normalizeCountry(country)) {
      return { currency: currencyForCountry(country), locked: true, source: "preview" };
    }
    return { currency: "", locked: false, source: "" };
  }

  function resolveCurrency(input) {
    var options = input || {};
    var preview = currencyFromSearch(options.search || "");
    if (preview.locked) return preview;
    var fromEdge = currencyForCountry(options.country || "");
    if (fromEdge) return { currency: fromEdge, locked: false, source: "edge" };
    return {
      currency: currencyFromLocales(options.locales || []),
      locked: false,
      source: "locale",
    };
  }

  function paint(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    var nodes = doc.querySelectorAll("[data-price]");
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var tier = node.getAttribute("data-price");
      var currency = node.classList && node.classList.contains("money-eur") ? "eur" : "usd";
      var text = formatAmount(tier, currency);
      if (text) node.textContent = text;
    }
  }

  async function countryFromEndpoint(url, fetchImpl) {
    if (typeof url !== "string" || url.charAt(0) !== "/" || url.charAt(1) === "/") return "";
    var doFetch = fetchImpl;
    if (typeof doFetch !== "function") {
      if (typeof fetch !== "function") return "";
      doFetch = fetch;
    }
    try {
      var init = {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        redirect: "error",
      };
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        init.signal = AbortSignal.timeout(1500);
      }
      var response = await doFetch(url, init);
      if (!response || !response.ok) return "";
      var data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return "";
      if (typeof data.country !== "string") return "";
      return normalizeCountry(data.country);
    } catch (error) {
      return "";
    }
  }

  var api = {
    amounts: amounts,
    usdCountries: usdCountries,
    eurCountries: eurCountries,
    normalizeCountry: normalizeCountry,
    currencyForCountry: currencyForCountry,
    currencyForLocale: currencyForLocale,
    currencyFromLocales: currencyFromLocales,
    readLocales: readLocales,
    formatAmount: formatAmount,
    currencyFromSearch: currencyFromSearch,
    resolveCurrency: resolveCurrency,
    paint: paint,
    countryFromEndpoint: countryFromEndpoint,
  };

  root.GalionPrices = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
