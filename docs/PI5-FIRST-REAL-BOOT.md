# First real boot on the Pi 5

This page is the order of commands on the Pi after the SSD has booted Raspberry Pi OS. Flash the disk from [PI5-SEED.md](PI5-SEED.md). The longer notes stay in [PI5.md](PI5.md).

Nothing on this page has been run on a Raspberry Pi 5. The offline test of the pack script is not a Raspberry Pi 5 result.

Let Raspberry Pi OS finish its own first-boot resize before you copy anything. Copy this checkout and the seed tarball onto the Pi. A USB stick is enough. Nothing below downloads the seed.

Run these from the checkout. `<seed>` is the unpacked `galion-os-pi5-seed-<sha>` directory.

1. Check the seed, then write the [first-boot report](../scripts/pi5/first-boot.sh).

```sh
tar -xzf galion-os-pi5-seed-<sha>.tar.gz
cd galion-os-pi5-seed-<sha>
sha256sum -c SHA256SUMS
cd /path/to/galion-operating-system
sudo sh scripts/pi5/first-boot.sh <seed> "$PWD/pi5-first-boot.txt"
```

A second run of that script is safe. Read `pi5-first-boot.txt`. A failed line says what to do next.

2. Write the [board report](../scripts/pi5/board-report.sh). It runs the [unit check](../scripts/pi5-flash-check.sh) and the loopback table.

```sh
sudo sh scripts/pi5/board-report.sh "$PWD/pi5-board.txt"
```

Keep `pi5-board.txt` beside `pi5-first-boot.txt`. Exit 0 means the report was written. FAIL rows inside it are still failures.

3. Pack both reports into one dated tarball.

```sh
sh scripts/pi5/pack-reports.sh "$PWD"
```

The file is `pi5-reports-YYYYMMDD.tar.gz` in that directory. Copy that file off the Pi. Hostnames, secret values, and addresses other than loopback are removed before the archive is written. The two report files on the Pi are left as they were.

Bring the tarball back. It is a reading from the machine only if you ran the two commands above on the board.
