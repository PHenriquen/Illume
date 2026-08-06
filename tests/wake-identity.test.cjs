const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const listener = fs.readFileSync(path.join(root, "native", "wake-listener.ps1"), "utf8");
const identity = fs.readFileSync(path.join(root, "src", "app", "identity.ts"), "utf8");
const audio = fs.readFileSync(path.join(root, "src", "app", "audio.ts"), "utf8");

test("Noa is the primary spoken identity", () => {
  assert.match(identity, /wakeWords:\s*\["noa"\]/);
  assert.match(identity, /"acorde noa"/);
  assert.match(identity, /"descanse noa"/);
  assert.match(listener, /'acorde noa'/);
  assert.match(listener, /'descanse noa'/);
});

test("legacy Trace wake words remain explicit and temporary", () => {
  assert.match(identity, /legacyWakeWords:\s*\["trace", "tracer"\]/);
  assert.match(listener, /'acorde trace'/);
  assert.match(listener, /'descanse trace'/);
  assert.match(listener, /assistant = if \(\$phrase -match/);
});

test("the native listener keeps a constrained confidence gate", () => {
  assert.match(listener, /Confidence -lt 0\.70/);
  assert.match(listener, /durationMs -lt 320/);
  assert.match(listener, /ConvertTo-Json -Compress/);
});

test("transcribed commands use the centralized Noa parser", () => {
  assert.match(audio, /isNoaWakeCommand/);
  assert.match(audio, /isNoaSleepCommand/);
  assert.match(audio, /diga “Acorde, Noa”/);
  assert.doesNotMatch(audio, /const traceName =/);
});

test("runtime branding observes dynamic interface copy", () => {
  assert.match(identity, /new MutationObserver/);
  assert.match(identity, /observeRuntimeIdentity/);
  assert.match(identity, /characterData: true/);
});
