@echo off
setlocal
cd /d "%~dp0\..\.."

taskkill /IM TRACE.exe /F >nul 2>nul
call npm ci --no-audit --no-fund || goto :failure
call npm run check || goto :failure
call npm run build || goto :failure

echo TRACE atualizado e validado.
exit /b 0

:failure
echo Nao foi possivel concluir a atualizacao.
pause
exit /b 1
