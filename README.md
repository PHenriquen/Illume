# Noa

**Local desktop assistant for Windows focused on privacy, controlled automation and reliable system integration.**

Noa is a personal software engineering project that combines a TypeScript/Electron desktop interface with a Python backend, local persistence and optional local AI models.

I started the project to explore a practical question: **how useful can a desktop assistant become without giving a language model unrestricted access to the operating system?**

That led the project toward three priorities: clear permissions, observable actions and local-first data handling.

> **Status:** v1.0.2 — active development. Core flows are functional locally, but the project is not production-ready yet.

## What I built

I built Noa as a desktop application rather than a thin chat interface. Most of the work has been around making several parts of the system cooperate reliably: UI state, Electron IPC, a local Python service, persistence, document handling, voice experiments and controlled native actions.

Some code paths that represent the project well:

- [`src/main.ts`](src/main.ts) — composition root for the TypeScript renderer and its controllers;
- [`src/app/`](src/app/) — UI, chat, audio, speech, application and system controllers;
- [`desktop/main.cjs`](desktop/main.cjs) — Electron lifecycle, windows, tray and native integration;
- [`desktop/preload.cjs`](desktop/preload.cjs) — explicit IPC bridge between the renderer and native process;
- [`backend/app.py`](backend/app.py) — local application services, model integration, memory, documents and voice;
- [`backend/server.py`](backend/server.py) — local HTTP layer;
- [`backend/security.py`](backend/security.py) — scoped authorization and an experimental tamper-evident audit trail;
- [`tests/`](tests/) — automated checks for architecture, permissions and application resolution.

The project has changed significantly as I tested it on Windows. Some early implementation choices are still visible in the repository, including legacy `TRACE` identifiers. I am migrating those gradually instead of doing a risky global rename that could break packaging or existing local data.

## What Noa does today

- streams conversations through a local backend;
- stores conversation history in SQLite;
- supports local models through Ollama;
- reads authorized text, code, PDF, DOCX and image files;
- supports microphone input, wake-word experiments and local speech output;
- opens approved applications and runs predefined local routines;
- exports responses to TXT, PDF and DOCX;
- packages as a Windows desktop application;
- includes automated checks for architecture, permissions and application resolution.

## Architecture

```text
┌──────────────────────────────┐
│ TypeScript / Vite Renderer   │
│ UI, chat, audio, settings    │
└──────────────┬───────────────┘
               │ secure preload / IPC
┌──────────────▼───────────────┐
│ Electron Main Process        │
│ windows, tray, native actions│
└──────────────┬───────────────┘
               │ local HTTP
┌──────────────▼───────────────┐
│ Python Backend               │
│ models, memory, docs, voice  │
└──────────────┬───────────────┘
               │
          SQLite / local files
```

I separated the interface, native desktop integration and backend services so that each boundary has a clear responsibility. In particular, the renderer does not receive direct access to Node.js or arbitrary system commands.

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Engineering decisions

### 1. Controlled actions instead of arbitrary commands

The assistant can propose an action, but system operations are expected to pass through explicit contracts, allowlists, file scopes or user confirmation.

The intended flow is:

```text
Understand -> Plan -> Check permission -> Execute -> Verify -> Record
```

I chose this constraint because a model producing a plausible answer is not evidence that an operating-system action actually succeeded. Native execution needs a deterministic path and a result that the application can verify.

### 2. Local-first data

Conversation history and application data stay on the user's machine by default. Remote providers are not treated as invisible implementation details: if added, they should be explicit and isolated behind provider contracts.

### 3. Model-independent interface

I do not want the desktop application coupled to a single model API. The current local provider uses Ollama/Qwen, while the rest of the application communicates through internal interfaces that can evolve independently.

### 4. Failure is part of the product

Noa should not report an action as completed simply because a model produced a plausible response. Native actions are designed around execution results, error states and verification.

## Tech stack

| Area | Technologies |
|---|---|
| Desktop | Electron, Electron Builder |
| Frontend | TypeScript, Vite, HTML, CSS |
| Backend | Python 3.13 |
| Data | SQLite |
| Local AI | Ollama / Qwen |
| Voice | Whisper.cpp, Piper, Windows speech APIs |
| Quality | Node Test Runner, TypeScript checks, GitHub Actions |
| Experimental | small local ML classifier, C++ audio/concurrency lab |

The experimental modules are intentionally isolated from the main runtime. I use them to test an engineering idea before deciding whether the added complexity belongs in the product path.

## Repository structure

```text
NOA/
├── backend/       # Python services, local API, memory and model integration
├── desktop/       # Electron main process, preload and native integration
├── src/           # TypeScript renderer
├── tests/         # automated checks
├── scripts/       # setup, diagnostics, backup and packaging helpers
├── native/        # native assets and isolated experiments
├── docs/          # architecture, product and development notes
└── .github/       # CI workflows
```

## Running locally

### Requirements

- Windows 10 or 11
- Node.js 22+
- npm 10+
- Python 3.13 recommended
- Git
- Ollama for the default local model provider

### Install and validate

```powershell
npm ci
npm run check
npm run build
```

### Start the desktop app

```powershell
npm run desktop
```

### Start only the Python core

```powershell
python -m backend.launcher
```

## Quality checks

```powershell
npm run typecheck
npm test
npm run check
```

I keep these checks in the repository because several bugs in a desktop assistant only become obvious when interfaces between modules change. GitHub Actions also runs basic validation outside my development machine.

## Current limitations

- voice activation still depends heavily on microphone quality and environment calibration;
- some optional local components require an initial download;
- the application still needs broader validation on clean Windows installations;
- code signing and automatic updates are not configured for public distribution;
- some older internal identifiers from the project's previous name are being migrated gradually to avoid breaking local data and packaging.

I prefer keeping these limitations visible rather than presenting the project as more mature than it currently is.

## What I am improving next

- make the permission/action pipeline more explicit and testable;
- improve voice-state coordination and interruption;
- separate memory, model-provider and document services further in the Python backend;
- strengthen abuse tests around file scopes and native actions;
- validate installation and packaging on a clean Windows environment.

## Documentation

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries and technical decisions
- [`DEVELOPMENT.md`](docs/DEVELOPMENT.md) — local development notes
- [`PRODUCT.md`](docs/PRODUCT.md) — product direction
- [`ENGINEERING_LABS.md`](docs/ENGINEERING_LABS.md) — isolated technical experiments
- [`BACKUP_AND_RECOVERY.md`](docs/BACKUP_AND_RECOVERY.md) — local data and recovery strategy

## License

The repository is currently `UNLICENSED`. A public license will be selected before opening the project for external contributions or broader distribution.
