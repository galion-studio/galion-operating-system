# Galion landing pages

*Maciej Grajczyk · 2026-11-14 (Europe/Zagreb, CET, UTC+1).*

Static pages for galion.app. HTML and CSS, one small stylesheet, self-hosted fonts, no JavaScript, no tracking, no payment form. galion.app is the only domain. One nav links every path.

| Path | File | Page |
|---|---|---|
| `/` | [index.html](index.html) | Galion OS, the home page. Free forever. Open source. |
| `/one/` | [one/index.html](one/index.html) | Galion One. Plus, $20 / €20 per month. |
| `/research/` | [research/index.html](research/index.html) | Galion Research. Ultra, $220 / €220 one-time. |
| `/operating-system/` | [operating-system/index.html](operating-system/index.html) | Profiles and documents for the operating system. |
| `/voice/` | [voice/index.html](voice/index.html) | Galion Voice, the voice model inside Galion One. Not a separate product. |
| `/labs/` | [labs/index.html](labs/index.html) | Galion Labs. |

The same pricing section is on each page. Billing is not live. `paid_tiers` stays false. Nothing on these pages takes a card.

Each page ends with the four Galion Labs lines and the MIT licence text from the repository `LICENSE`.

Samantha V2 has her own section on the Galion One page and on the voice-model page. The learned emotion detector is in development.

## Preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. That serves your own machine. It is not a deployment. Choosing a host, approving a deploy, and any DNS change are the owner's steps. This repository does not do them.

The marks are the SVG files in [`../docs/brand/marks/`](../docs/brand/marks/). The guide is [`../docs/brand/BRANDING-V2.md`](../docs/brand/BRANDING-V2.md).

— Maciej Grajczyk
