# Pi 5 seed boot check

This job checks that the Pi 5 seed tarball installs and that `galion-os.target` comes up. The guest is an emulator. A green run is not a Raspberry Pi 5 result, and it is not a substitute for `scripts/pi5-flash-check.sh` on a board.

## What the emulator is

GitHub-hosted runners are x86_64. The job boots Debian's arm64 nocloud image, `debian-12-nocloud-arm64.qcow2`, under `qemu-system-aarch64` on a `virt` machine with TCG. There is no KVM for aarch64 on that runner, and there is no NIC in the guest. systemd is the image's own PID 1.

QEMU user-mode (`docker --platform linux/arm64`) was tried first. The seed unit sets `PrivateNetwork=yes`. That emulator fails the namespace setup with `status=225/NETWORK` before `galion-init` runs. A full system emulator has a real kernel, so the same unit can create its network namespace.

The image is Debian Bookworm. It is not Raspberry Pi OS. It does not boot the Pi kernel, the Pi firmware, or a bootloader, and it does not touch an SSD. The virt machine's device tree does not name a Raspberry Pi. `scripts/pi5-flash-check.sh` records `environment: emulator` and `hardware-claim: none`.

Downloading the cloud image uses the network. The guest install does not: the virtual machine has no NIC, and `install.sh` is started only after the guest confirms it has no default route. `install.sh` is run twice. The second run has to exit 0, because the seed install is idempotent. The seed's `install.sh` enables `galion-os.target` and, on a booted system, starts it.

## What a PASS means

`scripts/pi5-flash-check.sh` prints one row per Galion unit (`galion-os.target` and every `galion-*` unit the seed installed). The default wait is 90 seconds (`GALION_UNIT_TIMEOUT`).

| Live state | Verdict |
|---|---|
| `active`, result `success` | PASS. A target that is `active` / `active` is in this row. |
| oneshot, `RemainAfterExit=yes`, `active` / `exited`, result `success` | PASS. The note says `oneshot dry-run`. |
| A state named by the unit or by `/opt/galion/etc/unit-expectations` | PASS only when the live state matches. The note says `documented state`. |
| Anything else after the time limit | FAIL |

The oneshot row is the dry-run of the `galion-init` prototype. [PI5-SEED.md](PI5-SEED.md) says the service runs `galion-init desktop`, prints the in-memory desktop plan, and exits. It refuses to be PID 1. `active (exited)` means systemd kept the successful oneshot in the active state. It does not mean a daemon is running, and it does not mean the board booted Galion OS as its init. That note also says a live `systemctl start galion-os.target` had not been run. This job is that start, inside the emulator. It is still not a Raspberry Pi 5 reading.

A unit may document a different state. Either of these is the documented state, and the script then requires that pair instead of plain `active`:

```
# GalionExpected: active/exited
```

in the unit file, or a line in `/opt/galion/etc/unit-expectations` (or `GALION_EXPECTATIONS`):

```
galion-init.service active exited
```

`*` as the substate accepts any substate.

## What CI saves

The workflow is `.github/workflows/pi-seed-boot.yml`. The product-seed logs are the `pi5-boot-logs` artifact:

| File | Contents |
|---|---|
| `pi5-unit-table.txt` | PASS/FAIL table from the product seed |
| `pi5-journal.log` | journalctl from the guest, plus `systemctl status` |
| `pi5-install.log` | both `install.sh` runs |
| `pi5-environment.txt` | architecture, Debian codename, virt, network |
| `container.log` | Docker's log of systemd |
| `README.txt` | the same limit this page states |

`pi5-harness-logs` in that artifact is a different table. The harness tarball is built by `scripts/pi5-fixture-seed.sh`. It is a shell stub with the same unit shape, so the Bookworm guest can be checked even when the product archive is being built in another step. `fixture: yes` in `pi5-install.log` marks it. That table is not the product seed and it is not a hardware result.

The product tarball is `galion-os-pi5-seed-<sha>.tar.gz`. This job does not invent a second archive. `scripts/pi5-require-seed.sh` uses a tarball already in the tree, or the packager named in `.github/workflows/pi-seed.yml`, or `packaging/pi-seed.sh`. The seed change owns that packager, the static binaries, and the units inside the archive.

## What you run on a Pi

Flash and copy the seed as `docs/PI5-SEED.md` describes, then:

```sh
sudo sh scripts/pi5-flash-check.sh
```

On a Raspberry Pi the device tree model is read before any other guess, unless the script is inside a container (a container never claims to be the board). The table then says `environment: raspberry-pi` and `hardware-claim: device-tree`, and it prints the model string. Exit 0 means every Galion unit passed on that machine. Exit 1 means at least one unit failed. Exit 2 means `systemctl` could not be run.

A PASS from the GitHub job does not imply a PASS from this command. Run the command on the board after a real flash. Keep the table. The two tables are different readings.
