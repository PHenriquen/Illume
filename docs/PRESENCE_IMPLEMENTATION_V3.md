# Noa — Presence V3 Implementation Plan

## Objetivo

Implementar a direção de `PRESENCE_V3.md` sem quebrar o caminho funcional atual da Noa.

A regra é **migração compatível**, não busca/substituição cega de `TRACE`.

## 1. Dívida encontrada

A documentação e o repositório se apresentam como **Noa**, mas partes da implementação ainda carregam a identidade anterior.

Exemplos confirmados:

- `index.html` usa `<title>TRACE AI</title>`;
- interface mostra `TRACE ASSISTANT CORE`;
- interface mostra `TRACE CORE`;
- navegação fala em “Centrais do TRACE”;
- `src/app/types.ts` define `TraceState`;
- eventos tipados usam role `"trace"`;
- API global expõe `window.traceNative`.

Isso não deve ser corrigido de uma vez sem entender quem depende dos nomes internos.

## 2. Estratégia

### Fase A — identidade visível

Trocar primeiro o que o usuário vê:

- título da janela;
- labels TRACE;
- aria-labels;
- textos de inicialização;
- mensagens default;
- documentação/installer residual.

Objetivo: nenhuma tela de produto deve parecer pertencer ao TRACE.

### Fase B — estado semântico novo

Introduzir:

```ts
export type AssistantState =
  | "dormant"
  | "listening"
  | "thinking"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "speaking"
  | "offline"
  | "error";
```

Durante migração:

```ts
/** @deprecated Use AssistantState. */
export type TraceState = AssistantState;
```

Isso permite migrar consumidores gradualmente.

### Fase C — roles/eventos

Novo papel:

```ts
role?: "noa" | "user";
```

Durante compatibilidade, aceitar `"trace"` apenas na fronteira de eventos antigos e normalizar internamente:

```text
trace -> noa
```

Não espalhar suporte legado por toda a aplicação.

### Fase D — bridge nativa

Nova API pública:

```ts
window.noaNative
```

Compatibilidade temporária:

```ts
window.traceNative
```

Ambas podem apontar para o mesmo bridge durante uma versão.

Depois que renderer, preload e desktop forem migrados, remover `traceNative`.

## 3. AssistantState como fonte única

Hoje UI, áudio, chat e desktop não devem inventar estados diferentes para a mesma situação.

Criar um estado único contendo:

```ts
type AssistantRuntimeState = {
  state: AssistantState;
  since: number;
  taskId?: string;
  detail?: string;
  context?: ContextScope;
  approval?: ApprovalSummary;
};
```

### Regras

- Orb lê esse estado;
- Overlay lê esse estado;
- Workspace lê esse estado;
- áudio publica transições;
- ações publicam transições;
- erro inclui motivo recuperável;
- componentes visuais não criam “thinking” falso por timeout decorativo.

## 4. Máquina de estados recomendada

```text
Dormant
  ↓ wake / command
Listening
  ↓ transcript ready
Thinking
  ↓ tool/action required
Planning
  ↓ safe & authorized ───────────────┐
Awaiting approval                    │
  ↓ approved                         │
Executing <──────────────────────────┘
  ↓ result
Speaking / Result
  ↓ done
Dormant
```

Falhas podem levar a `Error`/`Offline` com recuperação explícita.

## 5. ContextScope

Representar contexto como dado, não texto solto.

```ts
type ContextScope =
  | { kind: "none" }
  | { kind: "window"; app: string; title?: string }
  | { kind: "file"; name: string; path?: string }
  | { kind: "selection"; app: string; characters: number }
  | { kind: "screen"; display?: string; temporary: boolean };
```

O Overlay transforma isso em pills como:

- `VS Code`;
- `curriculo.pdf`;
- `Seleção · 824 caracteres`;
- `Tela · somente nesta tarefa`.

## 6. ActionPlan público

Noa não mostra cadeia de raciocínio.

Ela mostra apenas plano observável:

```ts
type ActionStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
};
```

Exemplo:

```text
Abrir VS Code
Localizar projeto Réquiem
Abrir pasta
```

## 7. ApprovalSummary

Toda confirmação precisa ser específica.

```ts
type ApprovalSummary = {
  action: string;
  impact: "low" | "medium" | "high";
  target?: string;
  count?: number;
  reversible: boolean;
  preview?: string;
};
```

Interface:

> Mover 14 arquivos para a Lixeira.

`Cancelar` · `Mover`

Não usar “Permitir ação?” sem dizer o que vai acontecer.

## 8. CommandReceipt

Depois de ações persistentes/externas:

```ts
type CommandReceipt = {
  id: string;
  timestamp: number;
  commandSource: "voice" | "text" | "routine";
  action: string;
  scope: string;
  result: "success" | "failed" | "cancelled";
  detail?: string;
};
```

Persistência pode começar localmente em SQLite/JSON conforme arquitetura existente.

O Overlay mostra só o resumo. Workspace exibe detalhes.

## 9. Orb

### Componente desejado

`NoaOrb`

Props conceituais:

```ts
state
micLevel
speakingLevel
hasApproval
isOffline
```

### Regra

A animação deve derivar dessas props.

Não depender de timer randômico para parecer viva.

## 10. Overlay

Separar visualmente em zonas pequenas:

```text
[Orb] [input/transcrição........................] [mic]
      [context pills]
      [plan / approval / result — quando necessário]
```

O Overlay cresce verticalmente apenas quando existe informação real.

Ele não abre um dashboard dentro do overlay.

## 11. Workspace

Reorganizar como ferramenta de inspeção.

Navegação recomendada:

- Conversa;
- Arquivos;
- Memória;
- Ações;
- Permissões;
- Voz;
- Modelos;
- Diagnóstico.

Telemetria técnica entra em Diagnóstico, não disputa espaço com conversa principal.

## 12. Sequência de migração de código

### PR A — Brand cleanup

- labels visíveis TRACE -> Noa;
- title;
- acessibilidade;
- instaladores/documentação residual;
- nenhuma mudança de IPC.

### PR B — AssistantState

- introduzir novo tipo;
- alias `TraceState` temporário;
- normalizador de evento;
- testes de transição.

### PR C — Orb real

- conectar estado;
- remover animações falsas;
- mic level real;
- speaking level real quando disponível.

### PR D — Overlay

- transcrição progressiva;
- context pill;
- action plan;
- approval;
- result.

### PR E — Receipts + memória

- recibos de ação;
- painel de inspeção;
- origem da memória.

### PR F — remover legado

Somente depois de testes:

- remover `TraceState`;
- remover role `trace`;
- remover `traceNative`;
- remover assets/scripts/strings TRACE restantes.

## 13. Testes mínimos por migração

### Brand cleanup

- desktop abre;
- overlay abre;
- compact funciona;
- voz continua funcional;
- nenhum seletor JS depende do texto visível alterado.

### AssistantState

Testar transições:

- dormant -> listening;
- listening -> thinking;
- thinking -> speaking;
- thinking -> planning -> executing;
- planning -> awaiting approval -> executing;
- qualquer estado -> error;
- offline -> recovery.

### Bridge

- renderer chama API nova;
- alias antigo continua funcionando temporariamente;
- preload não aumenta superfície de privilégio.

## 14. Critério de pronto da V3

Não é “trocamos TRACE por Noa”.

A migração está pronta quando:

1. nenhuma superfície visível tem identidade antiga;
2. existe um estado semântico único;
3. Orb reflete estado real;
4. Overlay resolve ações rápidas;
5. contexto tem escopo visível;
6. ações sensíveis explicam impacto;
7. ações deixam recibo;
8. Workspace guarda profundidade e diagnóstico;
9. aliases legados podem ser removidos sem quebrar testes.
