@echo off
setlocal EnableExtensions
rem G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
rem Developed and distributed by Galion Labs
rem Perpetual Open MIT License
rem Copyright © 2026 Galion Labs. All rights reserved.
rem The licence text is LICENSE. This file does not restate it.
rem
rem Galion OS one-click start. Loopback only (127.0.0.1).
rem Default root is G:\galion. Override with GALION_ROOT.
if not defined GALION_ROOT set "GALION_ROOT=G:\galion"
set "TEMP=%GALION_ROOT%\tmp\win"
set "TMP=%GALION_ROOT%\tmp\win"
if not exist "%GALION_ROOT%\logs" mkdir "%GALION_ROOT%\logs"
if not exist "%GALION_ROOT%\tmp\win" mkdir "%GALION_ROOT%\tmp\win"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-GALION-OS.ps1" %*
