# wechat-mail-bridge

Use this skill when handling WeChat group mail-query workflows.

## Supported deterministic commands

- `/mail someone@example.com`
- `查邮箱 someone@example.com`
- `/watch someone@example.com 300`
- `/mail-watch someone@example.com 300`
- `监控 someone@example.com 300`
- `/mail-health`
- `/mail-bind list`
- `/mail-bind set <alias>`
- `/mail-bind get <alias>`
- `/mail-bind del <alias>`
- `/mail-pause`
- `/mail-resume`
- `/mail-flush`
- `/mail-last someone@example.com`

## Behavior

- Prefer deterministic parsing first.
- Ask for clarification only when input is ambiguous (for example multiple emails).
- Keep replies concise and operational in group context.
- Do not expose secrets, tokens, or raw credentials.

## When to call plugin tooling

Use plugin bridge routes/tooling when:

- user asks for latest mail for one email
- user asks to watch for a new matching mail for a bounded timeout
- BHMailer webhook payload needs routing into a target group

Manual tool endpoint:

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
