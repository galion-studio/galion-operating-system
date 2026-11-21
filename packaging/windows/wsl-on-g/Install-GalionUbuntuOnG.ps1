# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Owner entry for Galion-Ubuntu on G:\galion. The .cmd launcher is the
# command to run from an elevated PowerShell.

param(
    [switch]$DryRun,
    [switch]$Uninstall,
    [switch]$Confirm,
    [switch]$Repair,
    [string]$RepoRoot
)

. "$PSScriptRoot\GalionUbuntuOnG.ps1"

if ($MyInvocation.InvocationName -eq '.') { return }

$code = Start-GalionUbuntuInstall -DryRun:$DryRun -Uninstall:$Uninstall -Confirm:$Confirm -Repair:$Repair -RepoRoot $RepoRoot
exit $code
