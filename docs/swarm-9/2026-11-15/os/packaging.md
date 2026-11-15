# Swarm 9 — os / packaging

*Worker lane packaging. Commands below ran at 2026-11-15 15:28:49 +0100, and the lint and refusal tests were run again at 2026-11-15 15:29:49 +0100 (Europe/Zagreb).*

## What I checked

- Swarm rules and the GitHub survey.
- Draft #13, `cursor/os-packaging-plan-3946` at `3adee77f86c3dfb8cd32f9070ad045f018e9b046`. Read `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, and `NOTICE` (`The licence is LICENSE.`). Did not push to that branch.
- Open pull requests after the test run: #13 (packaging plan, draft), #17 (OS page notes, draft), #19 (`Swarm 9 os/galion-init`, not a draft). No pull request titled "Swarm 9 os plan". An earlier search for that title also returned nothing.
- `docs/voice-profile/PACKAGING.md` for `galion-init`, `galion-voiced`, and `galion-probe`.
- #19 is a separate prototype. This dry run does not build it and does not mark `galion-init` built. The image still waits on a PID 1 that can mount, bring up loopback, set the clock, and supervise, which is decision D2.

## What I changed

This branch adds a dry-run skeleton. It does not publish an image.

- `image/MANIFEST.txt` — Ubuntu 26.04 LTS, `x86_64`, squashfs, Node.js 22.22.1 as recorded in the plan, `weights=none`, `publish=off`. `version=none` because no tag is created. `one_url=console-one-on-18181` stands for the console `/one` on port 18181. The address itself is not written in the file.
- `image/packages/ubuntu-26.04.list` — `nodejs` included, `unattended-upgrades` excluded, kernel and firmware unnamed.
- `image/packages/galion-planned.list` — `galion-init` (desktop), `galion-voiced` (voice), `galion-probe` (voice). Status `planned`. Status `built` is rejected.
- `image/packages/payloads.list` — the four desktop pieces from the plan, all planned.
- `scripts/image/dry-run.sh` — prints the plan. `--build` and `--flash` exit 2 without `--allow-real-image` or `--allow-real-flash`. With those flags they still exit 2 while the three programs are planned. `--publish`, `--upload`, and `--gh-release` always exit 2. No image tool is invoked.
- `scripts/image/lint.sh` and `scripts/image/test-dry-run.sh`.
- `.github/workflows/image-dry-run.yml` — shellcheck, the dry run, and the refusal tests. `contents: read`. No artifact upload and no release.

`docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, and `NOTICE` are unchanged.

## Commands

`shellcheck` 0.9.0 was installed from Ubuntu noble (`shellcheck 0.9.0-1`) so the lint could be run here. `REQUIRE_SHELLCHECK=1 bash scripts/image/lint.sh` exited 0:

```
bash -n scripts/image/dry-run.sh
bash -n scripts/image/lint.sh
bash -n scripts/image/test-dry-run.sh
ShellCheck - shell script analysis tool
version: 0.9.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
shellcheck ok (3 scripts)
```

`bash scripts/image/dry-run.sh` exited 0. HEAD was still the plan commit, so `git` below is `3adee77`. The script prints `git rev-parse HEAD`, so the commit that adds this note prints a different git line.

```
galion-os image dry run
mode: dry-run
base: ubuntu-26.04
arch: x86_64
profile: desktop
name: galion-os
version: none
git: 3adee77f86c3dfb8cd32f9070ad045f018e9b046
openmind: de7480e71ce98191d2ee11f018fa15be6c5a1707
research: ed3ce9993f58ec655af4f23c2438eb83cd7ea844
node: 22.22.1
node_path: /usr/bin/node
init: galion-init
init_status: planned
weights: none
root: squashfs
unattended_upgrades: off
publish: off
console_user: galion
console_port: 18181
research_port: 8787
research_command: /usr/bin/node src/server.js
one_url: console-one-on-18181
browser: none
silence_file: none
boot_tone: planned
notice: The licence is LICENSE.
host_packages_installed: no
ubuntu-26.04 packages:
  included	nodejs	not-installed
  excluded	unattended-upgrades	kept-off
  unnamed	kernel	package-unnamed
  unnamed	firmware	package-unnamed
galion programs:
  planned	galion-init	not-built required-before-boot
  planned	galion-voiced	not-built off-desktop-image
  planned	galion-probe	not-built off-desktop-image
payloads:
  planned	openmind-desktop	de7480e71ce98191d2ee11f018fa15be6c5a1707	/opt/galion/openmind-desktop/openmind-desktop	not-built
  planned	site-one	this-repository	/opt/galion/site/one/	not-built
  planned	site-research	this-repository	/opt/galion/site/research/	not-built
  planned	hermes-research	ed3ce9993f58ec655af4f23c2438eb83cd7ea844	/opt/galion/research/current/	not-built
image files not written:
  galion-os-<untagged>-x86_64.iso
  galion-os-<untagged>-x86_64.img
result: dry run only. no image was built. no device was flashed. nothing was published.
```

Refusals, each exiting 2:

```
refused: --build writes a real image and needs the explicit flag --allow-real-image. No image was written. Nothing was published.
refused: --allow-real-image was set. The build is still refused because galion-init, galion-voiced, and galion-probe are planned, not built. This skeleton does not run debootstrap, xorriso, apt, or mksquashfs. No image was written. Nothing was published.
refused: --flash writes a device (no device path was given) and needs the explicit flag --allow-real-flash. No device was written. Nothing was published.
refused: --publish, --upload, and --gh-release are not implemented. Nothing was published.
```

`bash scripts/image/test-dry-run.sh` exited 0 with `passed 21`. The test puts stubs for `debootstrap`, `xorriso`, `dd`, `apt-get`, and the other image tools first on `PATH`. The stamp file those stubs write was not created. No `.iso` or `.img` was created.

`node --test scripts/test_region_prices.mjs` exited 0: 10 passed, 0 failed. `python3 scripts/check_links.py` exited 0: `Checked 6 HTML pages and 15 SVG files. No broken links.`

The same lint and `test-dry-run.sh` were run again at 15:29:49 +0100. Lint exited 0. The test script printed `passed 21`. `--build --allow-real-image` exited 2.

## CI

Not run yet at the time of this note. The workflow file is `.github/workflows/image-dry-run.yml`. GitHub's result belongs on the pull request after the push. The vnu HTML check from the existing link-check workflow was not run locally.

Node.js 22.22.1 was not re-queried from the Ubuntu archive. It is the figure already recorded in `docs/PACKAGING.md` D1.

## Open questions for Maciej

- The kernel and firmware rows are `unnamed`. The plan says they are Ubuntu 26.04's and does not give apt package names.
- A real image build stays refused even with `--allow-real-image`, because the three Galion programs are planned. Say when that refusal should become a builder. This skeleton does not add one.
- `galion-voiced` and `galion-probe` are on the planned list, and the dry run marks them off the desktop image, which is decision D2. Say if the desktop package list should omit them.
- `version` stays `none` until you tag this repository. No tag was created.
- The runner for the new job is `ubuntu-latest`. It does not boot an Ubuntu 26.04 image.

## Refused or skipped

- Did not edit draft #13, and did not push `cursor/os-packaging-plan-3946`.
- Did not build an ISO or a disk image, did not flash a device, and did not publish.
- Did not take `galion-init` from #19. That prototype is another branch.
- Did not run vnu locally.
- Did not merge this pull request. It stays a draft until every non-skipped check on its head is green, then it is marked ready for review.
