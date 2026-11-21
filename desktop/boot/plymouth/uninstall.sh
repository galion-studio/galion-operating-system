#!/bin/sh
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This script does not restate it.
#
# Remove the Galion Plymouth theme. Same work as install.sh --uninstall.

set -eu
DIR=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
exec "$DIR/install.sh" --uninstall "$@"
