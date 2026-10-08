'use strict';

const fs = require('fs');
const path = require('path');

function isReceipt(value) {
    return Boolean(value && typeof value === 'object' && value.id && value.timestamp && value.action && value.status);
}

function createReceiptStore(filePath, options = {}) {
    const maxEntries = Math.max(10, Math.min(Number(options.maxEntries) || 200, 1000));

    function load() {
        try {
            const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (!Array.isArray(parsed))
                return [];
            return parsed.filter(isReceipt).slice(-maxEntries);
        }
        catch {
            return [];
        }
    }

    function save(entries) {
        const next = entries.filter(isReceipt).slice(-maxEntries);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8');
        return next;
    }

    function append(receipt) {
        if (!isReceipt(receipt))
            throw new TypeError('A valid action receipt is required.');
        const entries = load();
        entries.push(receipt);
        save(entries);
        return receipt;
    }

    function recent(limit = 25) {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 25, maxEntries));
        return load().slice(-safeLimit).reverse();
    }

    function clear() {
        save([]);
    }

    return Object.freeze({
        append,
        recent,
        clear,
        maxEntries
    });
}

module.exports = { createReceiptStore, isReceipt };
