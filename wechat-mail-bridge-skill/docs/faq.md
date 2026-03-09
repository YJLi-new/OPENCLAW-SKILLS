# FAQ

## Is this skill-only?

No. Runtime logic is plugin-first with a bundled skill.

## Why sidecar on Windows?

Desktop WeChat automation needs local Windows UI access.

## Does it support locked desktop sessions?

Not reliably. This is a known GUI automation limitation.

## Does BHMailer use GUI automation here?

No by default. The primary integration path is HTTP API/webhook.

## Can webhook callbacks be proxied through the sidecar?

Yes. Enable `webhook_proxy` in sidecar config and point BHMailer HTTP POST to the sidecar webhook endpoint.
