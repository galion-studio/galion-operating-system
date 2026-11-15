# Swarm 9 — os — orchestrator notes

*2026-11-15 15:23 +01:00 (Europe/Zagreb).*

## What was checked

- `RULES.md` and `GITHUB-SURVEY.md` for this swarm, including the standing permission at 15:21 +01:00.
- `main` at `b9517e92815dd72196b435613ad9130abaa68336` (`git fetch origin main` on 2026-11-15 15:22 +01:00; `HEAD` and `origin/main` matched).
- `README.md`, `LICENSE`, `site/README.md`, `labs/README.md`, `docs/voice-profile/README.md`, `voice-first.md`, `hermes-later.md`, `FB0-SURFACE.md`, `PACKAGING.md`, `site/index.html`, `site/assets/site.css` (focus and reduced-motion), `.github/workflows/link-check.yml`.
- Draft #13 head `3adee77f86c3dfb8cd32f9070ad045f018e9b046`: `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`. Files on that pull request: `NOTICE`, `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, `docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md`.
- #14 merged into `cursor/os-packaging-plan-3946` at `bf222991d1c4f9f88f205cb621288d44211baa46` (2026-11-15T00:39:18Z), not into `main`.
- #7 merged at `e48f3d4f6b7f2f0e0ae77ba4784ab427fb54587d` (2026-11-02T10:13:41Z). `docs/voice-profile/he-IL/` is absent on this tree.
- #6 remains open on `cursor/remove-he-il-voice-docs-c39e` (`c63fb1df5c99c07757de75ac78f103ada75337f1`). Not edited.
- #17 draft `cursor/swarm-8-b3-os-finish-a3d9` (`37eb721385a29a65e9cb898c71cf135e5ca0a44e`). Not edited.
- Open pull requests at 15:21 +01:00: #17, #13, #6. No pull request titled `Swarm 9 os/` yet.
- `link-check` success on `b9517e9`: https://github.com/galion-studio/galion-operating-system/actions/runs/43659226573
- `link-check` success on #13 head `3adee77`: https://github.com/galion-studio/galion-operating-system/actions/runs/43722765891
- Branch protection `GET` returned 403. Rulesets returned `[]`.

## Commands

From the repository root, before this notes file was added:

```
python3 scripts/check_links.py
```

`Checked 6 HTML pages and 15 SVG files. No broken links.` Exit 0.

```
node --test scripts/test_region_prices.mjs
```

`# pass 10` / `# fail 0`. Exit 0.

`vnu.jar` — not run.

Absence checks on this tree:

```
test ! -e docs/PACKAGING.md
test ! -e docs/PACKAGING-DECISIONS.md
test ! -e NOTICE
test ! -d docs/voice-profile/he-IL
```

Each exited 0.

## What changed

- `docs/swarm-9/2026-11-15/os/PLAN.md` — lanes, file ownership, acceptance, backlog map, standing permission, merge order.
- This notes file.

## Later owner direction, recorded in PLAN.md

- 15:25 +01:00. Design direction for every lane: working, a great experience, a very small beautiful UI, one product across the OS, desktop, apps, and browsers. Reuse Branding V2 and the Open Mind style guide.
- 15:25 +01:00. The owner reported a Labs GitHub organisation. Public API checks at 15:26 +01:00 did not confirm `galion-labs` (404). `galionlabs` and `Galion-Lab` are recorded as unverified. References stay planned. No live organisation link was added.
- 15:26 +01:00. Keep going until the swarm's pull requests are green. Transfers still wait for a yes on the list in the plan. No transfer was performed.

## Open questions for Maciej

1. Merge #13 when the checklist in the plan still holds. Swarm 9 will not merge it.
2. Close #6. Swarm 8 B3 already recorded that in #17. Swarm 9 will not close it.
3. Confirm the Labs organisation slug. The kit's spelling returned 404. Two other organisations exist and were not treated as this one.
4. Approve or reject the transfer list. The proposal is to transfer nothing.
5. The Hermes binary for the later GUI profile stays your pick.
6. A 432 Hz boot tone and persistent Silence stay planned. This swarm does not build them.

## Refused or skipped

- No merge of #6, #13, or #17.
- No edit of those branches.
- No deploy. The tree has no deploy workflow.
- Local HTML validator not run on this pass.
