'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createActionExecutor } = require('../desktop/action-executor.cjs');

function harness() {
    const receipts = [];
    const executor = createActionExecutor({
        appendReceipt: receipt => receipts.push(receipt),
        now: () => new Date('2026-08-27T08:00:00.000Z')
    });
    return { executor, receipts };
}

test('dispatches a low-risk action and records its lifecycle', async () => {
    const { executor, receipts } = harness();
    let dispatched = false;

    const result = await executor.execute({
        action: 'launch_app',
        target: 'Editor',
        dispatch: async () => {
            dispatched = true;
            return { ok: true, name: 'Editor' };
        }
    });

    assert.equal(dispatched, true);
    assert.deepEqual(result, { ok: true, name: 'Editor' });
    assert.deepEqual(receipts.map(item => item.status), ['dispatched', 'succeeded']);
    assert.ok(receipts.every(item => item.target === 'Editor'));
});

test('requires confirmation before a confirm-risk action is dispatched', async () => {
    const { executor, receipts } = harness();
    let dispatched = false;

    const result = await executor.execute({
        action: 'save_document',
        target: 'Resumo',
        dispatch: async () => {
            dispatched = true;
            return { ok: true };
        }
    });

    assert.equal(dispatched, false);
    assert.equal(result.reason, 'confirmation_required');
    assert.deepEqual(receipts.map(item => item.status), ['planned']);
});

test('records approval when confirmation is explicit', async () => {
    const { executor, receipts } = harness();

    const result = await executor.execute({
        action: 'save_document',
        target: 'Resumo',
        confirmed: true,
        dispatch: async () => ({ ok: true })
    });

    assert.equal(result.ok, true);
    assert.deepEqual(receipts.map(item => item.status), ['approved', 'dispatched', 'succeeded']);
});

test('can request confirmation at the trusted execution boundary', async () => {
    const { executor, receipts } = harness();
    let dispatched = false;

    const result = await executor.execute({
        action: 'capture_screen',
        target: 'Tela principal',
        requestConfirmation: async () => true,
        dispatch: async () => {
            dispatched = true;
            return { ok: true };
        }
    });

    assert.equal(dispatched, true);
    assert.equal(result.ok, true);
    assert.deepEqual(receipts.map(item => item.status), ['planned', 'approved', 'dispatched', 'succeeded']);
});

test('records cancellation and does not dispatch after native refusal', async () => {
    const { executor, receipts } = harness();
    let dispatched = false;

    const result = await executor.execute({
        action: 'capture_screen',
        target: 'Tela principal',
        requestConfirmation: async () => false,
        dispatch: async () => {
            dispatched = true;
            return { ok: true };
        }
    });

    assert.equal(dispatched, false);
    assert.equal(result.reason, 'cancelled');
    assert.deepEqual(receipts.map(item => item.status), ['planned', 'cancelled']);
});

test('fails safely when the native confirmation surface is unavailable', async () => {
    const { executor, receipts } = harness();

    const result = await executor.execute({
        action: 'capture_screen',
        requestConfirmation: async () => {
            throw new Error('dialog unavailable');
        },
        dispatch: async () => ({ ok: true })
    });

    assert.equal(result.reason, 'confirmation_failed');
    assert.deepEqual(receipts.map(item => item.status), ['planned', 'failed']);
    assert.equal(receipts.at(-1).detail, 'confirmation_failed');
});

test('records a cancelled destination picker as cancellation, not failure', async () => {
    const { executor, receipts } = harness();

    const result = await executor.execute({
        action: 'save_document',
        target: 'Documento PDF',
        confirmed: true,
        dispatch: async () => ({ ok: false, reason: 'cancelled' })
    });

    assert.equal(result.reason, 'cancelled');
    assert.deepEqual(receipts.map(item => item.status), ['approved', 'dispatched', 'cancelled']);
});

test('blocks forbidden actions without invoking the dispatcher', async () => {
    const { executor, receipts } = harness();
    let dispatched = false;

    const result = await executor.execute({
        action: 'financial_transaction',
        dispatch: async () => {
            dispatched = true;
            return { ok: true };
        }
    });

    assert.equal(dispatched, false);
    assert.equal(result.reason, 'blocked_by_policy');
    assert.deepEqual(receipts.map(item => item.status), ['blocked']);
});

test('turns dispatcher failures into structured results and receipts', async () => {
    const { executor, receipts } = harness();

    const result = await executor.execute({
        action: 'run_routine',
        target: 'Trabalho',
        dispatch: async () => {
            throw new Error('launcher unavailable');
        }
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'action_failed');
    assert.equal(result.detail, 'launcher unavailable');
    assert.deepEqual(receipts.map(item => item.status), ['dispatched', 'failed']);
    assert.equal(receipts.at(-1).detail, 'action_failed');
});
