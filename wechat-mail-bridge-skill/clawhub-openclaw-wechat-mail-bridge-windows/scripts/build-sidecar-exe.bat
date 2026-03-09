@echo off
setlocal
cd /d "%~dp0..\windows-sidecar" || exit /b 1
powershell -ExecutionPolicy Bypass -File scripts\build_exe.ps1
