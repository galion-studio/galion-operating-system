# Galion OS on a Raspberry Pi 5 SSD

This note is how to put the Pi 5 seed on a machine. The seed is a tarball of static binaries. It is not a disk image, and it does not replace Raspberry Pi OS.

The workflow that builds it is `.github/workflows/pi-seed.yml`. It does not create a GitHub release.

## What the tarball is

The file is `galion-os-pi5-seed-<sha>.tar.gz`. `<sha>` is the full git commit that produced it. GitHub Actions uploads that file as a workflow artifact of the same name. Nothing in the workflow publishes a release.

Inside the top-level directory:

| Path | What it is |
|---|---|
| `bin/galion-init` | The release binary for `aarch64-unknown-linux-musl`. Static. Symbols stripped. |
| `bin/galion-welcome` | The welcome page, same target and the same static link. It listens on the loopback interface only. |
| `systemd/galion-os.target` | The target `install.sh` enables. It starts init, then the welcome page. |
| `systemd/galion-init.service` | Oneshot service the target starts. It runs `galion-init desktop` and exits. |
| `systemd/galion-welcome.service` | Stays running. Serves the welcome page on port 18711. |
| `install.sh` | Copies the seed onto the machine and enables the target. Idempotent. No network. |
| `LICENSE` | The repository `LICENSE`, byte for byte. |
| `NOTICE` | The repository `NOTICE`. |
| `PI5-SEED.md` | This note. |
| `ideology/` | Notes that already say what Galion OS is. See below. |
| `SHA256SUMS` | `sha256sum` output for every other file in the directory. |

`galion-init` in this repository is the in-memory prototype. On the Pi it is not PID 1. Raspberry Pi OS systemd stays PID 1. The service runs the binary as the unprivileged user `galion`. The binary prints the desktop boot plan and exits. It refuses `--execute`. If its process id is 1, it exits 2. It does not mount filesystems, set the clock, open a socket, or supervise a real console.

`galion-welcome` is the other binary. It is not PID 1 either. It binds the loopback interface, port 18711, and serves one HTML page. The styles are in the page. The page does not load a font, a script, or any other host. It lists the Galion units on the machine and says whether each one is up. Init shows as finished, because the oneshot exits after the plan. Open Mind, Research, and Voice show as not on this machine until those units exist. The page reads `systemctl` on the machine. It does not record a boot time, a byte size, or a hardware result.

`galion-voiced` and `galion-probe` are not in this repository. They are not in the seed.

The same workflow also builds `x86_64-unknown-linux-musl` and runs that binary on the runner. That binary is not in the tarball. The Pi 5 is aarch64. On the toolchain used to prepare this note, `file` reports the aarch64 binary as `statically linked` and the x86_64 binary as `static-pie linked`. Both are stripped, and `ldd` reports no dynamic loader. A newer Rust may mark aarch64 as `static-pie linked` as well. The packager accepts either phrase.

Release profile for both triples: `opt-level = 3`, fat LTO, `codegen-units = 1`, `strip = true`. The linker is `rust-lld`, set with `CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER` and `CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER`. `rust-lld` is the binary in the Rust sysroot's `lib/rustlib/<host>/bin` directory. It is not on `PATH` until the workflow prepends that directory. Musl targets are linked with `crt-static`.

The voice packaging note still describes a different archive, with `opt-level = "z"` for `galion-init`, and it is not what this seed builds.

## Ideology files

This repository has no `docs/ideology` directory and no file with ideology in its name. The seed does not invent one. `ideology/` in the tarball is a byte-for-byte copy of notes that are already in the tree:

- `README.md`
- `docs/voice-profile/README.md`
- `docs/voice-profile/voice-first.md`
- `docs/voice-profile/hermes-later.md`

Links in those copies that point at the brand guide, the site, or the Labs kit are links to files that are not in the tarball. If a `docs/ideology` directory is added later, the packager copies that directory instead and leaves these four files out.

## What was actually run

The aarch64 binary is smoke-run under qemu-user in GitHub Actions. The runner calls `qemu-aarch64-static` when that name exists, and `qemu-aarch64` on Ubuntu 26.04, where the static emulator no longer has the `-static` suffix. The same smoke run was done on the machine that prepared this change. The smoke run is `galion-init desktop`, which must exit 0 and print the in-memory desktop plan, and `galion-init --execute`, which must exit 2 and print no plan.

That is not a boot on Raspberry Pi 5 hardware. No Pi 5, no SSD, and no Raspberry Pi OS image was used to produce or test this seed. `install.sh` was run twice against an empty directory tree (`GALION_SYSROOT`), which checks that the copy and the systemd enable symlink are idempotent. It was not run on a booted Pi, so `systemctl start galion-os.target` on a live system is untested.

The welcome page is also checked on the runner, from the x86_64 `galion-welcome` binary, over that runner's loopback interface (`sh packaging/test-welcome-page.sh`). That check is not a Raspberry Pi 5 result. The aarch64 `galion-welcome` binary is the one in the tarball. It is checked with `file` and `ldd` in the workflow. It was not run on a Pi 5, and this note does not treat the runner check as a substitute.

## Flash Raspberry Pi OS Bookworm 64-bit

The current Raspberry Pi OS 64-bit download is Debian 13 (Trixie). Bookworm is the older image. On the [Raspberry Pi OS downloads page](https://www.raspberrypi.com/software/operating-systems/) it is listed as **Raspberry Pi OS (Legacy, 64-bit)**: "A port of Debian Bookworm". Use that 64-bit Legacy image, not the Trixie image Imager offers as the default.

1. On another computer, install [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Choose the device Raspberry Pi 5.
3. Choose the operating system Raspberry Pi OS (Legacy) 64-bit, the Bookworm port. If the first screen only offers the current 64-bit image, open the other-images list and pick the Legacy 64-bit Bookworm image. Do not pick a 32-bit image. The seed binary is aarch64.
4. Choose the SSD as the storage device. That is a USB SSD, or an NVMe drive in an enclosure the computer can write. Writing erases that disk.
5. Write the image. Imager can set a hostname, a user, and SSH before it writes. Those settings are Raspberry Pi OS. This repository does not choose them. The seed does not contain a password, a key, or an address.
6. Connect the SSD to the Pi 5 and boot. A USB SSD is the path that does not depend on extra bootloader steps. An NVMe drive on the Pi 5's PCIe connector only boots if the Pi's bootloader tries that device. Updating that bootloader is Raspberry Pi's procedure, not part of this seed, and it was not run here.

Boot the Pi once so Raspberry Pi OS has finished its own first-boot resize. Then copy the tarball. A USB stick is enough. `install.sh` does not download anything, and it does not need a network.

## Install the seed

On the booted Pi, as root:

```sh
tar -xzf galion-os-pi5-seed-<sha>.tar.gz
cd galion-os-pi5-seed-<sha>
sha256sum -c SHA256SUMS
sudo ./install.sh
```

`install.sh` checks `SHA256SUMS` again, copies `bin/` to `/opt/galion/bin/`, copies `LICENSE`, `NOTICE`, this note, and `ideology/` to `/opt/galion/`, installs the units into `/etc/systemd/system/`, creates the system user `galion` if it is missing, and enables `galion-os.target`. On a running system it also starts that target. Run it again and it does the same work without failing.

`GALION_SYSROOT` selects a mounted root instead of the machine you are on. The script then uses `useradd --root` and `systemctl --root`, and it does not start the target, because that system is not the one that is booted. Leaving the variable unset installs onto the running machine.

After a successful start, `systemctl status galion-os.target` should show the target active, `galion-init.service` exited 0, and `galion-welcome.service` running. The service output of init is the in-memory desktop plan. On the machine, open the loopback name `localhost` and port 18711. That page is the welcome. There is no desktop on the framebuffer and no voice daemon. The page is not a measurement of the board.

## Licence

The repository [LICENSE](../LICENSE). This note does not restate it.
