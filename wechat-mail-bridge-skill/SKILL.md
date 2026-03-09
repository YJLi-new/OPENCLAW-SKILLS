---
name: wechat-mail-bridge
description: Use this skill for Windows-side OpenClaw WeChat to mail-query bridge workflows, including parsing `/mail` and `/watch` style commands, extracting a single target email, and using bridge routes to inspect jobs, commands, receipts, bindings, and watches without exposing secrets.
---

Use this skill when handling Windows-side OpenClaw WeChat group mail-query workflows.

## Supported commands

- `/mail someone@example.com`
- `查邮箱 someone@example.com`
- `/watch someone@example.com 300`
- `/mail-watch someone@example.com 300`
- `监控 someone@example.com 300`
- `/mail-last someone@example.com`
- `/mail-health`
- `/mail-bind list`
- `/mail-bind set <alias>`
- `/mail-bind get <alias>`
- `/mail-bind del <alias>`
- `/mail-pause`
- `/mail-resume`
- `/mail-flush`

## Workflow

1. Prefer deterministic parsing first.
2. Extract exactly one target email. If input contains multiple candidate emails, ask the user to choose one.
3. Use latest-mail query flow for `/mail`, `查邮箱`, and `/mail-last`.
4. Use bounded watch flow for `/watch`, `/mail-watch`, and `监控`.
5. Keep group replies concise and operational.
6. Do not expose secrets, tokens, raw credentials, or unnecessary raw mail content.
7. Assume the OpenClaw plugin and Windows sidecar are already installed and configured; this skill should not embed host-specific secrets or paths.

## Bridge routes and tooling

Use the bridge tool or admin routes when you need to query status or drive the workflow directly:

- `POST /api/v1/tools/wechat_mail_bridge_query`
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

## Operational guardrails

- Prefer deterministic command handling over free-form interpretation.
- Treat bare email messages as ambiguous unless the surrounding workflow clearly expects passive trigger mode.
- For status checks, summarize the current job/watch state instead of dumping full raw records.
- If a backend or sidecar is unhealthy, report the specific failed component and the next corrective action.
