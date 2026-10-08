'use strict';

const crypto = require('crypto');

const ActionRisk = Object.freeze({
    PASSIVE: 'passive',
    LOW: 'low',
    CONFIRM: 'confirm',
    BLOCKED: 'blocked'
});

const ActionStatus = Object.freeze({
    PLANNED: 'planned',
    APPROVED: 'approved',
    DISPATCHED: 'dispatched',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    BLOCKED: 'blocked'
});

const POLICY = Object.freeze({
    inspect_context: { risk: ActionRisk.PASSIVE, confirmation: false },
    capture_screen: { risk: ActionRisk.CONFIRM, confirmation: true },
    launch_app: { risk: ActionRisk.LOW, confirmation: false },
    open_url: { risk: ActionRisk.LOW, confirmation: false },
    run_routine: { risk: ActionRisk.LOW, confirmation: false },
    save_document: { risk: ActionRisk.CONFIRM, confirmation: true },
    send_message: { risk: ActionRisk.CONFIRM, confirmation: true },
    submit_form: { risk: ActionRisk.CONFIRM, confirmation: true },
    delete_file: { risk: ActionRisk.CONFIRM, confirmation: true },
    install_software: { risk: ActionRisk.CONFIRM, confirmation: true },
    financial_transaction: { risk: ActionRisk.BLOCKED, confirmation: true }
});

function normalizeActionName(action) {
    return String(action || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function policyFor(action) {
    const normalized = normalizeActionName(action);
    return POLICY[normalized] || { risk: ActionRisk.CONFIRM, confirmation: true };
}

function requiresConfirmation(action) {
    return Boolean(policyFor(action).confirmation);
}

function isBlocked(action) {
    return policyFor(action).risk === ActionRisk.BLOCKED;
}

function sanitizeTarget(value) {
    const text = String(value || '').trim();
    if (!text)
        return '';

    if (/^[a-z]:[\\/]/i.test(text) || text.startsWith('\\\\') || text.startsWith('/'))
        return '<local-path>';

    return text.slice(0, 160);
}

function createActionReceipt({ action, status, target = '', source = 'assistant', detail = '', now = new Date() }) {
    const normalizedAction = normalizeActionName(action);
    const policy = policyFor(normalizedAction);
    const normalizedStatus = Object.values(ActionStatus).includes(status) ? status : ActionStatus.PLANNED;

    return Object.freeze({
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        action: normalizedAction || 'unknown',
        status: normalizedStatus,
        risk: policy.risk,
        confirmationRequired: policy.confirmation,
        source: String(source || 'assistant').slice(0, 40),
        target: sanitizeTarget(target),
        detail: String(detail || '').slice(0, 240)
    });
}

module.exports = {
    ActionRisk,
    ActionStatus,
    POLICY,
    normalizeActionName,
    policyFor,
    requiresConfirmation,
    isBlocked,
    sanitizeTarget,
    createActionReceipt
};
