# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.

BeforeAll {
    . (Join-Path $PSScriptRoot '..\GalionUbuntuOnG.ps1')
    $script:PinFile = Join-Path $PSScriptRoot '..\pins.env'
    $script:Pins = Read-GalionPins $script:PinFile

    function New-GalionHealthyFacts {
    return @{
        IsAdmin            = $true
        Wsl2               = $true
        DriveReady         = $true
        FreeBytes          = [int64]107374182400
        MinFreeBytes       = [int64]21474836480
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
        RepoWsl            = '/mnt/g/galion/src/galion-operating-system'
        Provisioned        = $false
        ObsidianInstalled  = $false
        VoiceInstalled     = $false
        BackupStamp        = '20261121T000000Z'
        Preview            = $false
        Uninstall          = $false
        Confirm            = $false
        Repair             = $false
    }
}

function Get-GalionActionIds {
    param($Plan)
    return @($Plan.Actions | ForEach-Object { [string]$_['Id'] })
}

function Get-GalionAction {
    param($Plan, [string]$Id)
    return @($Plan.Actions | Where-Object { [string]$_['Id'] -eq $Id })[0]
}
}

Describe 'paths stay on G:' {
    It 'accepts a path under G:\galion and rejects C: and traversal' {
        (Test-GalionPathUnder 'G:\galion\wsl\cache\ubuntu-24.04.5-wsl-amd64.wsl' 'G:\galion') | Should -BeTrue
        (Test-GalionPathUnder 'C:\Users\Galion\.wslconfig' 'G:\galion') | Should -BeFalse
        (Test-GalionPathUnder 'G:\galion\..\Windows\System32' 'G:\galion') | Should -BeFalse
        (Test-GalionPathUnder '\\server\share\galion' 'G:\galion') | Should -BeFalse
        (Test-GalionPathUnder 'G:\galion\%TEMP%\x' 'G:\galion') | Should -BeFalse
        (ConvertTo-GalionWindowsPath 'G:\galion\..\Windows') | Should -Be 'G:\Windows'
        (Test-GalionSamePath '\\?\G:\galion\wsl\Galion-Ubuntu' 'G:\galion\wsl\Galion-Ubuntu') | Should -BeTrue
        (ConvertTo-GalionWslPath 'G:\galion\src\galion-one-voice') | Should -Be '/mnt/g/galion/src/galion-one-voice'
    }

    It 'rejects a large write off G: and allows only a small profile .wslconfig' {
        $large = @{ Kind = 'write'; Path = 'C:\Users\x\big.vhdx'; Text = ('x' * 1000); Profile = 'C:\Users\x' }
        (Test-GalionActionAllowed $large) | Should -Not -Be ''
        $protected = @{ Kind = 'write'; Path = 'G:\galion\wsl\ubuntu\ext4.vhdx'; Text = 'x'; Profile = 'C:\Users\x' }
        (Test-GalionActionAllowed $protected) | Should -Not -Be ''
        $small = @{ Kind = 'write'; Path = 'C:\Users\Galion\.wslconfig'; Text = 'abc'; Profile = 'C:\Users\Galion' }
        (Test-GalionActionAllowed $small) | Should -Be ''
        $edge = @{ Kind = 'write'; Path = 'C:\Users\Galion\.wslconfig'; Text = ('a' * 65535); Profile = 'C:\Users\Galion' }
        (Test-GalionActionAllowed $edge) | Should -Be ''
        $over = @{ Kind = 'write'; Path = 'C:\Users\Galion\.wslconfig'; Text = ('a' * 65536); Profile = 'C:\Users\Galion' }
        (Test-GalionActionAllowed $over) | Should -Not -Be ''
    }
}

Describe 'protected distros and uninstall' {
    It 'never unregisters Ubuntu or docker-desktop' {
        $plan = Get-GalionUbuntuPlan -Facts (New-GalionHealthyFacts) -Pins $script:Pins
        $blob = @($plan.Actions | ForEach-Object { @($_['Arguments']) -join ' ' }) -join "`n"
        $blob | Should -Not -Match '--shutdown'
        $blob | Should -Not -Match '--unregister Ubuntu'
        $blob | Should -Not -Match '--unregister docker-desktop'
        ($plan.Notes -join "`n") | Should -Match 'protected-distro: Ubuntu G:\\galion\\wsl\\ubuntu'
        ($plan.Notes -join "`n") | Should -Match 'Install-GalionWslOnG is not called'
    }

    It 'uninstalls only Galion-Ubuntu, and only with confirmation' {
        $facts = New-GalionHealthyFacts
        $facts.GalionBasePath = 'G:\galion\wsl\Galion-Ubuntu'
        $facts.Uninstall = $true
        $open = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        $open.ExitCode | Should -Be 2
        @($open.Actions).Count | Should -Be 0

        $facts.Confirm = $true
        $closed = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        $closed.ExitCode | Should -Be 0
        $ids = Get-GalionActionIds $closed
        $ids | Should -Contain 'unregister'
        $ids | Should -Contain 'remove-tree'
        ((Get-GalionAction $closed 'unregister')['Arguments'] -join ' ') | Should -Be 'wsl.exe --unregister Galion-Ubuntu'
        (Get-GalionAction $closed 'remove-tree')['Path'] | Should -Be 'G:\galion\wsl\Galion-Ubuntu'

        $facts.GalionBasePath = 'D:\wsl\Galion-Ubuntu'
        $wrong = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        $wrong.ExitCode | Should -Be 1
        @($wrong.Actions).Count | Should -Be 0
        ($wrong.Notes -join "`n") | Should -Match 'will not unregister'
    }

    It 'removes a leftover directory only when the name is not registered' {
        $facts = New-GalionHealthyFacts
        $facts.Uninstall = $true
        $facts.Confirm = $true
        $facts.InstallDirNonEmpty = $true
        $plan = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        $plan.ExitCode | Should -Be 0
        (Get-GalionActionIds $plan) | Should -Be @('mkdir-logs', 'remove-tree')
    }
}

Describe '.wslconfig merge' {
    It 'keeps debugConsole and an existing memory line, and does not add processors' {
        $existing = "[wsl2]`r`ndebugConsole=true`r`nmemory=16GB`r`n"
        $merged = Merge-GalionWslConfig -Existing $existing
        $merged | Should -Match 'debugConsole=true'
        $merged | Should -Match 'memory=16GB'
        $merged | Should -Not -Match 'processors='
        $merged | Should -Match 'swap=4GB'
        $merged | Should -Match 'swapFile=G:\\\\galion\\\\wsl\\\\swap\.vhdx'
        ($merged -replace "`r`n", '').Contains("`n") | Should -BeFalse
        { Merge-GalionWslConfig -Existing '' -SwapFile 'C:\swap.vhdx' } | Should -Throw
    }

    It 'does not invent memory or processors when they are absent' {
        $merged = Merge-GalionWslConfig -Existing "[wsl2]`r`ndebugConsole=true`r`n"
        $merged | Should -Match 'debugConsole=true'
        $merged | Should -Not -Match 'memory='
        $merged | Should -Not -Match 'processors='
        $merged | Should -Match '\[wsl2\]'
    }
}

Describe 'install plan' {
    It 'orders the first install and keeps Windows cache paths on G:' {
        $plan = Get-GalionUbuntuPlan -Facts (New-GalionHealthyFacts) -Pins $script:Pins
        $plan.ExitCode | Should -Be 0
        $ids = Get-GalionActionIds $plan
        $cursor = -1
        foreach ($name in @('probe', 'snapshot', 'download', 'hardlink', 'import', 'backup-wslconfig', 'write-wslconfig', 'write-wslconfig-copy', 'provision', 'terminate', 'linger', 'ports', 'obsidian', 'voice')) {
            $at = [array]::IndexOf($ids, $name)
            $at | Should -BeGreaterThan $cursor
            $cursor = $at
        }
        ([array]::IndexOf($ids, 'env-TEMP')) | Should -BeLessThan ([array]::IndexOf($ids, 'probe'))
        $import = (Get-GalionAction $plan 'import')['Arguments'] -join ' '
        $import | Should -Be 'wsl.exe --import Galion-Ubuntu G:\galion\wsl\Galion-Ubuntu G:\galion\wsl\cache\ubuntu-24.04.5-wsl-amd64.tar.gz --version 2'
        $provision = (Get-GalionAction $plan 'provision')['Arguments'] -join ' '
        $provision | Should -Match 'packaging/wsl/provision-galion-ubuntu.sh'
        $text = [string](Get-GalionAction $plan 'write-wslconfig')['Text']
        $text | Should -Match 'debugConsole=true'
        $text | Should -Not -Match 'memory='
        $text | Should -Not -Match 'processors='
        foreach ($act in @($plan.Actions | Where-Object { [string]$_['Kind'] -eq 'env' })) {
            [string]$act['Value'] | Should -Match '^G:\\galion\\'
        }
        ($plan.Notes -join "`n") | Should -Match '8797'
        ($plan.Notes -join "`n") | Should -Match '127\.0\.0\.1:7881'
    }

    It 'skips the download when the cached hash matches and skips import when the distro is already there' {
        $facts = New-GalionHealthyFacts
        $facts.RootfsHashMatch = $true
        $cached = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        (Get-GalionActionIds $cached) | Should -Contain 'skip-download'
        (Get-GalionActionIds $cached) | Should -Not -Contain 'download'

        $facts.GalionBasePath = '\\?\G:\galion\wsl\Galion-Ubuntu'
        $present = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        (Get-GalionActionIds $present) | Should -Contain 'skip-import'
        (Get-GalionActionIds $present) | Should -Not -Contain 'import'
    }

    It 'runs provision again on repair without importing over the distro' {
        $facts = New-GalionHealthyFacts
        $facts.RootfsHashMatch = $true
        $facts.GalionBasePath = 'G:\galion\wsl\Galion-Ubuntu'
        $facts.Provisioned = $true
        $facts.ObsidianInstalled = $true
        $facts.VoiceInstalled = $true
        $facts.Repair = $true
        $plan = Get-GalionUbuntuPlan -Facts $facts -Pins $script:Pins
        $ids = Get-GalionActionIds $plan
        $ids | Should -Contain 'provision'
        $ids | Should -Contain 'obsidian'
        $ids | Should -Contain 'voice'
        $ids | Should -Not -Contain 'import'
        $ids | Should -Not -Contain 'unregister'
    }

    It 'stops when the machine is not ready' {
        $low = New-GalionHealthyFacts
        $low.FreeBytes = [int64]100
        $lowPlan = Get-GalionUbuntuPlan -Facts $low -Pins $script:Pins
        $lowPlan.ExitCode | Should -Be 1
        ($lowPlan.Notes -join "`n") | Should -Match 'refused: G: free bytes'

        $missing = New-GalionHealthyFacts
        $missing.DriveReady = $false
        (Get-GalionUbuntuPlan -Facts $missing -Pins $script:Pins).ExitCode | Should -Be 1

        $admin = New-GalionHealthyFacts
        $admin.IsAdmin = $false
        ((Get-GalionUbuntuPlan -Facts $admin -Pins $script:Pins).Notes -join "`n") | Should -Match 'refused: PowerShell is not running as Administrator'

        $wsl = New-GalionHealthyFacts
        $wsl.Wsl2 = $false
        ((Get-GalionUbuntuPlan -Facts $wsl -Pins $script:Pins).Notes -join "`n") | Should -Match 'refused: WSL2 is not the default version'

        $root = New-GalionHealthyFacts
        $root.GalionRoot = 'C:\galion'
        ((Get-GalionUbuntuPlan -Facts $root -Pins $script:Pins).Notes -join "`n") | Should -Match 'refused: Galion root must be G:\\galion'

        $busy = New-GalionHealthyFacts
        $busy.InstallDirNonEmpty = $true
        (Get-GalionUbuntuPlan -Facts $busy -Pins $script:Pins).ExitCode | Should -Be 1
    }
}

Describe 'executor' {
    It 'does not call runners during a dry run' {
        $plan = Get-GalionUbuntuPlan -Facts (New-GalionHealthyFacts) -Pins $script:Pins
        $script:Hits = 0
        $runners = @{
            MakeDirectory = { $script:Hits++ }
            SetEnv        = { $script:Hits++ }
            Command       = { $script:Hits++; 0 }
            WriteText     = { $script:Hits++ }
        }
        $code = Invoke-GalionUbuntuPlan -Plan $plan -Runners $runners -DryRun
        $code | Should -Be 0
        $script:Hits | Should -Be 0
    }

    It 'refuses a large write, a shutdown, and an unregister of another name' {
        $script:Hits = 0
        $runners = @{
            WriteText = { $script:Hits++ }
            Command   = { $script:Hits++; 0 }
        }
        $write = [pscustomobject]@{
            ExitCode = 0
            Notes    = @()
            Actions  = @(@{ Id = 'bad'; Kind = 'write'; Path = 'C:\Users\x\big.vhdx'; Text = ('x' * 80000); Profile = 'C:\Users\x' })
        }
        (Invoke-GalionUbuntuPlan -Plan $write -Runners $runners) | Should -Be 1
        $stop = [pscustomobject]@{
            ExitCode = 0
            Notes    = @()
            Actions  = @(@{ Id = 'bad'; Kind = 'command'; Arguments = @('wsl.exe', '--shutdown') })
        }
        (Invoke-GalionUbuntuPlan -Plan $stop -Runners $runners) | Should -Be 1
        $other = [pscustomobject]@{
            ExitCode = 0
            Notes    = @()
            Actions  = @(@{ Id = 'bad'; Kind = 'command'; Arguments = @('wsl.exe', '--unregister', 'Ubuntu') })
        }
        (Invoke-GalionUbuntuPlan -Plan $other -Runners $runners) | Should -Be 1
        $script:Hits | Should -Be 0
    }
}

Describe 'profile snapshot and verify report' {
    It 'allows only a small new or changed .wslconfig' {
        $before = "Desktop`t0`nnotes.txt`t10`n"
        $vhdx = Compare-GalionUserProfileSnapshot $before "Desktop`t0`nnotes.txt`t10`nbig.vhdx`t99`n"
        $vhdx | Should -Contain 'new path: big.vhdx'
        $huge = Compare-GalionUserProfileSnapshot $before ".wslconfig`t65536`nDesktop`t0`nnotes.txt`t10`n"
        $huge | Should -Contain 'new path: .wslconfig'
        $resized = Compare-GalionUserProfileSnapshot $before "Desktop`t0`nnotes.txt`t11`n"
        $resized | Should -Contain 'resized: notes.txt'
        $ok = @(Compare-GalionUserProfileSnapshot $before "Desktop`t0`nnotes.txt`t10`n.wslconfig`t40`n")
        $ok.Count | Should -Be 0
        $changed = @(Compare-GalionUserProfileSnapshot ".wslconfig`t10`n" ".wslconfig`t20`n")
        $changed.Count | Should -Be 0
        (Compare-GalionUserProfileSnapshot '' "notes.txt`t1`n") | Should -Contain 'snapshot missing'
    }

    It 'accepts a healthy inside report and rejects a dead voice port' {
        $good = @"
systemd=degraded
display=:0
wayland=
pulse=
pulse_socket=yes
obsidian_version=openmind-desktop 0.1
obsidian_exit=0
obsidian_http=200
voice_http=200
voice_bytes=12
"@
        @(Get-GalionVerifyFailures $good).Count | Should -Be 0
        $dead = $good -replace 'voice_http=200', 'voice_http=000' -replace 'voice_bytes=12', 'voice_bytes=0'
        $failures = @(Get-GalionVerifyFailures $dead)
        ($failures -join "`n") | Should -Match '7881'
    }
}

Describe 'pins and the Windows entry' {
    It 'keeps the Ubuntu rootfs hash that SHA256SUMS published' {
        $script:Pins.GALION_UBUNTU_WSL_SHA256 | Should -Be 'bb415d824822c4b878125729af451a5d18fb13d1cf5cbed9a7393ad64ac6039e'
        $script:Pins.GALION_RESEARCH_PORT | Should -Be '8797'
        $script:Pins.GALION_HORBM_PREVIEW_PORT | Should -Be '8787'
        (Test-GalionWsl2StatusText "Default Version: 2`n") | Should -BeTrue
        (Test-GalionWsl2StatusText "Default Version: 1`n") | Should -BeFalse
        $spaced = (([char[]]'Default Version: 2') | ForEach-Object { "$_ " }) -join ''
        (Test-GalionWsl2StatusText $spaced) | Should -BeTrue
        (Get-Content -Raw (Join-Path $PSScriptRoot '..\Install-GalionUbuntuOnG.cmd')) | Should -Match 'Install-GalionUbuntuOnG\.ps1'
    }

    It 'prints a dry-run plan on this host and refuses a real run' {
        (Test-GalionHostWindows) | Should -BeFalse
        (Get-GalionLiveFacts -RepoRoot (Join-Path $PSScriptRoot '..\..\..\..')) | Should -BeNullOrEmpty
        $code = Start-GalionUbuntuInstall -DryRun
        $code | Should -Be 0
        $real = Start-GalionUbuntuInstall
        $real | Should -Be 1
    }
}
