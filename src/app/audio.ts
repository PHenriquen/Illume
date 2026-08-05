import * as runtime from "./runtime";

function encodeWav(input: Float32Array[], rate: number) {
    const n = input.reduce((a, c) => a + c.length, 0), src = new Float32Array(n);
    let o = 0;
    for (const c of input) {
        src.set(c, o);
        o += c.length;
    }
    const target = 16000, length = Math.max(1, Math.floor((n * target) / rate)), samples = new Float32Array(length), ratio = rate / target;
    for (let i = 0; i < length; i++) {
        const p = i * ratio, l = Math.floor(p), r = Math.min(l + 1, n - 1);
        samples[i] = src[l] * (1 - (p - l)) + src[r] * (p - l);
    }
    const b = new ArrayBuffer(44 + length * 2), v = new DataView(b), write = (at: number, s: string) => {
        for (let i = 0; i < s.length; i++)
            v.setUint8(at + i, s.charCodeAt(i));
    };
    write(0, "RIFF");
    v.setUint32(4, 36 + length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, target, true);
    v.setUint32(28, target * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    write(36, "data");
    v.setUint32(40, length * 2, true);
    o = 44;
    for (const s of samples) {
        const c = Math.max(-1, Math.min(1, s));
        v.setInt16(o, c < 0 ? c * 32768 : c * 32767, true);
        o += 2;
    }
    return new Blob([b], { type: "audio/wav" });
}

function playCue() {
    // A interface visual substitui os sons de ativacao para nao interromper midia.
}

function stopCurrentSpeech() {
    runtime.store.speechGeneration++;
    runtime.store.assistantSpeaking = false;
    speechSynthesis.cancel();
    const resolveAudio = runtime.store.currentAudioResolve;
    runtime.store.currentAudioResolve = null;
    if (runtime.store.currentAudio) {
        runtime.store.currentAudio.onended = null;
        runtime.store.currentAudio.onerror = null;
        runtime.store.currentAudio.pause();
        runtime.store.currentAudio.currentTime = 0;
        runtime.store.currentAudio = null;
    }
    if (runtime.store.currentAudioUrl) {
        URL.revokeObjectURL(runtime.store.currentAudioUrl);
        runtime.store.currentAudioUrl = "";
    }
    resolveAudio?.(false);
}

function interruptInteraction() {
    runtime.store.interactionGeneration++;
    runtime.store.activeRequest?.abort();
    runtime.store.activeRequest = null;
    if (runtime.store.activeTranscription) {
        runtime.store.activeTranscription.abort();
        runtime.store.activeTranscription = null;
        runtime.store.transcriptionBusy = false;
        void fetch("/api/voice/stop", { method: "POST" }).catch(() => undefined);
    }
    stopCurrentSpeech();
}

async function startAmbient() {
    if (runtime.store.ambient)
        return;
    try {
        runtime.store.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: true,
            },
        });
        runtime.store.audioContext = new AudioContext();
        await runtime.store.audioContext.resume();
        runtime.store.sampleRate = runtime.store.audioContext.sampleRate;
        const source = runtime.store.audioContext.createMediaStreamSource(runtime.store.stream);
        runtime.store.analyser = runtime.store.audioContext.createAnalyser();
        runtime.store.analyser.fftSize = 256;
        source.connect(runtime.store.analyser);
        runtime.store.processor = runtime.store.audioContext.createScriptProcessor(4096, 1, 1);
        const silent = runtime.store.audioContext.createGain();
        silent.gain.value = 0;
        runtime.store.processor.onaudioprocess = (e) => monitor(new Float32Array(e.inputBuffer.getChannelData(0)));
        source.connect(runtime.store.processor);
        runtime.store.processor.connect(silent);
        silent.connect(runtime.store.audioContext.destination);
        runtime.store.ambient = true;
        runtime.store.calibrationFrames = 0;
        runtime.ambientButton.textContent = "AMBIENTE ATIVO";
        runtime.ambientToggle.checked = true;
        runtime.micStatus.textContent = "ATIVO · CALIBRANDO";
        runtime.micStatus.className = "online";
        void window.traceNative?.report_mic?.(0, "ATIVO · CALIBRANDO");
        runtime.controllers.core.setState("idle", "Calibrando seu microfone…");
    }
    catch {
        runtime.micStatus.textContent = "BLOQUEADO";
        runtime.micStatus.className = "blocked";
        void window.traceNative?.report_mic?.(0, "BLOQUEADO");
        runtime.controllers.core.setState("error", "O Windows bloqueou o acesso ao microfone do TRACE.");
    }
}

function stopAmbient() {
    runtime.store.processor?.disconnect();
    runtime.store.stream?.getTracks().forEach((t) => t.stop());
    runtime.store.audioContext?.close();
    runtime.store.processor = null;
    runtime.store.stream = null;
    runtime.store.audioContext = null;
    runtime.store.ambient = false;
    runtime.store.capture = "none";
    runtime.ambientButton.textContent = "ATIVAR AMBIENTE";
    runtime.micStatus.textContent = "DESATIVADO";
    runtime.micStatus.className = "";
    runtime.micLevelBar.style.transform = "scaleX(0)";
    runtime.controllers.core.setState("idle", "Escuta ambiente desativada.");
}

function clapCalibrationLabel(text: string) {
    runtime.$("#clap-calibration-status").textContent = text;
}

function updateClapPreference(enabled: boolean, persist = true) {
    runtime.clapToggle.checked = enabled;
    runtime.$("#clap-calibration-panel").hidden = !enabled;
    if (persist)
        localStorage.setItem("trace-claps-enabled", String(enabled));
    if (!enabled) {
        runtime.store.lastClap = 0;
        runtime.store.quietFramesAfterFirstClap = 0;
        runtime.store.clapCalibrationUntil = 0;
        runtime.store.clapCalibrationSamples = [];
    }
    if (runtime.store.state === "idle")
        runtime.controllers.core.setState("idle", runtime.controllers.core.idleWakeCopy(), false);
}

function saveClapCalibration() {
    if (runtime.store.clapCalibrationSamples.length < 2)
        return false;
    const usable = runtime.store.clapCalibrationSamples.slice(-2);
    runtime.store.customClapPeak = Math.max(0.035, Math.min(...usable.map((sample) => sample.peak)) * 0.58);
    runtime.store.customClapRms = Math.max(0.006, Math.min(...usable.map((sample) => sample.rms)) * 0.55);
    localStorage.setItem("trace-clap-peak", runtime.store.customClapPeak.toFixed(5));
    localStorage.setItem("trace-clap-rms", runtime.store.customClapRms.toFixed(5));
    runtime.store.clapCalibrationUntil = 0;
    clapCalibrationLabel("Calibrado para este microfone · duas palmas reconhecidas.");
    runtime.micStatus.textContent = "PALMAS · PERSONALIZADO";
    return true;
}

async function startClapCalibration() {
    updateClapPreference(true);
    if (!runtime.store.ambient)
        await startAmbient();
    if (!runtime.store.ambient)
        return;
    runtime.store.clapCalibrationSamples = [];
    runtime.store.lastCalibrationSampleAt = 0;
    runtime.store.clapCalibrationUntil = performance.now() + 9000;
    clapCalibrationLabel("Bata duas palmas naturais, com um pequeno intervalo.");
    runtime.controllers.core.setState("listening", "Calibrando palmas · 0 de 2");
}

function resetClapCalibration() {
    runtime.store.customClapPeak = 0;
    runtime.store.customClapRms = 0;
    runtime.store.clapCalibrationUntil = 0;
    runtime.store.clapCalibrationSamples = [];
    localStorage.removeItem("trace-clap-peak");
    localStorage.removeItem("trace-clap-rms");
    clapCalibrationLabel("Modo automático ativo · adaptado ao ruído do ambiente.");
}

function monitor(data: Float32Array) {
    let sum = 0, differenceSum = 0, peak = 0, crossings = 0, previous = data[0] ?? 0;
    for (const x of data) {
        sum += x * x;
        const difference = x - previous;
        differenceSum += difference * difference;
        peak = Math.max(peak, Math.abs(x));
        if ((x >= 0) !== (previous >= 0))
            crossings++;
        previous = x;
    }
    const rms = Math.sqrt(sum / data.length);
    const zeroCrossingRate = crossings / data.length;
    const crestFactor = peak / Math.max(rms, 0.001);
    const transientFlux = Math.sqrt(differenceSum / data.length) / Math.max(rms, 0.001);
    if (runtime.store.capture === "none" && !runtime.store.assistantSpeaking) {
        const rate = runtime.store.calibrationFrames < 45 ? 0.08 : 0.002;
        runtime.store.noiseFloor = runtime.store.noiseFloor * (1 - rate) + Math.min(rms, 0.04) * rate;
        runtime.store.calibrationFrames++;
        if (runtime.store.calibrationFrames === 45) {
            runtime.micStatus.textContent = runtime.store.nativeWakeReady ? "ATIVO · PALAVRA-CHAVE LEVE"
                : "ATIVO · CALIBRADO";
            void window.traceNative?.report_mic?.(0, runtime.micStatus.textContent);
            runtime.controllers.core.setState("idle", "Microfone calibrado · diga “Acorde, Trace” para conversar");
        }
    }
    const range = Math.max(0.018, runtime.store.noiseFloor * 6);
    const normalized = Math.max(0, (rms - runtime.store.noiseFloor * 0.72) / range);
    runtime.store.micLevel = runtime.store.micLevel * 0.62 + normalized * 0.38;
    const visibleLevel = Math.min(1, runtime.store.micLevel);
    runtime.compactOverlay.style.setProperty("--voice", String(visibleLevel));
    runtime.micLevelBar.style.transform = `scaleX(${visibleLevel})`;
    if (runtime.nativeMode === "overlay" && Math.random() < 0.22)
        void window.traceNative?.report_mic?.(visibleLevel);
    const now = performance.now();
    runtime.store.preRoll.push(data);
    if (runtime.store.preRoll.length > 8)
        runtime.store.preRoll.shift();
    const quietBefore = runtime.store.quietFrames;
    if (rms < Math.max(0.006, runtime.store.noiseFloor * 1.55))
        runtime.store.quietFrames++;
    else
        runtime.store.quietFrames = 0;
    if (runtime.store.lastClap && rms < Math.max(0.006, runtime.store.noiseFloor * 1.65))
        runtime.store.quietFramesAfterFirstClap++;
    const automaticClapPeak = Math.max(0.052, runtime.store.noiseFloor * 7.2) / runtime.store.sensitivity, automaticClapRms = Math.max(0.0085, runtime.store.noiseFloor * 2.15) / runtime.store.sensitivity, clapPeak = runtime.store.customClapPeak || automaticClapPeak, clapRms = runtime.store.customClapRms || automaticClapRms;
    const calibrationTransient = runtime.clapToggle.checked &&
        now < runtime.store.clapCalibrationUntil &&
        now - runtime.store.lastCalibrationSampleAt > 240 &&
        quietBefore >= 1 &&
        peak > Math.max(0.032, runtime.store.noiseFloor * 4.2) / runtime.store.sensitivity &&
        rms > Math.max(0.0055, runtime.store.noiseFloor * 1.35) / runtime.store.sensitivity &&
        crestFactor > 1.65 &&
        transientFlux > 0.34;
    if (calibrationTransient) {
        runtime.store.lastCalibrationSampleAt = now;
        runtime.store.clapCalibrationSamples.push({ peak, rms });
        clapCalibrationLabel(`Palma ${Math.min(2, runtime.store.clapCalibrationSamples.length)} de 2 reconhecida.`);
        runtime.controllers.core.setState("listening", `Calibrando palmas · ${Math.min(2, runtime.store.clapCalibrationSamples.length)} de 2`);
        if (saveClapCalibration())
            runtime.controllers.core.setState("idle", "Palmas calibradas e prontas.");
        runtime.store.lastRms = rms;
        return;
    }
    if (runtime.store.clapCalibrationUntil && now >= runtime.store.clapCalibrationUntil) {
        runtime.store.clapCalibrationUntil = 0;
        runtime.store.clapCalibrationSamples = [];
        clapCalibrationLabel("Não capturei duas palmas. Tente novamente mais perto do microfone.");
        runtime.controllers.core.setState("idle", "Calibração encerrada sem alterar seus limites.");
    }
    if (runtime.store.assistantSpeaking) {
        const interruptionGate = Math.max(0.032, runtime.store.noiseFloor * 4.6) / runtime.store.sensitivity;
        if (runtime.bargeInToggle.checked &&
            rms > interruptionGate &&
            peak > interruptionGate * 1.8 &&
            zeroCrossingRate > 0.018)
            runtime.store.bargeInFrames++;
        else
            runtime.store.bargeInFrames = Math.max(0, runtime.store.bargeInFrames - 1);
        if (runtime.store.bargeInFrames >= 5) {
            runtime.store.bargeInFrames = 0;
            stopCurrentSpeech();
            void runtime.nativeCall("show_orb");
            beginCommand("Pode falar.", false);
        }
        runtime.store.lastRms = rms;
        return;
    }
    if (runtime.clapToggle.checked &&
        runtime.store.capture === "none" &&
        now >= runtime.store.clapCooldownUntil &&
        now - runtime.store.lastTypingAt > 900 &&
        quietBefore >= 2 &&
        peak > clapPeak &&
        rms > clapRms &&
        crestFactor > 2.05 &&
        transientFlux > 0.42 &&
        peak / Math.max(runtime.store.lastRms, runtime.store.noiseFloor, 0.001) > 2.15 &&
        zeroCrossingRate > 0.025 &&
        zeroCrossingRate < 0.48) {
        if (now - runtime.store.lastClap > 260 &&
            now - runtime.store.lastClap < 1120 &&
            runtime.store.quietFramesAfterFirstClap >= 1) {
            runtime.store.lastClap = 0;
            runtime.store.quietFramesAfterFirstClap = 0;
            runtime.store.clapCooldownUntil = now + 2400;
            runtime.micStatus.textContent = "DUAS PALMAS · OUVINDO";
            playCue();
            if (runtime.store.activeTranscription) {
                runtime.store.activeTranscription.abort();
                runtime.store.activeTranscription = null;
                runtime.store.transcriptionBusy = false;
                void fetch("/api/voice/stop", { method: "POST" }).catch(() => undefined);
            }
            void Promise.resolve(runtime.nativeCall("toggle_compact_visibility")).then((visible) => {
                if (visible)
                    beginCommand("Pode falar.", false);
                else
                    closeVoiceSession();
            });
            return;
        }
        if (now - runtime.store.lastClap > 260) {
            runtime.store.lastClap = now;
            runtime.store.quietFramesAfterFirstClap = 0;
            runtime.micStatus.textContent = "PALMA 1/2";
            setTimeout(() => {
                if (runtime.store.lastClap && performance.now() - runtime.store.lastClap > 1120) {
                    runtime.store.lastClap = 0;
                    runtime.store.quietFramesAfterFirstClap = 0;
                    runtime.micStatus.textContent = "ATIVO · CALIBRADO";
                }
            }, 1200);
            runtime.store.lastRms = rms;
            return;
        }
    }
    runtime.store.lastRms = rms;
    if (runtime.store.transcriptionBusy ||
        runtime.store.state === "thinking" ||
        runtime.store.state === "executing" ||
        runtime.store.state === "speaking") {
        runtime.store.lastRms = rms;
        return;
    }
    if (runtime.store.capture === "none") {
        // O Whisper nunca fica ouvindo o ambiente. Acordar usa a gramática leve
        // do Windows; se ela estiver indisponível, palmas e botão continuam ativos.
        return;
    }
    runtime.store.chunks.push(data);
    if (rms > Math.max(0.0055, runtime.store.noiseFloor * 1.45)) {
        runtime.store.speechStarted = true;
        runtime.store.voicedFrames++;
        runtime.store.silenceSince = 0;
    }
    else if (runtime.store.speechStarted && !runtime.store.silenceSince)
        runtime.store.silenceSince = now;
    const finished = runtime.store.speechStarted &&
        runtime.store.silenceSince > 0 &&
        now - runtime.store.silenceSince > 940 &&
        now - runtime.store.captureStarted > 700;
    if (finished || now - runtime.store.captureStarted > (runtime.store.capture === "command" ? 9000 : 5000))
        void finishCapture();
}

function openVoiceSession() {
    runtime.store.voiceSessionUntil = performance.now() + 28000;
}

function closeVoiceSession() {
    runtime.store.voiceSessionUntil = 0;
    runtime.store.capture = "none";
    runtime.store.chunks = [];
    runtime.store.speechStarted = false;
    runtime.store.voicedFrames = 0;
}

function beginCommand(text = "Estou ouvindo.", openCompact = true) {
    interruptInteraction();
    openVoiceSession();
    runtime.store.capture = "command";
    runtime.store.chunks = [];
    runtime.store.speechStarted = false;
    runtime.store.voicedFrames = 0;
    runtime.store.silenceSince = 0;
    runtime.store.captureStarted = performance.now();
    runtime.controllers.core.setState("listening", text);
    playCue();
    if (openCompact)
        void runtime.nativeCall("wake_compact");
}

function isLikelyNoiseTranscript(text: string) {
    const normalized = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (normalized.length < 3 || !/[a-z]{2}/.test(normalized))
        return true;
    if (/^(ah|ha|hum|hm|uh|um|e|oi)$/.test(normalized))
        return true;
    return /^(risos?|musica|aplausos?|silencio|ruido|som de .+|inaudivel)$/.test(normalized);
}

function wakeAssistant(text = "TRACE pronto.") {
    openVoiceSession();
    runtime.store.capture = "none";
    runtime.store.chunks = [];
    runtime.store.speechStarted = false;
    runtime.store.voicedFrames = 0;
    runtime.controllers.core.setState("idle", text);
    playCue();
    void runtime.nativeCall("show_orb");
}

async function manualListen() {
    if (!runtime.store.ambient) {
        await startAmbient();
        if (!runtime.store.ambient)
            return;
    }
    beginCommand("Estou ouvindo.", false);
}

async function finishCapture() {
    if (runtime.store.transcriptionBusy)
        return;
    const purpose = runtime.store.capture, heardSpeech = runtime.store.speechStarted, audio = runtime.store.chunks, speechEvidence = runtime.store.voicedFrames;
    runtime.store.capture = "none";
    runtime.store.chunks = [];
    runtime.store.speechStarted = false;
    runtime.store.voicedFrames = 0;
    if (audio.length < 5 || !heardSpeech || speechEvidence < 4) {
        if (purpose === "command")
            runtime.controllers.core.setState("idle", "Não detectei fala. Pode tentar novamente.");
        return;
    }
    runtime.store.transcriptionBusy = true;
    if (purpose === "command")
        runtime.controllers.core.setState("thinking", "Entendendo seu comando…");
    let timer = 0;
    try {
        const controller = new AbortController();
        runtime.store.activeTranscription = controller;
        timer = window.setTimeout(() => controller.abort(), purpose === "wake" ? 18000 : 45000);
        const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "audio/wav", "X-Trace-Purpose": purpose },
            body: encodeWav(audio, runtime.store.sampleRate),
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!response.ok)
            throw new Error(`Falha no reconhecimento de voz (${response.status}).`);
        const data = (await response.json()) as {
            ok: boolean;
            text: string;
            message: string;
        };
        if (!data.ok || !data.text?.trim())
            throw new Error(data.message || "Não consegui reconhecer essa fala.");
        const spoken = data.text.trim();
        if (isLikelyNoiseTranscript(spoken)) {
            if (purpose === "command")
                runtime.controllers.core.setState("idle", "Ouvi apenas ruído. Continuo aguardando seu comando.");
            runtime.store.nextWakeCaptureAt = performance.now() + 1600;
            return;
        }
        const normalized = spoken
            .toLocaleLowerCase("pt-BR")
            .replace(/[,.!?]/g, "")
            .trim();
        const traceName = "(?:trace|tracer|tr[êe]s|treice|treicer|tracy|tracey|trece|traze)";
        const rest = new RegExp(`^(?:(?:descanse|durma|desligue)\\s*${traceName}|${traceName}\\s*(?:descanse|durma|desligue))`, "i").test(normalized);
        const wake = new RegExp(`^(?:acord(?:e|a)\\s*${traceName}|${traceName}\\s*acord(?:e|a))`, "i").test(normalized);
        if (rest) {
            closeVoiceSession();
            interruptInteraction();
            runtime.controllers.core.setState("idle", "TRACE pronto.");
            void runtime.nativeCall("sleep_assistant");
            return;
        }
        if (purpose === "wake") {
            if (wake) {
                wakeAssistant("Pode falar.");
                beginCommand("Pode falar.", false);
                return;
            }
            runtime.store.nextWakeCaptureAt = performance.now() + 1800;
            return;
        }
        else
            await runtime.controllers.chat.askTrace(spoken, true);
    }
    catch (e) {
        const msg = (e as DOMException).name === "AbortError"
            ? "O reconhecimento de voz demorou demais. Tente novamente."
            : e instanceof Error
                ? e.message
                : "Não consegui entender.";
        if (purpose === "command") {
            runtime.controllers.chat.addMessage("trace", msg);
            runtime.controllers.core.setState("error", msg);
        }
        else {
            runtime.store.nextWakeCaptureAt = performance.now() + 1400;
            runtime.controllers.core.setState("idle", "Escuta ambiente ativa.");
        }
    }
    finally {
        if (timer)
            clearTimeout(timer);
        runtime.store.activeTranscription = null;
        runtime.store.transcriptionBusy = false;
    }
}

export const audioController = {
  encodeWav,
  playCue,
  stopCurrentSpeech,
  interruptInteraction,
  startAmbient,
  stopAmbient,
  clapCalibrationLabel,
  updateClapPreference,
  saveClapCalibration,
  startClapCalibration,
  resetClapCalibration,
  monitor,
  openVoiceSession,
  closeVoiceSession,
  beginCommand,
  isLikelyNoiseTranscript,
  wakeAssistant,
  manualListen,
  finishCapture,
};
