import * as runtime from "./runtime";

function compactPreview(role: "trace" | "user", text: string) {
    const target = role === "user" ? runtime.compactLastUser : runtime.compactLastTrace;
    target.textContent = text.length > 150 ? `${text.slice(0, 147)}…` : text;
    target.className = `compact-history-line ${role}`;
}

function renderAttachments() {
    runtime.attachmentList.replaceChildren();
    runtime.store.pendingAttachments.forEach((file, index) => {
        const chip = document.createElement("div");
        chip.className = "attachment-chip";
        const name = document.createElement("span");
        name.textContent = file.name;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.onclick = () => {
            runtime.store.pendingAttachments.splice(index, 1);
            renderAttachments();
        };
        chip.append(name, remove);
        runtime.attachmentList.append(chip);
    });
}

function currentPermissions() {
    return {
        files: runtime.permissionFiles.checked,
        images: runtime.permissionImages.checked,
        screen: runtime.permissionScreen.checked,
        apps: runtime.permissionApps.checked,
        edits: runtime.permissionEdits.checked,
    };
}

function finishWithInputModality(fromVoice: boolean) {
    if (fromVoice)
        runtime.controllers.audio.closeVoiceSession();
    if (runtime.responseMode.value === "always" ||
        (runtime.responseMode.value === "smart" && fromVoice))
        void runtime.controllers.speech.speak(runtime.store.lastTraceReply);
    else
        runtime.controllers.speech.finishSpeech();
}

function needsScreenContext(prompt: string) {
    return /(?:nesta|nessa|essa|minha)\s+(?:tela|janela)|o que (?:está|esta) (?:na|minha) tela|veja (?:a tela|isso aqui)|(?:esse|este) erro (?:aqui|na tela)|analise (?:minha|esta) tela/i.test(prompt);
}

async function saveDocument(data: {
    format: "pdf" | "docx" | "txt";
    text: string;
    bytes?: string;
}): Promise<boolean> {
    const result = await window.traceNative?.save_document?.(data);
    if (result?.ok) {
        runtime.controllers.core.setState("idle", "Documento salvo.");
        return true;
    }
    if (result?.reason === "cancelled") {
        runtime.controllers.core.setState("idle", "Salvamento cancelado.");
        return false;
    }
    runtime.controllers.core.setState("error", "Não foi possível salvar o documento.");
    return false;
}

async function performSuggestion(label: string) {
    const action = label.toLocaleLowerCase("pt-BR");
    if (action.includes("copiar")) {
        await navigator.clipboard.writeText(runtime.store.lastTraceReply);
        runtime.controllers.core.setState("idle", "Resposta copiada.");
    }
    else if (action.includes("salvar") && runtime.store.lastTraceReply) {
        if (!runtime.permissionEdits.checked)
            runtime.controllers.core.openSettings("permissions");
        else
            void saveDocument({
                format: "pdf",
                text: runtime.store.lastTraceReply,
            });
    }
    else if (action.includes("aplicativo")) {
        if (runtime.nativeMode === "overlay") {
            void runtime.broadcast({ type: "open-settings", page: "apps" });
            void runtime.nativeCall("show_dashboard");
        }
        else
            runtime.controllers.core.openSettings("apps");
        if (action.includes("atualizar"))
            void runtime.controllers.apps.refreshAuthorizedApps();
    }
    else if (action.includes("interface"))
        void runtime.nativeCall("show_dashboard");
    else if (action.includes("permiss") || action.includes("configur"))
        runtime.controllers.core.openSettings("permissions");
    else if (action.includes("resum"))
        void askTrace("Resuma sua resposta anterior em poucos tópicos.");
    else if (action.includes("aprofund"))
        void askTrace("Aprofunde a resposta anterior com os detalhes mais úteis.");
    else if (action.includes("corrigir"))
        void askTrace("Proponha uma correção prática para o código ou erro anterior.");
    else
        void askTrace(label);
}

function renderSuggestions(items: string[], share = true) {
    const unique = [...new Set(items)].slice(0, 3);
    for (const target of [runtime.$("#suggestion-strip"), runtime.$("#compact-suggestions")]) {
        target.replaceChildren();
        for (const label of unique) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.addEventListener("click", () => void performSuggestion(label));
            target.append(button);
        }
    }
    if (share && runtime.nativeMode)
        void runtime.broadcast({ type: "suggestions", items: unique });
}

async function exportDocument(format: "pdf" | "docx" | "txt", text: string) {
    if (format !== "docx") {
        await saveDocument({ format, text });
        return;
    }
    const requestDocx = () => fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    let response = await requestDocx();
    if (!response.ok &&
        confirm("Para exportar em Word, o TRACE precisa preparar o módulo local de documentos. Autorizar agora?")) {
        const setup = await fetch("/api/setup/documents", { method: "POST" });
        if (setup.ok)
            response = await requestDocx();
    }
    if (!response.ok) {
        runtime.controllers.core.setState("error", "O módulo DOCX ainda não está preparado.");
        return;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    await saveDocument({
        format,
        text,
        bytes: btoa(binary),
    });
}

function addMessage(role: "trace" | "user", text: string, share = true, id: string = crypto.randomUUID()) {
    if (runtime.seenMessages.has(id))
        return null;
    runtime.seenMessages.add(id);
    if (role === "trace")
        runtime.store.lastTraceReply = text;
    compactPreview(role, text);
    const d = document.createElement("div");
    d.className = `message ${role}`;
    d.dataset.messageId = id;
    const a = document.createElement("span");
    a.textContent = role === "trace" ? "T" : "P";
    const p = document.createElement("p");
    p.textContent = text;
    d.append(a, p);
    if (role === "trace" && runtime.nativeMode === "dashboard") {
        const tools = document.createElement("div");
        tools.className = "message-tools";
        for (const [label, format] of [
            ["PDF", "pdf"],
            ["WORD", "docx"],
            ["TXT", "txt"],
        ] as const) {
            const save = document.createElement("button");
            save.type = "button";
            save.textContent = `SALVAR ${label}`;
            save.onclick = () => {
                if (!runtime.permissionEdits.checked) {
                    runtime.controllers.core.openSettings("permissions");
                    return;
                }
                void exportDocument(format, p.textContent || text);
            };
            tools.append(save);
        }
        d.append(tools);
    }
    runtime.messages.append(d);
    runtime.messages.scrollTop = runtime.messages.scrollHeight;
    if (share && runtime.nativeMode)
        void runtime.broadcast({ type: "message", id, role, text });
    return p;
}

async function askTrace(prompt: string, fromVoice = false) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt && !runtime.store.pendingAttachments.length)
        return;
    runtime.controllers.audio.interruptInteraction();
    if (runtime.nativeMode)
        void runtime.broadcast({ type: "interrupt" });
    const generation = runtime.store.interactionGeneration;
    const controller = new AbortController();
    runtime.store.activeRequest = controller;
    const compactInput = runtime.$<HTMLInputElement>("#compact-input");
    const releaseInputs = () => {
        if (runtime.store.activeRequest === controller)
            runtime.store.activeRequest = null;
        runtime.promptInput.disabled = false;
        compactInput.disabled = false;
    };
    let files = runtime.store.pendingAttachments;
    runtime.store.pendingAttachments = [];
    renderAttachments();
    runtime.controllers.core.setState("thinking", "Pensando…");
    runtime.promptInput.disabled = true;
    compactInput.disabled = true;
    const screenRequested = needsScreenContext(cleanPrompt);
    if (screenRequested && !runtime.permissionScreen.checked) {
        addMessage("user", cleanPrompt);
        const reply = "Para compreender o que está na tela, ative a permissão “Compreender a tela atual”.";
        addMessage("trace", reply);
        renderSuggestions(["Configurar permissão", "Copiar resposta"]);
        runtime.controllers.core.setState("idle", "Permissão de tela necessária.");
        releaseInputs();
        return;
    }
    if (screenRequested && runtime.permissionScreen.checked) {
        runtime.controllers.core.setState("thinking", "Compreendendo a tela atual…");
        const capture = await window.traceNative?.capture_screen?.();
        if (!capture || !capture.ok) {
            addMessage("user", cleanPrompt);
            if (capture?.reason === "cancelled") {
                addMessage("trace", "Captura da tela cancelada.");
                runtime.controllers.core.setState("idle", "Continuo disponível.");
            }
            else {
                addMessage("trace", "Não consegui capturar a tela atual. Tente abrir o Lumi novamente.");
                runtime.controllers.core.setState("error", "Captura da tela indisponível.");
            }
            releaseInputs();
            return;
        }
        if (!capture.value) {
            addMessage("user", cleanPrompt);
            addMessage("trace", "Não consegui capturar a tela atual. Tente abrir o Lumi novamente.");
            runtime.controllers.core.setState("error", "Captura da tela indisponível.");
            releaseInputs();
            return;
        }
        files = [...files, capture.value].slice(0, 4);
    }
    const visiblePrompt = [
        cleanPrompt || "Analise os arquivos anexados.",
        files.length ? `ANEXOS · ${files.map((f) => f.name).join(" · ")}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");
    addMessage("user", visiblePrompt);
    const looksLikeRoutine = /\b(rotina|modo)\b/i.test(cleanPrompt);
    const looksLikeAppLaunch = /\b(abra|abre|abrir|inicia|inicie|iniciar|executa|execute|executar|roda|rode|rodar|lan[çc]a|lance|lan[çc]ar|mostra|mostre)\b/i.test(cleanPrompt);
    const looksLikeAppAction = looksLikeRoutine || looksLikeAppLaunch;
    if (/\b(abra|abrir|mostre)\b.*\b(interface|painel|tela principal)\b/i.test(cleanPrompt)) {
        const reply = "Abrindo a interface principal.";
        addMessage("trace", reply);
        runtime.controllers.core.setState("idle");
        void runtime.nativeCall("show_dashboard");
        finishWithInputModality(fromVoice);
        releaseInputs();
        return;
    }
    if (looksLikeAppAction && !runtime.permissionApps.checked) {
        const reply = "A abertura de aplicativos está desativada. Ative “Abrir aplicativos permitidos” nas configurações e marque os programas autorizados.";
        addMessage("trace", reply);
        renderSuggestions(["Configurar aplicativos", "Abrir interface"]);
        runtime.controllers.core.setState("idle", "Permissão para aplicativos necessária.");
        finishWithInputModality(fromVoice);
        releaseInputs();
        return;
    }
    if (looksLikeAppAction &&
        runtime.permissionApps.checked &&
        runtime.approvalMode.value === "always") {
        if (runtime.nativeMode === "overlay")
            await runtime.nativeCall("wake_compact");
        if (!confirm(`O TRACE identificou uma ação local:\n\n${cleanPrompt}\n\nAutorizar desta vez?`)) {
            const reply = "Ação cancelada. Continuo disponível.";
            addMessage("trace", reply);
            runtime.controllers.core.setState("idle", reply);
            finishWithInputModality(fromVoice);
            releaseInputs();
            return;
        }
    }
    if (looksLikeAppAction && runtime.permissionApps.checked) {
        const routine = await window.traceNative?.run_routine?.(cleanPrompt);
        if (routine?.ok) {
            const opened = routine.opened?.length
                ? ` Abri ${routine.opened.join(", ")}.`
                : "";
            const reply = `Rotina ${routine.name} iniciada.${opened}`;
            addMessage("trace", reply);
            renderSuggestions(["Abrir interface", "Copiar resposta"]);
            finishWithInputModality(fromVoice);
            releaseInputs();
            return;
        }
        const launched = await window.traceNative?.launch_app?.(cleanPrompt);
        if (launched?.ok) {
            const reply = `Abrindo ${launched.name ?? "o aplicativo"}.`;
            addMessage("trace", reply);
            renderSuggestions(["Abrir interface", "Copiar resposta"]);
            finishWithInputModality(fromVoice);
            releaseInputs();
            return;
        }
        const reply = launched?.reason === "launch_failed"
            ? `Encontrei ${launched.name ?? "o aplicativo"}, mas o Windows não conseguiu abri-lo.`
            : "Não encontrei esse aplicativo entre os programas autorizados. Abra Configurações → Aplicativos e marque-o na lista.";
        addMessage("trace", reply);
        renderSuggestions(["Configurar aplicativos", "Atualizar lista"]);
        runtime.controllers.core.setState("idle", "Aplicativo não disponível.");
        finishWithInputModality(fromVoice);
        releaseInputs();
        return;
    }
    if (/\b(descanse|durma|desligue)\b.*\btrace\b/i.test(cleanPrompt)) {
        addMessage("trace", "Entrando em espera.");
        runtime.controllers.audio.closeVoiceSession();
        runtime.controllers.core.setState("idle", "TRACE pronto.");
        void runtime.nativeCall("sleep_assistant");
        releaseInputs();
        return;
    }
    const started = performance.now();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, 70000);
    try {
        const permissions = currentPermissions(), attachments = files.filter((f) => f.name === "tela-atual.jpg"
            ? permissions.screen
            : permissions.files &&
                (permissions.images ||
                    !["png", "jpg", "jpeg", "webp"].includes(f.type)));
        const res = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: cleanPrompt,
                model: runtime.modelInput.value,
                attachments,
                permissions,
                profile: runtime.intelligenceProfile.value,
                personalization: {
                    name: runtime.userName.value.trim(),
                    style: runtime.responseStyle.value,
                },
            }),
            signal: controller.signal,
        });
        if (!res.ok)
            throw new Error(`Núcleo local retornou erro ${res.status}.`);
        if (!res.body)
            throw new Error("O núcleo não iniciou a resposta contínua.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const responseId = crypto.randomUUID();
        let buffer = "";
        let streamedReply = "";
        let replyNode: HTMLParagraphElement | null = null;
        let suggestions: string[] = [];
        let action = "";
        const consumeEvent = (event: {
            type: "delta" | "done";
            text?: string;
            reply?: string;
            suggestions?: string[];
            action?: string;
        }) => {
            if (event.type === "delta" && event.text) {
                streamedReply += event.text;
                if (!replyNode)
                    replyNode = addMessage("trace", "", false, responseId);
                if (replyNode) {
                    replyNode.textContent = streamedReply;
                    replyNode.parentElement?.classList.add("streaming");
                }
                runtime.store.lastTraceReply = streamedReply;
                compactPreview("trace", streamedReply);
                runtime.messages.scrollTop = runtime.messages.scrollHeight;
                runtime.controllers.core.setState("thinking", "Respondendo em tempo real…");
            }
            else if (event.type === "done") {
                streamedReply = event.reply?.trim() || streamedReply.trim();
                suggestions = event.suggestions ?? [];
                action = event.action ?? "";
            }
        };
        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines)
                if (line.trim())
                    consumeEvent(JSON.parse(line));
            if (done)
                break;
        }
        if (buffer.trim())
            consumeEvent(JSON.parse(buffer));
        if (!streamedReply.trim())
            throw new Error("O modelo retornou uma resposta vazia.");
        if (generation !== runtime.store.interactionGeneration)
            return;
        let finalReplyNode = runtime.messages.querySelector<HTMLParagraphElement>(`.message[data-message-id="${responseId}"] p`);
        if (!finalReplyNode)
            finalReplyNode = addMessage("trace", streamedReply, false, responseId);
        else
            finalReplyNode.textContent = streamedReply;
        finalReplyNode?.parentElement?.classList.remove("streaming");
        runtime.store.lastTraceReply = streamedReply;
        compactPreview("trace", streamedReply);
        if (runtime.nativeMode)
            void runtime.broadcast({
                type: "message",
                id: responseId,
                role: "trace",
                text: streamedReply,
            });
        runtime.$("#latency-readout").textContent =
            `${((performance.now() - started) / 1000).toFixed(1)}s`;
        if (action)
            runtime.controllers.core.setState("executing", action);
        renderSuggestions(suggestions.length
            ? suggestions
            : ["Aprofundar", "Resumir", "Copiar resposta"]);
        if (fromVoice)
            runtime.controllers.audio.closeVoiceSession();
        if (runtime.responseMode.value === "always" ||
            (runtime.responseMode.value === "smart" && fromVoice))
            void runtime.controllers.speech.speak(streamedReply);
        else
            runtime.controllers.speech.finishSpeech();
    }
    catch (e) {
        if (generation === runtime.store.interactionGeneration &&
            (timedOut || (e as DOMException).name !== "AbortError")) {
            const detail = timedOut
                ? "A resposta local demorou mais de 70 segundos. O TRACE foi liberado para tentar de novo."
                : e instanceof Error
                    ? e.message
                    : "Meu núcleo local não respondeu.";
            addMessage("trace", detail);
            runtime.controllers.core.setState("error", detail);
        }
    }
    finally {
        clearTimeout(timeout);
        if (runtime.store.activeRequest === controller)
            runtime.store.activeRequest = null;
        releaseInputs();
        runtime.promptInput.focus();
    }
}

async function loadHistory() {
    try {
        const data = (await fetch("/api/history").then((r) => r.json())) as {
            messages: {
                role: string;
                content: string;
            }[];
        };
        runtime.messages.replaceChildren();
        for (const [index, item] of data.messages.entries())
            if (item.role === "user" || item.role === "assistant")
                addMessage(item.role === "user" ? "user" : "trace", item.content, false, `history-${index}-${item.content.slice(0, 20)}`);
        if (!data.messages.length)
            addMessage("trace", "Sistemas locais preparados. Como posso ajudar?", false, "welcome");
    }
    catch {
        /* histórico opcional */
    }
}

export const chatController = {
  compactPreview,
  renderAttachments,
  currentPermissions,
  finishWithInputModality,
  needsScreenContext,
  performSuggestion,
  renderSuggestions,
  exportDocument,
  addMessage,
  askTrace,
  loadHistory,
};
