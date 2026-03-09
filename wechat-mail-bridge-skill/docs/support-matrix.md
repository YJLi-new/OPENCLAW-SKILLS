# Support matrix

## Plugin runtime

- Linux: supported
- macOS: supported
- WSL2: supported
- Remote host: supported (with sidecar outbound access)

## Sidecar

- Windows 11 + Python 3.11+: supported target
- `mock` adapter: implemented
- `pywinauto` adapter: experimental (best-effort send + generic inbound polling)
- `uiautomation` adapter: experimental (best-effort send + generic inbound polling)

## Mail adapter

- `mock`: implemented
- `bhmailer-http`: implemented (API-first)
- BHMailer GUI fallback: not implemented as default path
