@echo off
setlocal
call "%~dp0init-local-configs.bat" || exit /b 1
cd /d "%~dp0..\plugin" || exit /b 1
call npm install || exit /b 1
