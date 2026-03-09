# Release checklist

1. Confirm `README`, `docs/install.md`, `docs/config.md`, `docs/api.md` are current.
2. Confirm support matrix and limitations match actual adapter capabilities.
3. Run plugin and sidecar tests in CI.
4. Smoke test:
   - sidecar event ingest
   - mail query result queue
   - sidecar claim/ack
   - webhook push flow (if enabled)
   - optional local rehearsal via `npm run fake:bhmailer` and `npm run smoke:event`
5. Tag release and update `CHANGELOG.md`.
6. Publish plugin package and sidecar artifact strategy for target users.
