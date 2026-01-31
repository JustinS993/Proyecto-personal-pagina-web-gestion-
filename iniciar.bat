@echo off
cd /d "%~dp0"
echo Iniciando servidor...
call npm.cmd run dev
pause
