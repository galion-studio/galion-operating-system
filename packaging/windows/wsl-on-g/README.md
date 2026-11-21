# Galion Ubuntu on G: (WSL2)

G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
Developed and distributed by Galion Labs
Perpetual Open MIT License
Copyright © 2026 Galion Labs. All rights reserved.

The licence text is [LICENSE](../../../LICENSE). This page does not restate it.

Sector W1 is the Windows-side installer. It puts one Ubuntu 24.04 WSL2 guest, named `Galion-Ubuntu`, on the G: drive so the Obsidian desktop and Galion One Voice have one Linux environment on this laptop. The script is [Install-GalionWSL.ps1](Install-GalionWSL.ps1).

This is not the Galion OS image. The image plan in [docs/PACKAGING.md](../../../docs/PACKAGING.md) is Ubuntu 26.04, and it still waits on `galion-init`. Ubuntu 24.04 is the release Canonical publishes as a WSL rootfs. Its archive Node.js is 18.19.1, which is below the research app's Node.js 22 line. This installer does not install Node.js and does not start the console, the research app, or Galion Voice.

## What the script does

Run it from an elevated PowerShell on the laptop. It checks that the session is Administrator and that `G:` exists. If either check fails, it stops with a `refused:` line and writes nothing.

On a clean machine it:

1. Creates `G:\galion\tmp\win` and points `TEMP` and `TMP` at that directory for this process only. It does not call `setx`, so the Windows account temp directory is unchanged.
2. Enables the Windows features `Microsoft-Windows-Subsystem-Linux` and `VirtualMachinePlatform` when they are missing. Enabling them stores the WSL platform binaries in the Windows component store. Those binaries are a Windows component. This script does not copy them onto G:, and it does not copy a rootfs, a disk, a swap file, or a temp file onto the C: drive.
3. Downloads the official Ubuntu 24.04.5 WSL rootfs to `G:\galion\wsl\downloads` and checks the size and the SHA-256 pin below. The file is a gzip tar of the root filesystem. `wsl --import` consumes that tar.
4. Writes the `.wslconfig` body to `G:\galion\wsl\.wslconfig`. WSL reads `%USERPROFILE%\.wslconfig`, so the script creates a symbolic link from that profile path to the file on G:. The link is a reparse point. The file body stays on G:. If the profile already has a real `.wslconfig` file, the script stops and does not overwrite it.
5. Imports the distro:

```text
wsl --import Galion-Ubuntu G:\galion\wsl\Galion-Ubuntu G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl --version 2
```

The `ext4.vhdx` is created in `G:\galion\wsl\Galion-Ubuntu`.
6. Runs `wsl --shutdown` so the new limits apply. That stops every WSL2 distro on the machine, not only this one.
7. Inside the guest, creates the user `galion` and the empty directory `/opt/galion/openmind-desktop`. That is the console path from the packaging plan. The script does not build the binary.

A feature enable can ask for a restart. The script then exits `3010` and imports nothing yet. Run it again after Windows restarts.

## Layout on G:

```text
G:\galion\tmp\win\                                          installer temp for this process
G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl        pinned rootfs
G:\galion\wsl\downloads\SHA256SUMS                          published sums, checked against the pin
G:\galion\wsl\Galion-Ubuntu\ext4.vhdx                       the distro disk
G:\galion\wsl\swap.vhdx                                     WSL swap, named by .wslconfig
G:\galion\wsl\.wslconfig                                    config body
G:\galion\wsl\guest-setup.sh                                user and directory setup
G:\galion\src\obsidian-open-mind\                           checkout place, left empty
G:\galion\src\galion-one-voice\                             checkout place, left empty
```

`galion-studio/obsidian-open-mind` is the Obsidian desktop. `openmind-desktop` is the local control console. `galion-studio/galion-one-voice` is Galion One Voice. The voice packaging note names no install directory for `galion-voiced`, so the voice folder is only a checkout place. This installer does not clone, build, start, or deploy either tree.

The default WSL swap file would otherwise land in the Windows temp directory. The config sets `swapFile` so the swap disk is created on G:. Memory is half of the installed GiB, and at least 4GiB is left for Windows when the machine has 8GiB or more. Swap is 4GB. Processors are all of them when the machine has two or fewer, two when it has three, and half when it has four or more.

```text
[wsl2]
memory=<half, with the floor above>
processors=<count above>
swap=4GB
swapFile=G:\\galion\\wsl\\swap.vhdx
localhostForwarding=true
guiApplications=true
```

The pinned image is amd64 only. A Windows installation that is not amd64 is refused. The script will not download a different rootfs.

| | |
|---|---|
| File | `ubuntu-24.04.5-wsl-amd64.wsl` |
| URL | https://releases.ubuntu.com/24.04/ubuntu-24.04.5-wsl-amd64.wsl |
| SHA-256 | `bb415d824822c4b878125729af451a5d18fb13d1cf5cbed9a7393ad64ac6039e` |
| Bytes | `388975696` |
| Sums | https://releases.ubuntu.com/24.04/SHA256SUMS |

The script checks that the published sums line matches this pin. It does not check `SHA256SUMS.gpg`. The virtual disk can grow on G:. Keep free space there. The default maximum size is the WSL default.

## Commands

From an elevated PowerShell, in a checkout of this repository:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\packaging\windows\wsl-on-g\Install-GalionWSL.ps1 -DryRun
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\packaging\windows\wsl-on-g\Install-GalionWSL.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\packaging\windows\wsl-on-g\Install-GalionWSL.ps1 -Repair
wsl -d Galion-Ubuntu
```

`-DryRun` prints the plan and writes nothing. On a machine that is not Windows it still prints the first-install plan and says the host was not read. A real run on a machine that is not Windows is refused.

A second run, once `Galion-Ubuntu` is registered and `ext4.vhdx` is present, skips the import and changes nothing. `-Repair` rewrites the config, checks the rootfs hash, and repeats the guest setup. It does not unregister the distro while `ext4.vhdx` is present. It unregisters and imports again only when the name is registered and that disk is missing, or when the install directory is a leftover and the name is not registered.

Exit `0` means the plan was printed or the distro is in place. Exit `1` is a refusal. Exit `3010` means Windows must restart before the import.

## What a green test is

[Install-GalionWSL.Tests.ps1](Install-GalionWSL.Tests.ps1) is the Pester check. The workflow is [.github/workflows/wsl-on-g.yml](../../../.github/workflows/wsl-on-g.yml). It runs `-DryRun` on the hosted runner. A green run is not a Windows install. It does not enable WSL, download Ubuntu, or write a virtual disk.

```powershell
pwsh -NoProfile -File .\packaging\windows\wsl-on-g\Install-GalionWSL.ps1 -DryRun
```
