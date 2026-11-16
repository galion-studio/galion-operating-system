# Galion landing pages

*Maciej Grajczyk · 2026-11-14 (Europe/Zagreb, CET, UTC+1).*

Static pages for galion.app. HTML and CSS, one small stylesheet, self-hosted fonts, and two small scripts that choose the currency. No tracking, no payment form. galion.app is the only domain. One nav links every path.

These editorial pages use [`assets/site.css`](assets/site.css) and the voice ground in the brand guide. Product surfaces share [`assets/tokens.css`](assets/tokens.css): Open Mind colour, type, and spacing. The welcome page embeds that file. These pages do not.

| Path | File | Page |
|---|---|---|
| `/` | [index.html](index.html) | Galion OS, the home page. Free forever. Open source. |
| `/one/` | [one/index.html](one/index.html) | Galion One. Plus, $20 / €20 per month. |
| `/research/` | [research/index.html](research/index.html) | Galion Research. Ultra, $220 / €220 per month. |
| `/operating-system/` | [operating-system/index.html](operating-system/index.html) | Profiles and documents for the operating system. |
| `/voice/` | [voice/index.html](voice/index.html) | Galion Voice, the voice model inside Galion One. Not a separate product. |
| `/labs/` | [labs/index.html](labs/index.html) | Galion Labs. |

The same pricing section is on each page. Plus and Ultra are labelled Planned. Billing is not live. `paid_tiers` stays false. Nothing on these pages takes a card.

## Prices

The amounts are in [`assets/prices.js`](assets/prices.js). Plus is Galion One. Ultra is Galion Research. Free forever is Galion OS, MIT, open source.

| Visitor | Currency |
|---|---|
| United States, Canada, Australia, New Zealand | US dollars |
| Europe, including the United Kingdom and Ireland | Euros |
| Anywhere else | US dollars |

Europe here is UN M49 geographic Europe. The United Kingdom and Ireland are in that list.

The page asks `/api/region` for a country code. That endpoint only reads the `CF-IPCountry` header the host already set. It does not call a geo service. If the header is missing, the page uses the browser's `Intl` locale. A locale with no region shows US dollars.

`?currency=usd` and `?currency=eur` lock a preview. `?country=DE` previews one country code.

[`../functions/api/region.js`](../functions/api/region.js) is the endpoint. [`../scripts/serve_site.py`](../scripts/serve_site.py) serves the pages and that endpoint on your own machine. It is not a deployment.

Each page ends with the four Galion Labs lines and the MIT licence text from the repository `LICENSE`.

Samantha V2 has her own section on the Galion One page and on the voice-model page. The learned emotion detector is in development.

## Preview

From the repository root, with the country header available:

```sh
python3 scripts/serve_site.py
```

Then open `http://127.0.0.1:8765/`. From this directory, `python3 -m http.server 8765` still serves the HTML. Without `/api/region`, the locale fallback is what runs. Either command serves your own machine. It is not a deployment. Choosing a host, approving a deploy, and any DNS change are the owner's steps. This repository does not do them.

The marks are the SVG files in [`../docs/brand/marks/`](../docs/brand/marks/). The guide is [`../docs/brand/BRANDING-V2.md`](../docs/brand/BRANDING-V2.md).

— Maciej Grajczyk
