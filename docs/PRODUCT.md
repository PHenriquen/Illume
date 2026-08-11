# Noa — visão de produto

## Definição

**Noa é uma companhia digital local para Windows que entende contexto, conversa por texto ou voz e executa ações somente dentro de limites claros definidos pelo usuário.**

Noa não deve ser apresentada como um chatbot com atalhos. O produto combina conversa, memória, documentos, voz, contexto autorizado e automação segura em uma experiência contínua, privada e verificável.

A evolução 2.0 mantém essa essência e organiza a experiência em três superfícies: **Orb, Overlay e Workspace**.

## Problema

O uso diário do computador é fragmentado entre aplicativos, arquivos, notificações, configurações e tarefas repetitivas. Assistentes comuns frequentemente oferecem apenas respostas, dependem da nuvem ou escondem o que podem acessar e executar.

Noa existe para reduzir essa fragmentação sem retirar o controle do usuário.

## Proposta de valor

- **Local por padrão:** memória, histórico e componentes sensíveis permanecem no dispositivo sempre que tecnicamente possível.
- **Ação com consentimento:** toda capacidade operacional possui escopo, permissão e registro.
- **Presença contínua sem invasão:** a Noa pode existir como Orb mínima, Overlay rápido ou Workspace completo.
- **Contexto útil:** memória e contexto reduzem repetição, sem tornar o comportamento imprevisível.
- **Falhas compreensíveis:** Noa explica o que tentou fazer, o que falhou e qual é a próxima ação segura.
- **Interface orientada a estado:** animações e indicadores representam listening, thinking, approval, execution, speaking e error de verdade.

## Público inicial

O primeiro público é formado por usuários de Windows que:

- trabalham ou estudam no computador por longos períodos;
- desejam uma IA local sem cobrança recorrente de tokens;
- usam documentos, código, aplicativos e rotinas pessoais;
- valorizam privacidade e controle;
- aceitam instalar componentes opcionais para voz e modelos locais.

## Pilares da experiência

### 1. Companhia, não personagem imposto

Noa deve parecer presente e consistente, mas não deve impor gênero, rosto, humor excessivo ou intimidade artificial. A personalidade padrão é calma, direta, confiável e adaptável.

### 2. Local-first verificável

A interface deve informar claramente:

- qual modelo está ativo;
- onde os dados estão armazenados;
- quais componentes podem usar rede;
- quais permissões estão habilitadas;
- quando uma ação sai do dispositivo.

### 3. Autonomia limitada e útil

O fluxo operacional padrão é:

```text
Entender -> Planejar -> Verificar permissão -> Executar -> Confirmar resultado -> Registrar
```

Noa pode sugerir ações, mas não deve executar operações destrutivas, irreversíveis ou externas sem confirmação explícita.

### 4. Voz confiável antes de voz constante

A experiência de voz deve priorizar:

- detecção de fala e palavra de ativação confiáveis;
- baixa taxa de ativações acidentais;
- interrupção da resposta falada;
- indicação visual dos estados ouvindo, processando e falando;
- fallback claro para texto quando o áudio falhar.

### 5. Interface calma

A interface pode ser futurista, mas não deve parecer um painel decorativo. Todo movimento, partícula, leitura e indicador precisa comunicar estado, progresso, risco ou disponibilidade.

## As três superfícies

### Orb

Presença mínima e opcional no desktop.

- comunica estado real;
- abre Overlay com um clique;
- abre Workspace com interação expandida;
- não exibe informação decorativa sem função;
- pode ser completamente ocultada.

### Overlay

Superfície para tarefas rápidas sobre o aplicativo atual.

- voz e texto;
- comandos curtos;
- contexto autorizado da janela/seleção;
- resumo do plano quando necessário;
- confirmação de ações sensíveis;
- desaparece ao concluir a tarefa;
- pode expandir para o Workspace mantendo o contexto.

### Workspace

Superfície profunda de conversa e controle.

- documentos;
- histórico;
- memória;
- permissões;
- modelos e voz;
- diagnósticos;
- automações e integrações futuras.

O Workspace não é a identidade inteira da Noa: ele é o local de inspeção, configuração e tarefas longas.

## Modelo funcional

### Noa Core

Orquestra contexto, modelo, ferramentas, memória e resposta.

### Noa Voice

Gerencia palavra de ativação, atividade de voz, transcrição, síntese e interrupção.

### Noa Memory

Separa histórico de conversa, preferências duráveis, contexto recente e dados temporários. O usuário deve conseguir visualizar, editar, exportar e apagar memória.

### Noa Actions

Representa ações tipadas e auditáveis, como abrir aplicativo, ler arquivo, criar documento ou executar uma rotina autorizada.

### Noa Context

Reúne somente o contexto permitido: arquivo selecionado, aplicativo ativo, tela autorizada ou sessão atual.

### Noa Guard

Centraliza permissões, confirmações, allowlists, limites de pasta e trilha de auditoria.

### Noa Connect

Camada futura para provedores de modelo, extensões e integrações externas. Nenhuma integração deve receber acesso implícito ao sistema.

## Níveis de ação

| Nível | Exemplo | Comportamento esperado |
|---|---|---|
| Leitura local | Ler um PDF selecionado | Executar dentro do escopo autorizado |
| Ação reversível | Abrir aplicativo, criar rascunho | Executar e informar resultado |
| Alteração persistente | Editar ou mover arquivo | Mostrar resumo e solicitar confirmação conforme a regra |
| Ação externa | Enviar mensagem ou publicar conteúdo | Sempre exigir confirmação final |
| Ação crítica | Apagar dados, instalar software, alterar segurança | Bloquear por padrão ou usar confirmação reforçada |

## Contexto visual

A leitura de tela/janela deve ser opt-in e visível.

1. usuário autoriza a superfície;
2. Noa mostra o que será lido;
3. captura serve à tarefa atual, salvo permissão persistente explícita;
4. a resposta identifica que contexto visual foi utilizado;
5. qualquer ação derivada ainda passa pelo Noa Guard.

## Memória revisável

Categorias iniciais:

- sessão;
- preferência;
- projeto;
- rotina;
- contato/pessoa explicitamente salvo;
- histórico de conversa.

Toda memória durável precisa de origem, data e opção de edição/exclusão.

## Diferencial

Noa não pretende competir por quantidade de integrações. Seu diferencial inicial é unir, em um aplicativo de Windows coerente:

- IA local;
- voz opcional;
- memória controlável;
- leitura de documentos;
- contexto visual opt-in;
- ações explícitas;
- interface compacta;
- privacidade visível;
- instalação e diagnóstico acessíveis.

## Não objetivos da primeira fase

- controlar livremente qualquer elemento da tela sem limites;
- executar comandos arbitrários gerados pelo modelo;
- prometer funcionamento totalmente offline quando um provedor remoto estiver selecionado;
- agir em segundo plano sem indicação ou registro;
- substituir antivírus, backup ou controles administrativos do Windows;
- criar uma personalidade emocional que pressione o usuário a interagir;
- avatar 3D como requisito do produto;
- dezenas de integrações antes de estabilizar voz, ações e memória.

## Métricas de qualidade

- tempo entre ativação e início da transcrição;
- taxa de ativações falsas;
- percentual de ações concluídas sem intervenção corretiva;
- uso de CPU e memória em repouso;
- tempo médio para concluir uma tarefa pelo Overlay;
- clareza dos erros e diagnósticos;
- quantidade de permissões concedidas conscientemente;
- sucesso de instalação em uma máquina Windows limpa.

## Marcos

### M1 — Presença coerente

- consolidar Orb como indicador de estado real;
- criar Overlay rápido e consistente;
- manter Workspace como superfície profunda;
- unificar linguagem visual entre as três superfícies.

### M2 — Núcleo de ações

- consolidar contratos tipados;
- separar intenção, autorização, execução e resultado;
- criar timeline de execução;
- adicionar testes de permissão e falha.

### M3 — Voz confiável

- estruturar pipeline explícito de áudio;
- adicionar VAD;
- melhorar palavra de ativação e calibração;
- permitir interrupção e fallback;
- impedir listeners concorrentes.

### M4 — Contexto e memória controláveis

- contexto de janela/seleção opt-in;
- separar tipos de memória;
- painel de revisão e exclusão;
- registrar origem de cada memória.

### M5 — Extensibilidade segura

- catálogo de capacidades;
- avaliar MCP e provedores OpenAI-compatible;
- permissões por ferramenta e integração;
- SDK/contratos somente após estabilizar o núcleo.

## Direção visual e de UX

A especificação detalhada fica em [`UX_DIRECTION_2_0.md`](UX_DIRECTION_2_0.md).

## Frase de posicionamento

> **Noa é uma inteligência local para Windows que entende, organiza e age ao seu lado — sem esconder o que acessa ou executa.**
