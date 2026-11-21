# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.

# Create "Galion OS.lnk" on the current user's Desktop and, if present,
# on the OneDrive Desktop. The .lnk is the only write this script makes
# off G:. The target and icon stay under GALION_ROOT or this package.
# Default GALION_ROOT is G:\galion.
[CmdletBinding()]
param(
  [string]$GalionRoot = $(if ($env:GALION_ROOT) { $env:GALION_ROOT } else { 'G:\galion' }),
  [string]$StartCmd,
  [string]$IconPath
)
$ErrorActionPreference = 'Stop'
$GalionRoot = $GalionRoot.TrimEnd('\')
$Here = $PSScriptRoot
if (-not $Here) { $Here = Split-Path -Parent $MyInvocation.MyCommand.Path }

if (-not $StartCmd) {
  $c1 = Join-Path $Here 'START-GALION-OS.cmd'
  $c2 = Join-Path $GalionRoot 'START-GALION-OS.cmd'
  if (Test-Path $c1) { $StartCmd = $c1 } else { $StartCmd = $c2 }
}
if (-not (Test-Path -LiteralPath $StartCmd)) {
  throw "START-GALION-OS.cmd not found at $StartCmd. Set -StartCmd or GALION_ROOT."
}
$StartCmd = (Resolve-Path -LiteralPath $StartCmd).Path

if (-not $IconPath) {
  $candidates = @(
    (Join-Path $Here '..\..\..\docs\brand\icons\galion-os.ico'),
    (Join-Path $GalionRoot 'docs\brand\icons\galion-os.ico'),
    (Join-Path $GalionRoot 'assets\galion-os.ico')
  )
  foreach ($c in $candidates) {
    $full = [System.IO.Path]::GetFullPath($c)
    if (Test-Path -LiteralPath $full) { $IconPath = $full; break }
  }
}
if (-not $IconPath -or -not (Test-Path -LiteralPath $IconPath)) {
  Write-Warning 'galion-os.ico not found; shortcut will use the default icon.'
  $IconPath = $null
} else {
  $IconPath = (Resolve-Path -LiteralPath $IconPath).Path
}

$shell = New-Object -ComObject WScript.Shell
$destinations = New-Object System.Collections.Generic.List[string]
$desktop = [Environment]::GetFolderPath('Desktop')
if ($desktop) { $destinations.Add($desktop) }
$one = Join-Path $env:USERPROFILE 'OneDrive\Desktop'
if ($one -and (Test-Path -LiteralPath $one) -and -not ($destinations | Where-Object { $_.TrimEnd('\') -ieq $one.TrimEnd('\') })) {
  $destinations.Add($one)
}

foreach ($dir in $destinations) {
  $lnk = Join-Path $dir 'Galion OS.lnk'
  $sc = $shell.CreateShortcut($lnk)
  $sc.TargetPath = $StartCmd
  $sc.WorkingDirectory = Split-Path -Parent $StartCmd
  $sc.WindowStyle = 1
  $sc.Description = 'Galion OS (127.0.0.1 only)'
  if ($IconPath) { $sc.IconLocation = "$IconPath,0" }
  $sc.Save()
  Write-Output "wrote $lnk -> $StartCmd"
}
