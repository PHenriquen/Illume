const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const identity = fs.readFileSync(path.join(root, "backend", "identity.py"), "utf8");
const server = fs.readFileSync(path.join(root, "backend", "server.py"), "utf8");
const launcher = fs.readFileSync(path.join(root, "backend", "launcher.py"), "utf8");

test("backend prompt identifies the assistant as Noa without assigning gender", () => {
  assert.match(identity, /PRODUCT_NAME = "Noa"/);
  assert.match(identity, /Seu nome é Noa/);
  assert.match(identity, /Não assuma gênero/);
  assert.match(identity, /especialista em engenharia de software/);
  assert.match(identity, /Nunca diga que é JARVIS/);
  assert.doesNotMatch(identity, /Você é TRACE/);
  assert.doesNotMatch(identity, /engenheira de software/);
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

test("legacy public output is migrated at the API boundary", () => {
  assert.match(identity, /def migrate_public_payload/);
  assert.match(identity, /def migrate_docx_brand/);
  assert.match(server, /json\.dumps\(migrate_public_payload\(data\)/);
  assert.match(server, /migrated_event = migrate_public_payload\(event\)/);
  assert.match(server, /migrate_docx_brand\(content\)/);
});

test("launcher public errors use the Noa identity", () => {
  assert.match(launcher, /versão da \{PRODUCT_NAME\}/);
  assert.doesNotMatch(launcher, /versão do TRACE/);
});
