import * as runtime from "./runtime";
import type { TraceState, SettingsPage, Health } from "./types";

export function initializeApp(): void {
  runtime.$("#prompt-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = runtime.promptInput.value.trim();
      if (v) {
          runtime.promptInput.value = "";
          void runtime.controllers.chat.askTrace(v);
      }
  });
  runtime.$("#compact-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = runtime.$<HTMLInputElement>("#compact-input"), v = input.value.trim();
      if (v) {
          input.value = "";
          void runtime.controllers.chat.askTrace(v);
      }
  });
  runtime.activateButton.addEventListener("click", () => {
      if (runtime.nativeMode === "dashboard")
          void window.traceNative?.start_listening?.();
      else
          void runtime.controllers.audio.manualListen();
  });
  runtime.ambientButton.addEventListener("click", () => {
      if (runtime.nativeMode === "dashboard") {
          runtime.ambientToggle.checked = !runtime.ambientToggle.checked;
          runtime.ambientButton.textContent = runtime.ambientToggle.checked
              ? "AMBIENTE ATIVO"
              : "ATIVAR AMBIENTE";
          void window.traceNative?.set_ambient?.(runtime.ambientToggle.checked);
      }
      else
          runtime.store.ambient ? runtime.controllers.audio.stopAmbient() : void runtime.controllers.audio.startAmbient();
  });
  runtime.$("#attach-button").addEventListener("click", async () => {
      if (!runtime.permissionFiles.checked) {
          runtime.controllers.core.openSettings("permissions");
          return;
      }
      const selected = (await window.traceNative?.select_files?.()) ?? [];
      if (!selected.length)
          return;
      if (selected.some((file) => ["pdf", "docx"].includes(file.type))) {
          const status = (await fetch("/api/health").then((r) => r.json())) as Health;
          if (!status.document_ready) {
              if (!confirm("Para ler PDF/DOCX e reconhecer páginas digitalizadas, o TRACE precisa instalar o módulo local de documentos. Nada será enviado para a internet. Autorizar agora?"))
                  return;
              const setup = (await fetch("/api/setup/documents", {
                  method: "POST",
              }).then((r) => r.json())) as {
                  ok: boolean;
                  message: string;
              };
              if (!setup.ok) {
                  runtime.controllers.chat.addMessage("trace", setup.message);
                  return;
              }
          }
      }
      runtime.store.pendingAttachments = [...runtime.store.pendingAttachments, ...selected].slice(0, 4);
      runtime.controllers.chat.renderAttachments();
  });
  runtime.$("#compact-button").addEventListener("click", () => runtime.nativeMode === "dashboard"
      ? void runtime.nativeCall("enter_compact")
      : runtime.nativeMode ? void runtime.nativeCall("collapse_overlay")
          : runtime.controllers.core.setView("compact"));
  runtime.$("#voice-mode-button").addEventListener("click", () => runtime.controllers.system.setVoiceMode(!runtime.store.voiceEnabled));
  runtime.responseMode.addEventListener("change", runtime.controllers.system.updateVoiceButton);
  runtime.$("#voice-test-button").addEventListener("click", () => {
      if (runtime.voiceProfile.value === "silent")
          runtime.voiceProfile.value = "female";
      runtime.controllers.system.setVoiceMode(true);
      void runtime.controllers.speech.speak("Olá. A voz do TRACE está funcionando.");
  });
  runtime.systemVoiceChoice.addEventListener("change", () => {
      localStorage.setItem("trace-system-voice", runtime.systemVoiceChoice.value);
      const selected = runtime.controllers.speech.availablePortugueseVoices().find((voice) => voice.name === runtime.systemVoiceChoice.value);
      runtime.$("#selected-voice-status").textContent = selected
          ? `Selecionada: ${selected.name}${selected.localService ? " · offline" : " · natural online"}.`
          : "Seleção automática ativa · priorizando voz feminina Natural.";
  });
  runtime.$("#clap-calibration-button").addEventListener("click", () => {
      runtime.controllers.audio.updateClapPreference(true);
      if (runtime.nativeMode === "dashboard" && window.traceNative?.calibrate_claps) {
          runtime.controllers.audio.clapCalibrationLabel("Calibração iniciada · bata duas palmas e acompanhe o núcleo.");
          void window.traceNative.calibrate_claps();
      }
      else
          void runtime.controllers.audio.startClapCalibration();
  });
  runtime.clapToggle.addEventListener("change", () => runtime.controllers.audio.updateClapPreference(runtime.clapToggle.checked));
  runtime.$("#clap-reset-button").addEventListener("click", () => {
      runtime.controllers.audio.resetClapCalibration();
      if (runtime.nativeMode === "dashboard")
          void window.traceNative?.reset_claps?.();
  });
  runtime.$("#expand-button").addEventListener("click", () => {
      clearTimeout(runtime.store.orbClickTimer);
      runtime.store.orbClickTimer = window.setTimeout(() => (runtime.nativeMode ? void runtime.nativeCall("toggle_compact") : runtime.controllers.core.setView("full")), 230);
  });
  runtime.$("#expand-button").addEventListener("dblclick", () => {
      clearTimeout(runtime.store.orbClickTimer);
      runtime.nativeMode ? void runtime.nativeCall("show_dashboard") : runtime.controllers.core.setView("full");
  });
  runtime.$("#settings-button").addEventListener("click", () => runtime.controllers.core.openSettings("general"));
  runtime.$("#clear-button").addEventListener("click", () => fetch("/api/memory", { method: "DELETE" }).then(() => {
      runtime.messages.replaceChildren();
      void runtime.broadcast({ type: "clear" });
  }));
  runtime.$("#notification-button").addEventListener("click", () => {
      runtime.$<HTMLDialogElement>("#notification-dialog").showModal();
  });
  runtime.$("#clear-notifications").addEventListener("click", () => {
      runtime.$("#notification-list").replaceChildren();
      runtime.$("#notification-count").textContent = "0";
  });
  document
      .querySelectorAll<HTMLButtonElement>(".capability-nav button")
      .forEach((button) => {
      const mapping: Record<string, SettingsPage> = {
          approval: "permissions",
          storage: "general",
          voice: "voice",
          extensions: "apps",
      };
      button.addEventListener("click", () => runtime.controllers.core.openSettings(mapping[button.dataset.section ?? ""] ?? "general"));
  });
  document
      .querySelectorAll<HTMLButtonElement>("[data-settings-tab]")
      .forEach((button) => button.addEventListener("click", () => runtime.controllers.core.showSettingsPage(button.dataset.settingsTab as SettingsPage)));
  runtime.$<HTMLInputElement>("#app-search").addEventListener("input", runtime.controllers.apps.renderDetectedApps);
  runtime.$("#rescan-apps-button").addEventListener("click", () => void runtime.controllers.apps.refreshAuthorizedApps());
  runtime.$("#authorize-app-button").addEventListener("click", async () => {
      const app = await window.traceNative?.select_app?.();
      if (app) {
          runtime.permissionApps.checked = true;
          await runtime.controllers.apps.refreshAuthorizedApps();
      }
  });
  runtime.$("#save-routine-button").addEventListener("click", async () => {
      const name = runtime.$<HTMLInputElement>("#routine-name").value.trim();
      const apps = Array.from(document.querySelectorAll<HTMLInputElement>("#routine-app-list input:checked")).map((input) => input.value);
      if (!name || !apps.length) {
          runtime.controllers.core.setState("error", "Dê um nome e escolha pelo menos um aplicativo.");
          return;
      }
      if (await window.traceNative?.save_routine?.({ name, apps })) {
          runtime.$<HTMLInputElement>("#routine-name").value = "";
          await runtime.controllers.apps.refreshRoutines();
          runtime.controllers.core.setState("idle", `Rotina “${name}” criada.`);
      }
  });
  runtime.$("#screen-context-button").addEventListener("click", () => {
      runtime.permissionScreen.checked = !runtime.permissionScreen.checked;
      localStorage.setItem("trace-permission-screen", String(runtime.permissionScreen.checked));
      runtime.controllers.apps.updateScreenPermission();
  });
  runtime.permissionScreen.addEventListener("change", runtime.controllers.apps.updateScreenPermission);
  runtime.approvalMode.addEventListener("change", () => {
      const descriptions: Record<string, string> = {
          standard: "Usa suas permissões e confirma ações sensíveis.",
          always: "Pergunta antes de qualquer ação no computador.",
          autopilot: "Executa ações locais permitidas; ações externas continuam exigindo confirmação.",
      };
      runtime.$("#approval-description").textContent = descriptions[runtime.approvalMode.value];
      runtime.$("#approval-summary").textContent =
          runtime.approvalMode.options[runtime.approvalMode.selectedIndex].text.toUpperCase();
  });
  runtime.installModelButton.addEventListener("click", () => runtime.controllers.system.setup("model", runtime.installModelButton));
  runtime.settingsInstallButton.addEventListener("click", () => runtime.controllers.system.setup("model", runtime.settingsInstallButton));
  runtime.voiceInstallButton.addEventListener("click", () => runtime.controllers.system.setup("voice", runtime.voiceInstallButton));
  runtime.$("#diagnostic-button").addEventListener("click", async () => {
      const saved = await window.traceNative?.generate_diagnostic?.();
      runtime.controllers.core.setState(saved ? "idle" : "error", saved ? "Diagnóstico salvo com segurança." : "Diagnóstico cancelado.");
  });
  runtime.$("#demo-button").addEventListener("click", async () => {
      for (const s of [
          "listening",
          "thinking",
          "executing",
          "speaking",
          "idle",
      ] as TraceState[]) {
          runtime.controllers.core.setState(s);
          await new Promise((r) => setTimeout(r, 700));
      }
  });
  runtime.$("#save-settings").addEventListener("click", () => {
      runtime.store.intense = runtime.$<HTMLInputElement>("#intensity-toggle").checked;
      runtime.store.sensitivity = Number(runtime.sensitivityRange.value) / 100;
      localStorage.setItem("trace-intense", String(runtime.store.intense));
      localStorage.setItem("trace-ambient", String(runtime.ambientToggle.checked));
      localStorage.setItem("trace-claps-enabled", String(runtime.clapToggle.checked));
      localStorage.setItem("trace-keep-compact", String(runtime.keepCompactToggle.checked));
      localStorage.setItem("trace-permission-files", String(runtime.permissionFiles.checked));
      localStorage.setItem("trace-permission-images", String(runtime.permissionImages.checked));
      localStorage.setItem("trace-permission-screen", String(runtime.permissionScreen.checked));
      localStorage.setItem("trace-permission-apps", String(runtime.permissionApps.checked));
      localStorage.setItem("trace-permission-edits", String(runtime.permissionEdits.checked));
      localStorage.setItem("trace-approval-mode", runtime.approvalMode.value);
      localStorage.setItem("trace-sensitivity", runtime.sensitivityRange.value);
      localStorage.setItem("trace-barge-in", String(runtime.bargeInToggle.checked));
      localStorage.setItem("trace-voice-profile", runtime.voiceProfile.value);
      localStorage.setItem("trace-system-voice", runtime.systemVoiceChoice.value);
      localStorage.setItem("trace-response-mode", runtime.responseMode.value);
      localStorage.setItem("trace-response-style", runtime.responseStyle.value);
      localStorage.setItem("trace-user-name", runtime.userName.value.trim());
      localStorage.setItem("trace-intelligence-profile", runtime.intelligenceProfile.value);
      void window.traceNative?.set_startup?.(runtime.startupToggle.checked);
      runtime.controllers.system.setVoiceMode(runtime.voiceProfile.value !== "silent" && runtime.voiceToggle.checked);
      if (runtime.nativeMode === "dashboard")
          void window.traceNative?.set_ambient?.(runtime.ambientToggle.checked);
      else
          runtime.ambientToggle.checked && !runtime.store.ambient
              ? void runtime.controllers.audio.startAmbient()
              : !runtime.ambientToggle.checked && runtime.store.ambient
                  ? runtime.controllers.audio.stopAmbient()
                  : null;
      runtime.controllers.core.resize();
  });
  addEventListener("resize", runtime.controllers.core.resize);
  addEventListener("pointermove", (event) => {
      if (runtime.nativeMode !== "dashboard" || runtime.store.pointerFrame)
          return;
      const x = event.clientX;
      const y = event.clientY;
      runtime.store.pointerX = x;
      runtime.store.pointerY = y;
      runtime.store.pointerActive = true;
      runtime.store.pointerFrame = requestAnimationFrame(() => {
          runtime.store.pointerFrame = 0;
          document.documentElement.style.setProperty("--pointer-x", `${((x / innerWidth) * 100).toFixed(1)}%`);
          document.documentElement.style.setProperty("--pointer-y", `${((y / innerHeight) * 100).toFixed(1)}%`);
      });
  }, { passive: true });
  addEventListener("pointerleave", () => {
      runtime.store.pointerActive = false;
  });
  addEventListener("keydown", () => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable))
          runtime.store.lastTypingAt = performance.now();
  }, true);
  setInterval(() => (runtime.$("#clock").textContent = new Date().toLocaleTimeString("pt-BR")), 1000);
  runtime.store.intense = localStorage.getItem("trace-intense") === "true";
  runtime.$<HTMLInputElement>("#intensity-toggle").checked = runtime.store.intense;
  const naturalFlowMigrationApplied = localStorage.getItem("trace-natural-flow-migration-v0510");
  runtime.ambientToggle.checked = naturalFlowMigrationApplied
      ? localStorage.getItem("trace-ambient") !== "false"
      : true;
  if (!naturalFlowMigrationApplied) {
      localStorage.setItem("trace-ambient", "true");
      localStorage.setItem("trace-natural-flow-migration-v0510", "true");
  }
  const clapOptInMigration = localStorage.getItem("trace-claps-opt-in-v102");
  if (!clapOptInMigration) {
      localStorage.setItem("trace-claps-enabled", "false");
      localStorage.setItem("trace-claps-opt-in-v102", "true");
  }
  runtime.controllers.audio.updateClapPreference(localStorage.getItem("trace-claps-enabled") === "true", false);
  runtime.keepCompactToggle.checked =
      localStorage.getItem("trace-keep-compact") !== "false";
  runtime.permissionFiles.checked =
      localStorage.getItem("trace-permission-files") !== "false";
  runtime.permissionImages.checked =
      localStorage.getItem("trace-permission-images") !== "false";
  runtime.permissionScreen.checked =
      localStorage.getItem("trace-permission-screen") === "true";
  runtime.permissionApps.checked =
      localStorage.getItem("trace-permission-apps") === "true";
  runtime.permissionEdits.checked =
      localStorage.getItem("trace-permission-edits") === "true";
  runtime.approvalMode.value = localStorage.getItem("trace-approval-mode") || "standard";
  runtime.sensitivityRange.value = localStorage.getItem("trace-sensitivity") || "125";
  runtime.store.sensitivity = Number(runtime.sensitivityRange.value) / 100;
  runtime.bargeInToggle.checked = localStorage.getItem("trace-barge-in") !== "false";
  runtime.voiceProfile.value = localStorage.getItem("trace-voice-profile") || "female";
  runtime.controllers.speech.updateSystemVoiceCatalog();
  if ("speechSynthesis" in window)
      speechSynthesis.addEventListener("voiceschanged", runtime.controllers.speech.updateSystemVoiceCatalog);
  runtime.controllers.audio.clapCalibrationLabel(runtime.store.customClapPeak && runtime.store.customClapRms
      ? "Calibração personalizada ativa para este microfone."
      : "Modo automático ativo · adaptado ao ruído do ambiente.");
  const savedResponseMode = localStorage.getItem("trace-response-mode");
  const modalityMigrationApplied = localStorage.getItem("trace-modality-migration-v0510");
  runtime.responseMode.value = modalityMigrationApplied
      ? savedResponseMode || "smart"
      : "smart";
  if (!modalityMigrationApplied) {
      localStorage.setItem("trace-response-mode", "smart");
      localStorage.setItem("trace-modality-migration-v0510", "true");
  }
  runtime.responseStyle.value = localStorage.getItem("trace-response-style") || "direct";
  runtime.userName.value = localStorage.getItem("trace-user-name") || "";
  runtime.intelligenceProfile.value =
      localStorage.getItem("trace-intelligence-profile") || "balanced";
  void window.traceNative?.get_startup?.().then((enabled) => {
      runtime.startupToggle.checked = enabled;
  });
  runtime.approvalMode.dispatchEvent(new Event("change"));
  runtime.controllers.apps.updateScreenPermission();
  runtime.controllers.system.setVoiceMode(runtime.voiceProfile.value !== "silent" &&
      localStorage.getItem("trace-voice") !== "false", false);
  runtime.controllers.core.setView(runtime.nativeMode === "overlay"
      ? "compact"
      : runtime.nativeMode === "dashboard"
          ? "full"
          : (localStorage.getItem("trace-view") as "full" | "compact") || "full", !runtime.nativeMode);
  runtime.controllers.core.resize();
  requestAnimationFrame(runtime.controllers.core.animate);
  void runtime.controllers.system.health();
  void runtime.controllers.apps.refreshAuthorizedApps();
  void runtime.controllers.apps.refreshRoutines();
  void runtime.controllers.chat.loadHistory();
  if (runtime.nativeMode === "dashboard")
      window.traceNative?.on_mic?.((data) => {
          runtime.micLevelBar.style.transform = `scaleX(${Math.max(0, Math.min(1, data.level))})`;
          if (data.status) {
              runtime.micStatus.textContent = data.status;
              runtime.ambientButton.textContent = data.status.includes("DESATIVADO")
                  ? "ATIVAR AMBIENTE"
                  : "AMBIENTE ATIVO";
              runtime.micStatus.className = data.status.includes("BLOQUEADO")
                  ? "blocked"
                  : "online";
          }
      });
  window.traceNative?.on_event?.((event) => {
      if (event.type === "interrupt")
          runtime.controllers.audio.interruptInteraction();
      else if (event.type === "message" && event.role && event.text && event.id)
          runtime.controllers.chat.addMessage(event.role, event.text, false, event.id);
      else if (event.type === "state" && event.state)
          runtime.controllers.core.setState(event.state, event.text, false);
      else if (event.type === "speak" && event.text && runtime.nativeMode === "overlay")
          void runtime.controllers.speech.speak(event.text);
      else if (event.type === "voice-mode" && typeof event.enabled === "boolean")
          runtime.controllers.system.setVoiceMode(event.enabled, false);
      else if (event.type === "open-settings" && event.page)
          runtime.controllers.core.openSettings(event.page);
      else if (event.type === "suggestions" && event.items)
          runtime.controllers.chat.renderSuggestions(event.items, false);
      else if (event.type === "clear") {
          runtime.messages.replaceChildren();
          runtime.controllers.chat.renderSuggestions([], false);
      }
  });
  window.traceNative?.on_overlay_mode?.((mode) => {
      const root = document.documentElement;
      root.classList.toggle("orb-only", mode === "orb" || mode === "orb-enter");
      root.classList.toggle("chat-open", mode === "chat" || mode === "chat-enter");
      root.classList.toggle("orb-entering", mode === "orb-enter");
      root.classList.toggle("chat-entering", mode === "chat-enter");
      root.classList.toggle("surface-leaving", mode === "leaving");
  });
  window.traceNative?.on_wake_status?.((data) => {
      runtime.store.nativeWakeReady = data.ready;
      if (runtime.nativeMode === "overlay" && runtime.store.ambient) {
          runtime.micStatus.textContent = data.ready
              ? "ATIVO · PALAVRA-CHAVE LEVE"
              : "ATIVO · PALMAS · FRASE INDISPONÍVEL";
          runtime.micStatus.className = "online";
          void window.traceNative?.report_mic?.(runtime.store.micLevel, runtime.micStatus.textContent);
      }
  });
  window.traceNative?.on_native_wake?.((data) => {
      if (runtime.nativeMode !== "overlay")
          return;
      if (data.type === "sleep") {
          runtime.controllers.audio.closeVoiceSession();
          runtime.controllers.core.setState("idle", "TRACE em espera.");
          return;
      }
      void (async () => {
          if (!runtime.store.ambient)
              await runtime.controllers.audio.startAmbient();
          if (runtime.store.ambient)
              runtime.controllers.audio.beginCommand("Pode falar.", false);
      })();
  });
  window.traceNative?.on_clap_calibration?.((action) => {
      if (runtime.nativeMode !== "overlay")
          return;
      if (action === "reset")
          runtime.controllers.audio.resetClapCalibration();
      else
          void runtime.controllers.audio.startClapCalibration();
  });
  window.traceNative?.on_start_listening?.(() => {
      if (runtime.nativeMode === "overlay")
          void runtime.controllers.audio.manualListen();
  });
  window.traceNative?.on_ambient_control?.((enabled) => {
      if (runtime.nativeMode !== "overlay")
          return;
      runtime.ambientToggle.checked = enabled;
      if (enabled && !runtime.store.ambient)
          void runtime.controllers.audio.startAmbient();
      else if (!enabled && runtime.store.ambient)
          runtime.controllers.audio.stopAmbient();
  });
  addEventListener("storage", (event) => {
      if (event.key === "trace-claps-enabled") {
          runtime.controllers.audio.updateClapPreference(event.newValue === "true", false);
          return;
      }
      if (event.key !== "trace-clap-peak" && event.key !== "trace-clap-rms")
          return;
      runtime.store.customClapPeak = Number(localStorage.getItem("trace-clap-peak") || 0);
      runtime.store.customClapRms = Number(localStorage.getItem("trace-clap-rms") || 0);
      runtime.controllers.audio.clapCalibrationLabel(runtime.store.customClapPeak && runtime.store.customClapRms
          ? "Calibração personalizada ativa para este microfone."
          : "Modo automático ativo · adaptado ao ruído do ambiente.");
  });
  void window.traceNative?.runtime_state?.().then((current) => {
      runtime.store.nativeWakeReady = current?.wakeListenerReady === true;
  });
  window.traceNative?.on_global_command?.(() => {
      runtime.controllers.core.setState("idle", "Digite seu pedido ou clique na esfera para falar.");
      const input = runtime.$<HTMLInputElement>("#compact-input");
      input.focus();
      input.select();
      runtime.controllers.audio.playCue();
  });
  void window.traceNative?.get_shortcut?.().then((shortcut) => {
      if (shortcut)
          runtime.$<HTMLInputElement>("#compact-input").placeholder =
              `Digite ou fale… · ${shortcut}`;
  });
  addEventListener("unhandledrejection", (event) => {
      const reason = event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? "erro desconhecido");
      console.error("TRACE unhandled rejection", event.reason);
      runtime.controllers.core.setState("error", `Falha recuperável da interface: ${reason}`);
      runtime.promptInput.disabled = false;
      runtime.$<HTMLInputElement>("#compact-input").disabled = false;
  });
  addEventListener("error", (event) => {
      console.error("TRACE renderer error", event.error ?? event.message);
      runtime.controllers.core.setState("error", `Falha recuperável da interface: ${event.message}`);
      runtime.promptInput.disabled = false;
      runtime.$<HTMLInputElement>("#compact-input").disabled = false;
  });
  // Browsers exigem uma interação inicial antes de liberar o microfone. O primeiro clique em qualquer área prepara a escuta ambiente.
  if (runtime.nativeMode === "overlay") {
      if (window.traceNative)
          setTimeout(() => {
              if (runtime.ambientToggle.checked && !runtime.store.ambient)
                  void runtime.controllers.audio.startAmbient();
          }, 80);
      else
          addEventListener("pywebviewready", () => {
              if (runtime.ambientToggle.checked && !runtime.store.ambient)
                  void runtime.controllers.audio.startAmbient();
          }, { once: true });
  }
  else if (!runtime.nativeMode)
      addEventListener("pointerdown", () => {
          if (runtime.ambientToggle.checked && !runtime.store.ambient)
              void runtime.controllers.audio.startAmbient();
      }, { once: true });
}
