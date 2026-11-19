# Galion on a Raspberry Pi 5

Raspberry Pi OS stays the operating system. The Galion seeds are copied onto it. They are tarballs and one static binary. They are not a disk image.

The detail is already written. This page is the order, and the limit every one of those notes shares.

| Step | Where it is written |
|---|---|
| Flash, then the OS seed | [PI5-SEED.md](PI5-SEED.md) |
| The boot check, and the greeting | [PI5-SEED-BOOT.md](PI5-SEED-BOOT.md) |
| Research and the Obsidian desktop | [PI5-SYMPHONY.md](PI5-SYMPHONY.md) |

The OS seed is [pull request 42](https://github.com/galion-studio/galion-operating-system/pull/42). The boot check is [pull request 43](https://github.com/galion-studio/galion-operating-system/pull/43). Research and the desktop, in one virtual machine, are [pull request 44](https://github.com/galion-studio/galion-operating-system/pull/44). The greeting is [pull request 46](https://github.com/galion-studio/galion-operating-system/pull/46). The welcome page the OS seed now starts is [pull request 45](https://github.com/galion-studio/galion-operating-system/pull/45), and the OS seed note is where that page is described.

## What a virtual machine has done

No step on this page has been run on a Raspberry Pi 5. No Pi 5, no Raspberry Pi OS image, no SSD, and no SD card was used to produce or test the seeds.

What has been run:

- The OS seed note's [What was actually run](PI5-SEED.md#what-was-actually-run): qemu-user for `galion-init`, `install.sh` twice against an empty directory, and the welcome page from the x86_64 binary on the runner. The aarch64 welcome binary in the tarball was not run on a Pi 5.
- The boot note: `galion-os.target` started inside an arm64 Debian Bookworm virtual machine. That guest is Debian, not Raspberry Pi OS. It does not boot a Pi, and it does not touch an SSD. The greeting was required in that guest's journal. A line there is not a reading from a board.
- The symphony note: Research and the desktop installed in one virtual machine of that same kind, with no network interface in the guest. A PASS on its table is an emulator reading.

A green GitHub job is not a pass on the board. The board command is `scripts/pi5-flash-check.sh`. That command has not been run on a Pi 5.

[`.github/workflows/pi5-board-dry-run.yml`](../.github/workflows/pi5-board-dry-run.yml) shellchecks the Pi 5 scripts and runs [`scripts/pi5/test-board-report.sh`](../scripts/pi5/test-board-report.sh). That test writes the board report from stubbed files. A green run of that job is not a Raspberry Pi 5 result.

## Flash the card or the SSD

Follow [Flash Raspberry Pi OS Bookworm 64-bit](PI5-SEED.md#flash-raspberry-pi-os-bookworm-64-bit).

The image is **Raspberry Pi OS (Legacy, 64-bit)**, the port of Debian Bookworm, from the downloads page that note links. Imager's current 64-bit image is Debian 13 (Trixie). The seed was not built for Trixie. The seed binary is aarch64, so the image is the 64-bit one.

That note chooses an SSD: a USB SSD, or an NVMe drive in an enclosure the writing computer can see. An SD card is the same write. Choose the card as the storage device. Writing erases the card, as it erases the SSD.

A USB SSD does not need a bootloader change. An NVMe drive on the Pi 5's PCIe connector boots only when the Pi's bootloader tries that device. That update is Raspberry Pi's procedure, and it was not run for this seed. An SD card sits in the card slot, which is not that PCIe connector. This repository has not booted a card, a USB SSD, or an NVMe drive.

Boot once, and let Raspberry Pi OS finish its own first-boot resize, before you copy a seed. Nothing in the install downloads the seed.

## Install the OS seed

The file is an artifact of [`.github/workflows/pi-seed.yml`](../.github/workflows/pi-seed.yml). The workflow does not create a GitHub release. The file name, the checksum, and the install commands are [Install the seed](PI5-SEED.md#install-the-seed).

`install.sh` is idempotent. A second run does the same work and exits 0.

[`scripts/pi5/first-boot.sh`](../scripts/pi5/first-boot.sh) is the calm way to run that install on the machine. A second run is safe. Each step is one line in the report, and a failed line says what to do next. Save that report beside the board report:

```sh
sudo sh scripts/pi5/first-boot.sh /path/to/galion-os-pi5-seed-<sha> pi5-first-boot.txt
sudo sh scripts/pi5/board-report.sh pi5-board.txt
```

The offline test of this script uses stubbed files and a stubbed `systemctl`. That test is not a Raspberry Pi 5 result. This script has not been run on a Pi 5.

When that artifact contains `bin/galion-core`, the same script installs the greeting. The unit, the journal line, and a start that does not fail the install are in the [boot note](PI5-SEED-BOOT.md). The line was required in the emulator journal only.

The target also starts the welcome page. What the page lists, and where it listens, is in the OS seed note. Open Mind, Research, and Voice stay off that page until their units exist. Voice is not in these seeds. The page is not a measurement of the board.

## Install Research and the desktop

These two are not in the OS tarball. There is no release of either one.

[Pull request 44](https://github.com/galion-studio/galion-operating-system/pull/44) builds them from the public commits in [`scripts/symphony/pins.sh`](../scripts/symphony/pins.sh). [PI5-SYMPHONY.md](PI5-SYMPHONY.md) is that job, including why it clones the commits instead of downloading an artifact.

[`scripts/symphony/fetch-seeds.sh`](../scripts/symphony/fetch-seeds.sh) is the build. The workflow runs it on the GitHub runner. It has not been run on a Pi 5.

[`scripts/symphony/guest-run.sh`](../scripts/symphony/guest-run.sh) is the install. It runs as root, after the OS seed, inside the guest, and it does not fetch. The build products sit beside the script: `research-pi5-seed.tar.gz` and `openmind-desktop`. The script has not been run on Raspberry Pi OS, and it has not been run on a Pi 5.

The order inside that script:

1. The user `galion` is already there, because the OS seed's `install.sh` creates it. If the user is missing, the script writes `symphony: user galion is missing` and does not start the other two units.
2. Research is unpacked, checked with `sha256sum -c SHA256SUMS`, and installed as `galion-research-pi5.service`. The unit file is inside the research archive. A bad checksum is recorded, and the script continues to the desktop.
3. The desktop binary is `openmind-desktop`. Obsidian Open Mind pull request 100 shipped that binary and no systemd unit. The unit this job installs is [`scripts/symphony/openmind-desktop.service`](../scripts/symphony/openmind-desktop.service).

The menu entries and icons are copied with [`desktop/install.sh`](../desktop/install.sh).

[`scripts/symphony/prepare-root.sh`](../scripts/symphony/prepare-root.sh) copies shared libraries onto the emulator disk only when that nocloud image does not already have them. It is a step for the virtual machine. It is not a step for Raspberry Pi OS, and it was not run against Raspberry Pi OS.

After the install, the script prints the symphony health table and uses that table's exit code. The table's contract passes only for the offline arm64 Bookworm emulator. A Raspberry Pi fails the contract. That exit is the contract. It is not a report that the board is broken.

## Check the first boot

When the OS seed is on the machine, run the command in [What you run on a Pi](PI5-SEED-BOOT.md#what-you-run-on-a-pi):

```sh
sudo sh scripts/pi5-flash-check.sh
```

The script is in this repository. The seed tarball does not contain it. Copy the script onto the Pi with the tarball.

The table says which machine it read. On a Raspberry Pi, outside a container, it says `environment: raspberry-pi` and `hardware-claim: device-tree`, and it prints the model string. A container never claims to be the board. Exit 0 means every Galion unit passed. Exit 1 means at least one failed. Exit 2 means `systemctl` could not be run. Keep the table. The table from the GitHub job is a different reading, from the emulator.

The script starts `galion-os.target`, then reads every unit whose name starts with `galion-`. It does not start the other units by name. `galion-research-pi5.service` is one of those names once it is installed. `openmind-desktop.service` is not. The desktop's check is the symphony table, and that table has only been produced in the emulator.

## What a real pass looks like

After the SSD boots Raspberry Pi OS (Legacy) 64-bit with the seeds installed, run this from a checkout of this repository on the Pi. The seed tarball does not contain the script. Copy the checkout, not only the tarball.

```sh
sudo sh scripts/pi5/board-report.sh
```

An optional path writes the same text to a file. Paste the text back.

The script records the device-tree model, the kernel, the architecture, and the boot medium the kernel names for `/`. It starts each seed unit that is installed. The unit rows are [`scripts/pi5-flash-check.sh`](../scripts/pi5-flash-check.sh). The loopback rows are [`scripts/symphony/health-table.sh`](../scripts/symphony/health-table.sh). This page does not restate those verdicts.

Exit 0 means the report was written and the unit check could be run. FAIL rows inside it are still failures. Exit 2 means the report could not be written, or the unit check could not be run.

This script has not been run on a Raspberry Pi 5. A run under CI or QEMU is not a pass on the board. The fields below are empty on purpose. Nothing in this repository has filled them.

```
GALION BOARD REPORT
model:
kernel:
arch:
root:
root-cmdline:
boot-medium:
block:
block-sectors:

----- starts -----

----- unit check (scripts/pi5-flash-check.sh) -----

----- loopback check (scripts/symphony/health-table.sh) -----
```

A pass is a model line, read from `/proc/device-tree/model`, that names a Raspberry Pi; the unit check saying `environment: raspberry-pi` and `hardware-claim: device-tree`, with no FAIL row; and the loopback table's installed rows PASS. `contract:` on that table stays `failed`. The health table requires the offline emulator, so a board fails the contract. That line is the contract. It is not a failed flash. Leave the Pi's network as it is.

## When something is wrong

The notes already decide these. This list is the pointer.

### Imager offers the current 64-bit image

That image is Debian 13. Open the other-images list, as the OS seed note says, and choose Raspberry Pi OS (Legacy, 64-bit). A 32-bit image cannot run the aarch64 binary.

### The disk does not boot

A USB SSD is the path with no bootloader change. An NVMe drive on the PCIe connector needs the bootloader to try that device. That change was not run here. An SD card uses the card slot. None of the three has been booted in this repository.

### There is nothing to download

The OS workflow does not publish a release. The file is the Actions artifact named in the OS seed note. Research and the desktop are the build from `scripts/symphony/fetch-seeds.sh`, for the reason the symphony note gives.

### The checksum does not match

Stop on the OS seed. `sha256sum -c SHA256SUMS` fails, and `install.sh` runs that check under `set -eu`, so it does not install the archive. On the research archive, `scripts/symphony/guest-run.sh` records `error: research archive failed checksum` and still goes on to the desktop. The desktop is not a repaired research archive.

### `install.sh` exits at once

Run it as root. Otherwise it prints `install.sh: run as root` and exits 1.

### The flash check exits 2

`systemctl` could not be run. The script's own line names the binary it looked for. Raspberry Pi OS has systemd. This exit was defined for that, and the script has not been run on a Pi 5.

### The flash check exits 1

A Galion unit failed. The NOTE column is the state the script read after `GALION_UNIT_TIMEOUT`. What PASS means is the table in the boot note. `start: failed` means `galion-os.target` did not start. The script still prints the table.

A `galion-*` unit that is installed and left inactive stays a failure. The flash check starts `galion-os.target` only. Research is started by `scripts/symphony/guest-run.sh`, in the emulator, and that start has not been done on a Pi.

### `galion-init` is active and exited

The oneshot finished. systemd kept it active. The boot note calls this `oneshot dry-run`. There is no desktop on the framebuffer, and the binary is not PID 1. Raspberry Pi OS systemd stays PID 1.

### The welcome page leaves Research, Open Mind, or Voice off the machine

The OS seed does not install those units. The page is reporting the units it can see. Voice is not in these seeds.

### `status=225/NETWORK`

QEMU user-mode cannot build the network namespace the seed unit asks for with `PrivateNetwork=yes`. The boot note is that failure. It happens before `galion-init` runs. It is not a line from a Pi. The boot job uses a full system emulator, which has a kernel, and that job is still not a Pi 5.

### The table says `environment: emulator`

The reading is not the board. `hardware-claim: none` says the same. A container is reported as an emulator even when a device tree underneath it names a Raspberry Pi.

### The symphony table fails on a Pi

`scripts/symphony/health-table.sh` prints `contract: failed` unless the machine is aarch64 Debian Bookworm, with no default route, `environment: emulator`, and the commit lines the workflow records. A Raspberry Pi fails that contract. The symphony note says the job fails when the guest is not that emulator. Leave the Pi's network as it is. Matching the virtual machine is not a repair.

FAIL rows in `summary:` can be probe targets the job never started, while `installed:` has no FAIL. The job's rule is the `installed:` line, plus the contract. That whole table is an emulator reading.

### The greeting does not stay up

`install.sh` prints `install.sh: galion-core did not stay up; boot continues` and still finishes. A failed start of `galion-core.service` does not fail the install. The journal line the boot job requires was required of the emulator journal.

### Research does not start in the emulator

`scripts/symphony/prepare-root.sh` is the step that fills libraries the nocloud image lacks, from Debian Bookworm's public archive. It has no result on Raspberry Pi OS.

## Licence

The repository [LICENSE](../LICENSE). This page does not restate it.
