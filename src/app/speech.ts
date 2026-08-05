import * as runtime from "./runtime";

function finishSpeech() {
    runtime.store.assistantSpeaking = false;
    runtime.controllers.core.setState("idle", performance.now() < runtime.store.voiceSessionUntil
        ? "Conversa aberta · pode continuar falando."
        : undefined);
}

function voiceScore(voice: SpeechSynthesisVoice) {
    const name = voice.name.toLocaleLowerCase("pt-BR");
    let score = voice.lang.toLocaleLowerCase() === "pt-br" ? 500 : 300;
    if (/natural|neural|online/.test(name))
        score += 220;
    if (/francisca|thalita|maria|let[ií]cia|fernanda|brenda|yara|femin/.test(name))
        score += 180;
    if (/francisca/.test(name))
        score += 45;
    if (/antonio|daniel|faber|jo[aã]o|mascul|male/.test(name))
        score -= 260;
    if (!voice.localService)
        score += 35;
    return score;
}

function availablePortugueseVoices() {
    return speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLocaleLowerCase().startsWith("pt"))
        .sort((a, b) => voiceScore(b) - voiceScore(a));
}

function updateSystemVoiceCatalog() {
    if (!("speechSynthesis" in window))
        return;
    const voices = availablePortugueseVoices();
    const saved = localStorage.getItem("trace-system-voice") || "auto";
    runtime.systemVoiceChoice.replaceChildren(new Option("Automática — priorizar voz Natural", "auto"));
    for (const voice of voices) {
        const quality = /natural|neural|online/i.test(voice.name)
            ? "Natural"
            : voice.localService
                ? "Local"
                : "Online";
        runtime.systemVoiceChoice.add(new Option(`${voice.name} · ${quality}`, voice.name));
    }
    runtime.systemVoiceChoice.value = voices.some((voice) => voice.name === saved)
        ? saved
        : "auto";
    const preferred = voices[0];
    runtime.$("#selected-voice-status").textContent = preferred
        ? `Automática atual: ${preferred.name}${preferred.localService ? " · offline" : " · requer internet"}.`
        : "Nenhuma voz brasileira do Windows foi encontrada; usarei a voz local como alternativa.";
}

async function systemVoice(text: string, offlineOnly = false): Promise<boolean> {
    if (!("speechSynthesis" in window))
        return false;
    let voices = speechSynthesis.getVoices();
    if (!voices.length) {
        await new Promise<void>((resolve) => {
            const ready = () => {
                speechSynthesis.removeEventListener("voiceschanged", ready);
                resolve();
            };
            speechSynthesis.addEventListener("voiceschanged", ready, { once: true });
            window.setTimeout(ready, 900);
        });
        voices = speechSynthesis.getVoices();
    }
    return new Promise<boolean>((resolve) => {
        speechSynthesis.cancel();
        let settled = false;
        const done = (ok: boolean) => {
            if (settled)
                return;
            settled = true;
            resolve(ok);
        };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 0.99;
        utterance.pitch = 1.02;
        utterance.volume = 0.96;
        const selectedName = runtime.systemVoiceChoice.value;
        const portuguese = voices
            .filter((voice) => voice.lang.toLocaleLowerCase().startsWith("pt") &&
            (!offlineOnly || voice.localService))
            .sort((a, b) => voiceScore(b) - voiceScore(a));
        utterance.voice =
            portuguese.find((voice) => voice.name === selectedName) ??
                portuguese[0] ??
                null;
        if (!utterance.voice)
            return done(false);
        runtime.$("#selected-voice-status").textContent =
            `Em uso: ${utterance.voice.name}${utterance.voice.localService ? " · offline" : " · natural online"}.`;
        utterance.onend = () => {
            finishSpeech();
            done(true);
        };
        utterance.onerror = () => done(false);
        speechSynthesis.speak(utterance);
        window.setTimeout(() => {
            if (!speechSynthesis.speaking && !speechSynthesis.pending)
                done(false);
        }, 1600);
    });
}

async function localVoice(text: string): Promise<boolean> {
    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!response.ok)
            return false;
        runtime.store.currentAudioUrl = URL.createObjectURL(await response.blob());
        const audio = (runtime.store.currentAudio = new Audio(runtime.store.currentAudioUrl));
        return await new Promise<boolean>((resolve) => {
            const complete = (played: boolean) => {
                if (runtime.store.currentAudioResolve === complete)
                    runtime.store.currentAudioResolve = null;
                if (!played && runtime.store.currentAudio === audio) {
                    runtime.store.currentAudio = null;
                    if (runtime.store.currentAudioUrl) {
                        URL.revokeObjectURL(runtime.store.currentAudioUrl);
                        runtime.store.currentAudioUrl = "";
                    }
                }
                resolve(played);
            };
            runtime.store.currentAudioResolve = complete;
            audio.onended = () => {
                if (runtime.store.currentAudio === audio) {
                    runtime.store.currentAudio = null;
                    if (runtime.store.currentAudioUrl) {
                        URL.revokeObjectURL(runtime.store.currentAudioUrl);
                        runtime.store.currentAudioUrl = "";
                    }
                    finishSpeech();
                }
                complete(true);
            };
            audio.onerror = () => complete(false);
            void audio.play().catch(() => complete(false));
        });
    }
    catch {
        return false;
    }
}

async function speak(text: string) {
    runtime.controllers.audio.stopCurrentSpeech();
    const generation = runtime.store.speechGeneration;
    if (!runtime.store.voiceEnabled || runtime.voiceProfile.value === "silent") {
        finishSpeech();
        return;
    }
    runtime.controllers.core.setState("speaking", text);
    if (runtime.nativeMode === "overlay")
        void runtime.nativeCall("expand_overlay");
    runtime.store.assistantSpeaking = true;
    const preferred = runtime.voiceProfile.value === "female" || runtime.voiceProfile.value === "female-local"
        ? await systemVoice(text, runtime.voiceProfile.value === "female-local")
        : await localVoice(text);
    if (generation !== runtime.store.speechGeneration)
        return;
    const spoken = preferred ||
        (runtime.voiceProfile.value === "female" || runtime.voiceProfile.value === "female-local"
            ? await localVoice(text)
            : await systemVoice(text));
    if (generation !== runtime.store.speechGeneration)
        return;
    if (!spoken) {
        runtime.controllers.audio.stopCurrentSpeech();
        runtime.controllers.core.setState("error", "A saída de voz não iniciou. Use TESTAR VOZ nas configurações.");
    }
}

export const speechController = {
  finishSpeech,
  voiceScore,
  availablePortugueseVoices,
  updateSystemVoiceCatalog,
  systemVoice,
  localVoice,
  speak,
};
