---
name: wechat-mail-bridge
description: Windows-side OpenClaw release bundle for the WeChat-to-mail bridge plugin, sidecar, configs, and operator docs.
---

# WeChat Mail Bridge

Public release bundle for the plugin-first OpenClaw extension that connects WeChat commands to BHMailer-backed mail query workflows.

## Included content

- `plugin/`: OpenClaw plugin source, tests, smoke scripts, Dockerfile, config examples, and bundled operator skill.
- `windows-sidecar/`: Windows-local sidecar source, tests, adapter implementations, and executable build script.
- `docs/`: install, config, API, operations, architecture, limitations, threat model, and support docs.
- `examples/`: plugin config examples, sidecar config examples, docker-compose sample, and BHMailer rule examples.
- `scripts/`: Windows batch helpers for install, start, probe, and sidecar EXE build.

## Core operator commands

- `/mail <address>` or `查邮箱 <address>`: query a mailbox immediately.
- `/watch <address>` or `/mail-watch <address>`: bind mailbox watch mode.
- `/mail-bind <address>`: alias for binding a mailbox to the current chat.
- `/mail-last`: show latest bound mailbox result.
- `/mail-health`: surface plugin and sidecar health.
- `/mail-pause`, `/mail-resume`, `/mail-flush`: control pending delivery behavior.

## Packaging rules

- This release bundle is intended for Windows-side OpenClaw deployment, not Codex-only installation metadata.
- No host-specific paths, personal chat targets, live tokens, or private runtime databases are included.
- Secrets must be supplied through environment variables or local config files outside version control.

## Recommended starting points

1. Read `README.md` for the end-to-end architecture.
2. Use `docs/install.md` and `docs/config.md` to bring up the plugin.
3. Use `windows-sidecar/README.md` and `examples/windows-sidecar.example.toml` to bring up the sidecar.
4. Use `scripts/start-plugin-dev.bat` and `scripts/start-sidecar-dev.bat` for Windows-local development.
5. Use `scripts/start-sidecar-real-filehelper.bat` when you want the sidecar pointed at the real File Transfer Assistant test config.
