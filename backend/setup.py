from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import asdict, dataclass

from backend.app import (
    DEFAULT_MODEL,
    document_reader_ready,
    install_document_reader,
    install_model,
    install_tts_engine,
    install_voice_engine,
    model_installed,
    ollama_available,
    tts_ready,
    voice_ready,
)
from backend.launcher import ensure_ollama, start_existing_ollama


@dataclass(slots=True)
class ComponentStatus:
    name: str
    ready: bool
    message: str


def ensure_ollama_running() -> ComponentStatus:
    if ollama_available() or start_existing_ollama():
        return ComponentStatus("ollama", True, "Ollama disponível.")
    if ensure_ollama():
        return ComponentStatus("ollama", True, "Ollama instalado e iniciado.")
    return ComponentStatus("ollama", False, "Não foi possível instalar ou iniciar o Ollama.")


def prepare_model() -> ComponentStatus:
    ollama = ensure_ollama_running()
    if not ollama.ready:
        return ComponentStatus("model", False, ollama.message)
    if model_installed():
        return ComponentStatus("model", True, f"Modelo {DEFAULT_MODEL} já está instalado.")
    ok, message = install_model()
    return ComponentStatus("model", ok, message)


def prepare_voice() -> ComponentStatus:
    if voice_ready():
        return ComponentStatus("voice", True, "Whisper já está instalado.")
    ok, message = install_voice_engine()
    return ComponentStatus("voice", ok, message)


def prepare_tts() -> ComponentStatus:
    if tts_ready():
        return ComponentStatus("tts", True, "Piper e a voz pt-BR já estão instalados.")
    ok, message = install_tts_engine()
    return ComponentStatus("tts", ok, message)


def prepare_documents() -> ComponentStatus:
    if document_reader_ready():
        return ComponentStatus("documents", True, "Leitor de documentos já está instalado.")
    ok, message = install_document_reader()
    return ComponentStatus("documents", ok, message)


def current_status() -> list[ComponentStatus]:
    return [
        ComponentStatus("ollama", ollama_available(), "Ollama disponível." if ollama_available() else "Ollama indisponível."),
        ComponentStatus("model", model_installed() if ollama_available() else False, f"Modelo {DEFAULT_MODEL}."),
        ComponentStatus("voice", voice_ready(), "Whisper e modelo de transcrição."),
        ComponentStatus("tts", tts_ready(), "Piper e voz neural pt-BR."),
        ComponentStatus("documents", document_reader_ready(), "PDF, DOCX e OCR visual."),
    ]


def print_status(statuses: list[ComponentStatus], *, json_output: bool) -> None:
    if json_output:
        print(json.dumps([asdict(item) for item in statuses], ensure_ascii=False, indent=2))
        return
    for item in statuses:
        marker = "OK" if item.ready else "ERRO"
        print(f"[{marker}] {item.name}: {item.message}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepara os componentes locais do TRACE AI.")
    parser.add_argument("--all", action="store_true", help="Instala IA, reconhecimento, TTS e documentos.")
    parser.add_argument("--model", action="store_true", help="Prepara o modelo local do Ollama.")
    parser.add_argument("--voice", action="store_true", help="Prepara Whisper.cpp e o modelo de transcrição.")
    parser.add_argument("--tts", action="store_true", help="Prepara Piper e a voz neural pt-BR.")
    parser.add_argument("--documents", action="store_true", help="Prepara PDF, DOCX e OCR visual.")
    parser.add_argument("--status", action="store_true", help="Exibe somente o estado atual.")
    parser.add_argument("--json", action="store_true", help="Emite o resultado em JSON.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.status:
        statuses = current_status()
        print_status(statuses, json_output=args.json)
        return 0 if all(item.ready for item in statuses) else 1

    install_everything = args.all or not any((args.model, args.voice, args.tts, args.documents))
    operations = []
    if install_everything or args.model:
        operations.append(prepare_model)
    if install_everything or args.voice:
        operations.append(prepare_voice)
    if install_everything or args.tts:
        operations.append(prepare_tts)
    if install_everything or args.documents:
        operations.append(prepare_documents)

    statuses: list[ComponentStatus] = []
    for operation in operations:
        status = operation()
        statuses.append(status)
        if not args.json:
            print_status([status], json_output=False)
        time.sleep(0.1)

    if args.json:
        print_status(statuses, json_output=True)
    return 0 if all(item.ready for item in statuses) else 1


if __name__ == "__main__":
    raise SystemExit(main())
