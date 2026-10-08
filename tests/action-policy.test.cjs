const test = require('node:test');
const assert = require('node:assert/strict');
const {
    ActionRisk,
    ActionStatus,
    normalizeActionName,
    policyFor,
    requiresConfirmation,
    isBlocked,
    sanitizeTarget,
    createActionReceipt
} = require('../desktop/action-policy.cjs');

test('normalizes action names deterministically', () => {
    assert.equal(normalizeActionName('Send Message'), 'send_message');
    assert.equal(normalizeActionName('run-routine'), 'run_routine');
});

test('low-risk local actions do not require confirmation', () => {
    assert.equal(policyFor('launch_app').risk, ActionRisk.LOW);
    assert.equal(requiresConfirmation('launch_app'), false);
    assert.equal(requiresConfirmation('run_routine'), false);
});

test('external or destructive side effects require confirmation', () => {
    for (const action of ['send_message', 'submit_form', 'delete_file', 'install_software', 'save_document'])
        assert.equal(requiresConfirmation(action), true, action);
});

test('unknown actions fail closed into explicit confirmation', () => {
    const policy = policyFor('future_tool_we_do_not_know');
    assert.equal(policy.risk, ActionRisk.CONFIRM);
    assert.equal(policy.confirmation, true);
});

test('financial transactions are explicitly blocked at the policy layer', () => {
    assert.equal(isBlocked('financial_transaction'), true);
    assert.equal(policyFor('financial_transaction').risk, ActionRisk.BLOCKED);
});

test('receipt strips local paths and keeps useful metadata', () => {
    const receipt = createActionReceipt({
        action: 'launch_app',
        status: ActionStatus.SUCCEEDED,
        target: 'C:\\Users\\Pedro\\AppData\\Local\\Programs\\Example.exe',
        source: 'voice',
        now: new Date('2026-08-21T10:00:00.000Z')
    });

    assert.equal(receipt.action, 'launch_app');
    assert.equal(receipt.status, 'succeeded');
    assert.equal(receipt.risk, ActionRisk.LOW);
    assert.equal(receipt.target, '<local-path>');
    assert.equal(receipt.timestamp, '2026-08-21T10:00:00.000Z');
    assert.match(receipt.id, /^[0-9a-f-]{36}$/i);
});

test('receipt falls back to planned for unknown status', () => {
    const receipt = createActionReceipt({ action: 'send_message', status: 'whatever', target: 'Contato' });
    assert.equal(receipt.status, ActionStatus.PLANNED);
    assert.equal(receipt.confirmationRequired, true);
});

test('sanitization preserves labels but not obvious absolute paths', () => {
    assert.equal(sanitizeTarget('Spotify'), 'Spotify');
    assert.equal(sanitizeTarget('/home/user/private.txt'), '<local-path>');
    assert.equal(sanitizeTarget('\\\\server\\share\\private.txt'), '<local-path>');
});
