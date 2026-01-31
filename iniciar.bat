@echo off
cd /d "%~dp0"
echo Iniciando servidor...
call npm.cmd run dev
if errorlevel 1 echo. & echo Alternativa: abre index.html con doble clic.
pause
