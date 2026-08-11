"""Security primitives for Noa's local action pipeline.

This module is intentionally dependency-free so it can run in the local core.
It provides scoped action authorization and a tamper-evident audit trail using
HMAC signatures. It does not replace OS sandboxing; it is one layer in a
defense-in-depth model.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from hashlib import sha256
import hmac
import json
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class ActionRequest:
    action: str
    resource: str = ""
    risk: str = "low"


@dataclass(frozen=True)
class SecurityDecision:
    allowed: bool
    reason: str
    requires_confirmation: bool = False


class SecurityPolicy:
    """Small policy engine used before local actions are executed."""

    def __init__(
        self,
        allowed_actions: Iterable[str],
        allowed_roots: Iterable[str | Path] = (),
        confirmation_risks: Iterable[str] = ("medium", "high", "critical"),
    ) -> None:
        self.allowed_actions = {item.strip().lower() for item in allowed_actions}
        self.allowed_roots = [Path(root).expanduser().resolve() for root in allowed_roots]
        self.confirmation_risks = {item.strip().lower() for item in confirmation_risks}

    def evaluate(self, request: ActionRequest) -> SecurityDecision:
        action = request.action.strip().lower()
        risk = request.risk.strip().lower()

        if action not in self.allowed_actions:
            return SecurityDecision(False, f"action_not_allowed:{action}")

        if request.resource and self.allowed_roots:
            try:
                target = Path(request.resource).expanduser().resolve()
            except (OSError, RuntimeError, ValueError):
                return SecurityDecision(False, "invalid_resource")

            if not any(target == root or root in target.parents for root in self.allowed_roots):
                return SecurityDecision(False, "resource_outside_allowed_scope")

        return SecurityDecision(
            True,
            "allowed",
            requires_confirmation=risk in self.confirmation_risks,
        )


class AuditTrail:
    """Append-only JSONL audit log with a chained HMAC signature."""

    def __init__(self, path: str | Path, secret: bytes) -> None:
        if len(secret) < 16:
            raise ValueError("audit secret must contain at least 16 bytes")
        self.path = Path(path)
        self.secret = secret
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, event: dict) -> dict:
        previous = self._last_signature()
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "previous_signature": previous,
            **event,
        }
        canonical = json.dumps(record, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        signature = hmac.new(self.secret, canonical.encode("utf-8"), sha256).hexdigest()
        signed = {**record, "signature": signature}
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(signed, ensure_ascii=False) + "\n")
        return signed

    def append_decision(self, request: ActionRequest, decision: SecurityDecision) -> dict:
        return self.append(
            {
                "type": "security_decision",
                "request": asdict(request),
                "decision": asdict(decision),
            }
        )

    def verify(self) -> bool:
        previous = ""
        if not self.path.exists():
            return True

        for raw_line in self.path.read_text(encoding="utf-8").splitlines():
            if not raw_line.strip():
                continue
            signed = json.loads(raw_line)
            signature = signed.pop("signature", "")
            if signed.get("previous_signature", "") != previous:
                return False
            canonical = json.dumps(signed, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
            expected = hmac.new(self.secret, canonical.encode("utf-8"), sha256).hexdigest()
            if not hmac.compare_digest(signature, expected):
                return False
            previous = signature
        return True

    def _last_signature(self) -> str:
        if not self.path.exists():
            return ""
        lines = [line for line in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]
        if not lines:
            return ""
        return json.loads(lines[-1]).get("signature", "")
