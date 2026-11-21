#!/bin/bash
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Linux-side provisioning for the Galion-Ubuntu WSL2 distro.
# The distro import onto G:\galion\wsl\Galion-Ubuntu is a separate
# Windows installer. Run this script inside the distro, from a checkout
# of this repository. It is safe to run again.
#
# W0 entry point, one command, run as root inside the distro:
#   sudo bash packaging/wsl/provision-galion-ubuntu.sh
#   sudo bash packaging/wsl/provision-galion-ubuntu.sh --dry-run
#
# From Windows, after the distro exists, that same command is:
#   wsl -d Galion-Ubuntu -u root -- bash /path/to/packaging/wsl/provision-galion-ubuntu.sh
#
# The script creates the login user galion, installs the base toolchain,
# WSLg font and audio clients, the desktop entries and GTK session files
# from desktop/install.sh, XDG directories under /home/galion, and
# /etc/wsl.conf with systemd=true and default=galion.
#
# Apt, rustup, Cargo, npm, pip, and font caches stay on this distro's
# Linux filesystem (/var, /opt/galion, /home/galion). Temp files use
# /var/cache/galion/tmp. Cargo build output uses
# /opt/galion/cargo/target. That filesystem is the distro disk on G:.
# /mnt/<drive> is a Windows drive and is not used for caches, temps,
# or build output. The script does not start Galion services, build an image,
# or publish a release. systemd=true takes effect after the distro is
# restarted from Windows. This is not the voice image and not the Pi 5
# seed: those paths are packaging/dry-run.sh and packaging/pi5/install.sh.
# docs/ARCHITECTURE.md maps the programs this desktop session can launch.

set -euo pipefail

here=$(CDPATH='' cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd) || exit 1
root=$(CDPATH='' cd -- "$here/../.." && pwd) || exit 1

usage() {
  cat <<'EOF'
Usage: sudo bash packaging/wsl/provision-galion-ubuntu.sh [--dry-run]

W0 entry point. One command, run as root inside the Galion-Ubuntu
distro, from a checkout of this repository. --dry-run prints the plan
and writes nothing.

The real run creates user galion, installs the toolchain and WSLg
clients, copies the desktop entries and GTK theme, creates XDG
directories under /home/galion, and writes /etc/wsl.conf.
EOF
}

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

say() {
  printf '%s\n' "$*"
}

require_file() {
  if [[ ! -f $1 ]]; then
    die "missing $1"
  fi
}

refuse_symlink() {
  if [[ -L $1 ]]; then
    die "$1 is a symlink"
  fi
}

assert_inside() {
  local path=$1
  local real=$path
  case $path in
    /mnt | /mnt/*)
      die "$path is on a Windows drive mount"
      ;;
  esac
  if [[ -e $path || -L $path ]]; then
    real=$(readlink -f -- "$path")
    case $real in
      /mnt | /mnt/*)
        die "$path resolves to a Windows drive mount ($real)"
        ;;
    esac
  fi
}

copy_file() {
  local src=$1 dest=$2 mode=$3
  refuse_symlink "$dest"
  install -d -m 0755 "$(dirname "$dest")"
  install -m "$mode" "$src" "$dest"
  say "install $dest"
}

packages=(
  build-essential
  ca-certificates
  curl
  git
  xz-utils
  sudo
  python3
  python3-pip
  python3-venv
  fontconfig
  fonts-dejavu-core
  fonts-liberation
  fonts-ibm-plex
  xdg-utils
  xdg-user-dirs
  libpulse0
  pulseaudio-utils
  libpipewire-0.3-0t64
  pipewire-bin
  libasound2-plugins
  libasound2-dev
)

assets=(
  wsl.conf
  sudoers-galion
  pip.conf
  npmrc
  asound.conf
  user-dirs.conf
  user-dirs.dirs
  profile.d-galion-wsl.sh
  rust-tool.sh
)

dry=0
help=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      dry=1
      ;;
    --help | -h)
      help=1
      ;;
    --publish | --flash | --deploy | --execute | --build)
      printf 'refused: this script does not build, flash, or publish an image.\n' >&2
      exit 2
      ;;
    *)
      printf 'refused: unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
  shift
done

if [[ $help -eq 1 && $dry -eq 1 ]]; then
  printf 'refused: pass only one of --help or --dry-run.\n' >&2
  exit 2
fi

if [[ $help -eq 1 ]]; then
  usage
  exit 0
fi

require_file "$root/desktop/install.sh"
require_file "$root/LICENSE"
for name in "${assets[@]}"; do
  require_file "$here/$name"
done

print_plan() {
  say 'mode: dry-run'
  say 'publish: off'
  say 'user: galion'
  say 'home: /home/galion'
  say 'shell: /bin/bash'
  say "packages: ${packages[*]}"
  say 'apt-cache: /var/cache/apt'
  say 'rustup: /opt/galion/rustup'
  say 'cargo: /opt/galion/cargo'
  say 'node: Node.js LTS from nodejs.org into /opt/galion/node'
  say 'node-cache: /var/cache/galion/node'
  say 'npm-cache: /var/cache/npm'
  say 'pip-cache: /var/cache/pip'
  say 'font-cache: /var/cache/fontconfig'
  say 'tmpdir: /var/cache/galion/tmp'
  say 'cargo-target: /opt/galion/cargo/target'
  say 'windows-drive-caches: none'
  say 'entry: sudo bash packaging/wsl/provision-galion-ubuntu.sh'
  say 'audio-clients: libpulse0 pulseaudio-utils libpipewire-0.3-0t64 pipewire-bin libasound2-plugins'
  say 'alsa-headers: libasound2-dev'
  say 'home-owner: galion:galion'
  say 'audio-servers: none'
  say 'apt-components: universe multiverse'
  say 'wsl.conf: /etc/wsl.conf'
  say 'systemd: true'
  say 'default-user: galion'
  say 'desktop: system'
  say 'xdg: /home/galion'
  say 'dry-run: write /etc/wsl.conf mode 0644'
  cat "$here/wsl.conf"
  say 'dry-run: write /etc/profile.d/galion-wsl.sh mode 0644'
  say 'dry-run: write /home/galion/.config/user-dirs.dirs mode 0644'
  say 'dry-run: write /home/galion/.config/user-dirs.conf mode 0644'
  sh "$root/desktop/install.sh" --system --dry-run
  say 'result: no image was built. nothing was published.'
}

if [[ $dry -eq 1 ]]; then
  print_plan
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  die 'run as root inside Galion-Ubuntu (sudo bash packaging/wsl/provision-galion-ubuntu.sh)'
fi

umask 022
export DEBIAN_FRONTEND=noninteractive
export LC_ALL=C

repo_real=$(readlink -f -- "$root")
case $repo_real in
  /mnt | /mnt/*)
    say "note: the checkout is on a Windows drive ($repo_real). Installs and caches still go to the distro filesystem."
    ;;
esac

ensure_user() {
  local home="" shell="" comment=""
  if getent passwd galion >/dev/null; then
    home=$(getent passwd galion | cut -d: -f6)
    shell=$(getent passwd galion | cut -d: -f7)
    if [[ $home != /home/galion ]]; then
      die "user galion exists with home $home, expected /home/galion"
    fi
    say "user: galion already exists ($shell)"
  else
    useradd \
      --create-home \
      --home-dir /home/galion \
      --shell /bin/bash \
      --user-group \
      --comment Galion \
      galion
    say 'user: created galion'
  fi
  refuse_symlink /home/galion
  assert_inside /home/galion
  if [[ ! -d /home/galion ]]; then
    install -d -o galion -g galion -m 0755 /home/galion
  fi
  shell=$(getent passwd galion | cut -d: -f7)
  comment=$(getent passwd galion | cut -d: -f5)
  if [[ $shell != /bin/bash || $comment != Galion ]]; then
    usermod --shell /bin/bash --comment Galion galion
  fi
  passwd -l galion >/dev/null
}

ensure_user

# Temps and Cargo build output stay on the distro filesystem. Inherited
# TMPDIR, TEMP, or TMP values that point at /mnt are replaced.
install -d -m 1777 /var/cache/galion/tmp
refuse_symlink /var/cache/galion/tmp
assert_inside /var/cache/galion/tmp
export TMPDIR=/var/cache/galion/tmp
export TMP=/var/cache/galion/tmp
export TEMP=/var/cache/galion/tmp
export CARGO_TARGET_DIR=/opt/galion/cargo/target
say 'tmpdir: /var/cache/galion/tmp'
say 'cargo-target: /opt/galion/cargo/target'

ensure_apt_component() {
  local component=$1
  local file changed=0
  for file in /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list; do
    if [[ ! -f $file ]]; then
      continue
    fi
    refuse_symlink "$file"
    if [[ $file == */ubuntu.sources ]]; then
      if grep -E -q "^Components:.*\\<${component}\\>" "$file"; then
        continue
      fi
      sed -i -E "s/^(Components:.*)\$/\\1 ${component}/" "$file"
      changed=1
    elif grep -E -q "^deb .*\\<${component}\\>( |\$)" "$file"; then
      continue
    else
      sed -i -E "/^deb / { /\\<${component}\\>/! s/\$/ ${component}/ }" "$file"
      changed=1
    fi
  done
  if [[ $changed -eq 1 ]]; then
    say "apt: enabled $component"
  else
    say "apt: $component already enabled"
  fi
}

# fonts-ibm-plex is in multiverse. libasound2-plugins is in universe.
# Both are part of the WSLg desktop client set. libasound2-dev is the
# ALSA header package the voice step compiles against.
ensure_apt_component universe
ensure_apt_component multiverse

say "apt: install ${packages[*]}"
apt_log=/var/log/galion-provision-apt.log
install -d -m 0755 /var/log
if ! apt-get update >>"$apt_log" 2>&1; then
  tail -n 40 "$apt_log" >&2
  die 'apt-get update failed'
fi
if ! apt-get install -y --no-install-recommends "${packages[@]}" >>"$apt_log" 2>&1; then
  tail -n 40 "$apt_log" >&2
  die 'apt-get install failed'
fi
say "apt-log: $apt_log"

apt_root=$(apt-config dump --format='%v%n' Dir)
apt_cache=$(apt-config dump --format='%v%n' Dir::Cache)
apt_root=${apt_root%%$'\n'*}
apt_cache=${apt_cache%%$'\n'*}
apt_root=${apt_root#\"}
apt_root=${apt_root%\"}
apt_cache=${apt_cache#\"}
apt_cache=${apt_cache%\"}
apt_root=${apt_root%/}
apt_cache=${apt_cache%/}
if [[ -z $apt_cache ]]; then
  die 'apt Dir::Cache is empty'
fi
# Dir::Cache is often relative to Dir, whose value is /.
case $apt_cache in
  /*) ;;
  *) apt_cache="${apt_root}/${apt_cache}" ;;
esac
assert_inside "$apt_cache"
say "apt-cache: $apt_cache"

if ! getent group sudo >/dev/null; then
  die 'the sudo group is missing'
fi
usermod --append --groups sudo galion

copy_file "$here/sudoers-galion" /etc/sudoers.d/galion 0440
visudo -cf /etc/sudoers.d/galion >/dev/null
runuser -u galion -- sudo -n true
say 'sudo: galion passwordless, password locked'

install -d -o root -g root -m 0755 /opt/galion
refuse_symlink /opt/galion
assert_inside /opt/galion
install -d -o galion -g galion -m 0755 /opt/galion/rustup /opt/galion/cargo /opt/galion/cargo/target
install -d -o root -g galion -m 2775 /var/cache/galion /var/cache/galion/node /var/cache/npm /var/cache/pip
install -d -m 1777 /var/cache/galion/tmp
for cache_dir in /var/cache/galion /var/cache/galion/node /var/cache/galion/tmp /var/cache/npm /var/cache/pip /opt/galion/rustup /opt/galion/cargo /opt/galion/cargo/target; do
  refuse_symlink "$cache_dir"
  assert_inside "$cache_dir"
done

copy_file "$here/pip.conf" /etc/pip.conf 0644
copy_file "$here/asound.conf" /etc/asound.conf 0644
copy_file "$here/profile.d-galion-wsl.sh" /etc/profile.d/galion-wsl.sh 0644

bashrc_marker='# galion-wsl caches'
refuse_symlink /etc/bash.bashrc
if [[ ! -f /etc/bash.bashrc ]]; then
  printf '%s\n. /etc/profile.d/galion-wsl.sh\n' "$bashrc_marker" > /etc/bash.bashrc
  say 'install /etc/bash.bashrc'
elif ! grep -q -F "$bashrc_marker" /etc/bash.bashrc; then
  printf '\n%s\n. /etc/profile.d/galion-wsl.sh\n' "$bashrc_marker" >> /etc/bash.bashrc
  say 'update /etc/bash.bashrc'
else
  say 'update /etc/bash.bashrc already present'
fi

fetch() {
  local url=$1 dest=$2
  say "fetch: $url"
  say "cache: $dest"
  assert_inside "$(dirname "$dest")"
  curl \
    --proto '=https' \
    --tlsv1.2 \
    --fail \
    --silent \
    --show-error \
    --location \
    --retry 5 \
    --retry-delay 2 \
    --retry-all-errors \
    --output "$dest.partial" \
    "$url"
  mv -f "$dest.partial" "$dest"
}

run_galion() {
  runuser -u galion -- env \
    HOME=/home/galion \
    USER=galion \
    LOGNAME=galion \
    RUSTUP_HOME=/opt/galion/rustup \
    CARGO_HOME=/opt/galion/cargo \
    TMPDIR=/var/cache/galion/tmp \
    "$@"
}

if [[ ! -x /var/cache/galion/rustup-init.sh ]]; then
  fetch https://sh.rustup.rs /var/cache/galion/rustup-init.sh
  chmod 0755 /var/cache/galion/rustup-init.sh
fi

rustup_log=/var/log/galion-provision-rustup.log
run_rustup() {
  if ! run_galion "$@" >>"$rustup_log" 2>&1; then
    tail -n 40 "$rustup_log" >&2
    die 'rustup failed'
  fi
}

if [[ -x /opt/galion/cargo/bin/rustup ]]; then
  say 'rustup: toolchain already present, ensuring stable'
  run_rustup /opt/galion/cargo/bin/rustup toolchain install stable --profile minimal
  run_rustup /opt/galion/cargo/bin/rustup default stable
else
  say 'rustup: install stable into /opt/galion/rustup'
  run_rustup sh /var/cache/galion/rustup-init.sh \
    -y \
    --no-modify-path \
    --default-toolchain stable \
    --profile minimal
fi
say "rustup-log: $rustup_log"
chown -R galion:galion /opt/galion/rustup /opt/galion/cargo

copy_file "$here/rust-tool.sh" /usr/local/bin/galion-rust-tool 0755
for tool in rustup cargo rustc; do
  if [[ ! -x /opt/galion/cargo/bin/$tool ]]; then
    die "missing /opt/galion/cargo/bin/$tool after rustup"
  fi
  ln -sfn galion-rust-tool "/usr/local/bin/$tool"
  say "link /usr/local/bin/$tool"
done

node_arch() {
  local machine
  machine=$(uname -m)
  case $machine in
    x86_64) printf 'x64\n' ;;
    aarch64 | arm64) printf 'arm64\n' ;;
    *)
      die "no Node.js build for $machine"
      ;;
  esac
}

node_lts_version() {
  python3 -c '
import json, sys
rows = json.load(sys.stdin)
for row in rows:
    if row.get("lts"):
        value = row.get("version") or ""
        if not value.startswith("v"):
            raise SystemExit("node index version has no v prefix")
        print(value)
        raise SystemExit(0)
raise SystemExit("node index has no LTS release")
'
}

verify_node_tarball() {
  local name=$1 sums=$2
  awk -v name="$name" '
    $2 == name { print; found = 1 }
    END { exit found ? 0 : 1 }
  ' "$sums" | (cd /var/cache/galion/node && sha256sum -c -)
}

install_node() {
  local version arch name sums tarball have lts bin npm_cache
  fetch https://nodejs.org/dist/index.json /var/cache/galion/node/index.json
  version=$(node_lts_version </var/cache/galion/node/index.json)
  arch=$(node_arch)
  name="node-${version}-linux-${arch}.tar.xz"
  tarball=/var/cache/galion/node/$name
  sums=/var/cache/galion/node/SHASUMS256.txt
  fetch "https://nodejs.org/dist/${version}/SHASUMS256.txt" "$sums"
  if [[ ! -f $tarball ]] || ! verify_node_tarball "$name" "$sums"; then
    fetch "https://nodejs.org/dist/${version}/${name}" "$tarball"
  fi
  if ! verify_node_tarball "$name" "$sums"; then
    die "checksum failed for $name"
  fi
  have=""
  if [[ -x /opt/galion/node/bin/node ]]; then
    have=$(/opt/galion/node/bin/node -p 'process.version')
  fi
  if [[ $have == "$version" ]]; then
    say "node: already $version"
  else
    say "node: install $version into /opt/galion/node"
    rm -rf /opt/galion/node.next
    install -d -m 0755 /opt/galion/node.next
    tar -xJf "$tarball" -C /opt/galion/node.next --strip-components=1
    rm -rf /opt/galion/node
    mv /opt/galion/node.next /opt/galion/node
  fi
  copy_file "$here/npmrc" /opt/galion/node/etc/npmrc 0644
  install -o galion -g galion -m 0644 "$here/npmrc" /home/galion/.npmrc
  say 'install /home/galion/.npmrc'
  for bin in node npm npx corepack; do
    if [[ -e /opt/galion/node/bin/$bin ]]; then
      ln -sfn "/opt/galion/node/bin/$bin" "/usr/local/bin/$bin"
      say "link /usr/local/bin/$bin"
    fi
  done
  if [[ ! -x /usr/local/bin/node ]]; then
    die 'node was not installed'
  fi
  lts=$(/usr/local/bin/node -p 'process.release.lts ? "yes" : "no"')
  if [[ $lts != yes ]]; then
    die 'installed node is not an LTS build'
  fi
  npm_cache=$(runuser -u galion -- env PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" /usr/local/bin/npm config get cache)
  if [[ $npm_cache != /var/cache/npm ]]; then
    die "npm cache is $npm_cache, expected /var/cache/npm"
  fi
  say "node: $version"
  say 'npm-cache: /var/cache/npm'
}

install_node

venv_smoke=$(mktemp -d /var/cache/galion/tmp/venv.XXXXXX)
chown galion:galion "$venv_smoke"
runuser -u galion -- python3 -m venv "$venv_smoke/venv"
if [[ ! -x $venv_smoke/venv/bin/python ]]; then
  die 'python3 -m venv did not create a python'
fi
rm -rf "$venv_smoke"
say 'python3-venv: ok'

if ! gcc --version >/dev/null; then
  die 'gcc is missing after the toolchain install'
fi
if ! git --version >/dev/null; then
  die 'git is missing after the toolchain install'
fi
if ! curl --version >/dev/null; then
  die 'curl is missing after the toolchain install'
fi
say "rustc: $(/usr/local/bin/rustc --version)"
say 'toolchain: ok'

fc-cache -f
if [[ -d /var/cache/fontconfig ]]; then
  refuse_symlink /var/cache/fontconfig
  assert_inside /var/cache/fontconfig
fi
say 'font-cache: /var/cache/fontconfig'

sh "$root/desktop/install.sh" --system

xdg_names=(
  Desktop
  Downloads
  Templates
  Public
  Documents
  Music
  Pictures
  Videos
  .config
  .local/share
  .local/state
  .cache
)
for xdg_name in "${xdg_names[@]}"; do
  install -d -o galion -g galion -m 0755 "/home/galion/$xdg_name"
  refuse_symlink "/home/galion/$xdg_name"
  assert_inside "/home/galion/$xdg_name"
done
install -o galion -g galion -m 0644 "$here/user-dirs.dirs" /home/galion/.config/user-dirs.dirs
install -o galion -g galion -m 0644 "$here/user-dirs.conf" /home/galion/.config/user-dirs.conf
# install -d applies -o to the final path component. Ancestors such as
# /home/galion/.local are created as root, and the voice step then cannot
# write ~/.local/share/galion or ~/.local/bin. Hand the home tree to galion.
chown -R galion:galion /home/galion
say 'xdg: /home/galion'
say 'home-owner: galion:galion'

copy_file "$here/wsl.conf" /etc/wsl.conf 0644
if ! grep -q '^systemd=true$' /etc/wsl.conf; then
  die '/etc/wsl.conf is missing systemd=true'
fi
if ! grep -q '^default=galion$' /etc/wsl.conf; then
  die '/etc/wsl.conf is missing default=galion'
fi

say 'provision-galion-ubuntu: ok'
say 'mode: real'
say 'publish: off'
say 'user: galion'
say 'home: /home/galion'
say 'shell: /bin/bash'
say 'wsl.conf: /etc/wsl.conf'
say 'systemd: true'
say 'default-user: galion'
say 'audio-servers: none'
say 'windows-drive-caches: none'
say 'caches: /var/cache/apt /var/cache/galion /var/cache/npm /var/cache/pip /opt/galion/rustup /opt/galion/cargo /var/cache/fontconfig'
say 'tmpdir: /var/cache/galion/tmp'
say 'cargo-target: /opt/galion/cargo/target'
say 'entry: sudo bash packaging/wsl/provision-galion-ubuntu.sh'
say 'desktop: /usr/local/share/applications'
say 'theme: /etc/xdg/gtk-3.0 /etc/xdg/gtk-4.0'
say 'restart: from Windows, wsl --shutdown, then open Galion-Ubuntu again'
say 'result: no image was built. nothing was published.'
