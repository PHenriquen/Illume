@echo off
setlocal
title Noa - Instalacao completa
cd /d "%~dp0\..\.."
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Install-NoaComplete.ps1" %*
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo A instalacao completa da Noa nao foi concluida.
echo Leia a mensagem acima antes de fechar esta janela.
pause
exit /b 1
