# Swarm 9 — os / packaging

*Worker lane packaging. Commands below ran at 2026-11-15 15:36:09 +0100 (Europe/Zagreb), on `main` `170335b1d70478f4f6fa7a99f0410ae01243b707` plus this lane's uncommitted files.*

The plan on `main` is `docs/swarm-9/2026-11-15/os/PLAN.md`. This lane follows that file: one desktop image story, no workflow, and no page.

## What changed

- `packaging/README.md`, `packaging/MANIFEST.txt`, `packaging/dry-run.sh`
- `packaging/packages/ubuntu-26.04.list`
- `packaging/packages/init.list` — `galion-init`, planned, not built
- `packaging/packages/desktop-payloads.list` — the four desktop pieces. `galion-voiced` and `galion-probe` are not in it.
- `packaging/packages/voice-profile.list` — those two programs, planned, voice profile, off this image
- `packaging/check-pr-13.sh` and `packaging/test-dry-run.sh`
- `docs/swarm-9/2026-11-15/os/pr-13-merge-readiness.md`

No workflow. `.github/**` is untouched. Draft #13 is not edited and not merged.

The first packaging branch, `cursor/os-packaging-dry-run-2651` (pull request #20), was cut from #13. Rebuilding it in place would be a force-push, which is forbidden. Retargeting that pull request at `main` would carry #13's commits. It stays a draft. This branch starts at current `main`.

## Commands

`shellcheck -s sh packaging/dry-run.sh packaging/check-pr-13.sh packaging/test-dry-run.sh` exited 0 with no warnings.

`sh packaging/dry-run.sh` exited 0. `git` below is `170335b` because that was HEAD. The script prints `git rev-parse HEAD`, so the commit that adds this note prints a different git line.

```
galion-os image dry run
mode: dry-run
story: one desktop image on Ubuntu 26.04. galion-init is PID 1 and is absent. The console is openmind-desktop with no listen address, port 18181. Research is node src/server.js with PORT 8787. Static pages stay files. The 432 Hz tone is planned and is not played.
name: galion-os
profile: desktop
base: ubuntu-26.04
arch: x86_64
version: none
git: 170335b1d70478f4f6fa7a99f0410ae01243b707
node: 22.22.1
node_path: /usr/bin/node
init: galion-init
init_status: planned
init_present: no
weights: none
publish: off
openmind: de7480e71ce98191d2ee11f018fa15be6c5a1707
research: ed3ce9993f58ec655af4f23c2438eb83cd7ea844
console_user: galion
console_port: 18181
research_port: 8787
one_url: http on the IPv4 loopback interface, port 18181, path /one
browser: none
silence_file: none
boot_tone: planned
root: squashfs
unattended_upgrades: off
notice: absent on this tree
host_packages_installed: no
ubuntu-26.04 packages:
  included nodejs not-installed
  excluded unattended-upgrades kept-off
  unnamed kernel package-unnamed
  unnamed firmware package-unnamed
init:
  planned galion-init not-built required-before-boot
desktop payloads:
  planned openmind-desktop not-built /opt/galion/openmind-desktop/openmind-desktop
  planned site-one not-built /opt/galion/site/one/
  planned site-research not-built /opt/galion/site/research/
  planned hermes-research not-built /opt/galion/research/current/
end desktop payloads
other profile:
  planned galion-voiced not-built off-desktop-image
  planned galion-probe not-built off-desktop-image
end other profile
image files not written:
  galion-os-<untagged>-x86_64.iso
  galion-os-<untagged>-x86_64.img
result: dry run only. no image was built. no device was flashed. nothing was published.
```

`sh packaging/dry-run.sh --execute` exited 2:

```
refused: --execute would build or flash a real image. galion-init is planned, not built. No image was written. Nothing was published.
result: no image was built. no device was flashed. nothing was published.
```

`sh packaging/test-dry-run.sh` exited 0 with `passed 13`. Stubs for `apt`, `debootstrap`, `xorriso`, `dd`, and the other image tools were first on `PATH` and were not executed. `--build`, `--build --allow-real-image`, `--flash`, `--flash --allow-real-flash`, `--publish`, `--upload`, and `--gh-release` each exited 2 inside that script.

`python3 scripts/check_links.py` exited 0: `Checked 6 HTML pages and 15 SVG files. No broken links.`

`node --test scripts/test_region_prices.mjs` exited 0: `# pass 10` and `# fail 0`.

`vnu.jar` was not run locally. The existing `link-check` workflow runs it. Node.js 22.22.1 was not re-queried from the Ubuntu archive.

A search of `packaging/` for a dotted IPv4 literal found none.

## Open questions for Maciej

- Apt package names for the Ubuntu 26.04 kernel and firmware are still unnamed.
- A real image build stays refused while `galion-init` is planned. This lane does not add a builder or a workflow.
- `version` stays `none` until you tag the repository.

## Refused or skipped

- Did not edit or merge draft #13, and did not push `cursor/os-packaging-plan-3946`.
- Did not force-push pull request #20.
- Did not add a workflow, an ISO, a disk image, or a download.
- Did not transfer a repository. Labs organisation links stay planned.
