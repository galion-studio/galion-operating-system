# Pi 5 symphony

One GitHub Actions job boots a single arm64 Debian Bookworm virtual machine and installs three seeds in it:

- Galion OS, built from `origin/main` of this repository by `packaging/pi-seed.sh`
- Galion Research, built from the public git commit that merged [hermes-research pull request 14](https://github.com/galion-studio/hermes-research/pull/14) (`74f9a7071f1c9672c1fe83e8e96f70e6cbb17318`)
- `openmind-desktop`, built from the public git commit that merged [obsidian-open-mind pull request 100](https://github.com/galion-studio/obsidian-open-mind/pull/100) (`b26ad02e1b1e9084815bb56d3aff9a02888ca8d8`)

The workflow is `.github/workflows/pi5-symphony.yml`. It calls `scripts/pi5-seed-boot.sh` from the OS boot check. It does not start a second emulator.

## What the guest is

The guest is Debian's arm64 nocloud image, `debian-12-nocloud-arm64`, under `qemu-system-aarch64` on a virt machine. The virtual machine has no NIC. Installing the seeds does not use a network. Downloading the cloud image, and building the other two seeds on the runner, does.

The Actions artifact zip for those two repositories answers 401 when no token is sent. This job does not set a token and does not read secrets. It clones the public commits above and builds them. Research is the Pi 5 seed archive from that repository's pack script. Desktop is the `openmind-desktop` binary from crate `openmind-desktop`, profile `pi-seed`, target `aarch64-unknown-linux-musl`. Pull request 100's archive has no systemd unit for that binary. The job installs a unit that runs `openmind-desktop --listen 127.0.0.1:18181 --stack off` as the user `galion`.

The research unit is the one in that seed: `galion-research-pi5.service`, loopback `127.0.0.1:8787`. If the official Node binary needs a Bookworm shared library the nocloud image does not ship, the host copies that library from Debian Bookworm's public archive into the disk before boot, then the guest runs `ldconfig`. The guest still has no NIC.

## The table

`scripts/symphony/health-table.sh` prints one table, `pi5-health-table.txt`.

| Service | Check |
|---|---|
| `galion-init.service` | No HTTP health endpoint. PASS when the oneshot is `active` / `exited` with result `success`, the same reading as the OS boot check. |
| `galion-os.target` | No HTTP health endpoint. PASS when the target is `active` / `active`. |
| `galion-research` | `GET http://127.0.0.1:8787/health`. PASS when the body is `{"ok":true,"service":"galion-research","bind":"127.0.0.1"}`. |
| `openmind-desktop` | `GET http://127.0.0.1:18181/` PASS when the control console page is returned. `GET http://127.0.0.1:18181/probes` PASS when the read-only probe report is returned. |
| Each service in that probe report | The host, port, and path from the report. `up` is PASS. Anything else is FAIL. |

`installed:` counts `galion-init.service`, `galion-os.target`, `galion-research`, and both `openmind-desktop` endpoints. `summary:` counts every row, including services the desktop probed and this job did not start. Those probe rows can be FAIL while `installed:` is `0 FAIL`. The job fails when `installed:` has a FAIL, or when the guest is not aarch64 Debian Bookworm with no default route and `environment: emulator`.

The header says this table is not a Raspberry Pi 5 result. A PASS is an emulator reading. It is not a reading from Raspberry Pi 5 hardware, Raspberry Pi OS, or an SSD.
