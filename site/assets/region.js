/* Choose USD or EUR for the prices in site/assets/prices.js.
   Order: a preview query, then the same-origin /api/region country
   (the host's CF-IPCountry header), then the Intl locale, then USD.
   This file does not call a geo service. */
(function () {
  "use strict";

  var prices = globalThis.GalionPrices;
  if (!prices || !document.documentElement) return;

  var decision = prices.resolveCurrency({
    search: location.search,
    locales: prices.readLocales(globalThis),
    country: "",
  });
  document.documentElement.dataset.currency = decision.currency;

  function refine() {
    prices.paint(document);
    if (decision.locked) return;
    prices.countryFromEndpoint("/api/region").then(function (country) {
      if (!country) return;
      var next = prices.resolveCurrency({
        search: location.search,
        locales: prices.readLocales(globalThis),
        country: country,
      });
      document.documentElement.dataset.currency = next.currency;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refine);
  } else {
    refine();
  }
})();
