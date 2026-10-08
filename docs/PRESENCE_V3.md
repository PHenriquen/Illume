# Noa — Presence V3

> Direção de produto/UX para transformar a Noa de “interface de assistente” em uma presença útil no Windows.

## 1. Ideia central

**Noa não é um chat que ganhou acesso ao computador. É uma presença do sistema que conversa quando necessário e age quando autorizada.**

A diferença precisa aparecer em vídeo de 20 segundos.

Se a demonstração principal for apenas:

1. abrir janela;
2. digitar pergunta;
3. receber texto;

então a Noa ainda parece um chatbot.

A demonstração ideal é:

1. usuário chama;
2. Noa entende o contexto atual;
3. mostra em uma frase o que pretende fazer;
4. executa dentro da permissão;
5. mostra o resultado;
6. desaparece sem exigir gerenciamento de janela.

## 2. Referências

Referências de assistentes “JARVIS-like” são úteis principalmente por uma sensação: **o computador parece responder como sistema, não como site**.

A Noa não deve copiar:

- voz/personagem do JARVIS da Marvel;
- HUD circular cinematográfico;
- linguagem “senhor, iniciando protocolo”;
- animações decorativas;
- identidade visual de criadores específicos.

A Noa deve absorver:

- resposta imediata à voz;
- transição clara entre ouvir → pensar → agir;
- ações visíveis no computador;
- demonstrações curtas e impressionantes;
- pouca necessidade de abrir um painel completo.

## 3. A grande mudança de V3

A Noa 2.0 já define Orb, Overlay e Workspace.

A V3 dá uma responsabilidade **muito rígida** para cada superfície.

### Orb = presença

Não é mini-chat.

A Orb só precisa responder:

- Noa está acordada?;
- está ouvindo?;
- está processando?;
- está executando?;
- precisa de mim?;

A Orb nunca mostra parágrafos.

### Overlay = ação

É a interface principal da Noa no dia a dia.

Ela aparece para:

- receber comando;
- mostrar interpretação;
- pedir confirmação;
- mostrar progresso;
- entregar um resultado curto.

Depois some.

### Workspace = inspeção

Não deve parecer “a Noa inteira”.

Serve para:

- conversa longa;
- arquivos;
- memória;
- permissões;
- histórico;
- modelos;
- diagnósticos;
- configuração.

## 4. Regra de presença

**A Noa só ocupa espaço proporcional à tarefa.**

Exemplos:

“Que horas são?” → Orb/voz.

“Abre o projeto Réquiem.” → Overlay por poucos segundos + ação.

“Resume este PDF.” → Overlay durante leitura, resultado curto; opção de expandir.

“Me ajuda a revisar este código inteiro.” → Workspace.

“Apaga esta pasta.” → Overlay de confirmação forte.

## 5. Núcleo visual

A forma principal continua sendo um núcleo/orb abstrato, mas precisa deixar de parecer um “reator decorativo”.

### Forma

Duas curvas abertas que quase formam um círculo.

Leituras possíveis:

- órbita;
- onda;
- respiração;
- N abstrato.

Nunca desenhar um N literal dentro de um círculo.

### Repouso

- 20–28 px em bandeja/mini;
- 42–56 px no desktop;
- brilho mínimo;
- movimento quase invisível;
- nenhuma partícula contínua.

### Listening

- curvas afastam ligeiramente;
- amplitude reage ao nível real do microfone;
- centro fica mais claro;
- sem animação falsa se o microfone não estiver capturando.

### Thinking

- movimento interno lento e direcional;
- uma volta nunca deve parecer spinner genérico;
- progresso real pode substituir animação quando disponível.

### Planning

- segundo arco aparece brevemente;
- indica “eu entendi e estou decidindo como agir”.

### Awaiting approval

- azul sai de cena;
- âmbar aparece;
- movimento para quase completamente;
- a interface comunica que a próxima decisão é do usuário.

### Executing

- movimento passa a ter direção;
- timeline curta aparece no Overlay;
- se houver uma ação observável (app abrindo, arquivo criado), a animação não compete com ela.

### Speaking

- resposta de baixa amplitude sincronizada ao TTS;
- nada de equalizador gigante permanente.

### Error

- vermelho curto;
- animação interrompida;
- texto do motivo tem prioridade sobre efeito.

## 6. Visual

### Base

- fundo: grafite muito escuro;
- superfície: vidro fosco quando houver conteúdo atrás;
- azul frio: presença;
- branco: leitura;
- violeta: somente transições/processamento complexo;
- âmbar: decisão/atenção;
- vermelho: falha/risco.

### Redução

A interface atual herdada do TRACE possui elementos que devem ser considerados dívida visual quando forem apenas decorativos:

- anéis de scan sem função;
- múltiplas órbitas simultâneas;
- labels permanentes de telemetria;
- partículas de fundo contínuas;
- números “de sistema” que o usuário não precisa naquele momento;
- caixa grande para mostrar estado que poderia ser uma mudança da Orb.

Esses elementos podem existir no modo diagnóstico/Workspace, não como presença padrão.

## 7. Tipografia e texto

Noa deve falar como produto, não como ficção científica.

Evitar:

- “Inicializando protocolo”;
- “Core operacional”;
- “Sistema neural preparado”;
- “Comando aceito, senhor”.

Preferir:

- “Pronta”;
- “Ouvindo”;
- “Lendo o arquivo”;
- “Preciso da sua confirmação”;
- “Abri o projeto”;
- “Não consegui encontrar o aplicativo”.

## 8. Overlay V3

### Estado vazio

Formato horizontal compacto próximo ao centro inferior ou superior, sem dominar a tela.

Conteúdo:

- Orb pequena;
- input;
- microfone;
- indicador de contexto autorizado.

### Durante voz

Texto transcrito aparece progressivamente.

O usuário pode:

- interromper;
- corrigir texto;
- cancelar.

### Durante plano

Mostrar uma frase curta:

> Abrir VS Code → localizar Réquiem → abrir pasta.

Não revelar cadeia de raciocínio do modelo.

Mostrar apenas ações observáveis.

### Aprovação

Exemplo:

> Vou mover 14 arquivos para a Lixeira.

Botões:

- Cancelar;
- Mover.

Se a ação for externa:

> Vou enviar esta mensagem para Ana.

O conteúdo final precisa estar visível antes de confirmar.

### Execução

Timeline mínima:

`Entendido → Permitido → Executando → Concluído`

Etapas completas desaparecem rapidamente para não virar dashboard.

### Resultado

Exemplo:

> Projeto aberto no VS Code.

ou

> Encontrei 3 arquivos. O mais recente é `curriculo.pdf`.

Botão opcional:

`Abrir no Workspace`

## 9. Context pill

Quando contexto estiver ativo, mostrar exatamente o que a Noa pode ver.

Exemplos:

- `Janela: VS Code`;
- `Arquivo: curriculo.pdf`;
- `Seleção: 824 caracteres`;
- `Tela: compartilhada nesta tarefa`.

Nunca apenas “VISÃO ATIVA”.

O usuário precisa entender o escopo.

## 10. Command receipts

Toda ação importante gera um recibo simples e auditável.

Exemplo:

```text
14:32  Abriu Visual Studio Code
Origem: comando de voz
Escopo: aplicativos permitidos
Resultado: concluído
```

A interface normal mostra apenas “Concluído”.

O Workspace permite abrir detalhes.

Isso é uma assinatura forte da Noa: **ela não só age; consegue explicar tecnicamente o que realmente fez.**

## 11. Memória como produto

Noa não deve dizer apenas “eu lembro de você”.

A memória precisa ser inspecionável.

Quando uma informação durável for criada, o usuário pode receber um detalhe discreto:

`Memória salva · Projeto Réquiem`

No Workspace:

- o que foi salvo;
- por quê;
- origem;
- data;
- onde é usado;
- editar;
- esquecer.

## 12. “Modo presença”

Estado recomendado para uso cotidiano.

- Workspace fechado;
- Orb opcional;
- wake word opcional;
- Overlay aparece apenas sob comando/evento autorizado;
- consumo em repouso é uma métrica principal;
- Noa não inicia conversa para parecer viva.

“Presença” significa disponibilidade, não insistência.

## 13. Demonstração de portfólio

A Noa deve ser demonstrável em cinco cenas curtas.

### Cena 1 — Presença

Usuário: “Noa, abre o Réquiem.”

Orb acorda → Overlay mostra plano → VS Code/projeto abre → “Pronto.”

### Cena 2 — Contexto

Com PDF aberto:

“Resume só a parte sobre requisitos.”

Noa mostra pill do PDF autorizado, lê e responde.

### Cena 3 — Ação sensível

“Move esses arquivos antigos pra lixeira.”

Noa mostra quantidade + lista resumida e pede confirmação.

### Cena 4 — Memória

“Lembra que nesse projeto eu quero Godot e C#.”

Noa salva memória de projeto e permite abrir/editar.

### Cena 5 — Falha boa

“Abre o programa X.”

Noa não encontra.

Em vez de fingir:

> Não encontrei X entre os aplicativos autorizados. Posso procurar onde ele está instalado.

Essa cena vende maturidade técnica melhor que uma animação bonita.

## 14. Diferencial técnico para portfólio

A Noa deve conseguir demonstrar claramente:

- streaming;
- voz;
- STT/TTS local;
- memória SQLite;
- policy engine;
- IPC seguro;
- app resolver;
- leitura de arquivo;
- execução tipada;
- logs/recibos;
- fallback e erro;
- performance em repouso.

A interface deve tornar essas capacidades compreensíveis sem parecer um painel de engenharia.

## 15. O que cortar/reduzir

### Cortar da superfície principal

- branding TRACE residual;
- telemetria grande sempre visível;
- partículas decorativas permanentes;
- vários anéis/órbitas sem estado real;
- labels “CORE” repetidos;
- botões técnicos demais no topo;
- alertas falsos/placeholders como se fossem eventos reais.

### Manter no Workspace/diagnóstico

- modelo atual;
- latência;
- uso de memória;
- microfone;
- provider;
- permissões;
- status de componentes.

## 16. Regra de interface

Antes de adicionar qualquer elemento visual, responder:

1. Qual estado real ele representa?
2. Qual ação ele facilita?
3. Qual permissão/risco ele torna visível?
4. Ele precisa estar sempre na tela?

Se as quatro respostas forem “nenhuma”, remover.

## 17. Ordem de implementação

1. remover herança visual/textual de TRACE;
2. consolidar um `AssistantState` único;
3. Orb ligada ao estado real;
4. Overlay com input + transcrição;
5. timeline de ações observáveis;
6. aprovação tipada;
7. context pill;
8. command receipts;
9. memória revisável;
10. reduzir/organizar Workspace;
11. performance/voz;
12. só depois animação extra.

## 18. Critério de sucesso

A Noa V3 está no caminho certo quando:

- alguém entende o estado dela sem ler um manual;
- uma ação comum pode ser concluída sem abrir Workspace;
- a Orb não incomoda quando está ociosa;
- o usuário sabe quando Noa vê tela/microfone/arquivo;
- uma ação importante deixa prova de resultado;
- erro não é mascarado;
- vídeo curto parece um computador respondendo, não uma página de chat estilizada.
