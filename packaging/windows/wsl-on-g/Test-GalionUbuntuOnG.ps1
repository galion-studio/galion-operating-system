# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Checks Galion-Ubuntu after the installer. Administrator is not required.
# A display value from inside the distro does not prove that a window painted.

param()

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\GalionUbuntuOnG.ps1"

if (-not (Test-GalionHostWindows)) {
    Write-Host 'refused: Test-GalionUbuntuOnG.ps1 runs on Windows. This host was not measured, and this result is not a pass.'
    exit 1
}

$failures = New-Object System.Collections.Generic.List[string]
$base = ''
$lxss = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss'
if (Test-Path -LiteralPath $lxss) {
    foreach ($item in @(Get-ChildItem -LiteralPath $lxss)) {
        $prop = Get-ItemProperty -LiteralPath $item.PSPath
        if ([string]$prop.DistributionName -eq 'Galion-Ubuntu') {
            $base = [string]$prop.BasePath
        }
    }
}
if (-not (Test-GalionSamePath $base 'G:\galion\wsl\Galion-Ubuntu')) {
    [void]$failures.Add(('distro base path is not G:\galion\wsl\Galion-Ubuntu (read {0})' -f $base))
}

$script = ConvertTo-GalionWslPath (Join-Path $PSScriptRoot 'steps\verify-inside.sh')
if ($script -eq '') {
    [void]$failures.Add('verify script path could not be converted for WSL')
    $script = '/does-not-exist'
}
$old = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $raw = (& wsl.exe -d Galion-Ubuntu -u galion -- bash $script 2>&1 | Out-String)
}
catch {
    $raw = ''
    [void]$failures.Add('wsl verify command failed')
}
finally {
    $ErrorActionPreference = $old
}
$report = Repair-GalionWslText $raw
foreach ($item in @(Get-GalionVerifyFailures $report)) {
    [void]$failures.Add([string]$item)
}

$snapshot = 'G:\galion\logs\wsl\c-users-before.tsv'
if (-not (Test-Path -LiteralPath $snapshot)) {
    [void]$failures.Add('snapshot missing: G:\galion\logs\wsl\c-users-before.tsv')
}
else {
    $before = Read-GalionMaybeUtf16 $snapshot
    $after = Get-GalionProfileSnapshotText ([string]$env:USERPROFILE)
    foreach ($item in @(Compare-GalionUserProfileSnapshot $before $after)) {
        [void]$failures.Add([string]$item)
    }
}

foreach ($item in @($failures)) {
    Write-Host ('fail: {0}' -f $item)
}
if ($failures.Count -gt 0) { exit 1 }
Write-Host 'pass: Galion-Ubuntu checks returned no failures'
exit 0
