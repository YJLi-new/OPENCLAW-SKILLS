@echo off
setlocal
call "%~dp0init-local-configs.bat" || exit /b 1
set "SIDECAR_CFG=%~dp0..\runtime-config\windows-sidecar.toml"
cd /d "%~dp0..\windows-sidecar" || exit /b 1
py -3.11 -m pip install -e .[uiautomation,visual] || exit /b 1
oc-wx-sidecar --config "%SIDECAR_CFG%"
