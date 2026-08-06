@echo off
setlocal
title Noa - Preparar e criar backup completo
cd /d "%~dp0\..\.."

echo A Noa sera validada, os componentes locais serao preparados
echo e depois sera criado um backup restauravel no seu Desktop.
echo Dados antigos do TRACE serao preservados separadamente.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Install-NoaComplete.ps1"
if errorlevel 1 goto :failure

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Backup-NoaComplete.ps1" %*
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo O backup completo da Noa nao foi concluido.
echo Leia a mensagem acima antes de fechar esta janela.
pause
exit /b 1
