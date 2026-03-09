---
name: openclaw-wechat-mail-bridge-windows
description: Install, configure, run, and troubleshoot the Windows/OpenClaw WeChat-to-mail bridge bundle, including the OpenClaw plugin and Windows sidecar.
homepage: https://github.com/YJLi-new/OPENCLAW-SKILLS/tree/main/wechat-mail-bridge-skill
metadata: {"openclaw":{"emoji":"📬","homepage":"https://github.com/YJLi-new/OPENCLAW-SKILLS/tree/main/wechat-mail-bridge-skill"}}
---

# OpenClaw WeChat Mail Bridge (Windows)

Use this skill when the user wants to install, configure, run, package, or troubleshoot the WeChat-to-mail bridge on OpenClaw with a Windows WeChat sidecar.

## Read these files first

- First-time setup: `{baseDir}/references/install-windows.md`
- Plugin config reference: `{baseDir}/references/config.md`
- Sidecar config reference: `{baseDir}/references/sidecar-config.md`
- Runtime and operational checks: `{baseDir}/references/operations.md`

## User-facing resources in this bundle

- Config templates: `{baseDir}/config/`
- Windows helper scripts: `{baseDir}/scripts/`
- Shipped plugin release tree: `{baseDir}/bundle/plugin/`
- Shipped Windows sidecar release tree: `{baseDir}/bundle/windows-sidecar/`

## Working rules

- Start from the files inside this bundle instead of assuming host-specific paths.
- Keep secrets in local config or environment variables, never in the skill files.
- Treat WeChat desktop automation as Windows-local and the plugin control plane as OpenClaw-side.
- Prefer the top-level `scripts/*.bat` entry points for local Windows setup.
- If the user asks for deeper implementation detail, inspect the shipped source under `bundle/`.

## Common operator intents

- Bring up the bridge locally.
- Prepare or edit sidecar/plugin config.
- Build the Windows sidecar executable.
- Debug plugin-side or sidecar-side startup issues.
- Review supported WeChat mail commands such as `/mail`, `/watch`, `/mail-health`, and related control commands.
