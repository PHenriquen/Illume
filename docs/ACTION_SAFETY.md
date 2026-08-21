# Lumi — Action Safety & Receipts V1

## Goal

Lumi should feel fast for harmless local actions while making consequential actions visible, reviewable and harder to trigger by mistake.

The policy is deliberately separate from the language model. A model may propose an action, but the desktop runtime owns the final decision about whether that action is passive, allowed, confirmation-gated or blocked.

## Transferable principles from comparable systems

### OpenAI computer-use systems

OpenAI's public computer-use material uses layered safeguards and requires user confirmation before actions with meaningful external side effects. The important principle for Lumi is not to copy a particular UI; it is to keep **planning separate from commitment**. Opening an approved local app is different from sending a message, submitting a form or deleting data.

References:
- https://openai.com/index/computer-using-agent/
- https://deploymentsafety.openai.com/gpt-5-6

### Raycast

Raycast's current AI Extensions model asks for approval before tool execution by default and lets users explicitly allow individual tools. The transferable pattern is that permission decisions remain inspectable, scoped and reversible rather than becoming a global bypass.

Transferable principles:
- permission decisions should be inspectable and reversible;
- low-risk repeatable actions should stay fast;
- permission exceptions should be scoped to a specific tool/action;
- automation should prefer operations that are safe to run twice.

References:
- https://manual.raycast.com/ai/ai-extensions
- https://manual.raycast.com/settings

## Risk levels

`desktop/action-policy.cjs` is the machine-readable source for this first policy.

- `passive`: reads local state without creating an external side effect.
- `low`: reversible, user-scoped local action. No extra confirmation by default.
- `confirm`: action can create, publish, remove or expose something. Must be approved at the point of commitment.
- `blocked`: Lumi does not autonomously execute it through this policy.

Unknown future action names **fail closed** to `confirm` rather than silently becoming low-risk.

## Initial examples

| Action | Default | Reason |
| --- | --- | --- |
| inspect context | passive | no external side effect |
| launch approved app | low | local and reversible |
| run approved routine | low | bounded to already authorized apps |
| open URL | low | navigation only; later form submission is separate |
| capture screen | confirm | may expose sensitive visual context |
| save document | confirm | writes user data |
| send message | confirm | external communication |
| submit form | confirm | external commitment |
| delete file | confirm | destructive |
| install software | confirm | changes machine state |
| financial transaction | blocked | intentionally outside autonomous scope |

## Action receipt

Every executed tool action should eventually produce a compact local receipt.

A receipt contains:
- unique id;
- timestamp;
- normalized action name;
- status (`planned`, `approved`, `dispatched`, `succeeded`, `failed`, `cancelled`, `blocked`);
- policy risk;
- whether confirmation was required;
- source (`voice`, `overlay`, `workspace`, `routine`, etc.);
- a short target label;
- optional bounded detail.

`dispatched` is intentionally distinct from `succeeded`. For actions such as launching another Windows application, Lumi can reliably know that the OS accepted the launch request without being able to prove the target app actually became usable. Receipts should not overclaim success.

Absolute local paths are redacted by the shared helper. Receipts are for accountability, not for building a second copy of sensitive local data.

## Local persistence

`desktop/action-receipt-store.cjs` provides the first bounded persistence layer:

- local JSON only;
- default maximum of 200 entries;
- newest-first history reads;
- malformed/corrupted history fails empty rather than crashing Lumi;
- invalid objects are ignored on load;
- no conversation text, file contents or raw local paths are added by the store itself.

The store deliberately has no renderer access yet. The main Electron process remains the future enforcement and persistence boundary.

## Promotion plan

1. Define and test the policy/receipt contract with no behavior change to existing desktop actions.
2. Add bounded local receipt persistence and a status that distinguishes dispatch from verified success. **Done in this branch.**
3. Wrap `launch_app` and `run_routine` first; these are low-risk and make good instrumentation targets.
4. Add a read-only history UI fed by main-process IPC.
5. Route `capture_screen` and `save_document` through explicit confirmation gates.
6. Only then expand the model/tool surface to communication, browser form submission or file mutation.

Do not let renderer UI decide the security classification. The main Electron process must remain the enforcement point.

## Validation gate

- `tests/action-policy.test.cjs` covers normalization, low-risk actions, confirmation-gated actions, blocked actions, unknown-action fallback and local-path redaction.
- `tests/action-receipt-store.test.cjs` covers persistence, ordering, bounded history, corrupted data, invalid append payloads and clearing history.

The store is intentionally not wired into live IPC yet. That keeps this increment reversible and prevents persistence changes from silently changing current Lumi behavior before local Windows validation.
