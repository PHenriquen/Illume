# Backup e restauração

A Noa utiliza dois tipos de backup porque modelos de IA, runtimes e dados pessoais não devem ser gravados diretamente no histórico Git.

## 1. Repositório GitHub

Guarda código-fonte, testes, scripts e documentação. Pastas geradas como `node_modules`, `release`, bancos, modelos e dados pessoais continuam ignoradas.

## 2. Backup restaurável completo

Execute `CRIAR_BACKUP_NOA_COMPLETO.bat` na raiz. O comando valida o projeto, prepara os componentes autorizados e cria no Desktop uma pasta `Noa-Backup-<data>`.

Quando presentes no computador, o backup inclui:

- aplicativo portátil `Noa.exe`;
- código-fonte organizado;
- instalação local do Python usada pelo núcleo;
- runtime do Ollama;
- modelos existentes no Ollama;
- Whisper.cpp e o modelo de transcrição;
- Piper e a voz neural brasileira;
- bibliotecas de PDF, DOCX e OCR visual;
- memória SQLite, preferências e dados locais;
- restaurador automático.

Esse backup pode ocupar vários gigabytes. Guarde-o em HD externo, SSD externo ou armazenamento de nuvem que aceite arquivos grandes. Não faça commit das pastas `runtime-data`, `runtime-programs` ou `ollama-models`.

## Compatibilidade com TRACE

Durante a migração, dados podem existir em dois locais:

- `%LOCALAPPDATA%\Noa` — diretório novo;
- `%LOCALAPPDATA%\TRACE-AI` — diretório legado ainda usado por versões existentes.

O backup novo preserva os dois separadamente:

```text
runtime-data/
├── noa/
└── trace-legacy/
```

A restauração não mistura essas pastas nem apaga dados existentes. Backups antigos, que continham apenas `runtime-data`, continuam aceitos e são restaurados no diretório legado `TRACE-AI`.

## Restauração direta

Dentro da pasta de backup, execute `RESTAURAR_NOA_COMPLETO.bat`.

Quando o backup contém aplicativo portátil e runtimes, o restaurador:

1. recupera Python e Ollama nos caminhos locais esperados;
2. recupera modelos, voz, memória e bibliotecas;
3. restaura separadamente dados da Noa e dados legados;
4. copia o aplicativo para `%LOCALAPPDATA%\Programs\Noa`;
5. cria o atalho `Noa.lnk` no Desktop;
6. inicia `Noa.exe` — ou `TRACE.exe` quando o backup for antigo.

Se o backup não contiver aplicativo portátil, o restaurador recupera o código e executa `Install-NoaComplete.ps1`. Como fallback, backups antigos ainda podem usar `Install-TraceComplete.ps1`.

## Instalação completa com internet

Em um computador novo, execute `INSTALAR_NOA_COMPLETO.bat`. O instalador prepara:

- Node.js;
- Python;
- Ollama;
- dependências do projeto;
- modelo local configurado;
- Whisper.cpp;
- modelo de transcrição;
- Piper e voz pt-BR;
- leitura de PDF e DOCX;
- build e instalador do Windows.

O ZIP do repositório não contém os modelos. Eles são obtidos durante a preparação autorizada e passam a fazer parte de um backup restaurável posterior.

## Nomes legados

Os arquivos abaixo continuam no repositório apenas como wrappers de compatibilidade:

- `INSTALAR_TRACE_COMPLETO.bat`;
- `Backup-TraceComplete.ps1`;
- `Restore-TraceComplete.ps1`;
- `RESTAURAR_TRACE_COMPLETO.bat`.

Eles encaminham para os scripts oficiais da Noa e poderão ser removidos somente após uma versão de migração documentada e testada.
