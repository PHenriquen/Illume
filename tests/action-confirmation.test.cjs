'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const main = fs.readFileSync('desktop/main.cjs', 'utf8');
const chat = fs.readFileSync('src/app/chat.ts', 'utf8');

test('screen capture is confirmed and enforced by the Electron process', () => {
    const handler = main.slice(
        main.indexOf("ipcMain.handle('trace:capture-screen'"),
        main.indexOf("ipcMain.handle('trace:generate-diagnostic'"),
    );
    assert.match(handler, /getActionExecutor\(\)\.execute/);
    assert.match(handler, /action: 'capture_screen'/);
    assert.match(handler, /requestConfirmation/);
    assert.match(handler, /confirmDesktopAction/);
});

test('document writes are confirmed before the destination picker and write', () => {
    const handler = main.slice(
        main.indexOf("ipcMain.handle('trace:save-document'"),
        main.indexOf("ipcMain.handle('trace:select-app'"),
    );
    assert.match(handler, /action: 'save_document'/);
    assert.ok(handler.indexOf('requestConfirmation') < handler.indexOf('showSaveDialog'));
    assert.ok(handler.indexOf('showSaveDialog') < handler.indexOf('writeFileSync'));
});

test('renderer handles structured cancellation without deciding policy', () => {
    assert.match(chat, /capture\?\.reason === "cancelled"/);
    assert.match(chat, /result\?\.reason === "cancelled"/);
    assert.doesNotMatch(chat, /approvalMode\.value === "always"[\s\S]{0,180}captur/);
});
