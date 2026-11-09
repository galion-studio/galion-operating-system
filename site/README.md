# Galion landing pages

*Maciej Grajczyk · 2026-11-09 (Europe/Zagreb, CET, UTC+1).*

Static pages for the Galion ecosystem. HTML and CSS, one small stylesheet, self-hosted fonts, no JavaScript, no tracking, no payment form.

| Page | File |
|---|---|
| Galion, the ecosystem | [index.html](index.html) |
| Galion OS | [os/index.html](os/index.html) |
| Galion One | [one/index.html](one/index.html) |
| Galion Research | [research/index.html](research/index.html) |
| Galion Voice | [voice/index.html](voice/index.html) |
| Galion Labs | [labs/index.html](labs/index.html) |

Planned pricing (Local free forever, Plus, Ultra) is a section on each page. Billing is not implemented. `paid_tiers` stays false.

Samantha V2 has her own section on the Galion One page and the Galion Voice page. The learned emotion detector is in development.

## Preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. That serves your own machine. It is not a deployment. Choosing a host, and approving a deploy, is the owner's step.

The marks are the SVG files in [`../docs/brand/marks/`](../docs/brand/marks/). The guide is [`../docs/brand/BRANDING-V2.md`](../docs/brand/BRANDING-V2.md).

— Maciej Grajczyk
