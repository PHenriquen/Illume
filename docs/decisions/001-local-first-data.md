# ADR 001 — Keep personal data local by default

## Context

Noa stores conversation history, user preferences, authorized applications and other personal context. A desktop assistant can easily become useful enough to accumulate sensitive data, so the storage model is part of the architecture rather than a UI preference.

## Decision

Persist user data on the local machine by default. SQLite is used for durable local history and lightweight settings remain local to the application. Remote model providers, if added later, must be explicit and isolated behind provider contracts.

## Why I chose this

The first versions of the project were focused on getting the assistant working. As the feature set grew, it became clear that hidden network dependencies would make permissions difficult to explain and debugging harder. Local-first behavior gives me a simpler default: I know where the data lives and can reason about what leaves the machine.

## Consequences

- setup is more demanding because local components may need to be installed;
- model quality and latency depend on the user's hardware;
- backup and migration need to be handled deliberately;
- a future remote provider must expose its network behavior instead of silently replacing the local path.

## Status

Accepted. The implementation is still evolving, especially around separating history, preferences and temporary context.
