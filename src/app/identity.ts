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

function replaceLegacyBrand(value: string): string {
  return TEXT_REPLACEMENTS.reduce(
    (currentValue, [pattern, replacement]) => currentValue.replace(pattern, replacement),
    value,
  );
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

  const walker = documentRef.createTreeWalker(documentRef.body, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null = walker.nextNode();

  while (currentNode) {
    const parentElement = currentNode.parentElement;
    const parentTag = parentElement?.tagName;

    if (parentTag !== "SCRIPT" && parentTag !== "STYLE" && currentNode.nodeValue) {
      currentNode.nodeValue = replaceLegacyBrand(currentNode.nodeValue);
    }

    currentNode = walker.nextNode();
  }

  documentRef.querySelectorAll<HTMLElement>("*").forEach((element) => {
    BRAND_ATTRIBUTES.forEach((attributeName) => {
      const value = element.getAttribute(attributeName);
      if (value) {
        element.setAttribute(attributeName, replaceLegacyBrand(value));
      }
    });
  });

  const assistantAvatar = documentRef.querySelector<HTMLElement>(".message.trace > span");
  if (assistantAvatar) {
    assistantAvatar.textContent = "N";
  }
}
