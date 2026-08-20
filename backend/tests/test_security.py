import json
import tempfile
import unittest
from pathlib import Path

from backend.security import ActionRequest, AuditTrail, SecurityPolicy


class SecurityPolicyTests(unittest.TestCase):
    def test_rejects_unknown_action(self):
        policy = SecurityPolicy({"open_app"})

        decision = policy.evaluate(ActionRequest("delete_everything"))

        self.assertFalse(decision.allowed)
        self.assertEqual(decision.reason, "action_not_allowed:delete_everything")

    def test_rejects_resource_outside_allowed_root(self):
        with tempfile.TemporaryDirectory() as allowed_dir, tempfile.TemporaryDirectory() as outside_dir:
            policy = SecurityPolicy({"read_file"}, {allowed_dir})
            outside_file = Path(outside_dir) / "private.txt"

            decision = policy.evaluate(ActionRequest("read_file", str(outside_file)))

            self.assertFalse(decision.allowed)
            self.assertEqual(decision.reason, "resource_outside_allowed_scope")

    def test_requires_confirmation_for_high_risk_action(self):
        policy = SecurityPolicy({"launch_app"})

        decision = policy.evaluate(ActionRequest("launch_app", risk="high"))

        self.assertTrue(decision.allowed)
        self.assertTrue(decision.requires_confirmation)


class AuditTrailTests(unittest.TestCase):
    def test_detects_tampered_record(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "audit.jsonl"
            trail = AuditTrail(path, b"0123456789abcdef")
            trail.append({"type": "action", "result": "ok"})
            self.assertTrue(trail.verify())

            record = json.loads(path.read_text(encoding="utf-8"))
            record["result"] = "changed-after-write"
            path.write_text(json.dumps(record) + "\n", encoding="utf-8")

            self.assertFalse(trail.verify())


if __name__ == "__main__":
    unittest.main()
