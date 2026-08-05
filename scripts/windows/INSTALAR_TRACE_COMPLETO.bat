@echo off
setlocal
title TRACE AI - Instalacao completa
cd /d "%~dp0\..\.."
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\Install-TraceComplete.ps1"
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo A instalacao completa nao foi concluida.
echo Leia a mensagem acima antes de fechar esta janela.
pause
exit /b 1
