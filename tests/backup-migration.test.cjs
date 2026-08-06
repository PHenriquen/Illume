const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const installer = read("scripts", "windows", "powershell", "Install-NoaComplete.ps1");
const legacyInstaller = read("scripts", "windows", "powershell", "Install-TraceComplete.ps1");
const backup = read("scripts", "windows", "powershell", "Backup-NoaComplete.ps1");
const legacyBackup = read("scripts", "windows", "powershell", "Backup-TraceComplete.ps1");
const restore = read("scripts", "windows", "powershell", "Restore-NoaComplete.ps1");
const legacyRestore = read("scripts", "windows", "powershell", "Restore-TraceComplete.ps1");
const packageJson = JSON.parse(read("package.json"));

test("Noa has canonical Windows installer entrypoints", () => {
  assert.match(installer, /Noa — instalação completa e restaurável/);
  assert.match(installer, /Dados locais preservados/);
  assert.match(read("INSTALAR_NOA_COMPLETO.bat"), /INSTALAR_NOA_COMPLETO\.bat/);
  assert.match(read("scripts", "windows", "INSTALAR_NOA_COMPLETO.bat"), /Install-NoaComplete\.ps1/);
});

test("legacy installer names forward to Noa", () => {
  assert.match(legacyInstaller, /Install-NoaComplete\.ps1/);
  assert.match(read("INSTALAR_TRACE_COMPLETO.bat"), /INSTALAR_NOA_COMPLETO\.bat/);
  assert.match(read("scripts", "windows", "INSTALAR_TRACE_COMPLETO.bat"), /INSTALAR_NOA_COMPLETO\.bat/);
});

test("backup keeps Noa and TRACE runtime data separated", () => {
  assert.match(backup, /runtime-data/);
  assert.match(backup, /trace-legacy/);
  assert.match(backup, /includesNoaRuntimeData/);
  assert.match(backup, /includesLegacyRuntimeData/);
  assert.match(backup, /RESTAURAR_NOA_COMPLETO\.bat/);
});

test("restore accepts current and legacy backup layouts", () => {
  assert.match(restore, /Noa\.exe/);
  assert.match(restore, /TRACE\.exe/);
  assert.match(restore, /Backup no formato antigo detectado/);
  assert.match(restore, /Install-NoaComplete\.ps1/);
  assert.match(restore, /Install-TraceComplete\.ps1/);
});

test("legacy backup and restore scripts remain wrappers only", () => {
  assert.match(legacyBackup, /Backup-NoaComplete\.ps1/);
  assert.match(legacyRestore, /Restore-NoaComplete\.ps1/);
});

test("npm backup command uses the canonical Noa script", () => {
  assert.match(packageJson.scripts["backup:windows"], /Backup-NoaComplete\.ps1$/);
});
