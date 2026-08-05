# Arquitetura do TRACE AI

## Visão geral

O TRACE é dividido em três processos principais:

1. **Renderer TypeScript:** apresenta a interface, controla microfone, conversa, configurações e voz do navegador.
2. **Processo principal Electron:** administra janelas, bandeja, atalhos, aplicativos autorizados e recursos nativos.
3. **Backend Python:** fornece memória, IA local, transcrição, síntese, documentos e servidor HTTP local.

A comunicação ocorre somente no computador do usuário.

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

`backend/app.py` concentra os serviços de domínio:

- memória SQLite;
- integração com Ollama;
- processamento de anexos;
- Whisper.cpp;
- Piper;
- respostas e sugestões.

`backend/server.py` contém exclusivamente a camada HTTP e o serviço de arquivos compilados. `backend/launcher.py` administra o ciclo de vida dos processos locais.

## Fluxo de uma mensagem

1. O renderer valida a entrada e as permissões.
2. Anexos selecionados são serializados localmente.
3. A solicitação é enviada para `/api/chat/stream`.
4. O backend compõe contexto, memória e personalização.
5. O Ollama retorna eventos NDJSON incrementais.
6. A interface atualiza a resposta enquanto ela é gerada.
7. Ao finalizar, a mensagem é armazenada no SQLite e pode ser falada.

## Estado e persistência

Preferências leves ficam em `localStorage`. Dados de maior duração ficam no diretório de dados do TRACE:

- histórico SQLite;
- modelos de voz e transcrição;
- componentes opcionais de documentos;
- lista de aplicativos autorizados;
- rotinas pessoais.

Nenhum desses dados deve ser versionado.

## Regras de manutenção

- `src/main.ts` deve permanecer apenas como composition root.
- Arquivos da interface devem permanecer abaixo de 650 linhas.
- Novos canais IPC precisam de nomes únicos e handlers explícitos.
- Ações do sistema devem passar por allowlist ou confirmação.
- Não adicionar `node_modules`, builds, bancos ou modelos ao Git.
- Toda alteração estrutural deve manter `npm run check` aprovado.
