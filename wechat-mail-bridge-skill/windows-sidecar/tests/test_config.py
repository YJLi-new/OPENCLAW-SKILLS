from pathlib import Path

from oc_wx_bridge.config import load_config


def test_load_config(tmp_path: Path) -> None:
    config_file = tmp_path / "sidecar.toml"
    config_file.write_text(
        """
sidecar_id = "winbox-01"
adapter = "mock"
allow_groups = ["Ops Group"]

[bridge]
base_url = "http://127.0.0.1:8787"
shared_secret = "secret"
request_timeout_sec = 10
claim_batch_size = 3
send_poll_interval_sec = 2
""".strip(),
        encoding="utf-8",
    )

    cfg = load_config(config_file)
    assert cfg.sidecar_id == "winbox-01"
    assert cfg.adapter == "mock"
    assert cfg.bridge.claim_batch_size == 3
    assert cfg.bridge.auth_mode == "bearer"
    assert cfg.bridge.heartbeat_interval_sec == 15
    assert cfg.webhook_proxy.enabled is False
    assert cfg.webhook_proxy.inbound_secret == "local-webhook-secret"
    assert cfg.diagnostics.enabled is True


def test_invalid_auth_mode_falls_back_to_bearer(tmp_path: Path) -> None:
    config_file = tmp_path / "sidecar_bad_auth.toml"
    config_file.write_text(
        """
sidecar_id = "winbox-01"
adapter = "mock"

[bridge]
base_url = "http://127.0.0.1:8787"
shared_secret = "secret"
auth_mode = "invalid"
""".strip(),
        encoding="utf-8",
    )

    cfg = load_config(config_file)
    assert cfg.bridge.auth_mode == "bearer"


def test_empty_inbound_secret_disables_proxy_secret_check(tmp_path: Path) -> None:
    config_file = tmp_path / "sidecar_empty_inbound_secret.toml"
    config_file.write_text(
        """
sidecar_id = "winbox-01"
adapter = "mock"

[bridge]
base_url = "http://127.0.0.1:8787"
shared_secret = "secret"

[webhook_proxy]
enabled = true
inbound_secret = ""
""".strip(),
        encoding="utf-8",
    )

    cfg = load_config(config_file)
    assert cfg.webhook_proxy.enabled is True
    assert cfg.webhook_proxy.inbound_secret is None
