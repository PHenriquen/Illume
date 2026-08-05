@echo off
setlocal
title TRACE AI - Preparar e criar backup completo
cd /d "%~dp0\..\.."

echo O TRACE sera validado, os componentes locais serao preparados
echo e depois sera criado um backup restauravel no seu Desktop.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Install-TraceComplete.ps1"
if errorlevel 1 goto :failure

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Backup-TraceComplete.ps1"
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo O backup completo nao foi concluido.
echo Leia a mensagem acima antes de fechar esta janela.
pause
exit /b 1
