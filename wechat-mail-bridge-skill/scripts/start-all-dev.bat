@echo off
setlocal
call "%~dp0init-local-configs.bat" || exit /b 1
start "wechat-mail-bridge-plugin" cmd /k "\"%~dp0start-plugin-dev.bat\""
start "wechat-mail-bridge-sidecar" cmd /k "\"%~dp0start-sidecar-dev.bat\""
