param(
  [string]$OutputDir = "dist"
)

python -m pip install pyinstaller
pyinstaller `
  --onefile `
  --name oc-wx-sidecar `
  --distpath $OutputDir `
  -m oc_wx_bridge.main

Write-Host "Built executable in $OutputDir"

