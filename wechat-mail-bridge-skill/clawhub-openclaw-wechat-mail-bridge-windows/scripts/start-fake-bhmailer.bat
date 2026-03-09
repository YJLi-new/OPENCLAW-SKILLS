@echo off
setlocal
cd /d "%~dp0..\plugin" || exit /b 1
call npm install || exit /b 1
call npm run fake:bhmailer
