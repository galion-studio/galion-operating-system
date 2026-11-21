@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-GalionUbuntuOnG.ps1" %*
exit /b %ERRORLEVEL%
