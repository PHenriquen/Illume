@echo off
setlocal
title TRACE AI - Preparar inteligencia local
cd /d "%~dp0\..\.."

where ollama >nul 2>nul || goto :missing_ollama
ollama pull qwen3.5:2b-q4_K_M || goto :failure

echo Modelo local preparado.
exit /b 0

:missing_ollama
echo Ollama nao foi encontrado. Instale-o e tente novamente.
pause
exit /b 1

:failure
echo Nao foi possivel preparar o modelo local.
pause
exit /b 1
