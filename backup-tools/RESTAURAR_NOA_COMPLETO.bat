@echo off
setlocal
title Noa - Restaurar backup completo
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore-tools\Restore-NoaComplete.ps1" %*
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo A restauracao da Noa nao foi concluida.
echo Leia a mensagem acima antes de fechar esta janela.
pause
exit /b 1
