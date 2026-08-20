# ADR 002 — Separate desktop integration from the Python core

## Context

Noa needs a desktop UI, Windows integration, local persistence, model access, document processing and voice-related services. Putting all of that in one runtime would make failures harder to isolate and would give the renderer more privileges than it needs.

## Decision

Use three main boundaries:

1. a TypeScript renderer for UI state and interaction;
2. an Electron main process for windows, tray, IPC and native actions;
3. a Python backend for local services such as models, memory, documents and voice.

The renderer talks to native capabilities through an explicit preload bridge and to the Python core through a local HTTP boundary.

## Why I chose this

I wanted the UI to stay easy to reason about even when native actions or model calls fail. The split also lets me keep Node.js and operating-system capabilities away from renderer code by default.

## Consequences

- there are more interfaces to maintain;
- startup and shutdown need coordination between processes;
- errors need to preserve enough context when crossing IPC or HTTP boundaries;
- each boundary can be tested and replaced more independently.

## Status

Accepted. Some responsibilities in `backend/app.py` are still too concentrated and are being separated gradually.
