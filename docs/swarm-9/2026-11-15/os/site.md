# Swarm 9 os / site

*Worker lane site. 2026-11-15 15:31:08 +01:00 (Europe/Zagreb).*

The open draft titled "Swarm 9 os plan" was not on GitHub when this lane started. Open pull requests on galion-operating-system were #6 and #13. This lane stayed on the six landings in `site/`. It did not edit pull request #6, the packaging plan, voice-profile docs, the licence, or Branding V2. Nothing was deployed.

## What I checked

Served `site/` with `python3 scripts/serve_site.py --port 8765` and drove headless Chrome (`/usr/local/bin/google-chrome`) through axe-core 4.10.3.

Baseline, before the edits, at 1280×800, axe tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`: 0 violations on `/`, `/one/`, `/research/`, `/operating-system/`, `/voice/`, and `/labs/`.

Measured problems axe did not flag:

- Plus and Ultra were not labelled Planned. The status word in Branding V2 for a written price that is not on sale is Planned.
- Jumping to `#pricing` put the section label under the sticky header. At 390px the header ended at 73px and the label sat at 56px.
- Below 860px, `table { display: block }` removed the profiles table from the accessibility tree. At 390px the table role was absent.
- The current nav item was distinguished by colour alone.
- Escape did not close the mobile menu. Space on the checkbox did open it.

Document scroll width matched the viewport at 320, 390, 768, and 1280 on all six pages. No horizontal overflow.

## What changed

- Plus and Ultra carry a Planned badge and the word planned in the price copy. Free forever stays free forever. `paid_tiers` stays in the copy. There is no form and no checkout.
- `?currency=eur` still shows €20 and €220. The amounts are unchanged.
- In-page jumps use `scroll-padding-top: 5.5rem`. After the change, the pricing label sat at 144px, below the header at 73px.
- The profiles table stays `display: table`, with a caption and row headers. Chrome exposed `table: Image profiles`, the four column headers, and row headers for Galion OS Voice and Hermes GUI.
- The current page link is weight 600 and an amber underline, in the header and the footer.
- The mobile menu stays a checkbox, so it works without JavaScript. `site/assets/nav.js` closes it on Escape, on a nav link, on a click outside the header, and on `pagehide`. Escape returns focus to the checkbox.
- Under 480px the open menu is one column. Cards are two columns from 641px to 860px and one column below that. The status banner sits on solid obsidian and is left-aligned under 860px.
- The home Galion OS card links to `#status`. The Operating System card still links to `/operating-system/`.

## Commands and results

`node --test scripts/test_region_prices.mjs` — 11 tests, 11 pass, 0 fail. 2026-11-15 15:31:08 +01:00.

`python3 scripts/check_links.py` — `Checked 6 HTML pages and 15 SVG files. No broken links.`

`java -jar vnu.jar --errors-only --skip-non-html --also-check-svg site docs/brand/marks` — exit 0, no error output. Run after the HTML edits.

axe-core 4.10.3, same tags, after the edits: 0 violations on all six pages at 1280 and at 390.

Keyboard on `/labs/` at 320×640: Tab reached Skip to content, then the Galion mark, then `#nav-toggle`. Space set the checkbox and showed the nav (`display: grid`). The next Tab landed on OS. Escape cleared the checkbox, hid the nav, and returned focus to `#nav-toggle`.

Contrast, sampled from the painted pixels (most common colour in the element box) against the computed text colour:

| Text | Ratio |
|---|---|
| Banner, `#A7B6C4` on `#0A0A0C` | 9.54:1 |
| Kicker, heather on the wash, "Planned · Galion One" | 6.92:1 |
| Section label "The product" | 9.21:1 |
| Quiet button, amber | 9.29:1 |
| Current nav link, `#F5F5F7` on `#0A0A0C` | 18.17:1 |
| Other nav link, `#A7B6C4` on `#0A0A0C` | 9.54:1 |
| Planned badge, `#F5A524` on `#141418` | 9.00:1 |

All of those are above the WCAG AA 4.5:1 threshold for the sizes used. The kicker is below the solid-ground figure in Branding V2 (7.71:1) because the wash sits behind it. The token was not changed.

A local preview of the Galion One page with `?currency=eur` showed the Plus card as Planned, €20 / month, and the sentence "Planned. Billing is not live." Free forever had no Planned badge. The page had two Planned badges, `paid_tiers` in the text, no `form`, and no checkout.

## Review, 2026-11-15 15:33 +01:00

The orchestrator asked for two edits. The preview line above no longer contains a numeric address. The Labs landing now says the owner reports the organisation created and the public slug is unverified. It does not link an organisation.

## Open questions for Maciej

- The heather kicker on the wash measures 6.92:1. It passes AA. Say if the wash should be pulled back so that label matches the solid-ground figure.
- Confirm the Labs public slug. Until then the landing keeps the organisation planned and unverified.
