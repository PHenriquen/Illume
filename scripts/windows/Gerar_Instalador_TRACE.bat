@echo off
setlocal
title TRACE AI - Gerar instalador
cd /d "%~dp0\..\.."

where node >nul 2>nul || goto :missing_node
where npm >nul 2>nul || goto :missing_node

call npm ci --no-audit --no-fund || goto :failure
call npm run check || goto :failure
call npm run desktop:installer || goto :failure

start "" explorer "release"
exit /b 0

:missing_node
echo Node.js 22 ou superior nao foi encontrado.
echo Instale a versao LTS e execute este arquivo novamente.
pause
exit /b 1

:failure
echo.
echo Nao foi possivel gerar o instalador.
pause
exit /b 1
