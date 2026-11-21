@echo off
rem Galion archive preview. Serves this folder on 127.0.0.1 only.
rem Usage: START-PREVIEW.cmd
rem        START-PREVIEW.cmd 8790
cd /d "%~dp0"
set PORT=8790
if not "%~1"=="" set PORT=%~1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-preview.ps1" -Port %PORT%
