#!/bin/bash
# Contract for packaging/wsl/provision-galion-ubuntu.sh.
# With no arguments: shellcheck, then --dry-run. Writes nothing.
# With --real: shellcheck, then the real provisioner, run twice.
# A pass here is not a Windows install and not a published image.

set -euo pipefail
export LC_ALL=C

here=$(CDPATH='' cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd) || exit 1
root=$(CDPATH='' cd -- "$here/../.." && pwd) || exit 1
cd "$root"

prov=$here/provision-galion-ubuntu.sh

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

need_line() {
  local text=$1
  local needle=$2
  if ! printf '%s\n' "$text" | grep -F -q -e "$needle"; then
    printf 'error: missing line: %s\n' "$needle" >&2
    exit 1
  fi
}

cleanup_dirs=()
cleanup() {
  local dir
  for dir in "${cleanup_dirs[@]}"; do
    rm -rf "$dir"
  done
}
trap cleanup EXIT

mode=dry
if [[ $# -gt 1 ]]; then
  printf 'refused: too many arguments.\n' >&2
  exit 2
fi
if [[ ${1:-} == --real ]]; then
  mode=real
elif [[ $# -eq 1 ]]; then
  printf 'refused: unknown argument: %s\n' "$1" >&2
  exit 2
fi

if ! command -v shellcheck >/dev/null 2>&1; then
  die 'shellcheck is required and was not found'
fi

expected_sh='
packaging/wsl/container-ci.sh
packaging/wsl/profile.d-galion-wsl.sh
packaging/wsl/provision-galion-ubuntu.sh
packaging/wsl/rust-tool.sh
packaging/wsl/test-provision.sh
'
found_sh=$(find packaging/wsl -type f -name '*.sh' | sort)
if [[ $found_sh != "$(printf '%s\n' "$expected_sh" | sed '/^$/d')" ]]; then
  printf 'error: shellcheck list does not match packaging/wsl/*.sh\n' >&2
  printf 'found:\n%s\n' "$found_sh" >&2
  exit 1
fi

shellcheck --severity=warning -s bash \
  packaging/wsl/provision-galion-ubuntu.sh \
  packaging/wsl/test-provision.sh \
  packaging/wsl/container-ci.sh
shellcheck --severity=warning -s sh \
  packaging/wsl/profile.d-galion-wsl.sh \
  packaging/wsl/rust-tool.sh
printf 'shellcheck ok\n'

if grep -E -n '([0-9]{1,3}\.){3}[0-9]{1,3}' packaging/wsl/*; then
  die 'wsl files contain an address'
fi
if grep -E -n 'BEGIN (OPENSSH|RSA|EC) PRIVATE KEY|chpasswd|ghp_[A-Za-z0-9]|AKIA[0-9A-Z]{16}' \
  packaging/wsl/provision-galion-ubuntu.sh \
  packaging/wsl/container-ci.sh \
  packaging/wsl/profile.d-galion-wsl.sh \
  packaging/wsl/rust-tool.sh \
  packaging/wsl/wsl.conf \
  packaging/wsl/sudoers-galion \
  packaging/wsl/npmrc \
  packaging/wsl/pip.conf \
  packaging/wsl/asound.conf \
  packaging/wsl/user-dirs.dirs \
  packaging/wsl/user-dirs.conf
then
  die 'wsl files contain a credential marker'
fi

fingerprint() {
  sha256sum \
    "$root/LICENSE" \
    "$prov" \
    "$here/wsl.conf" \
    "$here/sudoers-galion" \
    "$here/user-dirs.dirs" \
    "$here/user-dirs.conf"
}

machine_snapshot() {
  local wsl_sum user_line
  if [[ -e /etc/wsl.conf ]]; then
    wsl_sum=$(sha256sum /etc/wsl.conf)
  else
    wsl_sum=absent
  fi
  user_line=$(getent passwd galion || true)
  printf '%s\n%s\n' "$wsl_sum" "$user_line"
}

expect_rc() {
  local want=$1
  shift
  local rc=0
  "$@" || rc=$?
  if [[ $rc -ne $want ]]; then
    die "command exited $rc, wanted $want"
  fi
}

run_dry() {
  local stubs stub_bin text before_files after_files before_machine after_machine
  stubs=$(mktemp -d)
  cleanup_dirs+=("$stubs")
  for stub_bin in curl wget apt-get apt useradd usermod groupadd passwd runuser fc-cache systemctl tar python3 npm node rustup cargo rustc git sudo visudo install; do
    cat >"$stubs/$stub_bin" <<'EOF'
#!/bin/sh
printf '%s refused\n' "$0" >&2
exit 99
EOF
    chmod 0755 "$stubs/$stub_bin"
  done

  before_files=$(fingerprint)
  before_machine=$(machine_snapshot)
  text=$(PATH="$stubs:$PATH" bash "$prov" --dry-run)
  after_files=$(fingerprint)
  after_machine=$(machine_snapshot)
  if [[ $before_files != "$after_files" ]]; then
    die 'dry-run changed a repository file'
  fi
  if [[ $before_machine != "$after_machine" ]]; then
    die 'dry-run changed the account or /etc/wsl.conf'
  fi

  need_line "$text" 'mode: dry-run'
  need_line "$text" 'publish: off'
  need_line "$text" 'user: galion'
  need_line "$text" 'home: /home/galion'
  need_line "$text" 'shell: /bin/bash'
  need_line "$text" 'build-essential'
  need_line "$text" 'git'
  need_line "$text" 'curl'
  need_line "$text" 'python3-venv'
  need_line "$text" 'fonts-ibm-plex'
  need_line "$text" 'xdg-utils'
  need_line "$text" 'libpulse0'
  need_line "$text" 'pulseaudio-utils'
  need_line "$text" 'libpipewire-0.3-0t64'
  need_line "$text" 'pipewire-bin'
  need_line "$text" 'apt-cache: /var/cache/apt'
  need_line "$text" 'rustup: /opt/galion/rustup'
  need_line "$text" 'cargo: /opt/galion/cargo'
  need_line "$text" 'node: Node.js LTS from nodejs.org into /opt/galion/node'
  need_line "$text" 'node-cache: /var/cache/galion/node'
  need_line "$text" 'npm-cache: /var/cache/npm'
  need_line "$text" 'pip-cache: /var/cache/pip'
  need_line "$text" 'font-cache: /var/cache/fontconfig'
  need_line "$text" 'tmpdir: /var/cache/galion/tmp'
  need_line "$text" 'cargo-target: /opt/galion/cargo/target'
  need_line "$text" 'entry: sudo bash packaging/wsl/provision-galion-ubuntu.sh'
  need_line "$text" 'windows-drive-caches: none'
  need_line "$text" 'audio-servers: none'
  need_line "$text" 'apt-components: universe multiverse'
  need_line "$text" 'systemd=true'
  need_line "$text" 'default=galion'
  need_line "$text" 'appendWindowsPath=false'
  need_line "$text" 'wsl.conf: /etc/wsl.conf'
  need_line "$text" 'install /usr/local/share/applications/galion-research.desktop'
  need_line "$text" 'install /usr/local/share/applications/openmind-desktop.desktop'
  need_line "$text" 'install /usr/local/share/applications/galion-voice.desktop'
  need_line "$text" 'install /usr/local/share/icons/hicolor/scalable/apps/galion-os.svg'
  need_line "$text" 'install /etc/xdg/gtk-3.0/settings.ini'
  need_line "$text" 'install /etc/xdg/gtk-3.0/gtk.css'
  need_line "$text" 'install /etc/xdg/gtk-4.0/settings.ini'
  need_line "$text" 'install /etc/xdg/gtk-4.0/gtk.css'
  need_line "$text" 'xdg: /home/galion'
  need_line "$text" 'result: no image was built. nothing was published.'

  if printf '%s\n' "$text" | grep -E -q '(^| )pulseaudio( |$)'; then
    die 'dry-run installs the pulseaudio server'
  fi
  if printf '%s\n' "$text" | grep -E -q '(^| )pipewire-pulse( |$)'; then
    die 'dry-run installs the pipewire-pulse server'
  fi
  if printf '%s\n' "$text" | grep -E -q 'cache: /mnt/|/mnt/[a-z]/'; then
    die 'dry-run places a path on a Windows drive'
  fi
  if printf '%s\n' "$text" | grep -E -q '([0-9]{1,3}\.){3}[0-9]{1,3}'; then
    die 'dry-run output contains an address'
  fi

  expect_rc 0 bash "$prov" --help >/dev/null
  expect_rc 2 bash "$prov" --publish
  expect_rc 2 bash "$prov" --deploy
  expect_rc 2 bash "$prov" --no-such
  expect_rc 2 bash "$prov" --help --dry-run
  printf 'dry-run ok\n'
}

assert_inside_dir() {
  local path=$1
  local real
  if [[ ! -d $path ]]; then
    die "missing directory $path"
  fi
  if [[ -L $path ]]; then
    die "$path is a symlink"
  fi
  real=$(readlink -f -- "$path")
  case $real in
    /mnt | /mnt/*) die "$path resolves to a Windows drive ($real)" ;;
  esac
}

run_real() {
  local log before_files after_files pass
  if [[ "$(id -u)" -ne 0 ]]; then
    die 'real mode must run as root'
  fi
  before_files=$(fingerprint)
  log=$(mktemp)
  cleanup_dirs+=("$log")
  for pass in 1 2; do
    say_pass=$pass
    if ! bash "$prov" | tee "$log"; then
      die "provisioner failed on pass $say_pass"
    fi
    need_line "$(cat "$log")" 'provision-galion-ubuntu: ok'
    need_line "$(cat "$log")" 'mode: real'
    need_line "$(cat "$log")" 'publish: off'
    need_line "$(cat "$log")" 'systemd: true'
    need_line "$(cat "$log")" 'default-user: galion'
    need_line "$(cat "$log")" 'audio-servers: none'
    need_line "$(cat "$log")" 'windows-drive-caches: none'
    need_line "$(cat "$log")" 'tmpdir: /var/cache/galion/tmp'
    need_line "$(cat "$log")" 'cargo-target: /opt/galion/cargo/target'
    need_line "$(cat "$log")" 'entry: sudo bash packaging/wsl/provision-galion-ubuntu.sh'
    need_line "$(cat "$log")" 'python3-venv: ok'
    if grep -E -q 'cache: /mnt/' "$log"; then
      die 'a cache was placed on a Windows drive'
    fi
    # Debian package revisions are not addresses. A bare four-part
    # number, or one followed by a slash, a colon, or a space, is.
    if grep -E -q '([0-9]{1,3}\.){3}[0-9]{1,3}([^0-9.-]|$)' "$log"; then
      die 'provisioner output contains an address'
    fi
  done

  after_files=$(fingerprint)
  if [[ $before_files != "$after_files" ]]; then
    die 'provisioner changed a repository file'
  fi

  local home shell status groups
  home=$(getent passwd galion | cut -d: -f6)
  shell=$(getent passwd galion | cut -d: -f7)
  if [[ $home != /home/galion ]]; then
    die "home is $home"
  fi
  if [[ $shell != /bin/bash ]]; then
    die "shell is $shell"
  fi
  if [[ -L /home/galion ]]; then
    die '/home/galion is a symlink'
  fi
  status=$(passwd -S galion)
  case $status in
    'galion L'*) ;;
    *) die 'galion password is not locked' ;;
  esac
  groups=$(id -nG galion)
  case " $groups " in
    *' sudo '*) ;;
    *) die 'galion is not in the sudo group' ;;
  esac
  runuser -u galion -- sudo -n true

  cmp -s "$here/wsl.conf" /etc/wsl.conf || die '/etc/wsl.conf differs'
  cmp -s "$here/sudoers-galion" /etc/sudoers.d/galion || die 'sudoers differs'
  if [[ $(stat -c '%a' /etc/sudoers.d/galion) != 440 ]]; then
    die 'sudoers mode is not 440'
  fi
  cmp -s "$here/pip.conf" /etc/pip.conf || die 'pip.conf differs'
  cmp -s "$here/asound.conf" /etc/asound.conf || die 'asound.conf differs'
  cmp -s "$here/profile.d-galion-wsl.sh" /etc/profile.d/galion-wsl.sh || die 'profile.d differs'
  cmp -s "$here/npmrc" /opt/galion/node/etc/npmrc || die 'npmrc differs'
  cmp -s "$here/npmrc" /home/galion/.npmrc || die 'user npmrc differs'
  cmp -s "$here/user-dirs.dirs" /home/galion/.config/user-dirs.dirs || die 'user-dirs.dirs differs'
  cmp -s "$here/user-dirs.conf" /home/galion/.config/user-dirs.conf || die 'user-dirs.conf differs'
  if grep -q '/mnt/' /home/galion/.config/user-dirs.dirs; then
    die 'xdg dirs point at a Windows drive'
  fi
  if [[ $(grep -c -F '# galion-wsl caches' /etc/bash.bashrc) -ne 1 ]]; then
    die 'bash.bashrc marker is not exactly once'
  fi

  local desktop_name icon_name
  for desktop_name in galion-research.desktop openmind-desktop.desktop galion-voice.desktop; do
    cmp -s "$root/desktop/applications/$desktop_name" "/usr/local/share/applications/$desktop_name" \
      || die "$desktop_name differs"
  done
  for icon_name in galion-research galion-voice galion-os; do
    cmp -s "$root/desktop/icons/hicolor/scalable/apps/$icon_name.svg" \
      "/usr/local/share/icons/hicolor/scalable/apps/$icon_name.svg" \
      || die "$icon_name.svg differs"
  done
  local gtk_major
  for gtk_major in 3.0 4.0; do
    cmp -s "$root/desktop/gtk/settings.ini" "/etc/xdg/gtk-$gtk_major/settings.ini" \
      || die "gtk $gtk_major settings differ"
    cmp -s "$root/desktop/gtk/gtk.css" "/etc/xdg/gtk-$gtk_major/gtk.css" \
      || die "gtk $gtk_major css differs"
  done

  local xdg_name
  for xdg_name in Desktop Downloads Documents Music Pictures Videos .config .local/share .cache; do
    assert_inside_dir "/home/galion/$xdg_name"
  done
  for xdg_name in /var/cache/apt /var/cache/galion /var/cache/galion/node /var/cache/galion/tmp /var/cache/npm /var/cache/pip /opt/galion/rustup /opt/galion/cargo /opt/galion/cargo/target /var/cache/fontconfig; do
    assert_inside_dir "$xdg_name"
  done
  pinned=$(runuser -u galion -- bash -lc 'printf %s "$TMPDIR $CARGO_TARGET_DIR $CARGO_HOME $NPM_CONFIG_CACHE"')
  if [[ $pinned != '/var/cache/galion/tmp /opt/galion/cargo/target /opt/galion/cargo /var/cache/npm' ]]; then
    die "login environment is $pinned"
  fi

  command -v gcc >/dev/null
  command -v git >/dev/null
  command -v curl >/dev/null
  command -v pactl >/dev/null
  command -v pw-cli >/dev/null
  command -v xdg-open >/dev/null
  if [[ -x /usr/bin/pulseaudio || -x /usr/bin/pipewire-pulse ]]; then
    die 'a sound server binary was installed'
  fi

  local rustc_out node_lts npm_cache pip_cache venv
  rustc_out=$(/usr/local/bin/rustc --version)
  case $rustc_out in
    rustc\ 1.*) ;;
    *) die "unexpected rustc: $rustc_out" ;;
  esac
  /usr/local/bin/cargo --version >/dev/null
  node_lts=$(/usr/local/bin/node -p 'process.release.lts ? "yes" : "no"')
  if [[ $node_lts != yes ]]; then
    die 'node is not an LTS build'
  fi
  npm_cache=$(runuser -u galion -- env PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" /usr/local/bin/npm config get cache)
  if [[ $npm_cache != /var/cache/npm ]]; then
    die "npm cache is $npm_cache"
  fi
  pip_cache=$(runuser -u galion -- env -u PIP_CACHE_DIR python3 -m pip cache dir)
  if [[ $pip_cache != /var/cache/pip ]]; then
    die "pip cache is $pip_cache"
  fi
  venv=$(mktemp -d)
  cleanup_dirs+=("$venv")
  chown galion:galion "$venv"
  runuser -u galion -- python3 -m venv "$venv/venv"
  if [[ ! -x $venv/venv/bin/python ]]; then
    die 'python3 -m venv failed'
  fi
  printf 'real ok\n'
}

if [[ $mode == dry ]]; then
  run_dry
else
  run_real
fi
