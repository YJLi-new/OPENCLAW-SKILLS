# Operator curl examples

Base assumptions:

- Plugin base URL: `http://127.0.0.1:8787`
- Shared secret: same value as `BRIDGE_SHARED_SECRET`

```bash
export BASE_URL="http://127.0.0.1:8787"
export BRIDGE_SECRET="dev-bridge-secret"
```

## Bearer auth + nonce (recommended)

`GET /api/v1/admin/health/detail`:

```bash
TS=$(date +%s)
NONCE=$(uuidgen | tr -d '-')
curl -sS "$BASE_URL/api/v1/admin/health/detail" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE"
```

`POST /api/v1/admin/jobs/status-counts`:

```bash
TS=$(date +%s)
NONCE=$(uuidgen | tr -d '-')
curl -sS -X POST "$BASE_URL/api/v1/admin/jobs/status-counts" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "content-type: application/json" \
  -d '{}'
```

`POST /api/v1/admin/commands/list`:

```bash
TS=$(date +%s)
NONCE=$(uuidgen | tr -d '-')
curl -sS -X POST "$BASE_URL/api/v1/admin/commands/list" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "content-type: application/json" \
  -d '{"limit":20,"status":"queued"}'
```

`POST /api/v1/admin/bindings/resolve`:

```bash
TS=$(date +%s)
NONCE=$(uuidgen | tr -d '-')
curl -sS -X POST "$BASE_URL/api/v1/admin/bindings/resolve" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "content-type: application/json" \
  -d '{"target":"ops"}'
```

## HMAC auth example

Example for `POST /api/v1/sidecar/commands/claim`:

```bash
TS=$(date +%s)
NONCE=$(uuidgen | tr -d '-')
BODY='{"sidecarId":"winbox-01","limit":5}'
CANON=$(printf '%s' "$BODY" | jq -cS '.')
SIG=$(printf '%s.%s' "$TS" "$CANON" | openssl dgst -sha256 -hmac "$BRIDGE_SECRET" -binary | xxd -p -c 256)

curl -sS -X POST "$BASE_URL/api/v1/sidecar/commands/claim" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "x-bridge-signature: $SIG" \
  -H "content-type: application/json" \
  -d "$CANON"
```

## Replay check behavior

- If `x-bridge-nonce` is reused with the same secret in the auth window, plugin returns `401` with `replayed_nonce`.
- If nonce is omitted, bearer/HMAC still works (timestamp checks still apply when enabled).

## Push-mode roundtrip (watch + webhook)

Start watch:

```bash
TS=$(date +%s); NONCE=$(uuidgen | tr -d '-')
curl -sS -X POST "$BASE_URL/api/v1/sidecar/events" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "content-type: application/json" \
  -d '{
    "eventId":"evt_watch_001",
    "source":"windows-sidecar",
    "sidecarId":"winbox-01",
    "platform":"wechat-desktop",
    "chatType":"group",
    "chatId":"ops-group-001",
    "chatName":"Ops Group",
    "messageId":"msg_watch_001",
    "messageText":"/watch someone@example.com 120",
    "messageTime":"2026-03-09T00:00:00Z",
    "observedAt":"2026-03-09T00:00:00Z"
  }'
```

Post webhook result:

```bash
TS=$(date +%s); NONCE=$(uuidgen | tr -d '-')
curl -sS -X POST "$BASE_URL/api/v1/bhmailer/webhook" \
  -H "Authorization: Bearer $BRIDGE_SECRET" \
  -H "x-bridge-ts: $TS" \
  -H "x-bridge-nonce: $NONCE" \
  -H "content-type: application/json" \
  -d '{
    "matchedEmail":"someone@example.com",
    "subject":"OTP code",
    "from":"no-reply@example.com",
    "receivedAt":"2026-03-09T00:00:10Z",
    "bodyPreview":"Your verification code is 123456",
    "extractedFields":{"code":"123456"}
  }'
```
