# Packaging dry run

*Maciej Grajczyk · 2026-11-15 (Europe/Zagreb, UTC+1).*

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is `LICENSE`. This page does not restate it.

This directory is a dry-run skeleton of the image in draft #13, `docs/PACKAGING.md` §7. It prints one desktop image story: Ubuntu 26.04, `galion-init`, the console on port 18181, research on port 8787, and the static pages as files. Job 4 stays off until `galion-init` exists and the owner asks for a workflow. This lane adds no workflow, no ISO, and no download.

`galion-voiced` and `galion-probe` are the voice profile. They are named in `packages/voice-profile.list` and are not desktop payloads.

```sh
sh packaging/dry-run.sh
sh packaging/dry-run.sh --execute
```

The first command exits 0 and writes nothing. `--execute`, `--build`, `--flash`, and `--publish` exit 2 and write nothing. An explicit allow flag does not start a build while `galion-init` is planned.

`sh packaging/check-pr-13.sh` records that pull request #13 is on `main`. It does not merge anything. `sh packaging/check-one-story.sh` checks that this dry run and `galion-init/prototype.sh desktop` name the same boot: `galion-init` planned, console port 18181, research port 8787, handoff `/one`, tone not played.
