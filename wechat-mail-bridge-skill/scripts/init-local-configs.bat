@echo off
setlocal
set "ROOT=%~dp0.."
set "PLUGIN_ENV=%ROOT%\plugin\.env"
set "PLUGIN_ENV_EXAMPLE=%ROOT%\config\plugin\.env.example"
set "PLUGIN_JSON=%ROOT%\runtime-config\openclaw.plugin.json"
set "PLUGIN_JSON_EXAMPLE=%ROOT%\config\plugin\openclaw.plugin.example.json"
set "SIDECAR_CFG=%ROOT%\runtime-config\windows-sidecar.toml"
set "SIDECAR_CFG_EXAMPLE=%ROOT%\config\windows-sidecar.example.toml"

if not exist "%ROOT%\runtime-config" mkdir "%ROOT%\runtime-config" || exit /b 1

if not exist "%PLUGIN_ENV%" (
  copy /Y "%PLUGIN_ENV_EXAMPLE%" "%PLUGIN_ENV%" >nul || exit /b 1
)

if not exist "%PLUGIN_JSON%" (
  copy /Y "%PLUGIN_JSON_EXAMPLE%" "%PLUGIN_JSON%" >nul || exit /b 1
)

if not exist "%SIDECAR_CFG%" (
  copy /Y "%SIDECAR_CFG_EXAMPLE%" "%SIDECAR_CFG%" >nul || exit /b 1
)

echo Local config files are ready.
echo - Edit plugin\.env
echo - Edit runtime-config\openclaw.plugin.json
echo - Edit runtime-config\windows-sidecar.toml
