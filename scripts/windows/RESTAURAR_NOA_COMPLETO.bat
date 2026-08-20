@echo off
setlocal
cd /d "%~dp0\..\.."
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\windows\powershell\Restore-NoaComplete.ps1" %*
