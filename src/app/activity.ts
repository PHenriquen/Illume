import * as runtime from "./runtime";
import type { ActionReceipt } from "./types";

const actionLabels: Record<string, string> = {
    launch_app: "Aplicativo",
    open_url: "Link externo",
    run_routine: "Rotina",
    capture_screen: "Captura de tela",
    save_document: "Documento",
};

const statusLabels: Record<ActionReceipt["status"], string> = {
    planned: "Aguardando aprovação",
    approved: "Aprovada",
    dispatched: "Iniciada",
    succeeded: "Concluída",
    failed: "Falhou",
    cancelled: "Cancelada",
    blocked: "Bloqueada",
};

const riskLabels: Record<ActionReceipt["risk"], string> = {
    passive: "LEITURA",
    low: "LOCAL",
    confirm: "CONFIRMAÇÃO",
    blocked: "BLOQUEADA",
};

function eventTime(timestamp: string): string {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
        ? "horário indisponível"
        : date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
}

function emptyState(title: string, detail: string): HTMLElement {
    const empty = document.createElement("div");
    empty.className = "activity-empty";
    const symbol = document.createElement("span");
    symbol.textContent = "◇";
    const heading = document.createElement("strong");
    heading.textContent = title;
    const copy = document.createElement("small");
    copy.textContent = detail;
    empty.append(symbol, heading, copy);
    return empty;
}

function receiptCard(receipt: ActionReceipt): HTMLElement {
    const card = document.createElement("article");
    card.className = `activity-entry is-${receipt.status}`;

    const marker = document.createElement("span");
    marker.className = "activity-entry-marker";
    marker.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    body.className = "activity-entry-body";
    const title = document.createElement("strong");
    title.textContent = receipt.target || actionLabels[receipt.action] || "Ação local";
    const metadata = document.createElement("small");
    metadata.textContent = `${actionLabels[receipt.action] || receipt.action.replaceAll("_", " ")} · ${eventTime(receipt.timestamp)}`;
    body.append(title, metadata);

    const state = document.createElement("div");
    state.className = "activity-entry-state";
    const status = document.createElement("span");
    status.textContent = statusLabels[receipt.status];
    const risk = document.createElement("small");
    risk.textContent = riskLabels[receipt.risk];
    state.append(status, risk);

    card.append(marker, body, state);
    return card;
}

function render(receipts: ActionReceipt[]): void {
    if (!receipts.length) {
        runtime.activityList.replaceChildren(emptyState(
            "Nenhuma ação registrada",
            "Quando o Lumi abrir um aplicativo ou executar uma rotina, o resultado aparecerá aqui.",
        ));
        runtime.activityStatus.textContent = "Nenhum evento local até agora.";
        runtime.activitySummary.className = "activity-summary";
        return;
    }

    const attention = receipts.filter((receipt) => receipt.status === "failed" || receipt.status === "blocked").length;
    runtime.activityList.replaceChildren(...receipts.map(receiptCard));
    runtime.activityStatus.textContent = attention
        ? `${receipts.length} eventos recentes · ${attention} precisam de atenção`
        : `${receipts.length} eventos recentes · nenhuma falha`;
    runtime.activitySummary.className = `activity-summary${attention ? " has-attention" : ""}`;
}

async function refresh(): Promise<void> {
    runtime.activityList.setAttribute("aria-busy", "true");
    try {
        const api = runtime.getNativeApi();
        if (!api?.list_action_receipts) {
            runtime.activityList.replaceChildren(emptyState(
                "Disponível no aplicativo desktop",
                "O histórico aparece aqui quando esta interface é aberta pelo Lumi no Windows.",
            ));
            runtime.activityStatus.textContent = "Visualização web sem acesso ao histórico local.";
            return;
        }
        render(await api.list_action_receipts(30));
    }
    catch {
        runtime.activityList.replaceChildren(emptyState(
            "Não foi possível ler o histórico",
            "Os registros continuam preservados. Tente atualizar novamente.",
        ));
        runtime.activityStatus.textContent = "Histórico temporariamente indisponível.";
        runtime.activitySummary.className = "activity-summary has-attention";
    }
    finally {
        runtime.activityList.removeAttribute("aria-busy");
    }
}

export const activityController = { refresh };
