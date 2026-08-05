import * as runtime from "./runtime";

function renderDetectedApps() {
    const list = runtime.$("#detected-app-list");
    const query = runtime.$<HTMLInputElement>("#app-search")
        .value.trim()
        .toLocaleLowerCase("pt-BR");
    const visible = runtime.store.detectedApps.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(query));
    list.replaceChildren();
    if (!visible.length) {
        const empty = document.createElement("small");
        empty.textContent = query
            ? "Nenhum aplicativo corresponde à busca."
            : "Nenhum atalho foi detectado. Use “Adicionar outro”.";
        list.append(empty);
        return;
    }
    for (const appItem of visible) {
        const label = document.createElement("label");
        label.className = "detected-app";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = appItem.authorized;
        const name = document.createElement("span");
        name.textContent = appItem.name;
        input.addEventListener("change", async () => {
            input.disabled = true;
            const saved = await window.traceNative?.set_app_authorized?.(appItem, input.checked);
            input.disabled = false;
            if (saved) {
                appItem.authorized = input.checked;
                if (input.checked)
                    runtime.permissionApps.checked = true;
                renderRoutineApps();
            }
            else
                input.checked = appItem.authorized;
        });
        label.append(input, name);
        list.append(label);
    }
}

async function refreshAuthorizedApps() {
    runtime.store.detectedApps = (await window.traceNative?.detect_apps?.()) ?? [];
    renderDetectedApps();
    renderRoutineApps();
}

function renderRoutineApps() {
    const list = runtime.$("#routine-app-list");
    const authorized = runtime.store.detectedApps.filter((item) => item.authorized);
    list.replaceChildren();
    if (!authorized.length) {
        const empty = document.createElement("small");
        empty.textContent = "Autorize aplicativos acima para montar uma rotina.";
        list.append(empty);
        return;
    }
    for (const item of authorized) {
        const label = document.createElement("label");
        label.className = "routine-app";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = item.name;
        const name = document.createElement("span");
        name.textContent = item.name;
        label.append(input, name);
        list.append(label);
    }
}

function renderSavedRoutines() {
    const list = runtime.$("#saved-routine-list");
    list.replaceChildren();
    for (const routine of runtime.store.savedRoutines) {
        const row = document.createElement("div");
        row.className = "saved-routine";
        const info = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = routine.name;
        const apps = document.createElement("small");
        apps.textContent = routine.apps.join(" · ");
        info.append(name, apps);
        const run = document.createElement("button");
        run.type = "button";
        run.textContent = "EXECUTAR";
        run.onclick = () => void runtime.controllers.chat.askTrace(`Ative a rotina ${routine.name}`);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete";
        remove.textContent = "EXCLUIR";
        remove.onclick = async () => {
            await window.traceNative?.delete_routine?.(routine.name);
            await refreshRoutines();
        };
        row.append(info, run, remove);
        list.append(row);
    }
}

async function refreshRoutines() {
    runtime.store.savedRoutines = (await window.traceNative?.list_routines?.()) ?? [];
    renderSavedRoutines();
}

function updateScreenPermission() {
    const button = runtime.$("#screen-context-button");
    button.textContent = runtime.permissionScreen.checked
        ? "TELA AUTORIZADA"
        : "TELA DESATIVADA";
    button.classList.toggle("active", runtime.permissionScreen.checked);
}

export const appsController = {
  renderDetectedApps,
  refreshAuthorizedApps,
  renderRoutineApps,
  renderSavedRoutines,
  refreshRoutines,
  updateScreenPermission,
};
