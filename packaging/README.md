# Packaging dry run

*Maciej Grajczyk · 2026-11-15 (Europe/Zagreb, UTC+1).*

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is `LICENSE`. This page does not restate it.

This directory is a dry-run skeleton of the image in `docs/PACKAGING.md` §7. It prints one desktop image story: Ubuntu 26.04, `galion-init`, the console on port 18181, research on port 8787, and the static pages as files. The dry run writes no ISO and no download. The Pi 5 seed below is a separate tarball.

`galion-voiced` and `galion-probe` are the voice profile. They are named in `packages/voice-profile.list` and are not desktop payloads.

```sh
sh packaging/dry-run.sh
sh packaging/dry-run.sh --execute
```

The first command exits 0 and writes nothing. `--execute`, `--build`, `--flash`, and `--publish` exit 2 and write nothing. An explicit allow flag does not start a build while `galion-init` is planned.

`sh packaging/check-pr-13.sh` records that pull request #13 is on `main`. It does not merge anything. `sh packaging/check-one-story.sh` checks that this dry run and `galion-init/prototype.sh desktop` name the same boot: `galion-init` planned, console port 18181, research port 8787, handoff `/one`, tone not played.

`sh packaging/layout.sh` prints the four desktop files the image root would hold: the console and research as user `galion`, and the two static page directories with no user. `galion-voiced` and `galion-probe` are off this image. The command writes nothing. An argument exits 2.

## Pi 5 seed

`sh packaging/pi-seed.sh` packs a different artifact: `galion-os-pi5-seed-<sha>.tar.gz`, the static `aarch64-unknown-linux-musl` binaries `galion-init` and `galion-welcome`, `galion-os.target`, and `install.sh`. The target starts the init plan and then the welcome page on the IPv4 loopback interface, port 18711. The page is one HTML file with its styles inside it. It does not use the network. The workflow is `.github/workflows/pi-seed.yml`. The install note is [docs/PI5-SEED.md](../docs/PI5-SEED.md). This tarball is not the desktop image above. It does not write an ISO or a disk image, and it does not publish a release. `sh packaging/test-welcome-page.sh` checks the page on the machine where it is run. That check is not a Raspberry Pi 5 result.

## Windows laptop

`packaging/windows/wsl-on-g/Install-GalionWSL.ps1` is a different artifact from the image dry run above. It imports the official Ubuntu 24.04 WSL rootfs with `wsl --import` so the distro disk lives on `G:\galion`. `-DryRun` writes nothing. The Pester check is `.github/workflows/wsl-on-g.yml`. A green run of that check is not a Windows install. The note is [packaging/windows/wsl-on-g/README.md](windows/wsl-on-g/README.md). The existing `Ubuntu` 26.04.1 disk at `G:\galion\wsl\ubuntu` and `docker-desktop` are not this distro.

## WSL2 Galion-Ubuntu

`bash packaging/wsl/provision-galion-ubuntu.sh` is the Linux side of the `Galion-Ubuntu` WSL2 distro. Importing that distro onto `G:\galion\wsl\Galion-Ubuntu` is a separate Windows installer. The integrator entry point is one command, run as root inside the distro, from a checkout of this repository. It is safe to run again.

```sh
sudo bash packaging/wsl/provision-galion-ubuntu.sh
```

`--dry-run` prints the plan and writes nothing:

```sh
sudo bash packaging/wsl/provision-galion-ubuntu.sh --dry-run
```

From Windows, after the distro exists, that same command is:

```sh
wsl -d Galion-Ubuntu -u root -- bash /path/to/packaging/wsl/provision-galion-ubuntu.sh
```

The real run creates the login user `galion`, installs `build-essential`, `git`, `curl`, a stable Rust toolchain via rustup, the current Node.js LTS, and `python3-venv`, then WSLg font and audio clients. IBM Plex, the face named by the GTK session file, is Ubuntu's `fonts-ibm-plex` package from multiverse, and the ALSA Pulse plugin is in universe. The script enables those two archive components when the Ubuntu source list does not already have them. Desktop entries, icons, and the GTK session files come from `desktop/install.sh --system`. XDG directories stay under `/home/galion`. `/etc/wsl.conf` sets `systemd=true` and `default=galion`.

Apt, rustup, Cargo, npm, pip, and font caches stay on the distro filesystem (`/var`, `/opt/galion`, `/home/galion`). Temp files use `/var/cache/galion/tmp`. Cargo build output uses `/opt/galion/cargo/target`. That filesystem is the distro disk on `G:`. `systemd=true` takes effect after the distro is restarted from Windows.

The workflow is `.github/workflows/wsl-provision.yml`. It runs shellcheck and this script in an `ubuntu:24.04` container, in `--dry-run` and in real mode. A green run is not a Windows install. The script does not build an image and does not publish a release. `--publish`, `--flash`, `--deploy`, `--execute`, and `--build` exit 2.
