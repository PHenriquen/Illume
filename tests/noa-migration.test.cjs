const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const preload = fs.readFileSync("desktop/preload.cjs", "utf8");
const runtime = fs.readFileSync("src/app/runtime.ts", "utf8");
const types = fs.readFileSync("src/app/types.ts", "utf8");

test("Noa bridge is primary while TRACE bridge remains a compatibility alias", () => {
  assert.match(preload, /exposeInMainWorld\(['"]noaNative['"]/);
  assert.match(preload, /exposeInMainWorld\(['"]traceNative['"]/);
  assert.match(runtime, /window\.noaNative\s*\?\?\s*window\.traceNative/);
});

test("new code can use AssistantState without breaking old imports", () => {
  assert.match(types, /export type AssistantState/);
  assert.match(types, /export type TraceState = AssistantState/);
  assert.match(runtime, /state:\s*\(["']idle["']\) as AssistantState/);
});
