# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright (c) 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
#
# Pester checks for the WSL on G: installer. They run the dry run.
# They do not enable WSL, download Ubuntu, or write a virtual disk.

BeforeAll {
    $script:Here = $PSScriptRoot
    $script:Installer = Join-Path $script:Here 'Install-GalionWSL.ps1'
    $script:RepoRoot = (Resolve-Path (Join-Path $script:Here '..\..\..')).Path
    $env:GALION_WSL_DOTSOURCE = '1'
    try {
        . $script:Installer
    }
    finally {
        Remove-Item Env:GALION_WSL_DOTSOURCE
    }

    function Get-Plan {
    param(
        [bool]$IsAdmin = $true,
        [bool]$DriveReady = $true,
        [bool]$IsAmd64 = $true,
        [bool]$DistroRegistered = $false,
        [bool]$InstallDirNonEmpty = $false,
        [bool]$VhdxPresent = $false,
        [bool]$Repair = $false,
        [bool]$WslCommandPresent = $true,
        [bool]$FeatureWslEnabled = $true,
        [bool]$FeatureVmEnabled = $true,
        [bool]$ProfileConfigIsFile = $false,
        [int]$TotalMemoryGb = 16,
        [int]$LogicalProcessors = 8,
        [bool]$Preview = $false
    )
    return Get-GalionWslPlan -IsAdmin $IsAdmin -DriveReady $DriveReady -IsAmd64 $IsAmd64 -DistroRegistered $DistroRegistered -InstallDirNonEmpty $InstallDirNonEmpty -VhdxPresent $VhdxPresent -Repair $Repair -WslCommandPresent $WslCommandPresent -FeatureWslEnabled $FeatureWslEnabled -FeatureVmEnabled $FeatureVmEnabled -ProfileConfigIsFile $ProfileConfigIsFile -TotalMemoryGb $TotalMemoryGb -LogicalProcessors $LogicalProcessors -Preview $Preview
}

    function Get-InstallerOutput {
        param([string[]]$ArgumentList = @())
        $out = & pwsh -NoProfile -File $script:Installer @ArgumentList 2>&1
        return [pscustomobject]@{
            Text = ($out | ForEach-Object { [string]$_ }) -join "`n"
            Code = $LASTEXITCODE
        }
    }
}

Describe 'path guard' {
    It 'accepts Galion paths on G:' {
        Test-GalionDataPath 'G:\galion' | Should -BeTrue
        Test-GalionDataPath 'G:\galion\wsl\Galion-Ubuntu' | Should -BeTrue
        Test-GalionDataPath 'G:\galion\wsl\swap.vhdx' | Should -BeTrue
        Test-GalionDataPath 'g:\galion\tmp\win' | Should -BeTrue
    }

    It 'rejects anything that is not under G:\galion' {
        Test-GalionDataPath '' | Should -BeFalse
        Test-GalionDataPath 'G:\' | Should -BeFalse
        Test-GalionDataPath 'G:\other' | Should -BeFalse
        Test-GalionDataPath 'G:\galion\..\Windows' | Should -BeFalse
        Test-GalionDataPath 'D:\galion\wsl' | Should -BeFalse
        $offGalion = 'C' + ':\galion'
        Test-GalionDataPath $offGalion | Should -BeFalse
    }
}

Describe 'limits' {
    It 'leaves at least 4GiB for Windows when the machine has 8GiB or more' {
        Get-GalionWslMemoryLimitGb -TotalGb 8 | Should -Be 4
        Get-GalionWslMemoryLimitGb -TotalGb 16 | Should -Be 8
        Get-GalionWslMemoryLimitGb -TotalGb 32 | Should -Be 16
        Get-GalionWslMemoryLimitGb -TotalGb 9 | Should -Be 4
        Get-GalionWslMemoryLimitGb -TotalGb 12 | Should -Be 6
    }

    It 'uses half when the machine has less than 8GiB' {
        Get-GalionWslMemoryLimitGb -TotalGb 0 | Should -Be 1
        Get-GalionWslMemoryLimitGb -TotalGb 1 | Should -Be 1
        Get-GalionWslMemoryLimitGb -TotalGb 4 | Should -Be 2
        Get-GalionWslMemoryLimitGb -TotalGb 7 | Should -Be 3
    }

    It 'keeps two processors on a small machine and half on a larger one' {
        Get-GalionWslProcessorCount -Logical 0 | Should -Be 1
        Get-GalionWslProcessorCount -Logical 1 | Should -Be 1
        Get-GalionWslProcessorCount -Logical 2 | Should -Be 2
        Get-GalionWslProcessorCount -Logical 3 | Should -Be 2
        Get-GalionWslProcessorCount -Logical 4 | Should -Be 2
        Get-GalionWslProcessorCount -Logical 8 | Should -Be 4
    }
}

Describe 'wslconfig' {
    It 'puts swap on G: and records the memory limit' {
        $text = Get-GalionWslConfigText -MemoryGb 8 -Processors 4
        $text | Should -Be ("[wsl2]`nmemory=8GB`nprocessors=4`nswap=4GB`nswapFile=G:\\galion\\wsl\\swap.vhdx`nlocalhostForwarding=true`nguiApplications=true`n")
    }
}

Describe 'published checksum line' {
    It 'accepts the Ubuntu sums line for the pinned rootfs' {
        $pin = Get-GalionRootfsPin
        $line = '{0} *{1}' -f $pin.Sha256, $pin.Name
        Test-GalionSumsLine -Text $line -Hash $pin.Sha256 -Name $pin.Name | Should -BeTrue
    }

    It 'rejects a different file or hash' {
        $pin = Get-GalionRootfsPin
        Test-GalionSumsLine -Text ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa *{0}' -f $pin.Name) -Hash $pin.Sha256 -Name $pin.Name | Should -BeFalse
        Test-GalionSumsLine -Text ('{0} *other.wsl' -f $pin.Sha256) -Hash $pin.Sha256 -Name $pin.Name | Should -BeFalse
    }
}

Describe 'plan' {
    It 'refuses when PowerShell is not elevated' {
        $plan = Get-Plan -IsAdmin $false
        $plan.Action | Should -Be 'refuse'
        $plan.ExitCode | Should -Be 1
        $plan.DataPaths.Count | Should -Be 0
        ($plan.Lines -join "`n") | Should -Match 'not running as Administrator'
    }

    It 'refuses when G: is absent' {
        $plan = Get-Plan -DriveReady $false
        $plan.Action | Should -Be 'refuse'
        ($plan.Lines -join "`n") | Should -Match 'G: is not present'
        ($plan.Lines -join "`n") | Should -Match 'G:\\galion'
    }

    It 'refuses a non-amd64 machine' {
        $plan = Get-Plan -IsAmd64 $false
        $plan.Action | Should -Be 'refuse'
        ($plan.Lines -join "`n") | Should -Match 'not amd64'
    }

    It 'refuses to overwrite a profile .wslconfig file' {
        $plan = Get-Plan -ProfileConfigIsFile $true
        $plan.Action | Should -Be 'refuse'
        $plan.WriteConfig | Should -BeFalse
        ($plan.Lines -join "`n") | Should -Match 'will not overwrite'
    }

    It 'skips import when the distro and ext4 disk are present' {
        $plan = Get-Plan -DistroRegistered $true -VhdxPresent $true
        $plan.Action | Should -Be 'skip'
        $plan.ExitCode | Should -Be 0
        $plan.Import | Should -BeFalse
        $plan.Unregister | Should -BeFalse
        $plan.Download | Should -BeFalse
        $plan.WriteConfig | Should -BeFalse
        $plan.DataPaths.Count | Should -Be 0
        ($plan.Lines -join "`n") | Should -Match 'import-command: skipped'
        ($plan.Lines -join "`n") | Should -Not -Match 'wsl --import'
    }

    It 'refuses a registered distro whose disk is missing until -Repair' {
        $plan = Get-Plan -DistroRegistered $true -VhdxPresent $false
        $plan.Action | Should -Be 'refuse'
        ($plan.Lines -join "`n") | Should -Match 'ext4.vhdx is absent'
    }

    It 'refuses a leftover install directory until -Repair' {
        $plan = Get-Plan -InstallDirNonEmpty $true
        $plan.Action | Should -Be 'refuse'
        $plan.RemoveInstallDir | Should -BeFalse
        ($plan.Lines -join "`n") | Should -Match 'does not delete it otherwise'
    }

    It 'repairs config without unregistering a present disk' {
        $plan = Get-Plan -DistroRegistered $true -VhdxPresent $true -Repair $true
        $plan.Action | Should -Be 'repair'
        $plan.Import | Should -BeFalse
        $plan.Unregister | Should -BeFalse
        $plan.RemoveInstallDir | Should -BeFalse
        $plan.WriteConfig | Should -BeTrue
        $plan.PrepareGuest | Should -BeTrue
        $plan.ConfigText | Should -Match 'swapFile=G:\\\\galion\\\\wsl\\\\swap\.vhdx'
        $plan.ConfigText | Should -Match 'memory=8GB'
        ($plan.Lines -join "`n") | Should -Not -Match 'wsl --unregister'
    }

    It 'reimports only when -Repair is set and the disk is missing' {
        $plan = Get-Plan -DistroRegistered $true -VhdxPresent $false -Repair $true
        $plan.Action | Should -Be 'reimport'
        $plan.Unregister | Should -BeTrue
        $plan.RemoveInstallDir | Should -BeTrue
        $plan.Import | Should -BeTrue
        ($plan.Lines -join "`n") | Should -Match 'unregister: wsl --unregister Galion-Ubuntu'
        $import = 'import-command: wsl --import Galion-Ubuntu G:\galion\wsl\Galion-Ubuntu G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl --version 2'
        ($plan.Lines -join "`n") | Should -Match ([regex]::Escape($import))
    }

    It 'removes a leftover directory on -Repair without unregistering a missing name' {
        $plan = Get-Plan -InstallDirNonEmpty $true -Repair $true
        $plan.Action | Should -Be 'reimport'
        $plan.Unregister | Should -BeFalse
        $plan.RemoveInstallDir | Should -BeTrue
        $plan.Import | Should -BeTrue
    }

    It 'imports on a clean machine and keeps every write under G:\galion' {
        $plan = Get-Plan
        $plan.Action | Should -Be 'install'
        $plan.Import | Should -BeTrue
        $plan.Unregister | Should -BeFalse
        $plan.EnableFeatures | Should -BeFalse
        $plan.DataPaths.Count | Should -BeGreaterThan 0
        foreach ($path in $plan.DataPaths) {
            Test-GalionDataPath $path | Should -BeTrue
            $path | Should -Match '^[Gg]:\\galion(\\|$)'
        }
        ($plan.Lines -join "`n") | Should -Match 'c-drive-data: none'
        ($plan.Lines -join "`n") | Should -Match 'Windows component'
        ($plan.Lines -join "`n") | Should -Match 'temp: G:\\galion\\tmp\\win'
        ($plan.Lines -join "`n") | Should -Match 'galion-studio/obsidian-open-mind'
        ($plan.Lines -join "`n") | Should -Match 'galion-studio/galion-one-voice'
    }

    It 'lists the feature enable commands when WSL is missing' {
        $plan = Get-Plan -WslCommandPresent $false -FeatureWslEnabled $false -FeatureVmEnabled $false -TotalMemoryGb 0 -LogicalProcessors 0 -Preview $true
        $plan.EnableFeatures | Should -BeTrue
        $text = $plan.Lines -join "`n"
        $text | Should -Match 'feature-if-missing: dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart'
        $text | Should -Match 'feature-if-missing: dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart'
        $text | Should -Match 'not a reading of this machine'
    }
}

Describe 'guest and source notes' {
    It 'creates the galion user and the console directory without cloning' {
        $guest = Get-GalionGuestScript
        $guest | Should -Match '/opt/galion/openmind-desktop'
        $guest | Should -Match 'useradd'
        $guest | Should -Match 'default=galion'
        $guest | Should -Not -Match 'git clone'
        $guest | Should -Not -Match '\d{1,3}(\.\d{1,3}){3}'
    }

    It 'names both desktop checkouts and does not deploy them' {
        $readme = Get-GalionSrcReadme
        $readme | Should -Match 'galion-studio/obsidian-open-mind'
        $readme | Should -Match 'galion-studio/galion-one-voice'
        $readme | Should -Match 'does not clone'
        $readme | Should -Not -Match '\d{1,3}(\.\d{1,3}){3}'
    }
}

Describe 'dry run' {
    It 'prints the import plan and writes nothing' {
        $beforeTemp = $env:TEMP
        $before = Get-ChildItem -LiteralPath $script:Here -Recurse -File | ForEach-Object { $_.FullName + ':' + $_.Length }
        $run = Get-InstallerOutput -ArgumentList @('-DryRun')
        $run.Code | Should -Be 0
        $env:TEMP | Should -Be $beforeTemp
        $after = Get-ChildItem -LiteralPath $script:Here -Recurse -File | ForEach-Object { $_.FullName + ':' + $_.Length }
        Compare-Object $before $after | Should -BeNullOrEmpty
        $run.Text | Should -Match 'mode: dry-run'
        $run.Text | Should -Match 'written: no'
        $run.Text | Should -Match 'c-drive-data: none'
        $run.Text | Should -Match 'platform: the WSL platform binaries are a Windows component and stay in the Windows component store'
        $import = 'import-command: wsl --import Galion-Ubuntu G:\galion\wsl\Galion-Ubuntu G:\galion\wsl\downloads\ubuntu-24.04.5-wsl-amd64.wsl --version 2'
        $run.Text | Should -Match ([regex]::Escape($import))
        $run.Text | Should -Match 'swapFile: G:\\\\galion\\\\wsl\\\\swap\.vhdx'
        $run.Text | Should -Match 'sha256: bb415d824822c4b878125729af451a5d18fb13d1cf5cbed9a7393ad64ac6039e'
        $run.Text | Should -Match 'bytes: 388975696'
        $run.Text | Should -Match 'repair: not requested'
        $run.Text | Should -Match 'skip-when-registered:'
        $run.Text | Should -Not -Match '\d{1,3}(\.\d{1,3}){3}'
        $run.Text | Should -Not -Match 'C:\\'
    }

    It 'prints the repair rules without writing' {
        $run = Get-InstallerOutput -ArgumentList @('-DryRun', '-Repair')
        $run.Code | Should -Be 0
        $run.Text | Should -Match 'repair: requested'
        $run.Text | Should -Match 'repair-keeps-disk:'
        $run.Text | Should -Match 'written: no'
    }

    It 'refuses a real run on this runner' {
        $run = Get-InstallerOutput -ArgumentList @()
        $run.Code | Should -Be 1
        $run.Text | Should -Match 'mode: refused'
        $run.Text | Should -Match 'this installer runs on Windows'
        $run.Text | Should -Match 'written: no'
    }
}

Describe 'repository locks' {
    It 'documents the same rootfs pin the script uses' {
        $pin = Get-GalionRootfsPin
        $note = Get-Content -LiteralPath (Join-Path $script:Here 'README.md') -Raw
        $note | Should -Match ([regex]::Escape($pin.Sha256))
        $note | Should -Match ([regex]::Escape($pin.Url))
        $note | Should -Match ([regex]::Escape([string]$pin.Bytes))
        $note | Should -Not -Match '\d{1,3}(\.\d{1,3}){3}'
    }

    It 'keeps the canonical LICENSE byte-identical' {
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $script:RepoRoot 'LICENSE')).Hash.ToLowerInvariant()
        $hash | Should -Be '33a955cb5bedbd5a58802766dd6a692f252dd7b3c663809496c21782ec21b22a'
    }

    It 'sets this process TEMP to G:\galion\tmp\win and does not call setx' {
        $raw = Get-Content -LiteralPath $script:Installer -Raw
        $raw | Should -Match '\$env:TEMP = ''G:\\galion\\tmp\\win'''
        $raw | Should -Match '\$env:TMP = ''G:\\galion\\tmp\\win'''
        $raw | Should -Not -Match 'setx'
        $raw | Should -Not -Match 'git clone'
        $raw | Should -Not -Match '\d{1,3}(\.\d{1,3}){3}'
        $raw | Should -Not -Match 'C:\\'
    }
}
