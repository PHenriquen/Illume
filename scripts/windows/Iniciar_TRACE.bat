@echo off
setlocal
title TRACE AI - Inicializador local
cd /d "%~dp0\..\.."

where node >nul 2>nul || goto :missing_node
where npm >nul 2>nul || goto :missing_node

set "PYTHON_CMD="
where py >nul 2>nul && set "PYTHON_CMD=py -3"
if not defined PYTHON_CMD where python >nul 2>nul && set "PYTHON_CMD=python"
if not defined PYTHON_CMD goto :missing_python

if not exist "node_modules" call npm ci --no-audit --no-fund || goto :failure
if not exist "dist\index.html" call npm run build || goto :failure

if not exist ".venv\Scripts\python.exe" (
  %PYTHON_CMD% -m venv .venv || goto :failure
)

".venv\Scripts\python.exe" -m backend.launcher
exit /b %errorlevel%

:missing_node
echo Node.js 22 ou superior nao foi encontrado.
pause
exit /b 1

:missing_python
echo Python 3 nao foi encontrado.
pause
exit /b 1

:failure
echo.
echo O TRACE nao conseguiu concluir a preparacao.
pause
exit /b 1
