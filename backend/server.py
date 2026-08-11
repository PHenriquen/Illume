from __future__ import annotations

import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

from backend import app as backend_app
from backend.identity import (
    PRODUCT_NAME,
    apply_backend_identity,
    migrate_docx_brand,
    migrate_public_payload,
)
from backend.ml_intent import build_default_classifier
from backend.security import ActionRequest, SecurityPolicy

apply_backend_identity(backend_app)

from backend.app import (
    DEFAULT_MODEL,
    WEB_DIR,
    chat,
    conversation_history,
    create_docx,
    db,
    document_reader_ready,
    install_document_reader,
    install_model,
    install_tts_engine,
    install_voice_engine,
    memory_count,
    model_installed,
    ollama_available,
    stop_active_whisper,
    stream_chat,
    synthesize_speech,
    transcribe_whisper,
    tts_ready,
    voice_ready,
)


INTENT_CLASSIFIER = build_default_classifier()
SECURITY_POLICY = SecurityPolicy(
    allowed_actions={
        "open_app",
        "read_file",
        "system_info",
        "voice_control",
        "document",
    },
    allowed_roots={WEB_DIR},
)


class NoaHandler(BaseHTTPRequestHandler):
    server_version = "Noa/1.0.2"

    def log_message(self, _format: str, *_args) -> None:
        return

    def send_json(self, data: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(migrate_public_payload(data), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_bytes(self, body: bytes, content_type: str = "audio/wav") -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self, maximum: int = 16_384) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > maximum:
                return {}
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            return {}

    def read_body(self, maximum: int = 16 * 1024 * 1024) -> bytes:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > maximum:
                return b""
            return self.rfile.read(length)
        except ValueError:
            return b""

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            ollama = ollama_available()
            self.send_json({
                "ok": True,
                "product": PRODUCT_NAME,
                "ollama": ollama,
                "model_installed": model_installed() if ollama else False,
                "voice_ready": voice_ready(),
                "tts_ready": tts_ready(),
                "document_ready": document_reader_ready(),
                "model": DEFAULT_MODEL,
                "memories": memory_count(),
                "profile": "eco",
                "intent_classifier": True,
                "security_policy": True,
            })
            return
        if path == "/api/history":
            self.send_json({"messages": conversation_history()})
            return
        self.serve_interface(path)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/ml/intent":
            data = self.read_json()
            text = str(data.get("text", "")).strip()
            if not text:
                self.send_json({"error": "Texto obrigatório"}, HTTPStatus.BAD_REQUEST)
                return
            prediction = INTENT_CLASSIFIER.predict(text)
            self.send_json({
                "label": prediction.label,
                "confidence": prediction.confidence,
                "scores": prediction.scores,
                "local": True,
            })
            return
        if path == "/api/security/evaluate":
            data = self.read_json()
            request = ActionRequest(
                action=str(data.get("action", "")),
                resource=str(data.get("resource", "")),
                risk=str(data.get("risk", "low")),
            )
            decision = SECURITY_POLICY.evaluate(request)
            self.send_json({
                "allowed": decision.allowed,
                "reason": decision.reason,
                "requires_confirmation": decision.requires_confirmation,
                "executed": False,
            })
            return
        if path == "/api/setup/model":
            ok, message = install_model()
            self.send_json({"ok": ok, "message": message, "model": DEFAULT_MODEL}, HTTPStatus.OK if ok else HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if path == "/api/setup/voice":
            ok, message = install_voice_engine()
            if ok:
                tts_ok, tts_message = install_tts_engine()
                ok = tts_ok
                message = f"{message} {tts_message}"
            self.send_json({"ok": ok, "message": message}, HTTPStatus.OK if ok else HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if path == "/api/setup/tts":
            ok, message = install_tts_engine()
            self.send_json({"ok": ok, "message": message}, HTTPStatus.OK if ok else HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if path == "/api/setup/documents":
            ok, message = install_document_reader()
            self.send_json({"ok": ok, "message": message}, HTTPStatus.OK if ok else HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if path == "/api/chat/stream":
            data = self.read_json(70 * 1024 * 1024)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "close")
            self.end_headers()
            try:
                events = stream_chat(
                    str(data.get("message", "")),
                    str(data.get("model", DEFAULT_MODEL)),
                    data.get("attachments") if isinstance(data.get("attachments"), list) else [],
                    data.get("permissions") if isinstance(data.get("permissions"), dict) else {},
                    str(data.get("profile", "balanced")),
                    data.get("personalization") if isinstance(data.get("personalization"), dict) else {},
                )
                for event in events:
                    migrated_event = migrate_public_payload(event)
                    self.wfile.write((json.dumps(migrated_event, ensure_ascii=False) + "\n").encode("utf-8"))
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        if path == "/api/chat":
            data = self.read_json(70 * 1024 * 1024)
            self.send_json(chat(
                str(data.get("message", "")),
                str(data.get("model", DEFAULT_MODEL)),
                data.get("attachments") if isinstance(data.get("attachments"), list) else [],
                data.get("permissions") if isinstance(data.get("permissions"), dict) else {},
                str(data.get("profile", "balanced")),
                data.get("personalization") if isinstance(data.get("personalization"), dict) else {},
            ))
            return
        if path == "/api/transcribe":
            purpose = self.headers.get("X-Noa-Purpose") or self.headers.get("X-Trace-Purpose", "command")
            ok, result = transcribe_whisper(self.read_body(), "wake" if purpose.lower() == "wake" else "command")
            self.send_json({"ok": ok, "text": result if ok else "", "message": "" if ok else result}, HTTPStatus.OK if ok else HTTPStatus.UNPROCESSABLE_ENTITY)
            return
        if path == "/api/voice/stop":
            self.send_json({"ok": True, "stopped": stop_active_whisper()})
            return
        if path == "/api/tts":
            data = self.read_json()
            audio = synthesize_speech(str(data.get("text", "")))
            if audio:
                self.send_bytes(audio)
            else:
                self.send_json({"error": "Voz neural indisponível"}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if path == "/api/export/docx":
            data = self.read_json()
            content = create_docx(str(data.get("text", "")))
            if content:
                self.send_bytes(migrate_docx_brand(content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            else:
                self.send_json({"error": "Exportação DOCX indisponível"}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        self.send_json({"error": "Rota inexistente"}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self) -> None:
        if urlparse(self.path).path != "/api/memory":
            self.send_json({"error": "Rota inexistente"}, HTTPStatus.NOT_FOUND)
            return
        with db() as connection:
            connection.execute("DELETE FROM conversation")
        self.send_json({"ok": True})

    def serve_interface(self, request_path: str) -> None:
        relative = "index.html" if request_path == "/" else unquote(request_path.lstrip("/"))
        target = (WEB_DIR / relative).resolve()
        try:
            target.relative_to(WEB_DIR.resolve())
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not target.is_file():
            target = WEB_DIR / "index.html"
        if not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "Interface compilada não encontrada")
            return
        body = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.end_headers()
        self.wfile.write(body)


def create_server(host: str = "127.0.0.1", port: int = 8710) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), NoaHandler)


def run_server(host: str = "127.0.0.1", port: int = 8710) -> None:
    create_server(host, port).serve_forever()
