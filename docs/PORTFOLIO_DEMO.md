# Portfolio demo

This is the demo I want to record for the repository. It is intentionally short and uses only flows that can be shown working end to end.

## Goal

Show that Noa is a desktop software project with multiple engineering layers, not only a chat UI.

Target length: **30 to 45 seconds**.

## Scene 1 — Start and local state

- open the desktop application;
- show the main surface and current model/runtime state;
- keep the screen readable long enough to show that this is a Windows application, not a browser mockup.

## Scene 2 — Conversation through the local backend

- send one short prompt;
- show the response streaming instead of appearing all at once;
- if useful, briefly show the backend health/status indicator.

## Scene 3 — Controlled native action

- ask Noa to open an application that is already in the approved list;
- show the action request and its result;
- do not use a destructive or sensitive action just for the demo.

The important part is to make the path visible: request -> permission -> executor -> result.

## Scene 4 — Local persistence

- close/reopen the relevant surface or restart the application;
- show that conversation history or a saved preference remains available from local storage/SQLite.

## Scene 5 — Failure path

- attempt a harmless action that is not authorized or cannot be resolved;
- show Noa reporting the failure instead of pretending the action succeeded.

This is more useful for the portfolio than another successful chat response because it demonstrates error handling.

## Recording rules

- no API keys, local paths containing personal names, private documents or notifications on screen;
- use a clean Windows profile or hide unrelated applications;
- do not speed the recording up so much that the execution path becomes impossible to follow;
- no claims about latency, memory usage or model quality unless they were measured separately;
- keep the final GIF/video small enough to load quickly in the README.

## Suggested caption

> Short demo of Noa running locally on Windows: streamed response, controlled application launch, persisted state and a visible failure path.

## Before publishing

Run:

```powershell
npm ci
npm run check
npm run build
```

Then test the exact demo sequence once from a clean application start. The recording should match the state of the repository tag or commit linked from the README.
