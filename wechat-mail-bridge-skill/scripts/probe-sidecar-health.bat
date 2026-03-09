@echo off
setlocal
cd /d "%~dp0..\windows-sidecar" || exit /b 1
py -3.11 -m pip install -e .[uiautomation,visual] || exit /b 1
oc-wx-sidecar --config ..\examples\windows-sidecar.example.toml --health-once
