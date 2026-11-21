# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Planner and path guard for Install-GalionUbuntuOnG.ps1.
# Windows PowerShell 5.1 is the owner's host. This file avoids the
# language additions that 5.1 does not have.

Set-StrictMode -Version 2.0

$script:GalionInstallPath = 'G:\galion\wsl\Galion-Ubuntu'
$script:GalionRootfsUrl = 'https://releases.ubuntu.com/24.04/ubuntu-24.04.5-wsl-amd64.wsl'
$script:GalionRootfsName = 'ubuntu-24.04.5-wsl-amd64.wsl'
$script:GalionRootfsHash = 'bb415d824822c4b878125729af451a5d18fb13d1cf5cbed9a7393ad64ac6039e'

function Test-GalionHostWindows {
    if (Test-Path -Path 'variable:IsWindows') {
        return [bool]$IsWindows
    }
    return ($env:OS -eq 'Windows_NT')
}

function ConvertTo-GalionWindowsPath {
    param([AllowEmptyString()][string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    $text = $Path
    if ($text.StartsWith('\\?\')) { $text = $text.Substring(4) }
    $text = $text.Replace('/', '\')
    if ($text.StartsWith('\\')) { return '' }
    if ($text.Contains('%')) { return '' }
    if ($text.Length -lt 2 -or $text[1] -ne ':') { return '' }
    $drive = $text.Substring(0, 1).ToUpperInvariant()
    $rest = ''
    if ($text.Length -gt 2) { $rest = $text.Substring(2).TrimStart('\') }
    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($seg in ($rest -split '\\')) {
        if ($seg -eq '' -or $seg -eq '.') { continue }
        if ($seg -eq '..') {
            if ($parts.Count -eq 0) { return '' }
            $parts.RemoveAt($parts.Count - 1)
            continue
        }
        [void]$parts.Add($seg)
    }
    if ($parts.Count -eq 0) { return ($drive + ':\') }
    return ($drive + ':\' + ($parts -join '\'))
}

function Test-GalionSamePath {
    param([AllowEmptyString()][string]$Left, [AllowEmptyString()][string]$Right)
    $a = ConvertTo-GalionWindowsPath $Left
    $b = ConvertTo-GalionWindowsPath $Right
    if ($a -eq '' -or $b -eq '') { return $false }
    return $a.Equals($b, [StringComparison]::OrdinalIgnoreCase)
}

function Test-GalionPathUnder {
    param([AllowEmptyString()][string]$Path, [AllowEmptyString()][string]$Root)
    $left = ConvertTo-GalionWindowsPath $Path
    $right = ConvertTo-GalionWindowsPath $Root
    if ($left -eq '' -or $right -eq '') { return $false }
    if ($left.Equals($right, [StringComparison]::OrdinalIgnoreCase)) { return $true }
    $prefix = $right.TrimEnd('\') + '\'
    return $left.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)
}

function Join-GalionPath {
    param([string]$Base, [string]$Child)
    return ($Base.TrimEnd('\') + '\' + $Child.TrimStart('\'))
}

function ConvertTo-GalionWslPath {
    param([AllowEmptyString()][string]$Path)
    $win = ConvertTo-GalionWindowsPath $Path
    if ($win.Length -lt 3 -or $win[1] -ne ':') { return '' }
    $drive = $win.Substring(0, 1).ToLowerInvariant()
    $rest = $win.Substring(2).Replace('\', '/')
    return ('/mnt/' + $drive + $rest)
}

function Repair-GalionWslText {
    param([AllowEmptyString()][string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return '' }
    $clean = $Text.Replace(([string][char]0), '').Replace("`r`n", "`n").Replace("`r", "`n")
    if ($clean.Length -gt 8) {
        $spaces = 0
        $checks = 0
        for ($i = 1; $i -lt $clean.Length; $i += 2) {
            $checks++
            if ($clean[$i] -eq ' ') { $spaces++ }
        }
        if ($checks -gt 0 -and $spaces -eq $checks) {
            $sb = New-Object System.Text.StringBuilder
            for ($i = 0; $i -lt $clean.Length; $i += 2) {
                [void]$sb.Append($clean[$i])
            }
            $clean = $sb.ToString()
        }
    }
    return $clean
}

function Test-GalionWsl2StatusText {
    param([AllowEmptyString()][string]$Text)
    $clean = Repair-GalionWslText $Text
    return [bool]($clean -match '(?m)^[ \t]*Default Version:[ \t]*2[ \t]*$')
}

function Read-GalionPins {
    param([Parameter(Mandatory = $true)][string]$Path)
    $map = @{}
    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
        $trim = $line.Trim()
        if ($trim.Length -eq 0 -or $trim.StartsWith('#')) { continue }
        $eq = $trim.IndexOf('=')
        if ($eq -lt 1) { continue }
        $map[$trim.Substring(0, $eq)] = $trim.Substring($eq + 1)
    }
    return $map
}

function Test-GalionSha256 {
    param([AllowEmptyString()][string]$Value)
    return [bool]($Value -match '^[0-9a-fA-F]{64}$')
}

function Get-GalionCacheLayout {
    return @{
        TEMP              = 'G:\galion\tmp\win'
        TMP               = 'G:\galion\tmp\win'
        CARGO_HOME        = 'G:\galion\cache\cargo'
        RUSTUP_HOME       = 'G:\galion\cache\rustup'
        CARGO_TARGET_DIR  = 'G:\galion\cache\cargo-target'
        npm_config_cache  = 'G:\galion\cache\npm'
        PIP_CACHE_DIR     = 'G:\galion\cache\pip'
        HF_HOME           = 'G:\galion\cache\huggingface'
    }
}

function Get-GalionFact {
    param($Facts, [string]$Name, $Default)
    if ($null -eq $Facts) { return $Default }
    if ($Facts -is [System.Collections.IDictionary]) {
        if ($Facts.Contains($Name)) { return $Facts[$Name] }
        return $Default
    }
    $prop = $Facts.PSObject.Properties[$Name]
    if ($null -eq $prop) { return $Default }
    return $prop.Value
}

function Get-GalionItemField {
    param($Item, [string]$Name)
    if ($null -eq $Item) { return '' }
    if ($Item -is [System.Collections.IDictionary]) {
        if ($Item.Contains($Name)) { return [string]$Item[$Name] }
        return ''
    }
    $prop = $Item.PSObject.Properties[$Name]
    if ($null -eq $prop -or $null -eq $prop.Value) { return '' }
    return [string]$prop.Value
}

function Test-GalionProtectedName {
    param([AllowEmptyString()][string]$Name)
    if ($Name -eq 'Ubuntu') { return $true }
    if ($Name.StartsWith('docker-desktop')) { return $true }
    return $false
}

function Test-GalionProtectedDataPath {
    param([AllowEmptyString()][string]$Path)
    $normal = ConvertTo-GalionWindowsPath $Path
    if ($normal -eq '') { return $false }
    if (Test-GalionPathUnder $normal 'G:\galion\wsl\ubuntu') { return $true }
    if (Test-GalionPathUnder $normal 'G:\galion\wsl\docker-desktop') { return $true }
    if (Test-GalionPathUnder $normal 'G:\galion\wsl\docker-desktop-data') { return $true }
    return $false
}

function Merge-GalionWslConfig {
    param(
        [AllowEmptyString()][string]$Existing,
        [string]$SwapSize = '4GB',
        [string]$SwapFile = 'G:\galion\wsl\swap.vhdx'
    )
    $normal = ConvertTo-GalionWindowsPath $SwapFile
    if (-not (Test-GalionPathUnder $normal 'G:\galion')) {
        throw 'swap file is not under G:\galion'
    }
    $escaped = $normal.Replace('\', '\\')
    $raw = ''
    if ($null -ne $Existing) { $raw = [string]$Existing }
    $raw = $raw -replace "`r", ''
    $lines = @()
    if ($raw.Length -gt 0) { $lines = $raw.Split([char]10) }
    $out = New-Object System.Collections.Generic.List[string]
    $section = ''
    $sawWsl2 = $false
    $wroteSwap = $false
    $wroteFile = $false
    foreach ($line in $lines) {
        if ($line -match '^\s*\[(.+?)\]\s*$') {
            if ($section -eq 'wsl2') {
                if (-not $wroteSwap) { [void]$out.Add(('swap={0}' -f $SwapSize)); $wroteSwap = $true }
                if (-not $wroteFile) { [void]$out.Add(('swapFile={0}' -f $escaped)); $wroteFile = $true }
            }
            $section = $Matches[1].Trim().ToLowerInvariant()
            if ($section -eq 'wsl2') { $sawWsl2 = $true }
            [void]$out.Add($line)
            continue
        }
        $replaced = $false
        if ($section -eq 'wsl2' -and $line -match '^\s*([^#;][^=]*)=(.*)$') {
            $key = $Matches[1].Trim()
            if ($key -eq 'swap') {
                [void]$out.Add(('swap={0}' -f $SwapSize))
                $wroteSwap = $true
                $replaced = $true
            }
            elseif ($key -eq 'swapFile') {
                [void]$out.Add(('swapFile={0}' -f $escaped))
                $wroteFile = $true
                $replaced = $true
            }
        }
        if (-not $replaced) { [void]$out.Add($line) }
    }
    if ($section -eq 'wsl2') {
        if (-not $wroteSwap) { [void]$out.Add(('swap={0}' -f $SwapSize)) }
        if (-not $wroteFile) { [void]$out.Add(('swapFile={0}' -f $escaped)) }
    }
    if (-not $sawWsl2) {
        if ($out.Count -gt 0 -and $out[$out.Count - 1] -ne '') { [void]$out.Add('') }
        [void]$out.Add('[wsl2]')
        [void]$out.Add(('swap={0}' -f $SwapSize))
        [void]$out.Add(('swapFile={0}' -f $escaped))
    }
    $text = [string]::Join("`r`n", $out.ToArray())
    return ($text.TrimEnd("`r", "`n") + "`r`n")
}

function ConvertTo-GalionSnapshotMap {
    param([AllowEmptyString()][string]$Text)
    $map = @{}
    if ([string]::IsNullOrEmpty($Text)) { return $map }
    foreach ($line in ($Text -split "`n")) {
        $row = $line.TrimEnd("`r")
        if ($row.Length -eq 0) { continue }
        $tab = $row.IndexOf("`t")
        if ($tab -lt 1) { continue }
        $map[$row.Substring(0, $tab)] = [int64]$row.Substring($tab + 1)
    }
    return $map
}

function Compare-GalionUserProfileSnapshot {
    param([AllowEmptyString()][string]$Before, [AllowEmptyString()][string]$After)
    $failures = New-Object System.Collections.Generic.List[string]
    if ([string]::IsNullOrEmpty($Before)) {
        [void]$failures.Add('snapshot missing')
        return @($failures.ToArray())
    }
    $old = ConvertTo-GalionSnapshotMap $Before
    $new = ConvertTo-GalionSnapshotMap $After
    foreach ($key in @($new.Keys)) {
        $length = [int64]$new[$key]
        $allowed = ($key -eq '.wslconfig' -and $length -ge 0 -and $length -lt 65536)
        if (-not $old.Contains($key)) {
            if (-not $allowed) { [void]$failures.Add(('new path: {0}' -f $key)) }
            continue
        }
        if ([int64]$old[$key] -ne $length -and -not $allowed) {
            [void]$failures.Add(('resized: {0}' -f $key))
        }
    }
    return @($failures.ToArray())
}

function Get-GalionVerifyFailures {
    param([AllowEmptyString()][string]$Report)
    $map = @{}
    if ($null -ne $Report) {
        foreach ($line in ($Report -split "`n")) {
            $row = $line.TrimEnd("`r")
            $eq = $row.IndexOf('=')
            if ($eq -lt 1) { continue }
            $map[$row.Substring(0, $eq)] = $row.Substring($eq + 1).Trim()
        }
    }
    $failures = New-Object System.Collections.Generic.List[string]
    $systemd = ''
    if ($map.Contains('systemd')) { $systemd = [string]$map['systemd'] }
    if (@('running', 'degraded', 'starting') -notcontains $systemd) {
        [void]$failures.Add('systemd is not running')
    }
    $display = ''
    $wayland = ''
    if ($map.Contains('display')) { $display = [string]$map['display'] }
    if ($map.Contains('wayland')) { $wayland = [string]$map['wayland'] }
    if ([string]::IsNullOrWhiteSpace($display) -and [string]::IsNullOrWhiteSpace($wayland)) {
        [void]$failures.Add('WSLg display is empty')
    }
    $pulse = ''
    $socket = ''
    if ($map.Contains('pulse')) { $pulse = [string]$map['pulse'] }
    if ($map.Contains('pulse_socket')) { $socket = [string]$map['pulse_socket'] }
    if ([string]::IsNullOrWhiteSpace($pulse) -and $socket -ne 'yes') {
        [void]$failures.Add('WSLg audio is not reachable')
    }
    $version = ''
    if ($map.Contains('obsidian_version')) { $version = [string]$map['obsidian_version'] }
    if ($version -notlike '*openmind-desktop*') {
        [void]$failures.Add('openmind-desktop did not report its name')
    }
    $exit = ''
    if ($map.Contains('obsidian_exit')) { $exit = [string]$map['obsidian_exit'] }
    if ($exit -ne '0') { [void]$failures.Add('openmind-desktop --version failed') }
    $page = ''
    if ($map.Contains('obsidian_http')) { $page = [string]$map['obsidian_http'] }
    if ($page -ne '200') { [void]$failures.Add('openmind-desktop did not answer on 127.0.0.1:18181') }
    $voice = ''
    if ($map.Contains('voice_http')) { $voice = [string]$map['voice_http'] }
    if ($voice -ne '200') { [void]$failures.Add('voice did not answer on 127.0.0.1:7881') }
    $bytes = 0
    if ($map.Contains('voice_bytes')) { $bytes = [int64]$map['voice_bytes'] }
    if ($bytes -le 0) { [void]$failures.Add('voice health body was empty') }
    return @($failures.ToArray())
}

function New-GalionPlan {
    param([int]$ExitCode, [string]$Action, $Notes, $Actions)
    $noteList = @()
    if ($null -ne $Notes) { $noteList = @($Notes) }
    $actionList = @()
    if ($null -ne $Actions) { $actionList = @($Actions) }
    return [pscustomobject]@{
        ExitCode = $ExitCode
        Action   = $Action
        Notes    = $noteList
        Actions  = $actionList
    }
}

function New-GalionAct {
    param([string]$Id, [string]$Kind, [hashtable]$Fields)
    $act = @{ Id = $Id; Kind = $Kind }
    if ($null -ne $Fields) {
        foreach ($key in @($Fields.Keys)) { $act[$key] = $Fields[$key] }
    }
    return $act
}

function Get-GalionUbuntuPlan {
    param($Facts, $Pins)
    $notes = New-Object System.Collections.Generic.List[string]
    $actions = New-Object System.Collections.Generic.List[object]
    $root = [string](Get-GalionFact $Facts 'GalionRoot' 'G:\galion')
    if (-not (Test-GalionSamePath $root 'G:\galion')) {
        [void]$notes.Add('refused: Galion root must be G:\galion')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    $distroName = 'Galion-Ubuntu'
    $url = $script:GalionRootfsUrl
    $hash = $script:GalionRootfsHash
    $minFree = [int64]21474836480
    if ($null -ne $Pins) {
        $pinnedName = [string](Get-GalionFact $Pins 'GALION_DISTRO_NAME' '')
        if ($pinnedName -ne '' -and $pinnedName -ne 'Galion-Ubuntu') {
            [void]$notes.Add('refused: pins.env distro name is not Galion-Ubuntu')
            return (New-GalionPlan -ExitCode 2 -Action 'refuse' -Notes $notes -Actions @())
        }
        $pinnedUrl = [string](Get-GalionFact $Pins 'GALION_UBUNTU_WSL_URL' '')
        $pinnedHash = [string](Get-GalionFact $Pins 'GALION_UBUNTU_WSL_SHA256' '')
        if ($pinnedUrl -ne '') { $url = $pinnedUrl }
        if ($pinnedHash -ne '') { $hash = $pinnedHash }
        $pinnedMin = [string](Get-GalionFact $Pins 'GALION_MIN_FREE_BYTES' '')
        if ($pinnedMin -match '^[0-9]+$') { $minFree = [int64]$pinnedMin }
    }
    if ($url -ne $script:GalionRootfsUrl -or -not (Test-GalionSha256 $hash)) {
        [void]$notes.Add('refused: rootfs pin is not the Ubuntu 24.04.5 WSL rootfs')
        return (New-GalionPlan -ExitCode 2 -Action 'refuse' -Notes $notes -Actions @())
    }
    if ($hash.ToLowerInvariant() -ne $script:GalionRootfsHash) {
        [void]$notes.Add('refused: rootfs pin hash does not match the recorded SHA256SUMS line')
        return (New-GalionPlan -ExitCode 2 -Action 'refuse' -Notes $notes -Actions @())
    }

    $base = [string](Get-GalionFact $Facts 'GalionBasePath' '')
    $registered = ($base -ne '')
    $exact = $false
    if ($registered) { $exact = Test-GalionSamePath $base $script:GalionInstallPath }
    if ($registered -and -not $exact) {
        [void]$notes.Add(('refused: Galion-Ubuntu is registered at {0}' -f $base))
        [void]$notes.Add('refused: this installer will not unregister it')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }

    $distros = @(Get-GalionFact $Facts 'Distros' @())
    foreach ($item in $distros) {
        $name = Get-GalionItemField $item 'Name'
        $itemBase = Get-GalionItemField $item 'BasePath'
        if (Test-GalionProtectedName $name) {
            [void]$notes.Add(('protected-distro: {0} {1}' -f $name, $itemBase))
        }
        # Test-GalionPathUnder is true for a path equal to the root, so the
        # distro's own base path looks stored inside itself. Skip that entry.
        # A different distro inside the target directory is still refused.
        if ($name -ne 'Galion-Ubuntu' -and $itemBase -ne '' -and (Test-GalionPathUnder $itemBase $script:GalionInstallPath)) {
            [void]$notes.Add(('refused: {0} is stored inside the Galion-Ubuntu directory' -f $name))
            return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
        }
        if ((Test-GalionProtectedName $name) -and $itemBase -ne '' -and (Test-GalionPathUnder $script:GalionInstallPath $itemBase)) {
            [void]$notes.Add(('refused: Galion-Ubuntu would be written inside {0}' -f $name))
            return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
        }
    }
    [void]$notes.Add('protected: Ubuntu and docker-desktop are never unregistered or deleted')
    [void]$notes.Add('shutdown: wsl --shutdown is not used')
    [void]$notes.Add('w1: Install-GalionWslOnG is not called')
    [void]$notes.Add('research-port: 8797')
    [void]$notes.Add('horbm-preview-port: 8787')
    [void]$notes.Add('voice: 127.0.0.1:7881')
    [void]$notes.Add('one-dot: 127.0.0.1:7878')
    [void]$notes.Add('nerve: 127.0.0.1:8670')
    [void]$notes.Add('hermes: 127.0.0.1:8642')
    if ([bool](Get-GalionFact $Facts 'Preview' $false)) {
        [void]$notes.Add('preview: not measured on Windows or on GALION-STUDIO')
    }

    $uninstall = [bool](Get-GalionFact $Facts 'Uninstall' $false)
    $confirm = [bool](Get-GalionFact $Facts 'Confirm' $false)
    $repair = [bool](Get-GalionFact $Facts 'Repair' $false)
    $admin = [bool](Get-GalionFact $Facts 'IsAdmin' $false)
    $wsl2 = [bool](Get-GalionFact $Facts 'Wsl2' $false)
    $drive = [bool](Get-GalionFact $Facts 'DriveReady' $false)
    $free = [int64](Get-GalionFact $Facts 'FreeBytes' 0)
    $busy = [bool](Get-GalionFact $Facts 'InstallDirNonEmpty' $false)
    $hashMatch = [bool](Get-GalionFact $Facts 'RootfsHashMatch' $false)
    $provisioned = [bool](Get-GalionFact $Facts 'Provisioned' $false)
    $obsidian = [bool](Get-GalionFact $Facts 'ObsidianInstalled' $false)
    $voice = [bool](Get-GalionFact $Facts 'VoiceInstalled' $false)
    $configExists = [bool](Get-GalionFact $Facts 'WslConfigExists' $false)
    $configText = [string](Get-GalionFact $Facts 'WslConfigText' '')
    $profile = [string](Get-GalionFact $Facts 'UserProfile' '')
    $repo = [string](Get-GalionFact $Facts 'RepoWsl' '')
    $stamp = [string](Get-GalionFact $Facts 'BackupStamp' 'preview')

    if ($uninstall) {
        if (-not $confirm) {
            [void]$notes.Add('refused: uninstall needs -Confirm or the phrase UNREGISTER Galion-Ubuntu')
            return (New-GalionPlan -ExitCode 2 -Action 'refuse' -Notes $notes -Actions @())
        }
        if (-not $admin) {
            [void]$notes.Add('refused: uninstall needs an elevated PowerShell')
            return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
        }
        if (-not $registered -and -not $busy) {
            [void]$notes.Add('uninstall: Galion-Ubuntu is already absent')
            return (New-GalionPlan -ExitCode 0 -Action 'absent' -Notes $notes -Actions @())
        }
        [void]$actions.Add((New-GalionAct 'mkdir-logs' 'mkdir' @{ Path = 'G:\galion\logs\wsl' }))
        if ($registered) {
            [void]$actions.Add((New-GalionAct 'terminate' 'command-best-effort' @{ Arguments = @('wsl.exe', '--terminate', 'Galion-Ubuntu') }))
            [void]$actions.Add((New-GalionAct 'unregister' 'command' @{ Arguments = @('wsl.exe', '--unregister', 'Galion-Ubuntu') }))
        }
        [void]$actions.Add((New-GalionAct 'remove-tree' 'remove' @{ Path = $script:GalionInstallPath }))
        return (New-GalionPlan -ExitCode 0 -Action 'uninstall' -Notes $notes -Actions $actions.ToArray())
    }

    if (-not $admin) {
        [void]$notes.Add('refused: PowerShell is not running as Administrator')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    if (-not $wsl2) {
        [void]$notes.Add('refused: WSL2 is not the default version')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    if (-not $drive) {
        [void]$notes.Add('refused: G: is not present')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    if (-not $registered -and $busy) {
        [void]$notes.Add('refused: G:\galion\wsl\Galion-Ubuntu exists and the distro is not registered')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    if ($repo -eq '') {
        [void]$notes.Add('refused: the repository path inside WSL is empty')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    if ($profile -eq '') {
        [void]$notes.Add('refused: USERPROFILE is empty, so .wslconfig cannot be merged')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }

    $needDownload = -not $hashMatch
    $needImport = -not $registered
    $needProvision = ((-not $provisioned) -or $repair)
    $needObsidian = ((-not $obsidian) -or $repair)
    $needVoice = ((-not $voice) -or $repair)
    $heavy = ($needDownload -or $needImport -or $needProvision -or $needObsidian -or $needVoice)
    if ($heavy -and $free -lt $minFree) {
        [void]$notes.Add(('refused: G: free bytes are {0}; the policy is {1}' -f $free, $minFree))
        [void]$notes.Add('refused: that free-space number is a policy threshold, not a measurement of this laptop')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }

    $merged = Merge-GalionWslConfig -Existing $configText -SwapSize '4GB' -SwapFile 'G:\galion\wsl\swap.vhdx'
    $mergedBytes = [System.Text.Encoding]::UTF8.GetByteCount($merged)
    if ($mergedBytes -ge 65536) {
        [void]$notes.Add('refused: merged .wslconfig is 65536 bytes or larger')
        return (New-GalionPlan -ExitCode 1 -Action 'refuse' -Notes $notes -Actions @())
    }
    $profileConfig = ''
    if ($profile -ne '') { $profileConfig = Join-GalionPath $profile '.wslconfig' }

    $layout = Get-GalionCacheLayout
    [void]$actions.Add((New-GalionAct 'mkdir-tmp' 'mkdir' @{ Path = $layout.TEMP }))
    [void]$actions.Add((New-GalionAct 'mkdir-cache' 'mkdir' @{ Path = 'G:\galion\wsl\cache' }))
    [void]$actions.Add((New-GalionAct 'mkdir-logs' 'mkdir' @{ Path = 'G:\galion\logs\wsl' }))
    [void]$actions.Add((New-GalionAct 'mkdir-backups' 'mkdir' @{ Path = 'G:\galion\wsl\backups' }))
    [void]$actions.Add((New-GalionAct 'mkdir-wsl' 'mkdir' @{ Path = 'G:\galion\wsl' }))
    [void]$actions.Add((New-GalionAct 'mkdir-src' 'mkdir' @{ Path = 'G:\galion\src' }))
    foreach ($envName in @('CARGO_HOME', 'RUSTUP_HOME', 'CARGO_TARGET_DIR', 'npm_config_cache', 'PIP_CACHE_DIR', 'HF_HOME')) {
        [void]$actions.Add((New-GalionAct ('mkdir-' + $envName) 'mkdir' @{ Path = [string]$layout[$envName] }))
    }
    foreach ($envName in @('TEMP', 'TMP', 'CARGO_HOME', 'RUSTUP_HOME', 'CARGO_TARGET_DIR', 'npm_config_cache', 'PIP_CACHE_DIR', 'HF_HOME')) {
        [void]$actions.Add((New-GalionAct ('env-' + $envName) 'env' @{ Name = $envName; Value = [string]$layout[$envName] }))
    }
    [void]$actions.Add((New-GalionAct 'probe' 'probe' @{ Path = 'G:\galion\.galion-write-test' }))
    [void]$actions.Add((New-GalionAct 'snapshot' 'snapshot' @{ Path = 'G:\galion\logs\wsl\c-users-before.tsv'; Profile = $profile }))

    $rootfs = Join-GalionPath 'G:\galion\wsl\cache' $script:GalionRootfsName
    $tar = 'G:\galion\wsl\cache\ubuntu-24.04.5-wsl-amd64.tar.gz'
    if ($needDownload) {
        [void]$actions.Add((New-GalionAct 'download' 'download' @{ Path = $rootfs; Url = $url; Expected = $hash }))
    }
    else {
        [void]$actions.Add((New-GalionAct 'skip-download' 'note' @{}))
    }
    if ($needImport) {
        [void]$actions.Add((New-GalionAct 'hardlink' 'hardlink' @{ Source = $rootfs; Dest = $tar }))
        [void]$actions.Add((New-GalionAct 'import' 'command' @{ Arguments = @('wsl.exe', '--import', 'Galion-Ubuntu', $script:GalionInstallPath, $tar, '--version', '2') }))
    }
    else {
        [void]$actions.Add((New-GalionAct 'skip-import' 'note' @{}))
    }
    if ($configExists) {
        [void]$actions.Add((New-GalionAct 'backup-wslconfig' 'copy' @{ Source = $profileConfig; Dest = (Join-GalionPath 'G:\galion\wsl\backups' ('.wslconfig-' + $stamp)); Profile = $profile }))
    }
    [void]$actions.Add((New-GalionAct 'write-wslconfig' 'write' @{ Path = $profileConfig; Text = $merged; Profile = $profile }))
    [void]$actions.Add((New-GalionAct 'write-wslconfig-copy' 'write' @{ Path = 'G:\galion\wsl\.wslconfig'; Text = $merged }))

    $provision = $repo + '/packaging/wsl/provision-galion-ubuntu.sh'
    $ports = $repo + '/packaging/windows/wsl-on-g/steps/apply-laptop-ports.sh'
    $obsidianScript = $repo + '/packaging/windows/wsl-on-g/steps/install-obsidian-wslg.sh'
    $voiceScript = $repo + '/packaging/windows/wsl-on-g/steps/install-voice-wsl.sh'
    if ($needProvision) {
        [void]$actions.Add((New-GalionAct 'provision' 'command' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'root', '--', 'bash', $provision) }))
        [void]$actions.Add((New-GalionAct 'terminate' 'command' @{ Arguments = @('wsl.exe', '--terminate', 'Galion-Ubuntu') }))
        [void]$actions.Add((New-GalionAct 'linger' 'command-best-effort' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'root', '--', 'loginctl', 'enable-linger', 'galion') }))
        [void]$actions.Add((New-GalionAct 'stamp-provision' 'command' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'root', '--', 'bash', '-c', 'mkdir -p /etc/galion && printf "%s\n" w0-provision > /etc/galion/w0-provision.stamp') }))
    }
    else {
        [void]$actions.Add((New-GalionAct 'skip-provision' 'note' @{}))
    }
    [void]$actions.Add((New-GalionAct 'ports' 'command' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'root', '--', 'bash', $ports) }))
    if ($needObsidian) {
        [void]$actions.Add((New-GalionAct 'obsidian' 'command' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'root', '--', 'bash', $obsidianScript) }))
    }
    else {
        [void]$actions.Add((New-GalionAct 'skip-obsidian' 'note' @{}))
    }
    if ($needVoice) {
        [void]$actions.Add((New-GalionAct 'voice' 'command' @{ Arguments = @('wsl.exe', '-d', 'Galion-Ubuntu', '-u', 'galion', '--', 'env', '-u', 'GALION_SAMANTHA_REF', 'bash', $voiceScript) }))
    }
    else {
        [void]$actions.Add((New-GalionAct 'skip-voice' 'note' @{}))
    }
    $state = ((@($actions.ToArray()) | ForEach-Object { [string]$_['Id'] }) -join "`n") + "`n"
    [void]$actions.Add((New-GalionAct 'state' 'write' @{ Path = 'G:\galion\wsl\Galion-Ubuntu.steps.txt'; Text = $state }))
    [void]$notes.Add('caches: Windows process caches are under G:\galion\cache. Linux toolchain caches stay inside the distro disk, which is G:\galion\wsl\Galion-Ubuntu\ext4.vhdx.')
    [void]$notes.Add('wsl-env: Windows CARGO_HOME is not passed into the distro')
    return (New-GalionPlan -ExitCode 0 -Action 'install' -Notes $notes -Actions $actions.ToArray())
}

function Test-GalionCommandAllowed {
    param([string[]]$ArgumentList)
    $list = @($ArgumentList)
    for ($i = 0; $i -lt $list.Count; $i++) {
        $arg = [string]$list[$i]
        if ($arg -eq '--shutdown') { return 'wsl --shutdown is refused' }
        if ($arg -eq '--unregister') {
            $name = ''
            if (($i + 1) -lt $list.Count) { $name = [string]$list[$i + 1] }
            if ($name -ne 'Galion-Ubuntu') { return 'unregister of another distro is refused' }
        }
        $asPath = ConvertTo-GalionWindowsPath $arg
        if ($asPath -ne '' -and (Test-GalionProtectedDataPath $asPath)) {
            return ('refused path in command: {0}' -f $arg)
        }
    }
    return ''
}

function Test-GalionActionAllowed {
    param($Action)
    $kind = [string]$Action['Kind']
    if ($kind -eq 'note') { return '' }
    if ($kind -eq 'mkdir' -or $kind -eq 'probe' -or $kind -eq 'snapshot') {
        $path = [string]$Action['Path']
        if (Test-GalionProtectedDataPath $path) { return 'protected path' }
        if (-not (Test-GalionPathUnder $path 'G:\galion')) { return 'path is not under G:\galion' }
        return ''
    }
    if ($kind -eq 'env') {
        $layout = Get-GalionCacheLayout
        $name = [string]$Action['Name']
        $value = [string]$Action['Value']
        if (-not $layout.Contains($name)) { return 'env name is not in the G: layout' }
        if ($layout[$name] -ne $value) { return 'env value is not the G: layout path' }
        return ''
    }
    if ($kind -eq 'download') {
        $path = [string]$Action['Path']
        if (-not (Test-GalionPathUnder $path 'G:\galion\wsl\cache')) { return 'download is not in the G: cache' }
        if ([string]$Action['Url'] -ne $script:GalionRootfsUrl) { return 'download URL is not the pinned rootfs' }
        return ''
    }
    if ($kind -eq 'hardlink') {
        if (-not (Test-GalionPathUnder ([string]$Action['Source']) 'G:\galion\wsl\cache')) { return 'hardlink source is not in the G: cache' }
        if (-not (Test-GalionPathUnder ([string]$Action['Dest']) 'G:\galion\wsl\cache')) { return 'hardlink dest is not in the G: cache' }
        return ''
    }
    if ($kind -eq 'copy') {
        $source = [string]$Action['Source']
        $dest = [string]$Action['Dest']
        $profile = [string]$Action['Profile']
        $allowed = Join-GalionPath $profile '.wslconfig'
        if (-not (Test-GalionSamePath $source $allowed)) { return 'backup source is not the profile .wslconfig' }
        if (-not (Test-GalionPathUnder $dest 'G:\galion\wsl\backups')) { return 'backup dest is not on G:' }
        return ''
    }
    if ($kind -eq 'write') {
        $path = [string]$Action['Path']
        $text = [string]$Action['Text']
        $bytes = [System.Text.Encoding]::UTF8.GetByteCount($text)
        if (Test-GalionProtectedDataPath $path) { return 'protected path' }
        if (Test-GalionPathUnder $path 'G:\galion') { return '' }
        $profile = [string]$Action['Profile']
        $allowed = Join-GalionPath $profile '.wslconfig'
        if ((Test-GalionSamePath $path $allowed) -and $bytes -lt 65536) { return '' }
        return 'large or unexpected write off G:'
    }
    if ($kind -eq 'remove') {
        if (-not (Test-GalionSamePath ([string]$Action['Path']) $script:GalionInstallPath)) {
            return 'remove path is not G:\galion\wsl\Galion-Ubuntu'
        }
        return ''
    }
    if ($kind -eq 'command' -or $kind -eq 'command-best-effort') {
        return (Test-GalionCommandAllowed -ArgumentList @($Action['Arguments']))
    }
    return ('unknown action kind: {0}' -f $kind)
}

function Invoke-GalionUbuntuPlan {
    param($Plan, $Runners, [switch]$DryRun, [string]$LogPath)
    $notes = @()
    if ($null -ne $Plan.Notes) { $notes = @($Plan.Notes) }
    foreach ($note in $notes) { Write-Host ([string]$note) }
    if ([int]$Plan.ExitCode -ne 0) { return [int]$Plan.ExitCode }
    $acts = @()
    if ($null -ne $Plan.Actions) { $acts = @($Plan.Actions) }
    foreach ($act in $acts) {
        $id = [string]$act['Id']
        Write-Host ('action: {0}' -f $id)
        if ($DryRun) { continue }
        $problem = Test-GalionActionAllowed $act
        if ($problem -ne '') {
            Write-Host ('refused: {0}' -f $problem)
            return 1
        }
        if ($LogPath -and $null -ne $Runners -and $Runners.ContainsKey('Log')) {
            & $Runners.Log $LogPath ('action: ' + $id)
        }
        $kind = [string]$act['Kind']
        if ($kind -eq 'note') { continue }
        if ($kind -eq 'mkdir') { & $Runners.MakeDirectory ([string]$act['Path']); continue }
        if ($kind -eq 'env') { & $Runners.SetEnv ([string]$act['Name']) ([string]$act['Value']); continue }
        if ($kind -eq 'probe') { & $Runners.ProbeWrite ([string]$act['Path']); continue }
        if ($kind -eq 'snapshot') { & $Runners.Snapshot ([string]$act['Path']); continue }
        if ($kind -eq 'download') { & $Runners.Download ([string]$act['Url']) ([string]$act['Path']) ([string]$act['Expected']); continue }
        if ($kind -eq 'hardlink') { & $Runners.HardLink ([string]$act['Source']) ([string]$act['Dest']); continue }
        if ($kind -eq 'copy') { & $Runners.CopyBytes ([string]$act['Source']) ([string]$act['Dest']); continue }
        if ($kind -eq 'write') { & $Runners.WriteText ([string]$act['Path']) ([string]$act['Text']); continue }
        if ($kind -eq 'remove') { & $Runners.RemoveTree ([string]$act['Path']); continue }
        if ($kind -eq 'command' -or $kind -eq 'command-best-effort') {
            # @($array) is the array operator, not a splat. Use a named parameter
            # so wsl.exe and its arguments stay separate. A joined string makes
            # PowerShell look for a program named "wsl.exe --import ...".
            $argv = [string[]]@($act['Arguments'])
            $code = [int](& $Runners.Command -ArgumentList $argv)
            if ($kind -eq 'command' -and $code -ne 0) {
                Write-Host ('refused: command {0} exited {1}' -f $id, $code)
                return 1
            }
        }
    }
    return 0
}

function Get-GalionProfileSnapshotText {
    param([AllowEmptyString()][string]$Profile)
    $lines = New-Object System.Collections.Generic.List[string]
    if ([string]::IsNullOrWhiteSpace($Profile) -or -not (Test-Path -LiteralPath $Profile)) {
        return ''
    }
    $rootInfo = Get-Item -LiteralPath $Profile
    $pending = New-Object System.Collections.Generic.Queue[System.IO.DirectoryInfo]
    $pending.Enqueue($rootInfo)
    while ($pending.Count -gt 0) {
        $dir = $pending.Dequeue()
        foreach ($entry in @($dir.GetFileSystemInfos())) {
            if (($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
            $rel = $entry.FullName.Substring($rootInfo.FullName.Length).TrimStart('\')
            if ($entry -is [System.IO.DirectoryInfo]) {
                [void]$lines.Add($rel + "`t0")
                $pending.Enqueue([System.IO.DirectoryInfo]$entry)
            }
            else {
                [void]$lines.Add($rel + "`t" + $entry.Length)
            }
        }
    }
    if ($lines.Count -eq 0) { return '' }
    return ([string]::Join("`n", $lines.ToArray()) + "`n")
}

function Get-GalionFileSha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $hash = $sha.ComputeHash($stream)
    }
    finally {
        $stream.Dispose()
        $sha.Dispose()
    }
    return ([System.BitConverter]::ToString($hash).Replace('-', '').ToLowerInvariant())
}

function Read-GalionMaybeUtf16 {
    param([Parameter(Mandatory = $true)][string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 2 -and $bytes[0] -eq 255 -and $bytes[1] -eq 254) {
        return [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
    }
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
        return [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    }
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Write-GalionUtf8 {
    param([string]$Path, [string]$Text)
    $enc = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Text, $enc)
}

function Get-GalionLiveFacts {
    param([string]$RepoRoot)
    if (-not (Test-GalionHostWindows)) { return $null }
    $admin = $false
    try {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        $admin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    }
    catch { $admin = $false }
    $drive = Test-Path -LiteralPath 'G:\'
    $free = [int64]0
    if ($drive) {
        try {
            $disk = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='G:'"
            if ($null -ne $disk) { $free = [int64]$disk.FreeSpace }
        }
        catch { $free = 0 }
    }
    $status = ''
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $status = (& wsl.exe --status 2>&1 | Out-String)
    }
    catch { $status = '' }
    finally { $ErrorActionPreference = $old }
    $wsl2 = Test-GalionWsl2StatusText $status
    $distros = @()
    $galionBase = ''
    $lxss = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss'
    if (Test-Path -LiteralPath $lxss) {
        foreach ($item in @(Get-ChildItem -LiteralPath $lxss)) {
            $prop = Get-ItemProperty -LiteralPath $item.PSPath
            $name = [string]$prop.DistributionName
            $basePath = [string]$prop.BasePath
            $distros += @{ Name = $name; BasePath = $basePath }
            if ($name -eq 'Galion-Ubuntu') { $galionBase = $basePath }
        }
    }
    $busy = $false
    if (Test-Path -LiteralPath $script:GalionInstallPath) {
        $children = @(Get-ChildItem -LiteralPath $script:GalionInstallPath -Force -ErrorAction SilentlyContinue)
        $busy = ($children.Count -gt 0)
    }
    $rootfs = Join-GalionPath 'G:\galion\wsl\cache' $script:GalionRootfsName
    $match = $false
    if (Test-Path -LiteralPath $rootfs) {
        $match = ((Get-GalionFileSha256 $rootfs) -eq $script:GalionRootfsHash)
    }
    $profile = [string]$env:USERPROFILE
    $configExists = $false
    $configText = ''
    if ($profile -ne '') {
        $configPath = Join-GalionPath $profile '.wslconfig'
        if (Test-Path -LiteralPath $configPath) {
            $configExists = $true
            $configText = Read-GalionMaybeUtf16 $configPath
        }
    }
    $provisioned = $false
    $obsidian = $false
    $voice = $false
    if ($galionBase -ne '' -and (Test-GalionSamePath $galionBase $script:GalionInstallPath)) {
        $ErrorActionPreference = 'Continue'
        try {
            & wsl.exe -d Galion-Ubuntu -u root -- test -f /etc/galion/w0-provision.stamp
            $provisioned = ($LASTEXITCODE -eq 0)
            & wsl.exe -d Galion-Ubuntu -u root -- test -f /etc/galion/obsidian-wslg.stamp
            $obsidian = ($LASTEXITCODE -eq 0)
            & wsl.exe -d Galion-Ubuntu -u galion -- test -f /home/galion/.local/share/galion/voice-wsl.stamp
            $voice = ($LASTEXITCODE -eq 0)
        }
        catch {
            $provisioned = $false
        }
        finally { $ErrorActionPreference = $old }
    }
    return @{
        IsAdmin            = $admin
        Wsl2               = $wsl2
        DriveReady         = $drive
        FreeBytes          = $free
        GalionRoot         = 'G:\galion'
        Distros            = $distros
        GalionBasePath     = $galionBase
        InstallDirNonEmpty = $busy
        RootfsHashMatch    = $match
        WslConfigExists    = $configExists
        WslConfigText      = $configText
        UserProfile        = $profile
        RepoWsl            = (ConvertTo-GalionWslPath $RepoRoot)
        Provisioned        = $provisioned
        ObsidianInstalled  = $obsidian
        VoiceInstalled     = $voice
        BackupStamp        = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
        Preview            = $false
    }
}

function Get-GalionDefaultRunners {
    return @{
        MakeDirectory = {
            param($Path)
            if (-not (Test-Path -LiteralPath $Path)) {
                New-Item -ItemType Directory -Path $Path | Out-Null
            }
        }
        SetEnv = {
            param($Name, $Value)
            [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
        }
        ProbeWrite = {
            param($Path)
            Write-GalionUtf8 $Path 'ok'
            Remove-Item -LiteralPath $Path -Force
        }
        Snapshot = {
            param($Path)
            Write-GalionUtf8 $Path (Get-GalionProfileSnapshotText ([string]$env:USERPROFILE))
        }
        Download = {
            param($Url, $Dest, $Expected)
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            if (Test-Path -LiteralPath $Dest) {
                if ((Get-GalionFileSha256 $Dest) -eq $Expected) { return }
                Remove-Item -LiteralPath $Dest -Force
            }
            $partial = $Dest + '.partial'
            if (Test-Path -LiteralPath $partial) { Remove-Item -LiteralPath $partial -Force }
            $client = New-Object System.Net.WebClient
            try { $client.DownloadFile($Url, $partial) }
            finally { $client.Dispose() }
            $got = Get-GalionFileSha256 $partial
            if ($got -ne $Expected) {
                Remove-Item -LiteralPath $partial -Force
                throw 'rootfs checksum did not match the pin'
            }
            Move-Item -LiteralPath $partial -Destination $Dest
        }
        HardLink = {
            param($Source, $Dest)
            if (Test-Path -LiteralPath $Dest) {
                if ((Get-GalionFileSha256 $Source) -eq (Get-GalionFileSha256 $Dest)) { return }
                Remove-Item -LiteralPath $Dest -Force
            }
            try {
                New-Item -ItemType HardLink -Path $Dest -Value $Source | Out-Null
            }
            catch {
                Copy-Item -LiteralPath $Source -Destination $Dest -Force
            }
        }
        CopyBytes = {
            param($Source, $Dest)
            $dir = Split-Path -Parent $Dest
            if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
            Copy-Item -LiteralPath $Source -Destination $Dest -Force
        }
        WriteText = {
            param($Path, $Text)
            $dir = Split-Path -Parent $Path
            if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
            Write-GalionUtf8 $Path $Text
        }
        RemoveTree = {
            param($Path)
            if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
        }
        Command = {
            param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ArgumentList)
            $names = @('CARGO_HOME', 'RUSTUP_HOME', 'CARGO_TARGET_DIR', 'npm_config_cache', 'PIP_CACHE_DIR', 'HF_HOME', 'NPM_CONFIG_CACHE', 'HUGGINGFACE_HUB_CACHE')
            $saved = @{}
            $program = [string]$ArgumentList[0]
            $rest = @()
            if ($ArgumentList.Count -gt 1) { $rest = $ArgumentList[1..($ArgumentList.Count - 1)] }
            $stripThis = ($program -eq 'wsl.exe')
            if ($stripThis) {
                foreach ($name in $names) {
                    $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
                    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
                }
            }
            if (-not (Get-Command $program -ErrorAction SilentlyContinue)) {
                Write-Host ('refused: command not found: {0}' -f $program)
                return 1
            }
            $old = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                & $program @rest *>&1 | ForEach-Object { Write-Host ([string]$_) }
                $code = $LASTEXITCODE
                if ($null -eq $code) { $code = 0 }
                return [int]$code
            }
            catch {
                Write-Host ('command-error: {0}' -f $_)
                return 1
            }
            finally {
                $ErrorActionPreference = $old
                if ($stripThis) {
                    foreach ($name in @($saved.Keys)) {
                        $previous = $saved[$name]
                        if ($null -eq $previous) {
                            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
                        }
                        else {
                            [Environment]::SetEnvironmentVariable($name, [string]$previous, 'Process')
                        }
                    }
                }
            }
        }
        Log = {
            param($Path, $Line)
            $dir = Split-Path -Parent $Path
            if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
            $enc = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::AppendAllText($Path, ($Line + "`n"), $enc)
        }
    }
}

function Get-GalionPreviewFacts {
    param([string]$RepoWsl)
    return @{
        IsAdmin            = $true
        Wsl2               = $true
        DriveReady         = $true
        FreeBytes          = [int64]107374182400
        GalionRoot         = 'G:\galion'
        Distros            = @(
            @{ Name = 'Ubuntu'; BasePath = 'G:\galion\wsl\ubuntu' },
            @{ Name = 'docker-desktop'; BasePath = 'C:\ProgramData\Docker\wsl\data' }
        )
        GalionBasePath     = ''
        InstallDirNonEmpty = $false
        RootfsHashMatch    = $false
        WslConfigExists    = $true
        WslConfigText      = "[wsl2]`r`ndebugConsole=true`r`n"
        UserProfile        = 'C:\Users\Galion'
        RepoWsl            = $RepoWsl
        Provisioned        = $false
        ObsidianInstalled  = $false
        VoiceInstalled     = $false
        BackupStamp        = 'preview'
        Preview            = $true
    }
}

function Start-GalionUbuntuInstall {
    param(
        [switch]$DryRun,
        [switch]$Uninstall,
        [switch]$Confirm,
        [switch]$Repair,
        [string]$RepoRoot
    )
    if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
        $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
    }
    $pinPath = Join-Path $PSScriptRoot 'pins.env'
    if (-not (Test-Path -LiteralPath $pinPath)) {
        Write-Host 'refused: pins.env is missing'
        return 2
    }
    $pins = Read-GalionPins $pinPath
    $confirmed = [bool]$Confirm
    if ($Uninstall -and -not $confirmed -and (Test-GalionHostWindows)) {
        $interactive = $false
        try { $interactive = -not [Console]::IsInputRedirected } catch { $interactive = $false }
        if ($interactive) {
            Write-Host 'Type UNREGISTER Galion-Ubuntu to remove only that distro.'
            $line = [Console]::ReadLine()
            if ($line -eq 'UNREGISTER Galion-Ubuntu') { $confirmed = $true }
        }
    }
    if (-not (Test-GalionHostWindows)) {
        if (-not $DryRun) {
            Write-Host 'refused: this installer runs on Windows. Pass -DryRun to print the plan.'
            return 1
        }
        $repoWsl = ConvertTo-GalionWslPath $RepoRoot
        if ($repoWsl -eq '') { $repoWsl = '/mnt/g/galion/src/galion-operating-system' }
        $facts = Get-GalionPreviewFacts -RepoWsl $repoWsl
        $facts['Uninstall'] = [bool]$Uninstall
        $facts['Confirm'] = $confirmed
        $facts['Repair'] = [bool]$Repair
        $plan = Get-GalionUbuntuPlan -Facts $facts -Pins $pins
        return [int](Invoke-GalionUbuntuPlan -Plan $plan -DryRun)
    }
    $facts = Get-GalionLiveFacts -RepoRoot $RepoRoot
    $facts['Uninstall'] = [bool]$Uninstall
    $facts['Confirm'] = $confirmed
    $facts['Repair'] = [bool]$Repair
    $plan = Get-GalionUbuntuPlan -Facts $facts -Pins $pins
    $log = ''
    $runners = $null
    if (-not $DryRun -and [int]$plan.ExitCode -eq 0) {
        $log = 'G:\galion\logs\wsl\install.log'
        $runners = Get-GalionDefaultRunners
    }
    return [int](Invoke-GalionUbuntuPlan -Plan $plan -Runners $runners -DryRun:$DryRun -LogPath $log)
}
