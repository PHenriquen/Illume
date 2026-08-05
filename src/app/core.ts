import * as runtime from "./runtime";
import type { TraceState, SettingsPage } from "./types";

const copies: Record<TraceState, [
    string,
    string,
    string
]> = {
    idle: [
        "TRACE NEXUS",
        "PRONTO",
        "Diga “Acorde, Trace” para ativar o compacto",
    ],
    listening: ["ENTRADA DE VOZ", "ESCUTANDO", "Pode falar."],
    thinking: ["RACIOCÍNIO LOCAL", "PROCESSANDO", "Analisando localmente…"],
    speaking: ["SÍNTESE DE VOZ", "RESPONDENDO", ""],
    executing: ["FERRAMENTA LOCAL", "EXECUTANDO", "Realizando ação autorizada…"],
    error: ["ATENÇÃO", "AÇÃO INTERROMPIDA", "Verifique o núcleo local."],
};

function showSettingsPage(page: SettingsPage) {
    document
        .querySelectorAll<HTMLButtonElement>("[data-settings-tab]")
        .forEach((button) => button.setAttribute("aria-selected", String(button.dataset.settingsTab === page)));
    document
        .querySelectorAll<HTMLElement>("[data-settings-page]")
        .forEach((section) => (section.hidden = section.dataset.settingsPage !== page));
}

function openSettings(page: SettingsPage = "general") {
    showSettingsPage(page);
    if (!runtime.settings.open)
        runtime.settings.showModal();
}

function idleWakeCopy() {
    return runtime.clapToggle.checked
        ? "Diga “Acorde, Trace” ou use duas palmas"
        : "Diga “Acorde, Trace” para ativar o compacto";
}

function setState(next: TraceState, text?: string, share = true) {
    runtime.store.state = next;
    runtime.core.className = `core-wrap ${next}`;
    runtime.core.setAttribute("aria-busy", String(next === "thinking" || next === "executing"));
    const copy = copies[next];
    runtime.kicker.textContent = copy[0];
    runtime.status.textContent = copy[1];
    const stateText = text ?? (next === "idle" ? idleWakeCopy() : copy[2]);
    runtime.caption.textContent = stateText;
    runtime.compactStatus.textContent = copy[1];
    runtime.compactCaption.textContent = stateText;
    runtime.compactOverlay.className = `compact-overlay ${next} ${next === "speaking" ? "active" : ""}`;
    if (share && runtime.nativeMode)
        void runtime.broadcast({ type: "state", state: next, text: stateText });
}

function setView(view: "full" | "compact", persist = true) {
    document.body.dataset.view = view;
    if (persist)
        localStorage.setItem("trace-view", view);
}

function resize() {
    runtime.canvas.width = innerWidth;
    runtime.canvas.height = innerHeight;
    const count = Math.min(runtime.store.intense ? 78 : 42, Math.max(28, Math.floor(innerWidth / 18)));
    runtime.store.particles = Array.from({ length: count }, () => ({
        angle: Math.random() * 6.28,
        radius: 50 + Math.random() * Math.min(innerWidth, innerHeight) * 0.43,
        speed: 0.0003 + Math.random() * 0.001,
        size: 0.5 + Math.random() * 2,
        length: 2 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.65,
        phase: Math.random() * 6.28,
        dash: Math.random() > 0.38,
    }));
}

function animate(t: number) {
    requestAnimationFrame(animate);
    if (document.hidden ||
        document.body.dataset.view === "compact" ||
        t - runtime.store.lastFrame < (runtime.store.intense ? 20 : 34))
        return;
    runtime.store.lastFrame = t;
    runtime.ctx.clearRect(0, 0, innerWidth, innerHeight);
    const coreBounds = runtime.core.getBoundingClientRect(), cx = coreBounds.left + coreBounds.width / 2, cy = coreBounds.top + coreBounds.height / 2, targetEnergy = runtime.store.state === "thinking" ? 1 : runtime.store.state === "executing" ? 0.82 : runtime.store.state === "listening" ? 0.56 : runtime.store.state === "speaking" ? 0.68 : 0.16, speed = runtime.store.state === "thinking" ? 4.2 : runtime.store.state === "executing" ? 3 : runtime.store.state === "listening" ? 1.8 : runtime.store.state === "speaking" ? 2.15 : 1, pulse = 1 + Math.sin(t * 0.0015) * 0.025 + runtime.store.micLevel * 0.11;
    runtime.store.particleEnergy += (targetEnergy - runtime.store.particleEnergy) * 0.055;
    for (const p of runtime.store.particles) {
        p.angle += p.speed * speed;
        const r = (p.radius + Math.sin(t * 0.0008 + p.phase) * (10 + runtime.store.particleEnergy * 16)) * pulse;
        let x = cx + Math.cos(p.angle) * r, y = cy + Math.sin(p.angle) * r * 0.62;
        if (runtime.store.pointerActive) {
            const dx = x - runtime.store.pointerX, dy = y - runtime.store.pointerY, distance = Math.hypot(dx, dy), influence = Math.max(0, 1 - distance / 210) * (18 + runtime.store.particleEnergy * 28);
            if (distance > 1) {
                x += (dx / distance) * influence;
                y += (dy / distance) * influence;
            }
        }
        const proximity = Math.max(0, 1 - r / (Math.min(innerWidth, innerHeight) * 0.72));
        const alpha = Math.min(0.92, p.alpha * (0.72 + runtime.store.particleEnergy * 0.55));
        const blue = 188 + Math.floor(proximity * 60);
        runtime.ctx.strokeStyle = `rgba(49,${blue},255,${alpha})`;
        runtime.ctx.fillStyle = `rgba(77,${Math.min(255, blue + 18)},255,${alpha})`;
        if (p.dash) {
            const tangent = p.angle + Math.PI / 2, length = p.length * (0.75 + runtime.store.particleEnergy * 0.75);
            runtime.ctx.beginPath();
            runtime.ctx.lineWidth = Math.max(1, p.size * 0.8);
            runtime.ctx.lineCap = "round";
            runtime.ctx.moveTo(x - Math.cos(tangent) * length * 0.5, y - Math.sin(tangent) * length * 0.5);
            runtime.ctx.lineTo(x + Math.cos(tangent) * length * 0.5, y + Math.sin(tangent) * length * 0.5);
            runtime.ctx.stroke();
        }
        else {
            runtime.ctx.beginPath();
            runtime.ctx.arc(x, y, Math.max(0.65, p.size * 0.55), 0, Math.PI * 2);
            runtime.ctx.fill();
        }
    }
}

export const coreController = {
  showSettingsPage,
  openSettings,
  idleWakeCopy,
  setState,
  setView,
  resize,
  animate,
};
