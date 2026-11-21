# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.

# Galion OS one-click start. 127.0.0.1 binds only. Never bind every interface.
# Never stop GalionLaptopLink, GalionShellLink, sshd, or cloudflared.
# Default root is G:\galion. Override with $env:GALION_ROOT.
$ErrorActionPreference = 'Continue'
$GalionRoot = $env:GALION_ROOT
if ([string]::IsNullOrWhiteSpace($GalionRoot)) { $GalionRoot = 'G:\galion' }
$GalionRoot = $GalionRoot.TrimEnd('\')
$Here = $PSScriptRoot
if (-not $Here) { $Here = Split-Path -Parent $MyInvocation.MyCommand.Path }

$env:TEMP = Join-Path $GalionRoot 'tmp\win'
$env:TMP = $env:TEMP
$logDir = Join-Path $GalionRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir, $env:TEMP, (Join-Path $logDir 'openmind') | Out-Null
$log = Join-Path $logDir 'start-galion-os.log'

function Write-Log([string]$msg) {
  $line = '{0} {1}' -f (Get-Date -Format o), $msg
  Add-Content -Path $log -Value $line
  Write-Output $msg
}

function Test-LoopbackListen([int]$Port) {
  return [bool](netstat -ano | Select-String -Pattern "127\.0\.0\.1:$Port\s+.*LISTENING")
}

function ConvertTo-WslPath([string]$WinPath) {
  $p = $WinPath.Replace('\', '/')
  if ($p.Length -ge 2 -and $p[1] -eq ':') {
    return ('/mnt/' + $p.Substring(0, 1).ToLowerInvariant() + $p.Substring(2))
  }
  return $p
}

function Get-WslDistro {
  if ($env:GALION_WSL_DISTRO) { return $env:GALION_WSL_DISTRO }
  return 'Ubuntu'
}

Write-Log 'START-GALION-OS begin'

# Protected processes: never stop or edit these.
$protected = @('GalionLaptopLink','GalionShellLink','sshd','cloudflared')
$seen = @()
foreach ($n in $protected) {
  if (Get-Process -Name $n -ErrorAction SilentlyContinue) { $seen += $n }
}
Write-Log ('protected left running: ' + ($seen -join ', '))

$distro = Get-WslDistro
$rootMnt = ConvertTo-WslPath $GalionRoot
$env:GALION_ROOT_MNT = $rootMnt

# 1) Existing WSL distro (default: Ubuntu). Do not create, delete, or overwrite.
wsl -d $distro --cd /home/galion -- bash -lc 'true' | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Log "FAIL wsl $distro start exit=$LASTEXITCODE" }
else { Write-Log "WSL $distro is running" }

# 2) OpenMind desktop + stack (idempotent; script skips ports already up)
$openmindSh = Join-Path $Here 'wsl-start-openmind.sh'
if (-not (Test-Path $openmindSh)) { $openmindSh = Join-Path $GalionRoot 'tmp\win\wsl-start-openmind.sh' }
if (Test-Path $openmindSh) {
  $openmindWsl = ConvertTo-WslPath $openmindSh
  wsl -d $distro --cd /home/galion -- bash -lc "GALION_ROOT_MNT='$rootMnt' bash '$openmindWsl'"
  Write-Log "openmind start script exit=$LASTEXITCODE"
} else {
  Write-Log "MISSING wsl-start-openmind.sh (looked in $Here and $GalionRoot\tmp\win)"
}

# 3) Knowledge cards read-only on 127.0.0.1:7900 (not 8787 HORBM preview)
if (Test-LoopbackListen 7900) {
  Write-Log 'ALREADY 127.0.0.1:7900 knowledge-ro'
} else {
  $knowPy = Join-Path $Here 'knowledge-ro-server.py'
  if (-not (Test-Path $knowPy)) { $knowPy = Join-Path $GalionRoot 'tmp\win\knowledge-ro-server.py' }
  if (Test-Path $knowPy) {
    $knowWsl = ConvertTo-WslPath $knowPy
    $knowRoot = ConvertTo-WslPath (Join-Path $GalionRoot 'knowledge')
    wsl -d $distro --cd /home/galion -- bash -lc "nohup env KNOWLEDGE_HOST=127.0.0.1 KNOWLEDGE_PORT=7900 KNOWLEDGE_ROOT='$knowRoot' python3 '$knowWsl' >> '$rootMnt/logs/knowledge-ro.log' 2>&1 & echo `$!"
    Write-Log 'launched knowledge-ro 127.0.0.1:7900'
  } else {
    Write-Log 'MISSING knowledge-ro-server.py and 7900 is down'
  }
}

# 4) samantha-local on 7881 if not already running
if (Test-LoopbackListen 7881) {
  Write-Log 'ALREADY 127.0.0.1:7881 samantha-local'
} else {
  $sam = Join-Path $GalionRoot 'work\START-SAMANTHA-7881.cmd'
  if (Test-Path $sam) {
    Start-Process -FilePath $sam -WorkingDirectory (Join-Path $GalionRoot 'work') -WindowStyle Hidden
    Write-Log 'launched START-SAMANTHA-7881.cmd'
  } else {
    Write-Log "MISSING $sam and 7881 is down"
  }
}

# 5) galion-research-gateway on 127.0.0.1:7911 (galion-one-voice, PR #239).
# Idempotent. Loopback only. Does not read a key. Hermes started by the
# OpenMind helper is --mock (no paid calls). Never bind every interface.
if (Test-LoopbackListen 7911) {
  Write-Log 'ALREADY 127.0.0.1:7911 galion-research-gateway'
} else {
  $gw = Join-Path $GalionRoot 'work\target-research-gateway\release\galion-research-gateway'
  if ($env:GALION_RESEARCH_GATEWAY) { $gw = $env:GALION_RESEARCH_GATEWAY }
  if (Test-Path $gw) {
    $gwWsl = ConvertTo-WslPath $gw
    wsl -d $distro --cd /home/galion -- bash -lc "nohup env GALION_RESEARCH_BIND=127.0.0.1:7911 '$gwWsl' >> '$rootMnt/logs/research-gateway.log' 2>&1 & echo `$!"
    Write-Log 'launched galion-research-gateway 127.0.0.1:7911'
  } else {
    Write-Log "MISSING galion-research-gateway binary ($gw); 7911 not started"
  }
}

Start-Sleep -Seconds 2

# 6) Open the OpenMind desktop
$desk = 'http://127.0.0.1:18181/'
if (Test-LoopbackListen 18181) {
  Start-Process $desk
  Write-Log "opened $desk"
} else {
  Write-Log 'FAIL desktop not listening; did not open browser'
}

Write-Log 'START-GALION-OS end'
