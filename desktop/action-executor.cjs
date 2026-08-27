'use strict';

const {
    ActionStatus,
    createActionReceipt,
    isBlocked,
    normalizeActionName,
    policyFor
} = require('./action-policy.cjs');

function createActionExecutor({ appendReceipt, now = () => new Date() }) {
    if (typeof appendReceipt !== 'function')
        throw new TypeError('appendReceipt must be a function.');

    function record(action, status, target, source, detail = '') {
        const receipt = createActionReceipt({
            action,
            status,
            target,
            source,
            detail,
            now: now()
        });
        appendReceipt(receipt);
        return receipt;
    }

    async function execute({ action, target = '', source = 'renderer', confirmed = false, dispatch }) {
        const normalizedAction = normalizeActionName(action);
        const policy = policyFor(normalizedAction);

        if (isBlocked(normalizedAction)) {
            record(normalizedAction, ActionStatus.BLOCKED, target, source, 'policy_blocked');
            return { ok: false, reason: 'blocked_by_policy', action: normalizedAction, risk: policy.risk };
        }

        if (policy.confirmation && !confirmed) {
            record(normalizedAction, ActionStatus.PLANNED, target, source, 'confirmation_required');
            return { ok: false, reason: 'confirmation_required', action: normalizedAction, risk: policy.risk };
        }

        if (typeof dispatch !== 'function')
            throw new TypeError('dispatch must be a function.');

        if (policy.confirmation)
            record(normalizedAction, ActionStatus.APPROVED, target, source);

        record(normalizedAction, ActionStatus.DISPATCHED, target, source);

        try {
            const result = await dispatch();
            const succeeded = result?.ok !== false;
            record(
                normalizedAction,
                succeeded ? ActionStatus.SUCCEEDED : ActionStatus.FAILED,
                target,
                source,
                succeeded ? '' : String(result?.reason || 'action_failed')
            );
            return result ?? { ok: true };
        }
        catch (error) {
            record(normalizedAction, ActionStatus.FAILED, target, source, 'action_failed');
            return {
                ok: false,
                reason: 'action_failed',
                detail: String(error?.message || error)
            };
        }
    }

    return Object.freeze({ execute });
}

module.exports = { createActionExecutor };
