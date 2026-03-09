# BHMailer Rule Examples

## OTP extraction profile

Suggested extracted fields:

- `subject`
- `from`
- `receivedAt`
- `code`
- `bodyPreview`

Adapter behavior:

- Base query (`mailFind`/`checkMail`/`mailReceive`) is normalized first.
- For non-`default` profiles, plugin attempts `mailExtract` enrichment by `mailId`.
- Webhook payload may use `targetChatId`; if absent, `targetChatName` can map via group bindings.

## Push callback payload recommendation

```json
{
  "matchedEmail": "someone@example.com",
  "subject": "Your verification code",
  "from": "no-reply@example.com",
  "receivedAt": "2026-03-09T12:00:15Z",
  "bodyPreview": "Your single-use code is 123456.",
  "code": "123456",
  "chatId": "wechat-group-opaque-id",
  "chatName": "Ops Group"
}
```
