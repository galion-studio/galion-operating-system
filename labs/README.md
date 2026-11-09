# Galion Labs

*Maciej Grajczyk · 2026-11-09 (Europe/Zagreb, CET, UTC+1).*

Galion Labs is the open community and research arm of Galion. It is where people read the work, argue with it in the open, and propose the next note. Galion OS, Obsidian Open Mind, Galion Research, Galion One, and Galion Voice stay free and open source. Labs is how that work meets other people.

Labs is not a paid tier. Plus and Ultra, the planned hosted computers, are described in the [brand guide](../docs/brand/BRANDING-V2.md). Billing is not implemented. `paid_tiers` stays false.

## What lives here

This folder is a kit, ready to drop into a future GitHub organisation named `galion-labs`, or into a repository of that name. It holds:

| File | Purpose |
|---|---|
| [README.md](README.md) | This page. What Labs is. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to offer a change. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Contributor Covenant 2.1, with the contact filled in. |
| [GOVERNANCE.md](GOVERNANCE.md) | Who decides what. |
| [SECURITY.md](SECURITY.md) | How to report a vulnerability in private. |
| [.github/profile/README.md](.github/profile/README.md) | The greeting for a future organisation profile. |
| [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) | Issue forms. |
| [.github/DISCUSSION_TEMPLATE/](.github/DISCUSSION_TEMPLATE/) | Discussion forms, for when Discussions are switched on. |

The brand guide and the static landing pages live next to this kit, in `docs/brand/` and `site/`. The Labs page on that site is `site/labs/`.

## The organisation is a manual step

Creating a GitHub organisation is not possible through the API this work can call. **Maciej Grajczyk creates `galion-labs` in the GitHub UI.** Until that click happens, this folder is the whole of Galion Labs in git.

When the organisation exists, the drop-in is:

1. Create a public repository named `.github` inside `galion-labs`.
2. Copy `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `GOVERNANCE.md`, and `SECURITY.md` to the root of that repository, so GitHub can pick them up as community health files.
3. Copy `.github/profile/README.md` to `profile/README.md` in that same repository. That file is the organisation profile.
4. Copy `.github/ISSUE_TEMPLATE` and `.github/DISCUSSION_TEMPLATE` into `.github/` of that repository, so they become the organisation defaults.
5. In the organisation settings, switch Discussions on if you want the discussion templates to appear.
6. Point the organisation URL at this kit only after those files are in place.

A product repository can carry the same health files if the organisation-level `.github` repository is not ready. Copying them is enough. Nothing in this kit creates the organisation, a team, or a billing account.

## What Labs is for

- Notes on Galion OS, Open Mind, Galion Research, Galion One, and Galion Voice.
- Questions about the brand guide and the landing pages.
- Research proposals that say what is known, what is guessed, and what is still open.
- A code of conduct with a named steward.

## What Labs is not for

- A checkout. There is no payment form here.
- A place to post secrets, private recordings, reference audio, or the address of a server.
- A claim that an OS image, a student voice model, or a learned emotion detector has shipped. Those are in development. Say so.

The living product repositories today are [galion-operating-system](https://github.com/galion-studio/galion-operating-system), [obsidian-open-mind](https://github.com/galion-studio/obsidian-open-mind), [galion-one-voice](https://github.com/galion-studio/galion-one-voice), and [hermes-research](https://github.com/galion-studio/hermes-research), all under `galion-studio`.

— Maciej Grajczyk
