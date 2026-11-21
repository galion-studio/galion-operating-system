# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright (c) 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This script does not restate it.
#
# Sector W1. Install Ubuntu 24.04 as the WSL2 distro Galion-Ubuntu with its
# ext4 disk, swap file, download, and installer temp files under G:\galion.
# -DryRun writes nothing. -Repair refreshes that layout and does not replace
# an ext4.vhdx that is already present.
# Tests dot-source this file with GALION_WSL_DOTSOURCE=1. The owner does not set that.

<#
.SYNOPSIS
    Install Ubuntu 24.04 WSL2 with its disk on G:\galion.
.DESCRIPTION
    Run from an elevated Windows PowerShell. The distro name is Galion-Ubuntu.
    Pass -DryRun to print the plan and write nothing. Pass -Repair to refresh
    the G: layout. -Repair does not unregister the distro when ext4.vhdx is present.
#>
[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Repair
)

$script:GalionWslExit = 1

function Get-GalionRootfsPin {
    [pscustomobject]@{
        Name   = 'ubuntu-24.04.5-wsl-amd64.wsl'
        Url    = 'https://releases.ubuntu.com/24.04/ubuntu-24.04.5-wsl-amd64.wsl'
        Sums   = 'https://releases.ubuntu.com/24.04/SHA256SUMS'
        Sha256 = 'bb415d824822c4b878125729af451a5d18fb13d1cf5cbed9a7393ad64ac6039e'
        Bytes  = 388975696
    }
}

function Get-GalionWslPaths {
    [pscustomobject]@{
        Root          = 'G:\galion'
        Temp          = 'G:\galion\tmp\win'
        Downloads     = 'G:\galion\wsl\downloads'
        Rootfs        = 'G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl'
        RootfsPartial = 'G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl.partial'
        Sums          = 'G:\galion\wsl\downloads\SHA256SUMS'
        Install       = 'G:\galion\wsl\Galion-Ubuntu'
        Vhdx          = 'G:\galion\wsl\Galion-Ubuntu\ext4.vhdx'
        WslConfig     = 'G:\galion\wsl\.wslconfig'
        Swap          = 'G:\galion\wsl\swap.vhdx'
        GuestSetup    = 'G:\galion\wsl\guest-setup.sh'
        InstalledNote = 'G:\galion\wsl\INSTALLED.txt'
        SrcDesktop    = 'G:\galion\src\obsidian-open-mind'
        SrcVoice      = 'G:\galion\src\galion-one-voice'
        SrcReadme     = 'G:\galion\src\README.txt'
    }
}

function Get-GalionImportCommandText {
    $paths = Get-GalionWslPaths
    return ('wsl --import Galion-Ubuntu {0} {1} --version 2' -f $paths.Install, $paths.Rootfs)
}

function Test-GalionDataPath {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $false
    }
    $normal = $Path.Replace('/', '\')
    if ($normal -match '(^|[\\])\.\.([\\]|$)') {
        return $false
    }
    if ($normal -notmatch '^[Gg]:\\galion(\\|$)') {
        return $false
    }
    return $true
}

function Get-GalionWslMemoryLimitGb {
    param([Parameter(Mandatory = $true)][int]$TotalGb)
    if ($TotalGb -lt 1) {
        return 1
    }
    if ($TotalGb -ge 8) {
        $half = [int][Math]::Floor($TotalGb / 2)
        $leave = $TotalGb - 4
        $limit = [int][Math]::Min($half, $leave)
        if ($limit -lt 4) {
            $limit = 4
        }
        $max = $TotalGb - 1
        if ($limit -gt $max) {
            $limit = $max
        }
        if ($limit -lt 1) {
            return 1
        }
        return $limit
    }
    $small = [int][Math]::Floor($TotalGb / 2)
    if ($small -lt 1) {
        return 1
    }
    return $small
}

function Get-GalionWslProcessorCount {
    param([Parameter(Mandatory = $true)][int]$Logical)
    if ($Logical -le 2) {
        if ($Logical -lt 1) {
            return 1
        }
        return $Logical
    }
    $half = [int][Math]::Floor($Logical / 2)
    if ($half -lt 2) {
        return 2
    }
    return $half
}

function Get-GalionWslConfigText {
    param(
        [Parameter(Mandatory = $true)][int]$MemoryGb,
        [Parameter(Mandatory = $true)][int]$Processors
    )
    $lines = @(
        '[wsl2]',
        ('memory={0}GB' -f $MemoryGb),
        ('processors={0}' -f $Processors),
        'swap=4GB',
        'swapFile=G:\\galion\\wsl\\swap.vhdx',
        'localhostForwarding=true',
        'guiApplications=true',
        ''
    )
    return ($lines -join "`n")
}

function Get-GalionGuestScript {
    return @'
#!/bin/bash
set -eu
install -d -m 0755 /opt/galion/openmind-desktop
if ! id -u galion >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash --comment "Galion desktop" galion
fi
if [ -f /etc/wsl.conf ] && grep -q '^default=' /etc/wsl.conf; then
    sed -i 's/^default=.*/default=galion/' /etc/wsl.conf
else
    printf '\n[user]\ndefault=galion\n' >> /etc/wsl.conf
fi
'@
}

function Get-GalionSrcReadme {
    return @'
Galion on G:\galion

obsidian-open-mind is the checkout place for galion-studio/obsidian-open-mind.
That repository is the Obsidian desktop. openmind-desktop is the local control console.
The packaging plan places the console at /opt/galion/openmind-desktop/openmind-desktop.
This installer creates that directory inside Galion-Ubuntu and does not build the binary.

galion-one-voice is the checkout place for galion-studio/galion-one-voice.
That repository is Galion One Voice. The voice packaging note names no install directory
for galion-voiced, so this folder is only a checkout place.

This installer does not clone, build, start, or deploy either tree.
'@
}

function Get-GalionDirectoryList {
    $paths = Get-GalionWslPaths
    return @(
        $paths.Temp,
        $paths.Downloads,
        $paths.SrcDesktop,
        $paths.SrcVoice
    )
}

function Get-GalionWritePathList {
    $paths = Get-GalionWslPaths
    $list = New-Object 'System.Collections.Generic.List[string]'
    foreach ($dir in @(Get-GalionDirectoryList)) {
        $list.Add([string]$dir) | Out-Null
    }
    foreach ($path in @(
            $paths.Rootfs,
            $paths.RootfsPartial,
            $paths.Sums,
            $paths.Install,
            $paths.WslConfig,
            $paths.Swap,
            $paths.GuestSetup,
            $paths.InstalledNote,
            $paths.SrcReadme
        )) {
        $list.Add([string]$path) | Out-Null
    }
    return @($list.ToArray())
}

function New-GalionPlan {
    param(
        [string]$Action,
        [int]$ExitCode,
        [System.Collections.Generic.List[string]]$Lines,
        [bool]$EnableFeatures,
        [bool]$Download,
        [bool]$WriteConfig,
        [bool]$Import,
        [bool]$Unregister,
        [bool]$RemoveInstallDir,
        [bool]$PrepareGuest,
        [string]$ConfigText
    )
    $data = @()
    $dirs = @()
    if ($ExitCode -eq 0 -and $Action -ne 'skip') {
        $data = @(Get-GalionWritePathList)
        $dirs = @(Get-GalionDirectoryList)
    }
    return [pscustomobject]@{
        Action           = $Action
        ExitCode         = $ExitCode
        Lines            = @($Lines.ToArray())
        DataPaths        = $data
        Directories      = $dirs
        EnableFeatures   = $EnableFeatures
        Download         = $Download
        WriteConfig      = $WriteConfig
        Import           = $Import
        Unregister       = $Unregister
        RemoveInstallDir = $RemoveInstallDir
        PrepareGuest     = $PrepareGuest
        ConfigText       = $ConfigText
    }
}

function Add-GalionCommonLines {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Action,
        [bool]$Repair,
        [bool]$Preview,
        [int]$TotalMemoryGb,
        [int]$LogicalProcessors
    )
    $pin = Get-GalionRootfsPin
    $paths = Get-GalionWslPaths
    if ($Preview) {
        $Lines.Add('host: not Windows. This plan is not a reading of this machine.') | Out-Null
    }
    $Lines.Add(('action: {0}' -f $Action)) | Out-Null
    $Lines.Add('distro: Galion-Ubuntu') | Out-Null
    $Lines.Add('version: 2') | Out-Null
    $Lines.Add(('root: {0}' -f $paths.Root)) | Out-Null
    $Lines.Add(('temp: {0}' -f $paths.Temp)) | Out-Null
    $Lines.Add('temp-scope: this process only') | Out-Null
    $Lines.Add(('rootfs: {0}' -f $pin.Url)) | Out-Null
    $Lines.Add(('sha256: {0}' -f $pin.Sha256)) | Out-Null
    $Lines.Add(('bytes: {0}' -f $pin.Bytes)) | Out-Null
    $Lines.Add('swap: 4GB') | Out-Null
    $Lines.Add('swapFile: G:\\galion\\wsl\\swap.vhdx') | Out-Null
    $Lines.Add(('wslconfig: {0}' -f $paths.WslConfig)) | Out-Null
    if ($TotalMemoryGb -gt 0) {
        $mem = Get-GalionWslMemoryLimitGb -TotalGb $TotalMemoryGb
        $cpu = Get-GalionWslProcessorCount -Logical $LogicalProcessors
        $Lines.Add(('memory: {0}GB' -f $mem)) | Out-Null
        $Lines.Add(('processors: {0}' -f $cpu)) | Out-Null
    }
    else {
        $Lines.Add('memory: half of the installed GiB when the machine is read, leaving at least 4GiB for Windows when the machine has 8GiB or more') | Out-Null
        $Lines.Add('processors: all of them when the machine has two or fewer, two when it has three, half when it has four or more') | Out-Null
    }
    if ($Repair) {
        $Lines.Add('repair: requested') | Out-Null
    }
    else {
        $Lines.Add('repair: not requested') | Out-Null
    }
    $Lines.Add(('desktop: {0}' -f 'galion-studio/obsidian-open-mind')) | Out-Null
    $Lines.Add(('voice: {0}' -f 'galion-studio/galion-one-voice')) | Out-Null
    $Lines.Add('desktop-path: /opt/galion/openmind-desktop') | Out-Null
    $Lines.Add('profile-link: user profile .wslconfig -> G:\galion\wsl\.wslconfig') | Out-Null
    $Lines.Add('profile-link-note: the link is a reparse point when the profile is not on G:; the file body stays on G:\galion') | Out-Null
    $Lines.Add('platform: the WSL platform binaries are a Windows component and stay in the Windows component store') | Out-Null
    $Lines.Add('c-drive-data: none') | Out-Null
    $Lines.Add('skip-when-registered: a second run does not import again when Galion-Ubuntu is registered and ext4.vhdx is present') | Out-Null
    $Lines.Add('repair-keeps-disk: -Repair does not unregister Galion-Ubuntu when ext4.vhdx is present') | Out-Null
}

function Get-GalionWslPlan {
    param(
        [Parameter(Mandatory = $true)][bool]$IsAdmin,
        [Parameter(Mandatory = $true)][bool]$DriveReady,
        [Parameter(Mandatory = $true)][bool]$IsAmd64,
        [Parameter(Mandatory = $true)][bool]$DistroRegistered,
        [Parameter(Mandatory = $true)][bool]$InstallDirNonEmpty,
        [Parameter(Mandatory = $true)][bool]$VhdxPresent,
        [Parameter(Mandatory = $true)][bool]$Repair,
        [Parameter(Mandatory = $true)][bool]$WslCommandPresent,
        [Parameter(Mandatory = $true)][bool]$FeatureWslEnabled,
        [Parameter(Mandatory = $true)][bool]$FeatureVmEnabled,
        [Parameter(Mandatory = $true)][bool]$ProfileConfigIsFile,
        [Parameter(Mandatory = $true)][int]$TotalMemoryGb,
        [Parameter(Mandatory = $true)][int]$LogicalProcessors,
        [Parameter(Mandatory = $true)][bool]$Preview
    )
    $lines = New-Object 'System.Collections.Generic.List[string]'
    $paths = Get-GalionWslPaths

    if (-not $IsAdmin) {
        $lines.Add('refused: PowerShell is not running as Administrator. Open PowerShell with Run as administrator and run this script again.') | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }
    if (-not $IsAmd64) {
        $lines.Add('refused: this Windows installation is not amd64. The pinned official image is ubuntu-24.04.5-wsl-amd64.wsl. This script will not download a different rootfs.') | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }
    if (-not $DriveReady) {
        $lines.Add('refused: G: is not present. Galion on this laptop lives only on G:\galion. Connect the G: drive and run this script again.') | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }
    if ($ProfileConfigIsFile) {
        $lines.Add('refused: the user profile already has a .wslconfig file. This script will not overwrite it and will not write the config body off G:\galion. Move that file aside and run the script again.') | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }
    if ($DistroRegistered -and -not $VhdxPresent -and -not $Repair) {
        $lines.Add(('refused: Galion-Ubuntu is registered and {0} is absent. Run again with -Repair to unregister it and import again. This script does not do that unless -Repair is set.' -f $paths.Vhdx)) | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }
    if (-not $DistroRegistered -and $InstallDirNonEmpty -and -not $Repair) {
        $lines.Add(('refused: {0} is not empty and Galion-Ubuntu is not registered. Run again with -Repair to remove that directory and import. This script does not delete it otherwise.' -f $paths.Install)) | Out-Null
        $lines.Add('written: no') | Out-Null
        $lines.Add('c-drive-data: none') | Out-Null
        return (New-GalionPlan -Action 'refuse' -ExitCode 1 -Lines $lines -EnableFeatures $false -Download $false -WriteConfig $false -Import $false -Unregister $false -RemoveInstallDir $false -PrepareGuest $false -ConfigText '')
    }

    $action = 'install'
    $import = $true
    $unregister = $false
    $remove = $false
    $download = $true
    $writeConfig = $true
    $guest = $true
    $features = -not ($WslCommandPresent -and $FeatureWslEnabled -and $FeatureVmEnabled)

    if ($DistroRegistered -and $VhdxPresent -and -not $Repair) {
        $action = 'skip'
        $import = $false
        $download = $false
        $writeConfig = $false
        $guest = $false
        $features = $false
    }
    elseif ($DistroRegistered -and $VhdxPresent -and $Repair) {
        $action = 'repair'
        $import = $false
    }
    elseif ($Repair -and (($DistroRegistered -and -not $VhdxPresent) -or (-not $DistroRegistered -and $InstallDirNonEmpty))) {
        $action = 'reimport'
        $import = $true
        $remove = $true
        $unregister = $DistroRegistered
    }

    Add-GalionCommonLines -Lines $lines -Action $action -Repair $Repair -Preview $Preview -TotalMemoryGb $TotalMemoryGb -LogicalProcessors $LogicalProcessors

    if ($action -eq 'skip') {
        $lines.Add('import-command: skipped') | Out-Null
        $lines.Add('result: Galion-Ubuntu is already registered. Nothing will be changed.') | Out-Null
    }
    else {
        $lines.Add(('import-command: {0}' -f (Get-GalionImportCommandText))) | Out-Null
        if ($features) {
            $lines.Add('feature-if-missing: dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart') | Out-Null
            $lines.Add('feature-if-missing: dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart') | Out-Null
            $lines.Add('reboot-possible: enabling the Windows features can require a restart before import') | Out-Null
        }
        else {
            $lines.Add('feature: already available') | Out-Null
        }
        $lines.Add('default-version: wsl --set-default-version 2') | Out-Null
        $lines.Add('shutdown: wsl --shutdown') | Out-Null
        if ($unregister) {
            $lines.Add('unregister: wsl --unregister Galion-Ubuntu') | Out-Null
        }
        if ($guest) {
            $lines.Add(('guest-script: {0}' -f $paths.GuestSetup)) | Out-Null
            $lines.Add('guest: wsl -d Galion-Ubuntu -u root -- /bin/bash -s') | Out-Null
        }
    }

    $config = ''
    if ($writeConfig -and $TotalMemoryGb -gt 0) {
        $mem = Get-GalionWslMemoryLimitGb -TotalGb $TotalMemoryGb
        $cpu = Get-GalionWslProcessorCount -Logical $LogicalProcessors
        $config = Get-GalionWslConfigText -MemoryGb $mem -Processors $cpu
    }

    return (New-GalionPlan -Action $action -ExitCode 0 -Lines $lines -EnableFeatures $features -Download $download -WriteConfig $writeConfig -Import $import -Unregister $unregister -RemoveInstallDir $remove -PrepareGuest $guest -ConfigText $config)
}

function Write-GalionLine {
    param([Parameter(Mandatory = $true)][string]$Line)
    [Console]::Out.WriteLine($Line)
}

function Assert-GalionDataPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-GalionDataPath $Path)) {
        throw ('path is outside G:\galion: {0}' -f $Path)
    }
}

function New-GalionDirectory {
    param([Parameter(Mandatory = $true)][string]$Path)
    Assert-GalionDataPath $Path
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Set-GalionFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content
    )
    Assert-GalionDataPath $Path
    $parent = Split-Path -Parent $Path
    Assert-GalionDataPath $parent
    New-GalionDirectory $parent
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Set-GalionProcessTemp {
    $temp = (Get-GalionWslPaths).Temp
    Assert-GalionDataPath $temp
    New-GalionDirectory $temp
    $env:TEMP = 'G:\galion\tmp\win'
    $env:TMP = 'G:\galion\tmp\win'
}

function Resolve-GalionWindowsTool {
    param([Parameter(Mandatory = $true)][string]$Name)
    $file = $Name
    if ($Name -eq 'wsl') {
        $file = 'wsl.exe'
    }
    $system = Join-Path $env:SystemRoot (Join-Path 'System32' $file)
    if (Test-Path -LiteralPath $system) {
        return $system
    }
    $cmd = Get-Command $file -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        return $cmd.Source
    }
    throw ('Windows tool not found: {0}' -f $Name)
}

function Invoke-GalionNative {
    param([Parameter(Mandatory = $true)][string[]]$ArgumentList)
    $exe = Resolve-GalionWindowsTool $ArgumentList[0]
    if ($ArgumentList.Count -eq 1) {
        & $exe | Out-Null
    }
    else {
        $rest = $ArgumentList[1..($ArgumentList.Count - 1)]
        & $exe @rest | Out-Null
    }
    return [int]$LASTEXITCODE
}

function Test-GalionWindowsFeatureEnabled {
    param([Parameter(Mandatory = $true)][string]$Name)
    $code = 0
    $out = @()
    $dism = Resolve-GalionWindowsTool 'dism.exe'
    $out = @(& $dism /online /Get-FeatureInfo ('/FeatureName:' + $Name) /English)
    $code = [int]$LASTEXITCODE
    if ($code -ne 0) {
        return $false
    }
    $text = $out -join "`n"
    return ($text -match 'State\s*:\s*Enabled')
}

function Enable-GalionWslFeatures {
    $names = @(
        'Microsoft-Windows-Subsystem-Linux',
        'VirtualMachinePlatform'
    )
    $reboot = $false
    foreach ($name in $names) {
        if (Test-GalionWindowsFeatureEnabled $name) {
            continue
        }
        $code = Invoke-GalionNative -ArgumentList @(
            'dism.exe', '/online', '/enable-feature', ('/featurename:' + $name), '/all', '/norestart'
        )
        if ($code -eq 3010) {
            $reboot = $true
            continue
        }
        if ($code -ne 0) {
            throw ('dism exited {0} while enabling {1}' -f $code, $name)
        }
    }
    if ($reboot) {
        return 3010
    }
    return 0
}

function Test-GalionSumsLine {
    param(
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text,
        [Parameter(Mandatory = $true)][string]$Hash,
        [Parameter(Mandatory = $true)][string]$Name
    )
    $clean = $Text.TrimStart([char]0xFEFF)
    foreach ($line in ($clean -split "`n")) {
        $trim = $line.Trim().TrimEnd("`r")
        if ($trim -match '^([0-9a-fA-F]{64})\s+\*?(.+)$') {
            $gotHash = $Matches[1].ToLowerInvariant()
            $gotName = $Matches[2].Trim()
            if ($gotHash -eq $Hash.ToLowerInvariant() -and $gotName -eq $Name) {
                return $true
            }
        }
    }
    return $false
}

function Test-GalionFileHash {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Expected
    )
    Assert-GalionDataPath $Path
    $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
    return ($actual.ToLowerInvariant() -eq $Expected.ToLowerInvariant())
}

function Save-GalionDownload {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][string]$Destination
    )
    Assert-GalionDataPath $Destination
    $parent = Split-Path -Parent $Destination
    New-GalionDirectory $parent
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    }
    catch {
        # Current PowerShell already negotiates TLS 1.2.
    }
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.UserAgent = 'Galion-WSL-installer'
    $request.AutomaticDecompression = [System.Net.DecompressionMethods]::None
    $request.Timeout = 3600000
    $request.ReadWriteTimeout = 3600000
    $response = $request.GetResponse()
    try {
        $inputStream = $response.GetResponseStream()
        $output = [System.IO.File]::Create($Destination)
        try {
            $inputStream.CopyTo($output)
        }
        finally {
            $output.Dispose()
            $inputStream.Dispose()
        }
    }
    finally {
        $response.Dispose()
    }
}

function Receive-GalionRootfs {
    $pin = Get-GalionRootfsPin
    $paths = Get-GalionWslPaths
    if ((Test-Path -LiteralPath $paths.Rootfs) -and (Test-GalionFileHash $paths.Rootfs $pin.Sha256)) {
        Write-GalionLine 'download: already present and the sha256 matches'
        return
    }
    if (Test-Path -LiteralPath $paths.Rootfs) {
        Assert-GalionDataPath $paths.Rootfs
        Remove-Item -LiteralPath $paths.Rootfs -Force
    }
    Save-GalionDownload -Url $pin.Sums -Destination $paths.Sums
    $sums = [System.IO.File]::ReadAllText($paths.Sums)
    if (-not (Test-GalionSumsLine -Text $sums -Hash $pin.Sha256 -Name $pin.Name)) {
        throw 'published SHA256SUMS does not contain the pinned rootfs hash. Nothing was imported.'
    }
    if (Test-Path -LiteralPath $paths.RootfsPartial) {
        Remove-Item -LiteralPath $paths.RootfsPartial -Force
    }
    Save-GalionDownload -Url $pin.Url -Destination $paths.RootfsPartial
    $length = (Get-Item -LiteralPath $paths.RootfsPartial).Length
    if ($length -ne $pin.Bytes) {
        Remove-Item -LiteralPath $paths.RootfsPartial -Force
        throw ('downloaded rootfs is {0} bytes, expected {1}. The partial file was removed from G:\galion.' -f $length, $pin.Bytes)
    }
    if (-not (Test-GalionFileHash $paths.RootfsPartial $pin.Sha256)) {
        Remove-Item -LiteralPath $paths.RootfsPartial -Force
        throw 'downloaded rootfs sha256 does not match the pin. The partial file was removed from G:\galion.'
    }
    Move-Item -LiteralPath $paths.RootfsPartial -Destination $paths.Rootfs
    Write-GalionLine 'download: sha256 matches'
}

function Install-GalionProfileLink {
    param([Parameter(Mandatory = $true)][string]$BodyPath)
    Assert-GalionDataPath $BodyPath
    if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
        throw 'USERPROFILE is empty, so WSL has no profile path for the .wslconfig link.'
    }
    $dest = Join-Path $env:USERPROFILE '.wslconfig'
    $root = [System.IO.Path]::GetPathRoot($dest)
    if ([string]::IsNullOrWhiteSpace($root)) {
        throw 'the user profile has no drive root, so the .wslconfig link was not created.'
    }
    if (Test-Path -LiteralPath $dest) {
        $item = Get-Item -LiteralPath $dest -Force
        $reparse = [IO.FileAttributes]::ReparsePoint
        $isLink = (($item.Attributes -band $reparse) -ne 0)
        if (-not $isLink) {
            throw 'the user profile already has a .wslconfig file. This script will not overwrite it and will not write the config body off G:\galion.'
        }
        $target = ''
        if ($item.Target -is [System.Array]) {
            $target = [string]$item.Target[0]
        }
        else {
            $target = [string]$item.Target
        }
        if ($target -eq $BodyPath) {
            Write-GalionLine 'profile-link: already points at the G: config'
            return
        }
        Remove-Item -LiteralPath $dest -Force
    }
    New-Item -ItemType SymbolicLink -Path $dest -Target $BodyPath | Out-Null
    Write-GalionLine 'profile-link: created. The file body stayed on G:\galion.'
}

function Remove-GalionInstallDirectory {
    $dir = (Get-GalionWslPaths).Install
    Assert-GalionDataPath $dir
    if ($dir -ne 'G:\galion\wsl\Galion-Ubuntu') {
        throw 'install directory is not the Galion-Ubuntu folder'
    }
    if (Test-Path -LiteralPath $dir) {
        Remove-Item -LiteralPath $dir -Recurse -Force
    }
}

function Get-GalionRegisteredDistroNames {
    $wsl = Resolve-GalionWindowsTool 'wsl'
    $previous = [Console]::OutputEncoding
    try {
        [Console]::OutputEncoding = [System.Text.Encoding]::Unicode
        $out = @(& $wsl --list --quiet 2>&1)
        $code = [int]$LASTEXITCODE
    }
    finally {
        [Console]::OutputEncoding = $previous
    }
    if ($code -ne 0) {
        return @()
    }
    $names = New-Object 'System.Collections.Generic.List[string]'
    foreach ($line in @($out)) {
        $clean = ([string]$line) -replace ([char]0), ''
        $clean = $clean.Trim()
        if (-not [string]::IsNullOrWhiteSpace($clean)) {
            $names.Add($clean) | Out-Null
        }
    }
    return @($names.ToArray())
}

function Test-GalionProfileConfigIsFile {
    if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
        return $false
    }
    $dest = Join-Path $env:USERPROFILE '.wslconfig'
    if (-not (Test-Path -LiteralPath $dest)) {
        return $false
    }
    $item = Get-Item -LiteralPath $dest -Force
    $reparse = [IO.FileAttributes]::ReparsePoint
    return (($item.Attributes -band $reparse) -eq 0)
}

function Test-GalionAmd64Host {
    if ($env:PROCESSOR_ARCHITECTURE -eq 'AMD64') {
        return $true
    }
    if ($env:PROCESSOR_ARCHITEW6432 -eq 'AMD64') {
        return $true
    }
    return $false
}

function Get-GalionInstalledMemoryGb {
    $system = Get-CimInstance -ClassName Win32_ComputerSystem
    $bytes = [int64]$system.TotalPhysicalMemory
    $gb = [int][Math]::Floor($bytes / 1GB)
    if ($gb -lt 1) {
        return 1
    }
    return $gb
}

function Get-GalionLiveFacts {
    $paths = Get-GalionWslPaths
    $wslPresent = $false
    try {
        $resolved = Resolve-GalionWindowsTool 'wsl'
        $wslPresent = -not [string]::IsNullOrWhiteSpace($resolved)
    }
    catch {
        $wslPresent = $false
    }
    $featureWsl = $false
    $featureVm = $false
    if ($wslPresent) {
        $featureWsl = Test-GalionWindowsFeatureEnabled 'Microsoft-Windows-Subsystem-Linux'
        $featureVm = Test-GalionWindowsFeatureEnabled 'VirtualMachinePlatform'
    }
    $registered = $false
    if ($wslPresent) {
        $names = @(Get-GalionRegisteredDistroNames)
        $registered = ($names -contains 'Galion-Ubuntu')
    }
    $dirNonEmpty = $false
    if (Test-Path -LiteralPath $paths.Install) {
        $children = @(Get-ChildItem -LiteralPath $paths.Install -Force -ErrorAction SilentlyContinue)
        $dirNonEmpty = ($children.Count -gt 0)
    }
    return [pscustomobject]@{
        IsAdmin             = $true
        DriveReady          = (Test-Path -LiteralPath 'G:\')
        IsAmd64             = (Test-GalionAmd64Host)
        DistroRegistered    = $registered
        InstallDirNonEmpty  = $dirNonEmpty
        VhdxPresent         = (Test-Path -LiteralPath $paths.Vhdx)
        WslCommandPresent   = $wslPresent
        FeatureWslEnabled   = $featureWsl
        FeatureVmEnabled    = $featureVm
        ProfileConfigIsFile = (Test-GalionProfileConfigIsFile)
        TotalMemoryGb       = (Get-GalionInstalledMemoryGb)
        LogicalProcessors   = [int][Environment]::ProcessorCount
    }
}

function Test-GalionAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-GalionWslExecute {
    param([Parameter(Mandatory = $true)]$Plan)
    if ($Plan.Action -eq 'skip') {
        return 0
    }
    foreach ($path in @($Plan.DataPaths)) {
        Assert-GalionDataPath $path
    }
    foreach ($dir in @($Plan.Directories)) {
        Assert-GalionDataPath $dir
    }
    Set-GalionProcessTemp
    foreach ($dir in @($Plan.Directories)) {
        New-GalionDirectory $dir
    }
    if ($Plan.EnableFeatures) {
        $featureCode = Enable-GalionWslFeatures
        if ($featureCode -eq 3010) {
            Write-GalionLine 'reboot: Windows must restart before Galion-Ubuntu can be imported. Run this script again after the restart.'
            return 3010
        }
    }
    $wslReady = $false
    try {
        Resolve-GalionWindowsTool 'wsl' | Out-Null
        $wslReady = $true
    }
    catch {
        $wslReady = $false
    }
    if (-not $wslReady) {
        Write-GalionLine 'reboot: wsl.exe is not available yet. Restart Windows and run this script again.'
        return 3010
    }
    if ($Plan.Download) {
        Receive-GalionRootfs
    }
    $paths = Get-GalionWslPaths
    if ($Plan.WriteConfig) {
        if ([string]::IsNullOrWhiteSpace($Plan.ConfigText)) {
            throw 'the .wslconfig body was empty'
        }
        if ($Plan.ConfigText -notmatch 'swapFile=G:\\\\galion\\\\wsl\\\\swap\.vhdx') {
            throw 'the .wslconfig body does not put swap on G:\galion'
        }
        Set-GalionFile -Path $paths.WslConfig -Content $Plan.ConfigText
        Install-GalionProfileLink -BodyPath $paths.WslConfig
    }
    $versionCode = Invoke-GalionNative -ArgumentList @('wsl', '--set-default-version', '2')
    if ($versionCode -ne 0) {
        throw ('wsl --set-default-version 2 exited {0}' -f $versionCode)
    }
    $stopCode = Invoke-GalionNative -ArgumentList @('wsl', '--shutdown')
    if ($stopCode -ne 0) {
        throw ('wsl --shutdown exited {0}' -f $stopCode)
    }
    if ($Plan.Unregister) {
        $dropCode = Invoke-GalionNative -ArgumentList @('wsl', '--unregister', 'Galion-Ubuntu')
        if ($dropCode -ne 0) {
            throw ('wsl --unregister Galion-Ubuntu exited {0}' -f $dropCode)
        }
    }
    if ($Plan.RemoveInstallDir) {
        Remove-GalionInstallDirectory
    }
    if ($Plan.Import) {
        $importCode = Invoke-GalionNative -ArgumentList @(
            'wsl', '--import', 'Galion-Ubuntu', $paths.Install, $paths.Rootfs, '--version', '2'
        )
        if ($importCode -ne 0) {
            throw ('wsl --import exited {0}. Galion data was not written off G:\galion.' -f $importCode)
        }
    }
    if ($Plan.PrepareGuest) {
        $guest = (Get-GalionGuestScript) -replace "`r", ''
        if (-not $guest.EndsWith("`n")) {
            $guest = $guest + "`n"
        }
        Set-GalionFile -Path $paths.GuestSetup -Content $guest
        $wslExe = Resolve-GalionWindowsTool 'wsl'
        $guest | & $wslExe -d 'Galion-Ubuntu' -u 'root' -- /bin/bash -s | Out-Null
        $guestCode = [int]$LASTEXITCODE
        if ($guestCode -ne 0) {
            throw ('guest setup exited {0}. Galion-Ubuntu is registered. Run again with -Repair to repeat the guest setup without replacing a present ext4.vhdx.' -f $guestCode)
        }
        $stopAgain = Invoke-GalionNative -ArgumentList @('wsl', '--shutdown')
        if ($stopAgain -ne 0) {
            throw ('wsl --shutdown exited {0}' -f $stopAgain)
        }
    }
    Set-GalionFile -Path $paths.SrcReadme -Content ((Get-GalionSrcReadme) + "`n")
    $pin = Get-GalionRootfsPin
    $note = @(
        'distro: Galion-Ubuntu',
        'version: 2',
        ('rootfs: {0}' -f $pin.Name),
        ('sha256: {0}' -f $pin.Sha256),
        'swapFile: G:\galion\wsl\swap.vhdx',
        ''
    ) -join "`n"
    Set-GalionFile -Path $paths.InstalledNote -Content $note
    Write-GalionLine 'result: Galion-Ubuntu is on G:\galion. Enter it with: wsl -d Galion-Ubuntu'
    return 0
}

function Invoke-GalionWslInstaller {
    param(
        [switch]$DryRun,
        [switch]$Repair
    )
    $windows = ($env:OS -eq 'Windows_NT')
    if (-not $windows) {
        if (-not $DryRun) {
            Write-GalionLine 'mode: refused'
            Write-GalionLine 'written: no'
            Write-GalionLine 'refused: this installer runs on Windows. Pass -DryRun to print the plan. Nothing was written.'
            Write-GalionLine 'c-drive-data: none'
            $script:GalionWslExit = 1
            return
        }
        $plan = Get-GalionWslPlan -IsAdmin $true -DriveReady $true -IsAmd64 $true -DistroRegistered $false -InstallDirNonEmpty $false -VhdxPresent $false -Repair $Repair.IsPresent -WslCommandPresent $false -FeatureWslEnabled $false -FeatureVmEnabled $false -ProfileConfigIsFile $false -TotalMemoryGb 0 -LogicalProcessors 0 -Preview $true
        Write-GalionLine 'mode: dry-run'
        Write-GalionLine 'written: no'
        foreach ($line in @($plan.Lines)) {
            Write-GalionLine $line
        }
        $script:GalionWslExit = $plan.ExitCode
        return
    }

    $admin = $false
    try {
        $admin = Test-GalionAdmin
    }
    catch {
        $admin = $false
    }
    if (-not $admin) {
        $plan = Get-GalionWslPlan -IsAdmin $false -DriveReady $false -IsAmd64 $false -DistroRegistered $false -InstallDirNonEmpty $false -VhdxPresent $false -Repair $Repair.IsPresent -WslCommandPresent $false -FeatureWslEnabled $false -FeatureVmEnabled $false -ProfileConfigIsFile $false -TotalMemoryGb 0 -LogicalProcessors 0 -Preview $false
        if ($DryRun) {
            Write-GalionLine 'mode: dry-run'
        }
        else {
            Write-GalionLine 'mode: refused'
        }
        Write-GalionLine 'written: no'
        foreach ($line in @($plan.Lines)) {
            Write-GalionLine $line
        }
        $script:GalionWslExit = 1
        return
    }

    $facts = Get-GalionLiveFacts
    $plan = Get-GalionWslPlan -IsAdmin $true -DriveReady $facts.DriveReady -IsAmd64 $facts.IsAmd64 -DistroRegistered $facts.DistroRegistered -InstallDirNonEmpty $facts.InstallDirNonEmpty -VhdxPresent $facts.VhdxPresent -Repair $Repair.IsPresent -WslCommandPresent $facts.WslCommandPresent -FeatureWslEnabled $facts.FeatureWslEnabled -FeatureVmEnabled $facts.FeatureVmEnabled -ProfileConfigIsFile $facts.ProfileConfigIsFile -TotalMemoryGb $facts.TotalMemoryGb -LogicalProcessors $facts.LogicalProcessors -Preview $false
    if ($DryRun) {
        Write-GalionLine 'mode: dry-run'
        Write-GalionLine 'written: no'
    }
    elseif ($plan.ExitCode -ne 0) {
        Write-GalionLine 'mode: refused'
        Write-GalionLine 'written: no'
    }
    elseif ($plan.Action -eq 'skip') {
        Write-GalionLine 'mode: skip'
        Write-GalionLine 'written: no'
    }
    else {
        Write-GalionLine 'mode: install'
    }
    foreach ($line in @($plan.Lines)) {
        Write-GalionLine $line
    }
    if ($plan.WriteConfig -and -not [string]::IsNullOrWhiteSpace($plan.ConfigText)) {
        Write-GalionLine 'wslconfig-body-begin'
        foreach ($configLine in ($plan.ConfigText -split "`n")) {
            Write-GalionLine $configLine
        }
        Write-GalionLine 'wslconfig-body-end'
    }
    if ($DryRun -or $plan.ExitCode -ne 0) {
        $script:GalionWslExit = $plan.ExitCode
        return
    }
    $script:GalionWslExit = Invoke-GalionWslExecute -Plan $plan
}

if ($env:GALION_WSL_DOTSOURCE -eq '1') {
    return
}

$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath 'variable:PSNativeCommandUseErrorActionPreference') {
    $PSNativeCommandUseErrorActionPreference = $false
}
try {
    Invoke-GalionWslInstaller -DryRun:$DryRun -Repair:$Repair
}
catch {
    Write-GalionLine ('refused: {0}' -f $_.Exception.Message)
    Write-GalionLine 'c-drive-data: none'
    $script:GalionWslExit = 1
}
exit $script:GalionWslExit
