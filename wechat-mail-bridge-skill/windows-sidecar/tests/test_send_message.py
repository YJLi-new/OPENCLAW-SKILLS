from __future__ import annotations

from typing import Any

from oc_wx_bridge.models import OutboundCommand
from oc_wx_bridge.send_message import process_outbound_once


def _command(command_id: str) -> OutboundCommand:
    return OutboundCommand.model_validate(
        {
            "commandId": command_id,
            "chatId": "chat-1",
            "chatName": "Ops Group",
            "replyToMessageId": "msg-1",
            "text": "hello",
            "createdAt": "2026-03-09T00:00:00Z",
        }
    )


class _FakeAdapter:
    def __init__(self, fail_times: int) -> None:
        self.fail_times = fail_times
        self.calls = 0

    def send_text(self, chat_id: str, text: str) -> None:
        self.calls += 1
        if self.calls <= self.fail_times:
            raise RuntimeError("send-failed")


class _FakeBridgeClient:
    def __init__(self, commands: list[OutboundCommand]) -> None:
        self._commands = commands
        self.acks: list[dict[str, Any]] = []

    def claim_commands(self, sidecar_id: str, limit: int) -> list[OutboundCommand]:
        return self._commands[:limit]

    def ack_command(
        self,
        command_id: str,
        sidecar_id: str,
        status: str,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        self.acks.append(
            {
                "command_id": command_id,
                "sidecar_id": sidecar_id,
                "status": status,
                "error_code": error_code,
                "error_message": error_message,
            }
        )
        return {"ok": True}


def test_send_retries_then_ack_sent() -> None:
    adapter = _FakeAdapter(fail_times=1)
    bridge = _FakeBridgeClient(commands=[_command("cmd-1")])

    process_outbound_once(
        adapter=adapter,  # type: ignore[arg-type]
        bridge_client=bridge,  # type: ignore[arg-type]
        sidecar_id="winbox-01",
        claim_batch_size=5,
        send_max_attempts=2,
    )

    assert adapter.calls == 2
    assert len(bridge.acks) == 1
    assert bridge.acks[0]["status"] == "sent"


def test_send_fails_after_retries_and_ack_failed() -> None:
    adapter = _FakeAdapter(fail_times=5)
    bridge = _FakeBridgeClient(commands=[_command("cmd-2")])

    process_outbound_once(
        adapter=adapter,  # type: ignore[arg-type]
        bridge_client=bridge,  # type: ignore[arg-type]
        sidecar_id="winbox-01",
        claim_batch_size=5,
        send_max_attempts=2,
    )

    assert adapter.calls == 2
    assert len(bridge.acks) == 1
    assert bridge.acks[0]["status"] == "failed"
    assert bridge.acks[0]["error_code"] == "send_error"
