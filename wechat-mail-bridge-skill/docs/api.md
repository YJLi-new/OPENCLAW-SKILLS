# API reference (bridge plugin)

Base: plugin HTTP server, default `http://127.0.0.1:8787`.

See also: `docs/curl-examples.md` for ready-to-run operator commands.

Auth:

- Bearer: `Authorization: Bearer <secret>`
- Optional HMAC: `x-bridge-ts`, `x-bridge-signature`
- Optional replay nonce: `x-bridge-nonce` (recommended for sidecar and webhook clients)

## Public/diagnostic

- `GET /health`
- `GET /api/v1/admin/health/detail`

## Sidecar routes

- `POST /api/v1/sidecar/events`
- `POST /api/v1/sidecar/heartbeat`
- `POST /api/v1/sidecar/commands/claim`
- `POST /api/v1/sidecar/commands/:commandId/ack`

## BHMailer

- `POST /api/v1/bhmailer/webhook`

## Admin routes

- `POST /api/v1/admin/watch/list`
- `POST /api/v1/admin/watch/sweep`
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

## Tool helper route

- `POST /api/v1/tools/wechat_mail_bridge_query`
