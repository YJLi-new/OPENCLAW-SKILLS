@echo off
setlocal
cd /d "%~dp0..\plugin" || exit /b 1
if not exist ".env" if exist ".env.example" (
  copy /Y ".env.example" ".env" >nul
  echo Created plugin\.env from .env.example. Review secret values before real use.
)
call npm install || exit /b 1
call npm run dev
