import * as runtime from "./runtime";
import type { Health } from "./types";

async function health() {
    try {
        const d = (await fetch("/api/health").then((r) => r.json())) as Health;
        runtime.$("#connection-label").textContent = d.model_installed
            ? "INTELIGÊNCIA LOCAL PRONTA"
            : d.ollama
                ? "MODELO LOCAL PENDENTE"
                : "NÚCLEO LOCAL PENDENTE";
        runtime.$("#model-name").textContent = d.model_installed ? d.model : "DEMONSTRAÇÃO";
        runtime.$("#memory-count").textContent = `${d.memories} registros`;
        runtime.modelInput.value = d.model;
        runtime.installModelButton.hidden = d.model_installed;
        runtime.settingsInstallButton.hidden = d.model_installed;
        runtime.voiceInstallButton.hidden = d.voice_ready && d.tts_ready;
        runtime.$("#voice-setup-status").textContent = d.voice_ready
            ? d.tts_ready
                ? "Whisper e voz neural brasileira prontos."
                : "Whisper pronto · voz neural pendente de autorização."
            : "Reconhecimento de voz pendente de autorização.";
        runtime.$("#model-setup-status").textContent = d.model_installed
            ? "Qwen 3.5 2B instalado e pronto."
            : d.ollama
                ? "Ollama detectado; modelo aguardando autorização."
                : "Ollama e modelo aguardando autorização.";
    }
    catch {
        runtime.$("#connection-label").textContent = "NÚCLEO LOCAL INDISPONÍVEL";
    }
}

async function setup(kind: "model" | "voice", button: HTMLButtonElement) {
    const description = kind === "model"
        ? "O TRACE instalará, se necessário, o Ollama e o modelo Qwen local (aproximadamente 1,9 GB)."
        : "O TRACE baixará o Whisper Large V3 Turbo e a voz local (aproximadamente 650 MB).";
    if (!confirm(`${description}\n\nTudo ficará neste computador. Autorizar agora?`))
        return;
    button.disabled = true;
    button.textContent = "PREPARANDO…";
    runtime.controllers.core.setState("thinking", "Preparação autorizada em andamento…");
    try {
        const d = (await fetch(`/api/setup/${kind}`, { method: "POST" }).then((r) => r.json())) as {
            ok: boolean;
            message: string;
        };
        if (!d.ok)
            throw new Error(d.message);
        runtime.controllers.chat.addMessage("trace", d.message);
        await health();
        runtime.controllers.core.setState("idle");
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : "Falha na preparação.";
        runtime.controllers.chat.addMessage("trace", msg);
        runtime.controllers.core.setState("error", msg);
    }
    finally {
        button.disabled = false;
    }
}

function setVoiceMode(enabled: boolean, share = true) {
    runtime.store.voiceEnabled = enabled;
    runtime.voiceToggle.checked = enabled;
    updateVoiceButton();
    localStorage.setItem("trace-voice", String(enabled));
    if (!enabled)
        runtime.controllers.audio.stopCurrentSpeech();
    if (share && runtime.nativeMode)
        void runtime.broadcast({ type: "voice-mode", enabled });
}

function updateVoiceButton() {
    runtime.$("#voice-mode-button").textContent = !runtime.store.voiceEnabled
        ? "MODO SILENCIOSO"
        : runtime.responseMode.value === "smart"
            ? "VOZ INTELIGENTE"
            : runtime.responseMode.value === "silent"
                ? "SEM VOZ"
                : "VOZ ATIVA";
    runtime.$("#voice-mode-button").classList.toggle("muted", !runtime.store.voiceEnabled || runtime.responseMode.value === "silent");
}

export const systemController = {
  health,
  setup,
  setVoiceMode,
  updateVoiceButton,
};
