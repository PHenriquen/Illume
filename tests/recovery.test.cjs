const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const required = [
  'backend/setup.py',
  'scripts/windows/INSTALAR_NOA_COMPLETO.bat',
  'scripts/windows/CRIAR_BACKUP_NOA_COMPLETO.bat',
  'scripts/windows/RESTAURAR_NOA_COMPLETO.bat',
  'scripts/windows/INSTALAR_TRACE_COMPLETO.bat',
  'scripts/windows/CRIAR_BACKUP_COMPLETO.bat',
  'scripts/windows/powershell/Install-TraceComplete.ps1',
  'scripts/windows/powershell/Backup-TraceComplete.ps1',
  'scripts/windows/powershell/Restore-TraceComplete.ps1',
  'docs/BACKUP_AND_RECOVERY.md',
];

test('recovery kit contains every required entry point', () => {
  for (const relative of required) {
    assert.equal(fs.existsSync(path.join(root, relative)), true, `${relative} is missing`);
  }
});

test('gitignore excludes generated offline backups and runtime models', () => {
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  for (const rule of ['runtime-data/', 'ollama-models/', 'TRACE-AI-Backup-*/']) {
    assert.match(ignore, new RegExp(rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
