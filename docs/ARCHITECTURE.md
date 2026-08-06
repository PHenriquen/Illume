# Arquitetura da Noa

## Visão geral

Noa é dividida em três processos principais:

1. **Renderer TypeScript:** apresenta a interface, controla microfone, conversa, configurações e voz do navegador.
2. **Processo principal Electron:** administra janelas, bandeja, atalhos, aplicativos autorizados e recursos nativos.
3. **Backend Python:** fornece memória, IA local, transcrição, síntese, documentos e servidor HTTP local.

A comunicação principal ocorre no computador do usuário. Qualquer provedor remoto futuro deverá ser identificado explicitamente na interface e isolado atrás de um contrato de provedor.

## Princípios arquiteturais

- local-first, sem afirmar offline quando houver serviço remoto ativo;
- ações tipadas em vez de comandos livres entregues ao sistema;
- permissões proporcionais ao risco;
- contexto mínimo necessário para cada tarefa;
- estados e falhas observáveis;
- migrações compatíveis para dados e configurações;
- interface desacoplada do provedor de modelo.

## Renderer

O arquivo `src/main.ts` é o composition root. Ele conecta controladores especializados:

- `core.ts`: estado visual, partículas e alternância de visualização;
- `audio.ts`: captura do microfone, detector de palmas e transcrição;
- `chat.ts`: anexos, mensagens, streaming e exportações;
- `speech.ts`: voz do sistema e voz neural local;
- `apps.ts`: permissões, aplicativos detectados e rotinas;
- `system.ts`: saúde do backend, instalação e modo de voz;
- `bootstrap.ts`: listeners, migrações de preferências e inicialização;
- `runtime.ts`: referências DOM e estado compartilhado tipado;
- `types.ts`: contratos de dados e API nativa.

Os módulos não executam a aplicação de forma independente. O composition root registra todos os controladores antes de chamar `initializeApp()`.

## Electron

O preload expõe somente métodos explicitamente permitidos. O renderer não recebe `require`, `fs`, `child_process` ou acesso irrestrito ao sistema.

Responsabilidades do processo principal:

- criar painel e sobreposição;
- manter um estado único das superfícies;
- registrar atalhos globais;
- executar captura de tela autorizada;
- detectar e abrir aplicativos permitidos;
- manter rotinas locais;
- iniciar e encerrar o backend;
- compartilhar eventos entre janelas.

## Backend

`backend/app.py` concentra os serviços de domínio atuais:

- memória SQLite;
- integração com Ollama;
- processamento de anexos;
- Whisper.cpp;
- Piper;
- respostas e sugestões.

`backend/server.py` contém a camada HTTP e o serviço de arquivos compilados. `backend/launcher.py` administra o ciclo de vida dos processos locais.

A concentração atual em `backend/app.py` é aceitável para a base existente, mas a evolução deve separar gradualmente:

- provedores de modelo;
- memória;
- documentos;
- voz;
- ações;
- permissões;
- contexto.

A separação deve ocorrer por contratos e testes, não apenas pela criação de novas pastas.

## Fluxo de uma mensagem

1. O renderer valida a entrada e as permissões disponíveis.
2. Anexos selecionados são serializados localmente.
3. A solicitação é enviada para `/api/chat/stream`.
4. O backend compõe contexto, memória e personalização.
5. O provedor de modelo retorna eventos incrementais.
6. A interface atualiza a resposta enquanto ela é gerada.
7. Ao finalizar, a mensagem é armazenada no SQLite e pode ser falada.

## Fluxo futuro de uma ação

```text
Mensagem
  -> interpretação de intenção
  -> proposta de ação tipada
  -> avaliação de política e escopo
  -> confirmação quando necessária
  -> executor determinístico
  -> verificação do resultado
  -> resposta e auditoria
```

O modelo pode propor uma ação, mas não deve executar operações nativas diretamente.

## Pipeline de voz

A evolução da voz deve usar uma máquina de estados explícita:

```text
repouso -> atividade de voz -> wake word -> captura -> transcrição
-> interpretação -> resposta -> síntese -> reprodução -> repouso
```

Palmas, palavra de ativação e botão manual são entradas diferentes para o mesmo pipeline. Elas não devem iniciar listeners concorrentes sem coordenação.

## Estado e persistência

Preferências leves ficam em `localStorage`. Dados de maior duração ficam no diretório de dados da aplicação:

- histórico SQLite;
- modelos de voz e transcrição;
- componentes opcionais de documentos;
- lista de aplicativos autorizados;
- rotinas pessoais.

Nenhum desses dados deve ser versionado.

## Compatibilidade do rebranding

A marca pública passa a ser **Noa**, mas identificadores internos legados podem permanecer temporariamente durante a migração, incluindo:

- `appId` do Electron;
- diretório de dados;
- nomes de recursos empacotados;
- scripts de backup e restauração;
- chaves antigas de `localStorage`.

Esses identificadores só devem ser substituídos junto de uma rotina de migração testada. Renomeá-los diretamente poderia criar uma instalação paralela, perder preferências ou impedir a restauração de backups.

## Direção de módulos

| Domínio | Responsabilidade |
|---|---|
| Noa Core | orquestração de contexto, modelo e resposta |
| Noa Voice | wake word, VAD, STT, TTS e interrupção |
| Noa Memory | histórico, preferências e memória revisável |
| Noa Actions | contratos e executores determinísticos |
| Noa Context | tela, arquivos e sessão autorizados |
| Noa Guard | políticas, confirmações e auditoria |
| Noa Connect | provedores e integrações futuras |

Esses nomes organizam a arquitetura, mas a interface deve continuar usando termos simples para o usuário.

## Regras de manutenção

- `src/main.ts` deve permanecer apenas como composition root;
- arquivos da interface devem permanecer abaixo de 650 linhas;
- novos canais IPC precisam de nomes únicos e handlers explícitos;
- ações do sistema devem passar por allowlist, escopo ou confirmação;
- o resultado de uma ação precisa ser verificável antes de ser comunicado como sucesso;
- não adicionar `node_modules`, builds, bancos ou modelos ao Git;
- toda alteração estrutural deve manter `npm run check` aprovado;
- toda dependência nova deve justificar custo de tamanho, segurança e manutenção;
- decisões arquiteturais relevantes devem registrar contexto, alternativas e consequências.
