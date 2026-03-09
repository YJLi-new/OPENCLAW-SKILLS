from __future__ import annotations

from typing import Any

import requests

from oc_wx_bridge.bridge_client import BridgeClient
from oc_wx_bridge.config import BridgeConfig


class _FakeResponse:
    def __init__(self, payload: dict[str, Any], status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def json(self) -> dict[str, Any]:
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"http_{self.status_code}", response=self)


class _FakeSession:
    def __init__(self, status_code: int = 200, payload: dict[str, Any] | None = None) -> None:
        self.calls: list[dict[str, Any]] = []
        self._status_code = status_code
        self._payload = payload or {"ok": True}

    def request(
        self,
        method: str,
        url: str,
        json: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        timeout: int | None = None,
    ) -> _FakeResponse:
        self.calls.append(
            {
                "method": method,
                "url": url,
                "json": json,
                "headers": headers or {},
                "timeout": timeout,
            }
        )
        return _FakeResponse(self._payload, status_code=self._status_code)


def _make_client(auth_mode: str, session: _FakeSession | None = None) -> tuple[BridgeClient, _FakeSession]:
    client = BridgeClient(
        BridgeConfig(
            base_url="http://127.0.0.1:8787",
            shared_secret="secret",
            auth_mode=auth_mode,
            request_timeout_sec=10,
            claim_batch_size=5,
            send_poll_interval_sec=2,
            heartbeat_interval_sec=15,
        )
    )
    session = session or _FakeSession()
    client._session = session  # type: ignore[attr-defined]
    return client, session


def test_ack_command_uses_authenticated_request_bearer() -> None:
    client, session = _make_client("bearer")

    payload = client.ack_command(
        command_id="cmd_1",
        sidecar_id="winbox-01",
        status="sent",
    )

    assert payload["ok"] is True
    assert len(session.calls) == 1
    call = session.calls[0]
    assert call["method"] == "POST"
    assert call["url"].endswith("/api/v1/sidecar/commands/cmd_1/ack")
    assert call["json"] == {"sidecarId": "winbox-01", "status": "sent"}
    assert call["headers"]["Authorization"] == "Bearer secret"
    assert call["headers"]["x-bridge-ts"]
    assert call["headers"]["x-bridge-nonce"]


def test_ack_command_uses_authenticated_request_hmac() -> None:
    client, session = _make_client("hmac")

    payload = client.ack_command(
        command_id="cmd_2",
        sidecar_id="winbox-02",
        status="failed",
        error_code="send_error",
        error_message="boom",
    )

    assert payload["ok"] is True
    assert len(session.calls) == 1
    call = session.calls[0]
    assert call["method"] == "POST"
    assert call["json"] == {
        "sidecarId": "winbox-02",
        "status": "failed",
        "errorCode": "send_error",
        "errorMessage": "boom",
    }
    assert "Authorization" not in call["headers"]
    assert call["headers"]["x-bridge-signature"]
    assert call["headers"]["x-bridge-ts"]
    assert call["headers"]["x-bridge-nonce"]


def test_no_retry_on_4xx_http_error() -> None:
    error_session = _FakeSession(status_code=401, payload={"ok": False, "error": "unauthorized"})
    client, session = _make_client("bearer", session=error_session)

    raised = False
    try:
        client.ack_command(
            command_id="cmd_3",
            sidecar_id="winbox-03",
            status="sent",
        )
    except requests.HTTPError:
        raised = True

    assert raised is True
    assert len(session.calls) == 1
