# Architecture

## Components

1. OpenClaw plugin (`plugin/`)
2. Bundled skill (`plugin/skills/wechat-mail-bridge/`)
3. Windows sidecar (`windows-sidecar/`)
4. Mail adapter (`plugin/src/adapters/mail/`)

## Core flow

1. Sidecar observes an incoming group message.
2. Sidecar posts normalized event to plugin.
3. Plugin validates + dedupes + parses deterministic trigger.
4. Plugin runs mail query (`findLatest` or `waitForNew`).
5. Plugin formats concise reply and queues outbound command.
6. Sidecar claims pending command and sends message in WeChat group.
7. Sidecar acknowledges delivery result.

If sidecar cannot provide native `messageId`, plugin synthesizes a deterministic fallback id from chat/sender/time/text hash for dedupe.

## Push/webhook watch mode

1. Group command `/watch <email> <seconds>` creates a watch subscription.
2. Plugin keeps watch in SQLite with expiry.
3. BHMailer webhook is deduped and correlated to active watch subscriptions by email.
4. Plugin queues reply commands for matched subscriptions.
5. Background sweeper closes expired watches and queues timeout replies.
6. Maintenance pass also requeues stale claimed outbound commands and prunes old dedupe keys.

Plugin also accepts periodic sidecar heartbeats for operator visibility and health aggregation.

Operator override APIs include monitoring pause/resume, manual rerun, queue flush, and group alias bindings.

## State machine

`CREATED -> PARSED -> QUERYING_HISTORY | WAITING_NEW_MAIL -> MATCHED | NOT_FOUND | TIMEOUT -> REPLY_QUEUED -> REPLY_SENT | REPLY_FAILED -> COMPLETED`

## Security model

- Bearer token auth for sidecar and webhook routes.
- Optional timestamp window check via `x-bridge-ts`.
- Secrets from environment/config only.
