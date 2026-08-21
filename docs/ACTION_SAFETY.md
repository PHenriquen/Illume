# Lumi — Action Safety & Receipts V1

## Goal

Lumi should feel fast for harmless local actions while making consequential actions visible, reviewable and harder to trigger by mistake.

The policy is deliberately separate from the language model. A model may propose an action, but the desktop runtime owns the final decision about whether that action is passive, allowed, confirmation-gated or blocked.

## Transferable principles from comparable systems

### OpenAI computer-use systems

OpenAI's public computer-use material uses layered safeguards and requires user confirmation before actions with meaningful external side effects. The important principle for Lumi is not to copy a particular UI; it is to keep **planning separate from commitment**. Opening an approved local app is different from sending a message, submitting a form or deleting data.

References:
- https://openai.com/index/computer-using-agent/
- https://openai.com/index/operator-system-card/
- https://openai.com/index/running-codex-safely/

### Raycast

Raycast exposes explicit permission controls for AI tools and lets the user maintain an allow-list for tools that no longer need repeated approval. Script commands are also encouraged to be idempotent where possible.

Transferable principles:
- permission decisions should be inspectable and reversible;
- low-risk repeatable actions should stay fast;
- automation should prefer operations that are safe to run twice.

References:
- https://manual.raycast.com/settings
- https://manual.raycast.com/script-commands

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

Every executed tool action should eventually produce a compact local receipt. V1 defines the schema now before wiring persistence into `desktop/main.cjs`.

A receipt contains:
- unique id;
- timestamp;
- normalized action name;
- status (`planned`, `approved`, `succeeded`, `failed`, `cancelled`, `blocked`);
- policy risk;
- whether confirmation was required;
- source (`voice`, `overlay`, `workspace`, `routine`, etc.);
- a short target label;
- optional bounded detail.

Absolute local paths are redacted by the shared helper. Receipts are for accountability, not for building a second copy of sensitive local data.

## Promotion plan

1. **This change:** define and test the policy/receipt contract with no behavior change to existing desktop actions.
2. Wrap `launch_app` and `run_routine` first; these are low-risk and make good instrumentation targets.
3. Add a bounded local receipt store and read-only history UI.
4. Route `capture_screen` and `save_document` through explicit confirmation gates.
5. Only then expand the model/tool surface to communication, browser form submission or file mutation.

Do not let renderer UI decide the security classification. The main Electron process must remain the enforcement point.

## Validation gate

`tests/action-policy.test.cjs` covers normalization, low-risk actions, confirmation-gated actions, blocked actions, unknown-action fallback and local-path redaction.

This module is intentionally not wired into live IPC in V1. That keeps this increment reversible and prevents an untested policy refactor from changing current Lumi behavior before local Windows validation.
