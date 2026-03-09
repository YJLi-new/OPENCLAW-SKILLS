# Install Guide

## Plugin

1. `cd plugin`
2. `npm install`
3. Configure env:
   - `BRIDGE_SHARED_SECRET`
   - `SQLITE_PATH`
   - `MAIL_BACKEND=mock|bhmailer-http`
   - `MAIL_QUERY_MODE=direct-api|push-webhook`
4. Start:
   - `npm run dev`
   - or docker: `docker compose -f examples/docker-compose.plugin-only.yml up --build`

## Sidecar

1. `cd windows-sidecar`
2. `pip install -e .`
   - optional: `pip install -e .[pywinauto]` or `pip install -e .[uiautomation]`
3. Copy `examples/windows-sidecar.example.toml` and edit values.
4. Start:
   - `oc-wx-sidecar --config ../examples/windows-sidecar.example.toml`
   - probe-only: `oc-wx-sidecar --config ../examples/windows-sidecar.example.toml --health-once`

## BHMailer mode

Set plugin env:

- `MAIL_BACKEND=bhmailer-http`
- `BHMAILER_API_BASE`
- `BHMAILER_UID`
- `BHMAILER_SIGN`
- optional `BHMAILER_WEBHOOK_SECRET`

If direct webhook routing is inconvenient, enable sidecar proxy in
`examples/windows-sidecar.example.toml` and send BHMailer callbacks to:

- `http://<windows-host>:28761/bhmailer/webhook`
- include `x-webhook-secret` header (`local-webhook-secret` by default, unless overridden/disabled)

## Windows executable helper

To build a local sidecar `.exe` on Windows, use:

- `powershell -ExecutionPolicy Bypass -File windows-sidecar/scripts/build_exe.ps1`
