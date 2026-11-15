# Swarm 8 — B3 — Galion OS finish

*2026-11-15 (Europe/Zagreb, CET, UTC+1).*

Read first, then a small update of files that already exist. No second licence, no new brand, no new app, no second packaging plan.

## What was read

- `LICENSE` and `docs/brand/BRANDING-V2.md` on this repository's `main` (`b9517e9`).
- `docs/voice-profile/` (`README.md`, `voice-first.md`, `hermes-later.md`, `FB0-SURFACE.md`, `PACKAGING.md`).
- Pull request #13, branch `cursor/os-packaging-plan-3946`: `docs/PACKAGING.md` and `docs/PACKAGING-DECISIONS.md`. Not edited. Another agent owns that draft.
- `galion-studio/hermes-research` `README.md` on main. The desk is that app: Found, Inferred, Unknown; 432 Hz cues; Silence; `research_session`; Offline and Local; loopback port 8787. Not copied here.
- `galion-studio/obsidian-open-mind` `docs/desktop/README.md` and `brand/STYLE-GUIDE.md` on main. `openmind-desktop` listens on loopback port 18181. `/one` and `/research` are entry pages in that binary. The console probe stays on 18080. Port 18081 is not this console. The Open Mind style guide is Inter and Sky for that repository. These landing pages stay on Branding V2: Jost, IBM Plex, the voice ground.

## Pull request #6

Superseded. Recommend closing it. This agent did not close it, merge it, or force-push it.

The only commit on `cursor/remove-he-il-voice-docs-c39e` is `c63fb1d`. Its tree is `e386ad9406470c57ee0cd482e00e404b6bca4446`, the same tree as `e48f3d4`, which landed on main as "docs: remove the Hebrew/Israel Galion OS Voice profile (#7)" on 2026-11-02. `docs/voice-profile/he-IL/` is not on main. A merge of that branch into current main produces main's tree (`aee86fd5bc1ccf98b705512dafd37f80d0d2880b` at `b9517e9`). There is no remaining diff and no conflict to repair. The link-check workflow has no check run on that commit.

## Licence

Left as it is. `LICENSE` on main is the canonical text: the four G.A.L.I.O.N. lines, then the standard MIT grant, with `Copyright (c) 2026 Galion Labs`. No wording was added.

## Pricing

Checked, not changed. `paid_tiers` stays false. Plus is $20 / €20 per month. Ultra is $220 / €220 per month. `node --test scripts/test_region_prices.mjs` on this tree: 10 tests, 10 passed, 0 failed.

## What changed

The profile notes still pointed at pull request #1 as if it were open. #1 merged on 2026-11-02, and the Profiles section is already on the root README.

- `docs/voice-profile/README.md` now points at that Profiles section, and at `FB0-SURFACE.md` and `PACKAGING.md` in the same folder.
- `docs/voice-profile/FB0-SURFACE.md` no longer calls the profiles text an open change.
- The root README links the long form.
- `site/operating-system/index.html` links those existing notes, the README, the licence, and the `openmind-desktop` README. It does not restate a port.
- `site/assets/site.css` used a `.footer` selector that matched nothing. Footer links now use `.site-footer`, so the amber underline already used in the prose applies there too.

`python3 scripts/check_links.py`: 6 HTML pages, 15 SVG files, no broken links. `vnu.jar` on `site/` and `docs/brand/marks/`: no errors. A local preview of the operating-system page shows the new console link. A 390 px wide view of the home page shows the menu button, the dot, and the two actions, with no horizontal overflow.

## Left in place

No `FRXDEL STUDIOS` string in tracked files. No private-key or token pattern in tracked files. The only dotted IPv4 literals are the loopback address already used by the local preview, its test, and the voice packaging note. They match the loopback bind in `openmind-desktop` and in the research desk. They were not rewritten.

Pull request #13 was not edited. `SOUL.md`, `config.yaml`, and `LOCKS.toml` are not in this repository. Nothing was deployed.

## For Maciej

1. Close pull request #6. The removal is already on main as #7.
2. Leave pull request #13 with its owner. The image plan and the recommendations stay on that branch.
3. `LICENSE` needs no edit.
4. This change is the pointer fix above. Billing stays off.
