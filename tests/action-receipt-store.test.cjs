'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { ActionStatus, createActionReceipt } = require('../desktop/action-policy.cjs');
const { createReceiptStore } = require('../desktop/action-receipt-store.cjs');

function tempStore(maxEntries = 20) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumi-receipts-'));
    return {
        dir,
        file: path.join(dir, 'action-receipts.json'),
        store: createReceiptStore(path.join(dir, 'action-receipts.json'), { maxEntries })
    };
}

test('receipt store starts empty when file is missing', () => {
    const { dir, store } = tempStore();
    assert.deepEqual(store.recent(), []);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('receipt store persists and returns newest first', () => {
    const { dir, file, store } = tempStore();
    const first = createActionReceipt({ action: 'launch_app', status: ActionStatus.DISPATCHED, target: 'Editor' });
    const second = createActionReceipt({ action: 'run_routine', status: ActionStatus.SUCCEEDED, target: 'Trabalho' });
    store.append(first);
    store.append(second);

    const reloaded = createReceiptStore(file);
    assert.equal(reloaded.recent(2)[0].id, second.id);
    assert.equal(reloaded.recent(2)[1].id, first.id);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('receipt store enforces a bounded history', () => {
    const { dir, store } = tempStore(10);
    for (let index = 0; index < 14; index++) {
        store.append(createActionReceipt({
            action: 'launch_app',
            status: ActionStatus.DISPATCHED,
            target: `App ${index}`
        }));
    }

    const entries = store.recent(50);
    assert.equal(entries.length, 10);
    assert.equal(entries[0].target, 'App 13');
    assert.equal(entries.at(-1).target, 'App 4');
    fs.rmSync(dir, { recursive: true, force: true });
});

test('receipt store ignores corrupted or malformed history', () => {
    const { dir, file, store } = tempStore();
    fs.writeFileSync(file, '{broken', 'utf8');
    assert.deepEqual(store.recent(), []);

    fs.writeFileSync(file, JSON.stringify([{ nope: true }, createActionReceipt({ action: 'launch_app', status: ActionStatus.DISPATCHED })]), 'utf8');
    assert.equal(store.recent().length, 1);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('receipt store rejects invalid append payloads and can clear history', () => {
    const { dir, store } = tempStore();
    assert.throws(() => store.append({}), /valid action receipt/i);
    store.append(createActionReceipt({ action: 'launch_app', status: ActionStatus.DISPATCHED }));
    store.clear();
    assert.deepEqual(store.recent(), []);
    fs.rmSync(dir, { recursive: true, force: true });
});
