# Swarm 9 — os — plan

*Orchestrator reading · 2026-11-15 15:23 +01:00 (Europe/Zagreb).*

Repository: [galion-studio/galion-operating-system](https://github.com/galion-studio/galion-operating-system). Base for this plan: `main` at `b9517e92815dd72196b435613ad9130abaa68336`.

This file is the shared plan. Workers read it on the open draft pull request titled **Swarm 9 os plan**, and on `main` after that pull request merges. Each worker stays in one lane. Notes for a lane go in that lane's own draft pull request.

## Design direction

Owner direction, 2026-11-15 15:25 +01:00. It applies to every Swarm 9 lane.

Ship something that works. A genuinely great experience matters more than a perfect surface. The UI stays very small and beautiful. The operating system, the desktop, the apps, and the browsers on Linux should feel like one product: one boot, one console, one research handoff, one set of pages. Prefer a working connected flow over extra polish.

Reuse [docs/brand/BRANDING-V2.md](../../../../brand/BRANDING-V2.md) in this repository and `brand/STYLE-GUIDE.md` in [obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind). Do not invent a new visual language, a new palette, or a new wordmark.

What that means in each lane:

- **Packaging.** The dry-run prints one image story: Ubuntu 26.04, `galion-init`, the console on port 18181, research on port 8787, static pages as files. It does not build a second image and it does not play the 432 Hz tone.
- **galion-init.** The prototype prints one boot that hands the desktop console to research at `/one`. It does not draw a screen.
- **Site.** Polish the pages that already exist. Keep Branding V2 (Jost, IBM Plex, obsidian, amber, violet). Keep the skip link, the focus ring, and reduced motion. Do not add a new stylesheet language.

## Standing permission and merge order

Owner standing permission, by voice, 2026-11-15 15:21 +01:00. It applies to Swarm 9 only. It supersedes the earlier Swarm 9 rule that the orchestrator must not merge.

The orchestrator is the merge authority for Swarm 9 pull requests in this repository (this plan, and the three worker pull requests). A merge happens only when all of the following are true on the **current head**:

1. Every required CI check and every non-skipped CI check is green.
2. The orchestrator has re-run the local tests for that head.
3. The orchestrator's review has nothing open.

The merge is a normal merge commit. One pull request at a time. The next branch is updated from `main` and CI runs again on that new head before the next merge. Workers mark their own pull request ready when their checks are green. Workers do not merge.

15:26 +01:00: continue until the three worker pull requests are finished and their checks are green. Work already described in this plan does not wait for another approval. A repository transfer still waits for the owner's yes on the list below.

After a merge, a workflow that already exists in this repository may run on the push to `main`. The tree on `b9517e9` has one workflow, `.github/workflows/link-check.yml` (`pull_request`, and `push` to `main`). It is a check, and it is the run to report. This plan adds no deploy workflow, no Pages config, and no server step. Agents have no server credentials and do not request any.

Still forbidden, including under this permission: force-push, history rewrite, bypassing branch protection, an admin merge, skipping or disabling a check, deleting a branch that still has unmerged work, secrets or IPv4 literals in commits, comments, or logs, DNS, Cloudflare, HADES, firewall, and edits to `SOUL.md`, `config.yaml`, or `LOCKS.toml`. Pull requests outside Swarm 9 stay with their owners. Owner decisions stay recorded. This plan does not settle a new one.

### Merge order

| Order | Pull request title | When it merges |
|---|---|---|
| 1 | Swarm 9 os plan | First. Docs only. Later lanes update from the `main` that contains this file. |
| 2 | Swarm 9 os/galion-init | After order 1 is on `main`, the branch is updated, and the new head is green. |
| 3 | Swarm 9 os/packaging | After order 2, or after order 1 if the galion-init pull request is blocked on a review finding. Update from `main` first. |
| 4 | Swarm 9 os/site | Last. Draft [#17](https://github.com/galion-studio/galion-operating-system/pull/17) (Swarm 8 B3) also edits two site files. The site lane waits for a clean rebase onto the `main` that contains orders 1–3. |

A blocked lane is reported. The next lane merges only when its files do not depend on the blocked lane. Orders 2 and 3 do not edit the same paths. Order 4 does not edit orders 2 or 3.

## Owner decisions already on record

These are closed. Lanes implement them. Lanes do not reopen them.

Read from draft [#13](https://github.com/galion-studio/galion-operating-system/pull/13), head `3adee77f86c3dfb8cd32f9070ad045f018e9b046`, file `docs/PACKAGING.md` §10, decided 2026-11-15 15:00 CET:

| Id | Decision |
|---|---|
| D1 | Desktop base is Ubuntu 26.04 LTS. Manifest `base` is `ubuntu-26.04`. Node is `/usr/bin/node` from that release's `nodejs` package, 22.22.1. `unattended-upgrades` stays off the image. |
| D2 | PID 1 is `galion-init`. The image does not boot until that binary exists and can mount filesystems, bring up loopback, set the clock, and supervise the console and the research process. Systemd units stay reference. `galion-boot` is not the boot path. |
| D3 | The first image follows the desktop crate. A 432 Hz boot tone stays planned. Persistent Silence stays planned. The skeleton does not play audio and does not add a Silence file. |
| D4 | Static pages stay files. Research reaches One at `/one` on port 18181, http on the IPv4 loopback interface. Research `PORT` is 8787. `GALION_RESEARCH_URL`, `GALION_LLM`, `GALION_LLM_URL`, and `GALION_LLM_KEY` stay unset. |
| D5 | The licence is `LICENSE` on `main`, byte for byte. `NOTICE` names that file and does not restate it. The copyright holder in `LICENSE` is Galion Labs. |

Voice-profile notes on `main` stay the contract for `galion-init`, `galion-voiced`, and `galion-probe`. This repository still has no binaries. The Hermes build (Rust gateway or the published Python line) stays an owner pick in `docs/voice-profile/hermes-later.md`. Recorded here. Not chosen by this swarm.

`paid_tiers` stays false. Plus and Ultra remain planned copy. No billing file changes.

## Lanes

Three workers. Paths do not overlap. A file not listed under a lane is outside that lane. Shared paths that no lane owns are listed after the lanes.

Pull request title, base `main`, draft until that worker's checks are green:

| Lane | Title |
|---|---|
| packaging | Swarm 9 os/packaging |
| galion-init | Swarm 9 os/galion-init |
| site | Swarm 9 os/site |

### 1. Packaging

Dry-run image skeleton taken from [#13](https://github.com/galion-studio/galion-operating-system/pull/13), plus a fresh merge-readiness checklist so the owner can merge #13.

Branch from current `main`. Do not push to `cursor/os-packaging-plan-3946`. Do not edit the four files #13 already adds: `NOTICE`, `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, `docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md`. [#14](https://github.com/galion-studio/galion-operating-system/pull/14) merged into that branch (`merged_at` 2026-11-15T00:39:18Z, merge commit `bf222991d1c4f9f88f205cb621288d44211baa46`, base `cursor/os-packaging-plan-3946`). Its file is on #13, and it is absent on `main`. Merging the packaging lane must not be the act that lands #13.

**Files this lane owns**

- `packaging/**`
- `docs/swarm-9/2026-11-15/os/packaging.md`
- `docs/swarm-9/2026-11-15/os/pr-13-merge-readiness.md`

**Work**

- `packaging/README.md` states that this is a dry-run skeleton of #13 §7. Job 4 stays off until `galion-init` exists and the owner asks for a workflow. This lane adds no workflow.
- `packaging/dry-run.sh` prints the manifest pins and the file list the image would assemble. Pins: `name` `galion-os`, `profile` `desktop`, `base` `ubuntu-26.04`, `arch` `x86_64`, `node` `22.22.1`, `init` `galion-init` (absent), `weights` `none`. Listeners: `openmind-desktop` with no listen address (port 18181) and `node src/server.js` with `PORT=8787`. `GALION_ONE_URL` is described as http on the IPv4 loopback interface, port 18181, path `/one`, with no dotted address written in the file.
- With no arguments the script exits 0 and writes no image, no root filesystem, and no download.
- `--execute` exits 2 and writes nothing.
- The script does not call `apt`, does not fetch an Ubuntu image, and does not run a disc builder.
- The checklist file re-runs the readings in [Backlog map](#backlog-map) item P1 and records the command output, the #13 head SHA, and the link-check URL for that head.

**Acceptance**

- `sh packaging/dry-run.sh` exits 0. `sh packaging/dry-run.sh --execute` exits 2. Both outputs are pasted in `packaging.md`.
- `git diff --name-only origin/main` lists only this lane's paths.
- No dotted IPv4 literal, no secret, no `.wav`, no weight file.
- `python3 scripts/check_links.py` and `node --test scripts/test_region_prices.mjs` are re-run. On this plan's tree, before these docs, the first printed `Checked 6 HTML pages and 15 SVG files. No broken links.` (exit 0) and the second printed `# pass 10` / `# fail 0` (exit 0). Local `vnu.jar` was not run on this plan pass.
- CI `link-check` green on the current head. Workflow file: `.github/workflows/link-check.yml`.

### 2. galion-init

Design and a dry-run prototype from the voice-profile docs on `main`. Desktop supervision comes from #13 D2, read from that pull request, not copied into a second packaging plan.

**Files this lane owns**

- `galion-init/**`
- `docs/swarm-9/2026-11-15/os/galion-init.md`

**Work**

- `galion-init/README.md` is the design. It cites `docs/voice-profile/PACKAGING.md` §3 and §6 and `docs/voice-profile/voice-first.md`. `galion-init` is static musl PID 1. It mounts filesystems, brings the network up far enough that loopback exists, sets the clock, and supervises. The production voice image has no shell.
- `galion-init/prototype.sh` prints a boot plan and does not become PID 1.
  - `sh galion-init/prototype.sh voice` — supervise `galion-voiced` after ALSA. The binary is absent. `/dev/fb0` may be missing; that is a normal boot. No display server.
  - `sh galion-init/prototype.sh desktop` — supervise `/opt/galion/openmind-desktop/openmind-desktop` with no listen address, user `galion`, port 18181; then `/usr/bin/node src/server.js` in `/opt/galion/research/current`, user `galion`, `PORT=8787`, `GALION_ONE_URL` as in D4. Do not start `galion-voiced`. Do not start the Rust `galion-one` binary.
  - No argument prints both plans and exits 0.
  - `--execute` exits 2.
- The prototype does not open a socket, install a unit, play a tone, or write a Silence file. The 432 Hz boot tone stays planned.
- No repo-root Cargo workspace. No `galion-voiced`, `galion-probe`, or weight artifact.

**Acceptance**

- The three `sh galion-init/prototype.sh` invocations above exit 0, 0, and 2, and the output is pasted in `galion-init.md`.
- `git diff --name-only origin/main` lists only this lane's paths.
- Voice-profile files are unchanged.
- Same link-check and region-price commands as the packaging lane, re-run, plus CI `link-check` green on the current head.

### 3. Site

Polish and accessibility on the existing landing pages. The site stays a local preview. It is not deployed.

**Files this lane owns**

- `site/**`, except the two files draft [#17](https://github.com/galion-studio/galion-operating-system/pull/17) currently edits: `site/assets/site.css` and `site/operating-system/index.html` (head `37eb721385a29a65e9cb898c71cf135e5ca0a44e`). Leave those two files untouched while #17 is open. If a polish change needs them, say so in `site.md` and wait. Do not push to `cursor/swarm-8-b3-os-finish-a3d9`.
- `docs/swarm-9/2026-11-15/os/site.md`

**Work**

- Keep `lang="en"`, the skip link, `:focus-visible`, `prefers-reduced-motion`, `aria-current`, and the primary nav label.
- Check each page this lane edits: one accessible name on the menu control, heading order, decorative images still `alt=""`.
- Keep `paid_tiers` false. Keep the sentence that billing is not live. Add no checkout, no payment form, no new domain.
- Do not serve the site anywhere but the local preview. `scripts/serve_site.py` stays a local server. This lane does not edit `scripts/`.

**Acceptance**

- `python3 scripts/check_links.py` exits 0. Paste the output. The workflow job `link-check` is green on the current head. That job also runs `node --test scripts/test_region_prices.mjs` and `vnu.jar --errors-only` on `site/` and `docs/brand/marks/`.
- If `site/assets/prices.js` or `site/assets/region.js` changes, `node --test scripts/test_region_prices.mjs` is pasted too. Prefer to leave both files unchanged.
- `git diff --name-only origin/main` lists only this lane's paths, and does not list `site/assets/site.css` or `site/operating-system/index.html` while #17 is open.
- No deploy, no DNS change, no hosting change. The notes say the site was not deployed.

## Backlog map

| Id | Item | Lane | What that lane does |
|---|---|---|---|
| P1 | `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, and `NOTICE` exist only on the #13 branch. #14 shows as merged. Its base was the #13 branch, so the file is not on `main`. | packaging | Write `docs/swarm-9/2026-11-15/os/pr-13-merge-readiness.md`. The owner merges #13. This swarm does not. |
| S1 | Link-check stays green. The site is not deployed. | site | Acceptance above. The lane does not add a deploy. |
| O1 | Labs GitHub organisation. The owner reported it created at 15:25 +01:00. Public API checks at 15:26 +01:00 did not confirm a slug. | none | Unverified. References stay planned. No lane creates an organisation, and no lane transfers a repository. |
| R1 | [#6](https://github.com/galion-studio/galion-operating-system/pull/6) removes `docs/voice-profile/he-IL/`. [#7](https://github.com/galion-studio/galion-operating-system/pull/7) already landed that removal (`merged_at` 2026-11-02T10:13:41Z, merge commit `e48f3d4f6b7f2f0e0ae77ba4784ab427fb54587d`). `docs/voice-profile/he-IL/` is absent on `main` at `b9517e9`. Swarm 8 B3 owns #6. B3's draft #17 asks the owner to close #6. | none | Recorded. Swarm 9 does not edit, close, or merge #6 or #17. |

### P1 checklist for the owner

Orchestrator reading at 15:23 +01:00. The packaging lane re-checks these on its own head and writes the results to `pr-13-merge-readiness.md`.

- [ ] `main` still lacks `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, and `NOTICE`. On `b9517e9` all three were absent (`test ! -e` for each, 2026-11-15 15:21 +01:00).
- [ ] #13 head still contains those three files plus `docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md`. Head read: `3adee77f86c3dfb8cd32f9070ad045f018e9b046`. `NOTICE` is the single line `The licence is LICENSE.`
- [ ] #14 is merged into `cursor/os-packaging-plan-3946`, not into `main`. Merge commit `bf222991d1c4f9f88f205cb621288d44211baa46`.
- [ ] #13 is still a draft. Base is `main`. `mergeable` was `true` and `mergeable_state` was `clean` when read at 15:19 +01:00. The owner marks it ready and merges it. An agent does not.
- [ ] §10 still matches D1–D5 above.
- [ ] `LICENSE` on `main` is unchanged. It starts with the four G.A.L.I.O.N. lines and `Copyright (c) 2026 Galion Labs`.
- [ ] The #13 diff adds no workflow, image, release, or price change.
- [ ] `link-check` on `3adee77` succeeded: [run 43722765891](https://github.com/galion-studio/galion-operating-system/actions/runs/43722765891). The job does not scan Markdown. `link-check` on `main` `b9517e9` succeeded: [run 43659226573](https://github.com/galion-studio/galion-operating-system/actions/runs/43659226573).
- [ ] After the owner merges #13, `main` contains `NOTICE`, `docs/PACKAGING.md`, and `docs/PACKAGING-DECISIONS.md`.

### O1. Labs organisation, unverified

The kit in `labs/README.md` spells a future organisation name. That spelling is a candidate, not a confirmed slug. Checked with the public GitHub API at 2026-11-15 15:26 +01:00:

| Candidate | Result |
|---|---|
| `galion-labs` | `GET /users/galion-labs` returned 404. |
| `galionlabs` | Organisation id `184885785`, created 2024-10-14, display name "Galion Labs", blog `galionlabs.vercel.app`, 0 public repos, `updated_at` 2025-01-09. Not created today. |
| `Galion-Lab` | Organisation id `352079080`, created 2026-11-03, display name "Galion Lab", 0 public repos. |
| Search `galion type:org created:>=2026-11-14` | `total_count` 0. |
| `GET /users/galion-studio/orgs` | No organisations in the response. |
| Authenticated org list | 403, not readable with this token. |

`galionlabs` and `Galion-Lab` stay unverified. They are not linked from this plan. Site copy and the labs kit keep the organisation as planned until the owner confirms the slug. No Swarm 9 pull request turns those words into a live organisation URL.

### Proposed transfer list

No repository was transferred. A transfer waits for the owner's yes, and it still needs a confirmed slug.

| Repository | Proposal | Why |
|---|---|---|
| `galion-studio/galion-operating-system` | Keep. Do not transfer. | Canonical `LICENSE`, the site, and the OS notes. `main` is the source of truth. |
| `galion-studio/obsidian-open-mind` | Keep. Do not transfer. | Desktop console, port 18181, Branding files the site reuses. |
| `galion-studio/hermes-research` | Keep. Do not transfer. | Research desk, port 8787. |
| `galion-studio/galion-one-voice` | Keep. Do not transfer. | Outside this swarm. |
| Labs kit in this repo (`labs/`) | Do not transfer this repo. After the slug is confirmed, the owner may copy the kit into a new `.github` repository in that organisation. | `labs/README.md` already describes a copy, not a move. |

## Paths no Swarm 9 lane edits

- `LICENSE`, `README.md`, `NOTICE`
- `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`
- `docs/voice-profile/**`, `docs/brand/**`, `docs/swarm-8/**`
- `labs/**`, `scripts/**`, `functions/**`, `.github/**`
- Branches `cursor/os-packaging-plan-3946`, `cursor/remove-he-il-voice-docs-c39e`, `cursor/swarm-8-b3-os-finish-a3d9`

`SOUL.md`, `config.yaml`, `LOCKS.toml`, `voices/`, `weights/`, and `runtimes/` are not in this tree. They stay absent.

## Review bar

The orchestrator comments on each worker draft. Comments only until the merge bar above is met. A comment names any path outside the lane, any overlap with another lane, any dotted IPv4 literal, any missing acceptance output, and any owner decision the diff tries to change.

Known overlap outside this swarm, already visible at 15:23 +01:00: #17 edits `README.md`, `docs/voice-profile/README.md`, `docs/voice-profile/FB0-SURFACE.md`, `site/assets/site.css`, `site/operating-system/index.html`, and `docs/swarm-8/2026-11-15/b3-os-finish.md`. The site lane's carve-out is that pair of site files. No Swarm 9 lane owns the other four.

## Tests on this plan's tree

Run from the repository root on `b9517e9` plus this document, 2026-11-15 15:23 +01:00:

- `python3 scripts/check_links.py` — `Checked 6 HTML pages and 15 SVG files. No broken links.` Exit 0.
- `node --test scripts/test_region_prices.mjs` — 10 passed, 0 failed. Exit 0.
- `vnu.jar` — not run on this pass. The `link-check` workflow runs it.

Branch protection on `main` was not readable (`GET` branch protection returned 403). Rulesets list was empty (`[]`).
