from __future__ import annotations

import os
import platform
import shutil
import socket
import subprocess
import threading
import time
import webbrowser
from pathlib import Path

from backend import app as backend_app
from backend.identity import PRODUCT_NAME, apply_backend_identity

apply_backend_identity(backend_app)

from backend.app import (
    cleanup_orphaned_whisper,
    model_installed,
    ollama_available,
    stop_active_whisper,
    warm_model,
)
from backend.server import create_server

owned_ollama: subprocess.Popen | None = None


def start_existing_ollama() -> bool:
    """Inicia silenciosamente uma instalação já autorizada, sem baixar nada."""
    global owned_ollama
    if ollama_available():
        return True
    candidates = [
        Path(os.getenv("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe",
        Path(os.getenv("LOCALAPPDATA", "")) / "Ollama" / "ollama.exe",
    ]
    executable = shutil.which("ollama") or next((str(path) for path in candidates if path.is_file()), None)
    if not executable:
        return False
    try:
        owned_ollama = subprocess.Popen(
            [executable, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        for _ in range(40):
            if ollama_available():
                return True
            time.sleep(.25)
    except OSError:
        return False
    return ollama_available()


def ensure_ollama() -> bool:
    """Prepara o Ollama sem exigir instalação manual na edição atual."""
    if ollama_available():
        return True
    if platform.system() != "Windows" or shutil.which("winget") is None:
        return False
    creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        result = subprocess.run(
            ["winget", "install", "--id", "Ollama.Ollama", "-e", "--scope", "user", "--silent", "--accept-package-agreements", "--accept-source-agreements"],
            capture_output=True, timeout=900, creationflags=creation_flags,
        )
        if result.returncode != 0:
            subprocess.run(
                ["winget", "install", "--id", "Ollama.Ollama", "-e", "--silent", "--accept-package-agreements", "--accept-source-agreements"],
                capture_output=True, timeout=900, creationflags=creation_flags,
            )
        candidates = [
            Path(os.getenv("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe",
            Path(os.getenv("LOCALAPPDATA", "")) / "Ollama" / "ollama.exe",
        ]
        executable = shutil.which("ollama") or next((str(path) for path in candidates if path.is_file()), None)
        if executable:
            subprocess.Popen([executable, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=creation_flags)
        for _ in range(40):
            if ollama_available():
                return True
            time.sleep(.5)
    except (OSError, subprocess.TimeoutExpired):
        return False
    return ollama_available()


def automatic_setup() -> None:
    """Só aquece componentes existentes; novos downloads exigem autorização na interface."""
    if os.getenv("TRACE_SKIP_AUTO_SETUP") == "1":
        return
    start_existing_ollama()
    if ollama_available() and model_installed():
        warm_model()


def open_when_ready() -> None:
    if os.getenv("TRACE_NO_BROWSER") == "1":
        return
    for _ in range(40):
        try:
            with socket.create_connection(("127.0.0.1", 8710), timeout=0.5):
                webbrowser.open("http://127.0.0.1:8710")
                return
        except OSError:
            time.sleep(0.5)


if __name__ == "__main__":
    cleanup_orphaned_whisper()
    try:
        server = create_server()
    except OSError:
        print(f"\n[ERRO] Já existe uma versão da {PRODUCT_NAME} usando a porta 8710.")
        print("Feche a instância anterior e abra esta versão novamente.\n")
        raise SystemExit(2)
    threading.Thread(target=open_when_ready, daemon=True).start()
    threading.Thread(target=automatic_setup, daemon=True).start()
    try:
        server.serve_forever()
    finally:
        stop_active_whisper()
        if owned_ollama and owned_ollama.poll() is None:
            owned_ollama.terminate()
