const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const identity = fs.readFileSync(path.join(root, "backend", "identity.py"), "utf8");
const server = fs.readFileSync(path.join(root, "backend", "server.py"), "utf8");
const launcher = fs.readFileSync(path.join(root, "backend", "launcher.py"), "utf8");

test("backend prompt identifies the assistant as Noa", () => {
  assert.match(identity, /PRODUCT_NAME = "Noa"/);
  assert.match(identity, /Seu nome é Noa/);
  assert.match(identity, /Não assuma gênero/);
  assert.match(identity, /Nunca diga que é JARVIS/);
  assert.doesNotMatch(identity, /Você é TRACE/);
});

test("backend identity is applied before runtime imports", () => {
  assert.match(server, /apply_backend_identity\(backend_app\)/);
  assert.match(launcher, /apply_backend_identity\(backend_app\)/);
});

test("local API exposes Noa while preserving the legacy voice header", () => {
  assert.match(server, /class NoaHandler/);
  assert.match(server, /server_version = "Noa\/1\.0\.2"/);
  assert.match(server, /"product": PRODUCT_NAME/);
  assert.match(server, /X-Noa-Purpose/);
  assert.match(server, /X-Trace-Purpose/);
});

test("launcher public errors use the Noa identity", () => {
  assert.match(launcher, /versão da \{PRODUCT_NAME\}/);
  assert.doesNotMatch(launcher, /versão do TRACE/);
});
