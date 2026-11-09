# Contributing to Galion Labs

*Maciej Grajczyk · 2026-11-09 (Europe/Zagreb, CET, UTC+1).*

Galion Labs welcomes notes, corrections, and proposals from anyone. The steward is Maciej Grajczyk (Galion Studio). Read [GOVERNANCE.md](GOVERNANCE.md) for what the community proposes and what the steward decides, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for how people treat each other.

## Offer a change

1. Open an issue or, once Discussions exist, a discussion. Say what you want to add and which repository it belongs to.
2. Keep the change small enough to read in one sitting.
3. Open a pull request against the repository the steward names. Until `galion-labs` exists, proposals for this kit land in [galion-operating-system](https://github.com/galion-studio/galion-operating-system).
4. Describe the status of anything you claim: in development, roadmap, or planned. A feature that is only a document stays a document.

## Write like the rest of the project

- The spelling is Galion.
- Plain sentences. The brand voice is in [the brand guide](../docs/brand/BRANDING-V2.md).
- Sign a document you author as your own name. Documents for the maker are signed Maciej Grajczyk.
- Dates in a signed note use a real timezone. The maker uses Europe/Zagreb with an explicit offset.

## Leave these out of git

- Secrets, tokens, passwords, private keys, and `.env` files.
- Private recordings, and any reference audio for Samantha, Jarvis, or any other voice.
- Uncleared third-party material, including film audio, film stills, and trademarked logos.
- A production hostname, a server address, or a port for a machine you do not mean to publish.
- A payment form, a checkout link, or copy that says a charge is live. `paid_tiers` stays false until the owner changes that lock.
- Tracking scripts.

## Licence

This kit is MIT, the same licence as the rest of this repository. See [LICENSE](../LICENSE). Copyright (c) 3000 Galion / galion-studio. By offering a contribution you agree it may be used under that licence.

## The site

The landing pages are static files in [`../site/`](../site/). From that directory:

```sh
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/`. That command serves your own machine. It is not a deployment.

## Reports that are not feature requests

- Security: [SECURITY.md](SECURITY.md). Use a private channel. A public issue is the wrong place.
- Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Also private.

— Maciej Grajczyk
