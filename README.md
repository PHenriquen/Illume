# Noa

Noa is a Windows desktop assistant I built to experiment with local AI, automation and desktop integration without giving the model unrestricted access to the system.

The project uses an Electron/TypeScript interface with a Python backend, SQLite for local data and Ollama as the default local model provider.

> **Status:** v1.0.2 — active development. The main flows work on my machine, but I am still cleaning up old TRACE identifiers and testing the installer on clean Windows environments.

## What works today

- local chat with streamed responses;
- conversation history stored in SQLite;
- local models through Ollama;
- reading authorized text, code, PDF, DOCX and image files;
- microphone input, wake-word tests and local speech output;
- opening approved applications;
- small routines that open a predefined set of apps;
- TXT, PDF and DOCX export;
- Windows packaging through Electron Builder.

## Project structure

```text
Noa/
├── src/          # TypeScript renderer and UI controllers
├── desktop/      # Electron process, preload bridge and Windows integration
├── backend/      # Python services, HTTP server, memory and model integration
├── tests/        # Node tests
├── scripts/      # setup, packaging, backup and local utilities
├── native/       # wake listener, assets and isolated experiments
└── docs/         # technical notes
```

The renderer does not get direct Node.js or shell access. Native operations go through the Electron preload/IPC layer, while the Python backend handles model communication, memory, documents and voice-related services.

```text
TypeScript UI
     │
     ├── preload / IPC ──> Electron ──> approved Windows actions
     │
     └── local HTTP ─────> Python ─────> SQLite / Ollama / documents
```

## Code I would start with

If you are reviewing the project, these files show the main parts of the implementation:

- [`src/main.ts`](src/main.ts) — starts the renderer controllers;
- [`src/app/chat.ts`](src/app/chat.ts) — chat and streaming behavior;
- [`src/app/audio.ts`](src/app/audio.ts) — microphone and audio state;
- [`src/app/apps.ts`](src/app/apps.ts) — approved apps and routines in the UI;
- [`desktop/main.cjs`](desktop/main.cjs) — Electron windows, IPC and native actions;
- [`desktop/preload.cjs`](desktop/preload.cjs) — renderer/native bridge;
- [`backend/app.py`](backend/app.py) — local application services;
- [`backend/server.py`](backend/server.py) — HTTP endpoints;
- [`backend/security.py`](backend/security.py) — permission checks and audit-log experiment.

## A few decisions behind the code

### Keep system actions explicit

I did not want model text to execute arbitrary shell commands. App launches and other native actions use explicit handlers, approved resources and execution results.

### Keep user data local by default

Conversation history and application data are stored locally. Ollama is the default model path, so the basic project does not depend on a remote model API.

### Migrate TRACE gradually

Noa started from an earlier prototype called TRACE. Some old names still exist in IPC channels, storage keys and packaging paths. I am replacing them gradually because a global rename can break local data and packaged builds. New renderer code prefers the Noa-facing bridge while the old name remains temporarily for compatibility.

### Split code when it has a reason to change separately

The frontend is already separated into chat, audio, speech, apps, system and runtime modules. `backend/app.py` is still larger than I want, so the next backend cleanup is to extract model, memory and document responsibilities one at a time instead of creating folders only to make the tree look more complex.

## Stack

| Area | Main tools |
|---|---|
| Desktop | Electron, Electron Builder |
| Frontend | TypeScript, Vite, HTML, CSS |
| Backend | Python 3.13 |
| Data | SQLite |
| Local AI | Ollama / Qwen |
| Voice | Whisper.cpp, Piper, Windows speech APIs |
| Tests | Node Test Runner, Python `unittest` |

There are also small ML/C++ experiments under `native/` and `backend/`, but they are not required by the main application.

## Running locally

### Requirements

- Windows 10 or 11
- Node.js 22+
- npm 10+
- Python 3.13
- Ollama for the default local model

```powershell
npm ci
npm run check
npm run build
npm run desktop
```

To start only the Python side:

```powershell
python -m backend.launcher
```

## Tests

```powershell
npm run typecheck
npm test
python -m unittest discover -s backend/tests -p "test_*.py"
```

The tests currently cover architecture rules, app resolution, migration compatibility and the permission/audit module.

## Current cleanup

The main things I am working on now are:

- reducing the remaining TRACE compatibility code;
- separating responsibilities from `backend/app.py`;
- making voice capture/interruption easier to reason about;
- testing install/package flows on a clean Windows environment;
- moving permission checks into more native action paths.

More technical notes are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).
