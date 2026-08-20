# ADR 003 — Native actions must be controlled and verifiable

## Context

A language model can generate convincing text even when an operating-system action did not happen. Giving generated text or arbitrary commands direct access to the machine would make the assistant difficult to trust and difficult to debug.

## Decision

Model output may propose an action, but native execution must use explicit application contracts, allowlists, file scopes and confirmation when risk requires it.

The target flow is:

```text
Understand -> Plan -> Check permission -> Execute -> Verify -> Record
```

The existing `backend/security.py` is an experimental implementation of scoped authorization and tamper-evident audit records. It is not treated as an operating-system sandbox.

## Why I chose this

One bug I wanted to avoid early was reporting success because the assistant *said* an application had opened. The system should only report completion after the executor returns a result that can be checked.

## Consequences

- adding a new action takes more work than exposing a generic shell command;
- the product can explain why an action was blocked;
- tests can cover permission and failure paths without depending on model wording;
- sensitive actions can require confirmation without blocking harmless ones.

## Status

Accepted as the direction for new native actions. The policy engine and audit trail remain experimental until they are integrated into the critical execution path and covered by broader abuse tests.
