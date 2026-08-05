@echo off
setlocal
title TRACE AI - Restaurar backup completo
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore-tools\Restore-TraceComplete.ps1"
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo A restauracao nao foi concluida.
pause
exit /b 1
