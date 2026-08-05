const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readTree(directory, extensions) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return readTree(target, extensions);
      return extensions.includes(path.extname(entry.name))
        ? [fs.readFileSync(target, "utf8")]
        : [];
    })
    .join("\n");
}

const main = fs.readFileSync("desktop/main.cjs", "utf8");
const renderer = readTree("src", [".ts"]);
const backend = readTree("backend", [".py"]);
const wake = fs.readFileSync("native/wake-listener.ps1", "utf8");
const styles = `${fs.readFileSync("src/style.css", "utf8")}\n${readTree("src/styles", [".css"])}`;
const markup = fs.readFileSync("index.html", "utf8");

test("cada canal IPC possui um único controlador", () => {
  const channels = [...main.matchAll(/ipcMain\.handle\(["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(channels).size, channels.length);
});

test("estado visual central e Microsoft Store estão integrados", () => {
  assert.match(main, /surfaceState\s*=\s*["']dashboard["']/);
  assert.match(main, /Get-StartApps/);
  assert.match(main, /shell:AppsFolder/);
});

test("palavra-chave leve dispensa Whisper ambiente e permite interrupção", () => {
  assert.match(wake, /SpeechRecognitionEngine/);
  assert.match(wake, /acorde trace/);
  assert.match(renderer, /nativeWakeReady/);
  assert.match(renderer, /bargeInFrames/);
  assert.match(renderer, /Whisper nunca fica ouvindo o ambiente/);
  assert.doesNotMatch(backend, /WAKE_VOICE_MODEL/);
});

test("ativação rejeita ruído e permite calibração do microfone", () => {
  assert.match(wake, /Confidence -lt 0\.70/);
  assert.doesNotMatch(wake, /e ai trace/);
  assert.match(renderer, /crestFactor/);
  assert.match(renderer, /quietFramesAfterFirstClap/);
  assert.match(renderer, /startClapCalibration/);
  assert.match(renderer, /isLikelyNoiseTranscript/);
});

test("Liquid Glass, animação da esfera e voz feminina são adaptativos", () => {
  assert.match(styles, /--glass-fill/);
  assert.match(styles, /@keyframes orbMaterialize/);
  assert.match(styles, /backdrop-filter:blur\(34px\)/);
  assert.match(renderer, /voiceScore/);
  assert.match(renderer, /systemVoiceChoice/);
  assert.match(main, /animateOverlayOpacity/);
});

test("Living Core comunica processamento e reage sem textura de ruído", () => {
  assert.match(markup, /id="processing-indicator"/);
  assert.match(styles, /@keyframes processingDot/);
  assert.match(styles, /\.orb-ribbons/);
  assert.match(renderer, /ctx\.lineTo/);
  assert.match(renderer, /pointerActive/);
  assert.doesNotMatch(markup, /class="noise"/);
});

test("palmas são experimentais e exigem ativação explícita", () => {
  assert.match(markup, /id="clap-toggle"/);
  assert.match(renderer, /trace-claps-opt-in-v102/);
  assert.match(renderer, /clapToggle\.checked\s*&&/);
  assert.match(renderer, /Diga “Acorde, Trace” para ativar o compacto/);
});

test("resposta contínua e documentos fazem parte do núcleo", () => {
  assert.match(backend, /def stream_chat/);
  assert.match(backend, /\/api\/chat\/stream/);
  assert.match(backend, /python-docx/);
  assert.match(backend, /OCR VISUAL/);
});

test("frontend permanece modular e sem arquivos monolíticos", () => {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if ([".ts", ".css", ".html"].includes(path.extname(entry.name)))
        files.push(target);
    }
  };
  visit("src");
  files.push("index.html");

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).length;
    const limit = path.extname(file) === ".html" ? 1200 : 650;
    assert.ok(lines <= limit, `${file} possui ${lines} linhas; limite ${limit}`);
  }
  assert.ok(
    fs.readFileSync("src/main.ts", "utf8").split(/\r?\n/).length <= 40,
    "src/main.ts deve apenas compor os módulos",
  );
});

test("backend e processo desktop permanecem legíveis", () => {
  const limits = new Map([
    ["backend/app.py", 700],
    ["backend/server.py", 250],
    ["backend/launcher.py", 180],
    ["desktop/main.cjs", 650],
  ]);

  for (const [file, limit] of limits) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).length;
    assert.ok(lines <= limit, `${file} possui ${lines} linhas; limite ${limit}`);
  }
});

