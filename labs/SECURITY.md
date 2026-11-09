# Security policy

*Maciej Grajczyk · 2026-11-09 (Europe/Zagreb, CET, UTC+1).*

## What this kit is

Galion Labs, as published in this repository, is documents and static HTML. There is no service deployed from this pull request, and there is no account system. The supported surface is the current files in `labs/`, `docs/brand/`, and `site/`.

Product code lives in its own repositories under `galion-studio`. Report a vulnerability in the repository that contains the code.

## Reporting

**Do not open a public issue for a security problem.**

Write privately to **Maciej Grajczyk (Galion Studio)**, the owner of the GitHub organisation `galion-studio`. Use a private GitHub channel to that owner. When the `galion-labs` organisation exists and private vulnerability reporting is switched on, that advisory form replaces this paragraph. Until then, the organisation owner is the contact.

A public email address is not printed here. The owner adds one in this file when he wants one published.

Include, where you can:

- the file or page;
- what someone can do with the problem, in a sentence or two;
- a minimal reproduction that contains no secret and no recording.

What to expect: an acknowledgement, a first look, and then a fix or a reasoned "will not fix". Give the maintainer time to ship a fix before any public write-up.

## What never goes in a report, an issue, or a pull request

- Keys, tokens, passwords, or private key material. If you think a key leaked, say so privately. Do not paste the key.
- Contents of an environment file or a credential store.
- Personal data about other people.
- Private recordings, including any Samantha or Jarvis reference audio.
- A live hostname, address, or port. Use a placeholder.

## Out of scope

- Third-party services, including GitHub itself.
- The font files, which stay under their SIL Open Font License.
- A host, a domain, or a server the owner has not put in this repository. This repository does not name one.

— Maciej Grajczyk
