# WeChat Mail Bridge Release Bundle

This directory is the public Windows-oriented release bundle for the OpenClaw WeChat-to-mail bridge.

## Fastest path

1. Read [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md).
2. Run `scripts\\init-local-configs.bat`.
3. Edit `plugin\\.env` and `runtime-config\\windows-sidecar.toml`.
4. Start with `scripts\\start-plugin-dev.bat` and `scripts\\start-sidecar-dev.bat`.

## User-facing entry points

- `config/`: clean templates to copy from.
- `runtime-config/`: local editable config copies.
- `scripts/`: Windows batch entrypoints for install, start, probe, and build.
- `docs/`: reference documentation.
- `plugin/` and `windows-sidecar/`: full source trees.

## Release packaging rules

- No host-specific paths, private logs, local databases, or machine caches are included.
- Secrets belong in local config or environment variables only.
- The top-level `config/` plus `runtime-config/` layout is the intended starting point for Windows users.

---
# openclaw-wechat-mail-bridge

Plugin-first WeChat group -> mail query -> group reply bridge.

This repository follows the architecture in `PLAN.md`:

- `plugin/`: OpenClaw-facing control plane (TypeScript)
- `windows-sidecar/`: Windows desktop sidecar for WeChat UI automation (Python)
- `examples/`: reference configuration files
- `docs/`: operations, threat model, limitations

See also:

- `docs/config.md` for environment configuration reference
- `docs/sidecar-config.md` for sidecar TOML reference
- `docs/support-matrix.md` for current backend support levels
- `docs/flow-diagram.md` for end-to-end runtime flow
- `docs/api.md` for HTTP endpoint reference
- `docs/curl-examples.md` for operator-ready API command snippets
- `docs/release.md` for publish/release checklist

## Current implementation scope

Implemented in this iteration:

- Plugin skeleton with:
  - config schema loading
  - SQLite state
  - sidecar event ingest route
  - command claim/ack routes
  - webhook route with dedupe and watch-correlation support
  - expired watch sweeper
  - deterministic trigger + email parser
  - reply formatter
  - mock mail adapter and BHMailer HTTP adapter
- Bundled skill at `plugin/skills/wechat-mail-bridge/SKILL.md`
- Sidecar skeleton with:
  - adapter abstraction
  - bridge client auth and API calls
  - inbound watch loop and outbound send loop
  - experimental `pywinauto` and `uiautomation` generic polling + send support
  - mock adapter for local flow testing

## Quick start

1. Configure plugin env:
   - `cp plugin/.env.example plugin/.env` (optional baseline)
   - `BRIDGE_SHARED_SECRET`
   - `SQLITE_PATH`
   - `MAIL_BACKEND=mock` (or `bhmailer-http`)
2. Start plugin service:
   - `cd plugin && npm install && npm run dev`
   - optional docker path: `docker compose -f examples/docker-compose.plugin-only.yml up --build`
3. Configure sidecar:
   - copy `examples/windows-sidecar.example.toml` and set `shared_secret`
4. Start sidecar:
   - `cd windows-sidecar && pip install -e . && oc-wx-sidecar --config ../examples/windows-sidecar.example.toml`

Optional local integration helpers:

- fake BHMailer server: `cd plugin && npm run fake:bhmailer`
- smoke event post: `cd plugin && npm run smoke:event`
- smoke full roundtrip (event -> claim -> ack -> receipts/jobs): `cd plugin && npm run smoke:roundtrip`
- smoke push roundtrip (`/watch` -> webhook -> claim -> ack): `cd plugin && npm run smoke:push-roundtrip`

## API summary

- `GET /health`
- `GET /api/v1/admin/health/detail`
- `POST /api/v1/sidecar/events`
- `POST /api/v1/sidecar/heartbeat`
- `POST /api/v1/sidecar/commands/claim`
- `POST /api/v1/sidecar/commands/:commandId/ack`
- `POST /api/v1/bhmailer/webhook`
- `POST /api/v1/admin/watch/sweep`
- `POST /api/v1/admin/watch/list`
- `POST /api/v1/admin/watch/close`
- `POST /api/v1/admin/commands/flush`
- `POST /api/v1/admin/maintenance/run`
- `POST /api/v1/admin/monitoring/set`
- `GET /api/v1/admin/monitoring/status`
- `POST /api/v1/admin/query/rerun-last`
- `POST /api/v1/admin/receipts/list`
- `POST /api/v1/admin/sidecars/list`
- `POST /api/v1/admin/jobs/list`
- `POST /api/v1/admin/jobs/status-counts`
- `POST /api/v1/admin/commands/list`
- `POST /api/v1/admin/bindings/list`
- `POST /api/v1/admin/bindings/set`
- `POST /api/v1/admin/bindings/delete`
- `POST /api/v1/admin/bindings/resolve`
- `POST /api/v1/tools/wechat_mail_bridge_query`

## In-group command examples

- `/mail someone@example.com`
- `/mail-watch someone@example.com 300`
- `/mail-last someone@example.com`
- `/mail-health`
- `/mail-bind set ops`
- `/mail-bind list`
- `/mail-bind get ops`
- `/mail-flush`

## Notes

- WeChat desktop automation reliability still depends on desktop/UI conditions.
- BHMailer integration is API-first; GUI automation for BHMailer is intentionally not the default path.
- Real OpenClaw integration details can be finalized by aligning `plugin/openclaw.plugin.json` with your exact OpenClaw runtime contract.
- `plugin/openclaw.plugin.json` includes a bridge/wechat/mail/reply/privacy config schema scaffold.
- Sidecar-to-plugin auth supports bearer token, optional HMAC signing mode, and optional one-time nonce header (`x-bridge-nonce`).
- Sidecar local webhook proxy enforces `x-webhook-secret` by default (`local-webhook-secret`, configurable or disable-able).
- Background maintenance includes stale-claim recovery and old operational data pruning.
- Operators should review `docs/compliance.md` before production use.
