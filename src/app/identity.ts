export const NOA_VOICE_COMMANDS = {
  wake: ["acorde noa", "olá noa", "oi noa", "e aí noa"] as const,
  sleep: ["descanse noa", "durma noa"] as const,
  legacyWake: ["acorde trace", "acorde tracer"] as const,
  legacySleep: ["descanse trace", "descanse tracer"] as const,
} as const;

export const NOA_IDENTITY = Object.freeze({
  productName: "Noa",
  productNameUppercase: "NOA",
  assistantLabel: "Assistente local",
  dataProductId: "noa",
  wakeWords: ["noa"] as const,
  legacyWakeWords: ["trace", "tracer"] as const,
});

const TEXT_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/TRACE CORE/g, "NOA CORE"],
  [/TRACE AI/g, "NOA"],
  [/\bTRACE\b/g, "NOA"],
  [/\bTrace\b/g, "Noa"],
  [/\bTRACER\b/g, "NOA"],
  [/\bTracer\b/g, "Noa"],
  [/\btracer\b/g, "noa"],
];

const BRAND_ATTRIBUTES = ["aria-label", "title", "placeholder", "value"] as const;
const ASSISTANT_NAME_PATTERN = "(?:noa|noah|trace|tracer|tres|treice|treicer|tracy|tracey|trece|traze)";
const WAKE_ACTION_PATTERN = "(?:acorde|acorda|ola|oi|e ai)";
const SLEEP_ACTION_PATTERN = "(?:descanse|durma|desligue)";
const identityObservers = new WeakMap<Document, MutationObserver>();

function replaceLegacyBrand(value: string): string {
  return TEXT_REPLACEMENTS.reduce(
    (currentValue, [pattern, replacement]) => currentValue.replace(pattern, replacement),
    value,
  );
}

export function normalizeSpokenCommand(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNoaWakeCommand(value: string): boolean {
  const normalized = normalizeSpokenCommand(value);
  return new RegExp(
    `^(?:${WAKE_ACTION_PATTERN}\\s+${ASSISTANT_NAME_PATTERN}|${ASSISTANT_NAME_PATTERN}\\s+${WAKE_ACTION_PATTERN})$`,
    "i",
  ).test(normalized);
}

export function isNoaSleepCommand(value: string): boolean {
  const normalized = normalizeSpokenCommand(value);
  return new RegExp(
    `^(?:${SLEEP_ACTION_PATTERN}\\s+${ASSISTANT_NAME_PATTERN}|${ASSISTANT_NAME_PATTERN}\\s+${SLEEP_ACTION_PATTERN})$`,
    "i",
  ).test(normalized);
}

function rewriteTextNode(node: Node): void {
  const parentTag = node.parentElement?.tagName;
  if (parentTag === "SCRIPT" || parentTag === "STYLE" || !node.nodeValue) {
    return;
  }

  const rewritten = replaceLegacyBrand(node.nodeValue);
  if (rewritten !== node.nodeValue) {
    node.nodeValue = rewritten;
  }
}

function rewriteElementAttributes(element: HTMLElement): void {
  BRAND_ATTRIBUTES.forEach((attributeName) => {
    const value = element.getAttribute(attributeName);
    if (!value) {
      return;
    }

    const rewritten = replaceLegacyBrand(value);
    if (rewritten !== value) {
      element.setAttribute(attributeName, rewritten);
    }
  });
}

function rewriteSubtree(root: ParentNode, documentRef: Document): void {
  if (root instanceof HTMLElement) {
    rewriteElementAttributes(root);
  }

  const walker = documentRef.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    rewriteTextNode(currentNode);
    currentNode = walker.nextNode();
  }

  root.querySelectorAll<HTMLElement>("*").forEach(rewriteElementAttributes);
}

function observeRuntimeIdentity(documentRef: Document): void {
  if (!documentRef.body || identityObservers.has(documentRef)) {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") {
        rewriteTextNode(mutation.target);
        return;
      }

      if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
        rewriteElementAttributes(mutation.target);
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          rewriteTextNode(node);
        } else if (node instanceof HTMLElement) {
          rewriteSubtree(node, documentRef);
        }
      });
    });
  });

  observer.observe(documentRef.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...BRAND_ATTRIBUTES],
  });
  identityObservers.set(documentRef, observer);
}

/**
 * Aplica a identidade pública da Noa sobre a interface legada sem alterar
 * identificadores técnicos que ainda precisam de uma migração compatível.
 *
 * Classes CSS, IDs, canais IPC, diretórios de dados e chaves persistidas não
 * são renomeados por esta função.
 */
export function applyProductIdentity(documentRef: Document = document): void {
  documentRef.title = `${NOA_IDENTITY.productName} — ${NOA_IDENTITY.assistantLabel}`;
  documentRef.documentElement.dataset.product = NOA_IDENTITY.dataProductId;

  if (!documentRef.body) {
    return;
  }

  rewriteSubtree(documentRef.body, documentRef);

  const assistantAvatar = documentRef.querySelector<HTMLElement>(".message.trace > span");
  if (assistantAvatar) {
    assistantAvatar.textContent = "N";
  }

  observeRuntimeIdentity(documentRef);
}
