# Backup e restauração

O TRACE utiliza dois backups diferentes, porque modelos de IA e runtimes não devem ser gravados diretamente no histórico Git.

## 1. Repositório GitHub

Guarda o código-fonte, testes, scripts e documentação. Ele permanece pequeno, legível e fácil de atualizar. Pastas geradas como `node_modules`, `release`, bancos e modelos continuam ignoradas.

## 2. Backup restaurável completo

Execute `CRIAR_BACKUP_COMPLETO.bat` na raiz. Esse comando primeiro prepara e valida todos os componentes e depois cria no Desktop uma pasta `TRACE-AI-Backup-<data>`.

Quando presentes no computador, a pasta inclui:

- aplicativo portátil `TRACE.exe`, pronto para abrir sem recompilar;
- código-fonte organizado;
- instalação local do Python usada pelo núcleo;
- runtime do Ollama;
- modelo Qwen e demais modelos existentes no Ollama;
- Whisper.cpp e o modelo Large V3 Turbo Q5;
- Piper e a voz neural brasileira;
- bibliotecas de PDF, DOCX e OCR visual;
- memória SQLite, preferências e dados locais;
- restaurador automático.

Esse backup pode ocupar vários gigabytes. Guarde-o em HD externo, SSD externo ou armazenamento de nuvem que aceite arquivos grandes. Não faça commit das pastas `runtime-data`, `runtime-programs` ou `ollama-models` no Git comum.

## Restauração direta

Dentro da pasta de backup, execute `RESTAURAR_TRACE_COMPLETO.bat`.

Quando o backup contém o aplicativo portátil e os runtimes, o restaurador:

1. recupera Python e Ollama nos caminhos locais esperados;
2. recupera modelos, voz, memória e bibliotecas;
3. copia o aplicativo para `%LOCALAPPDATA%\Programs\TRACE-AI`;
4. cria um atalho no Desktop;
5. inicia o TRACE sem recompilar.

Se o backup tiver sido criado antes de gerar o aplicativo portátil, o restaurador recupera o código e usa a instalação online como fallback.

## Instalação completa com internet

Em um computador novo, o arquivo `INSTALAR_TRACE_COMPLETO.bat` instala ou prepara automaticamente:

- Node.js;
- Python;
- Ollama;
- dependências do projeto;
- modelo local Qwen;
- Whisper.cpp;
- modelo de transcrição;
- Piper e voz pt-BR;
- leitura de PDF e DOCX;
- instalador do Windows.

O ZIP do repositório não contém os modelos em si. Eles são obtidos durante a instalação e passam a fazer parte do backup restaurável criado posteriormente.
