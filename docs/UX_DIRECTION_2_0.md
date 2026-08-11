# Noa — UX Direction 2.0

## Objetivo

Amadurecer a Noa sem alterar sua essência: uma inteligência local para Windows, discreta, útil, controlável e capaz de agir apenas dentro de permissões explícitas.

A evolução não deve transformar a Noa em um painel futurista decorativo nem em um avatar invasivo. A direção é de **presença mínima + contexto imediato + profundidade sob demanda**.

## Benchmark de produto

Referências públicas de assistentes desktop locais e voice-first mostram padrões úteis: presença em overlay, VAD, estado visual explícito, memória revisável, ferramentas tipadas e contexto da tela. Esses padrões servem como benchmark de UX e engenharia; identidade, linguagem visual e fluxo permanecem próprios da Noa.

## Três superfícies

### 1. Orb

A menor forma da Noa.

- sempre opcional;
- pequena e silenciosa no canto;
- comunica estado real: repouso, ouvindo, pensando, executando, falando, erro;
- um clique abre o Overlay;
- duplo clique abre o Workspace;
- pode desaparecer completamente quando o usuário preferir.

A Orb nunca deve exibir informação falsa ou animação sem significado operacional.

### 2. Overlay

A superfície de uso rápido.

Objetivo: resolver uma tarefa sem interromper o fluxo atual.

Exemplos:

- falar um comando;
- perguntar sobre a janela/arquivo explicitamente autorizado;
- abrir aplicativo;
- resumir seleção;
- criar lembrete local;
- executar rotina permitida;
- mostrar confirmação antes de ação sensível.

Características:

- aparece sobre qualquer aplicativo;
- teclado e voz igualmente válidos;
- mostra plano de ação curto quando necessário;
- respostas compactas;
- desaparece após conclusão;
- permite expandir para Workspace preservando contexto.

### 3. Workspace

A superfície profunda.

Usada para:

- conversas longas;
- documentos;
- memória;
- permissões;
- histórico de ações;
- modelos e voz;
- diagnósticos;
- automações e integrações futuras.

O Workspace não é a identidade inteira do produto. Ele é o local de inspeção e controle.

## Estados visuais

A linguagem visual deve ser baseada em estados reais:

| Estado | Significado |
|---|---|
| Dormant | presença mínima, sem captura ativa |
| Listening | microfone autorizado e captura em andamento |
| Thinking | modelo processando |
| Planning | ferramenta/ação sendo preparada |
| Awaiting approval | ação requer confirmação |
| Executing | ação autorizada em andamento |
| Speaking | TTS ativo |
| Offline | componente esperado indisponível |
| Error | falha com explicação recuperável |

A Orb e o Overlay devem derivar aparência desses estados, não de efeitos aleatórios.

## Linguagem visual

- fundo escuro neutro, não preto absoluto em todas as superfícies;
- vidro/blur apenas quando aumenta separação de camadas;
- azul frio como assinatura principal, com brilho contido;
- branco para leitura;
- amarelo/âmbar para espera ou atenção;
- vermelho somente para erro, bloqueio ou risco;
- partículas mínimas e vinculadas a áudio/processamento;
- tipografia simples e alta legibilidade;
- animações curtas, com aceleração natural e sem excesso de HUD.

## Voz

Pipeline-alvo:

```text
wake/VAD -> captura -> STT -> intenção -> plano -> política -> ação -> resposta -> TTS
```

Regras:

- usuário pode interromper TTS imediatamente;
- dois listeners nunca competem pelo microfone;
- atividade de voz deve ser visível;
- wake word pode ser desativada;
- texto sempre funciona como fallback;
- latência e falhas precisam ser diagnosticáveis.

## Contexto de tela

Contexto visual deve ser opt-in.

Fluxo recomendado:

1. usuário ativa contexto de tela/janela;
2. Noa mostra qual superfície será lida;
3. captura ocorre somente para a tarefa atual, salvo permissão persistente explícita;
4. resposta informa quando contexto visual foi utilizado;
5. ação derivada desse contexto ainda passa pelo Noa Guard.

## Ações visíveis

Quando uma ação demora mais que uma resposta instantânea, o Overlay deve mostrar uma timeline mínima:

```text
Entendi -> Verifiquei permissão -> Executando -> Concluído
```

Em falha:

```text
Executando -> Falhou: motivo -> Próxima opção segura
```

## Memória

A memória precisa parecer um recurso controlável, não uma caixa-preta.

Categorias:

- sessão;
- preferência;
- pessoa/contato explicitamente salvo;
- projeto;
- rotina;
- histórico de conversa.

Toda memória durável deve ter origem, data e opção de edição/exclusão.

## Critérios de maturidade

A Noa 2.0 não será considerada melhor apenas por ter mais funções. A melhoria deve aparecer em:

- menor tempo para concluir tarefas comuns;
- menos cliques;
- menor consumo em repouso;
- voz mais confiável;
- menos ativações falsas;
- ações mais previsíveis;
- permissões mais claras;
- interface mais calma;
- instalação e diagnóstico mais simples.

## Escopo da próxima fase

Prioridade:

1. Orb orientada a estado;
2. Overlay rápido com voz/texto;
3. unificação de estados de áudio;
4. timeline de ações e confirmação;
5. contexto de janela opt-in;
6. memória revisável no Workspace;
7. polimento visual e performance.

Não prioridade agora:

- avatar 3D;
- dezenas de integrações;
- automação irrestrita;
- personalidade emocional complexa;
- visual cheio de painéis decorativos.
