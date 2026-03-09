# Threat Model

## Assets

- WeChat group message content
- Mail metadata/body preview
- Bridge credentials

## Primary threats

- Unauthorized event injection
- Credential leakage in logs
- Replay of old command/event requests
- Excessive sensitive content retention

## Controls in this implementation

- Bearer token auth on sidecar/webhook routes
- Optional HMAC request signing (`x-bridge-signature`) supported on plugin routes
- Optional timestamp window check (`x-bridge-ts`)
- Optional nonce replay protection (`x-bridge-nonce`) with one-time acceptance in auth window
- Webhook dedupe keys to reduce replay duplicate processing
- Optional local sidecar webhook proxy secret (`x-webhook-secret`) for inbound hardening
- Log minimal payload details in default paths
- Configurable body preview truncation

## Remaining risks

- Desktop UI automation reliability and environment constraints
- User-side BHMailer configuration quality
