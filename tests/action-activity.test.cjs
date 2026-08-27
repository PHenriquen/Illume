'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const markup = fs.readFileSync('index.html', 'utf8');
const activity = fs.readFileSync('src/app/activity.ts', 'utf8');
const preload = fs.readFileSync('desktop/preload.cjs', 'utf8');
const main = fs.readFileSync('desktop/main.cjs', 'utf8');

test('activity settings surface is connected to native receipts', () => {
    assert.match(markup, /data-settings-page="activity"/);
    assert.match(activity, /list_action_receipts\(30\)/);
    assert.match(preload, /list_action_receipts/);
    assert.match(main, /trace:list-action-receipts/);
});

test('activity view has explicit empty, unavailable and failure states', () => {
    assert.match(activity, /Nenhuma ação registrada/);
    assert.match(activity, /Disponível no aplicativo desktop/);
    assert.match(activity, /Não foi possível ler o histórico/);
});

test('activity renderer uses text nodes instead of injecting receipt markup', () => {
    assert.match(activity, /textContent = receipt\.target/);
    assert.doesNotMatch(activity, /innerHTML/);
});
