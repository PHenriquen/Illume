# TRACE AI

Assistente pessoal local para Windows com inteligência artificial, voz, memória, interface compacta e automações executadas somente após autorização.

> **Estado atual:** versão `1.0.2` — Living Core. O projeto está funcional, mas ainda deve ser tratado como software em desenvolvimento antes de uma distribuição pública ampla.

## Principais recursos

- IA local executada pelo Ollama com modelo Qwen configurável.
- Conversa em streaming, memória local em SQLite e histórico persistente.
- Entrada por texto, microfone, palavra-chave e duas palmas opcionais.
- Resposta por voz do Windows ou mecanismo neural local.
- Interface Electron com painel, bandeja e sobreposição compacta.
- Leitura local de texto, código, PDF, DOCX e imagens autorizadas.
- Abertura de aplicativos e rotinas somente a partir de uma lista permitida.
- Exportação de respostas em TXT, PDF e DOCX.
- Testes automatizados para arquitetura, permissões e resolução de aplicativos.

## Tecnologias

- **Interface:** TypeScript, Vite, HTML e CSS.
- **Desktop:** Electron e Electron Builder.
- **Backend:** Python 3.13 e biblioteca padrão.
- **Dados:** SQLite local.
- **IA local:** Ollama, Qwen, Whisper.cpp e Piper, preparados sob demanda.

## Estrutura do projeto

```text
TRACE-AI/
├── .github/workflows/       # validação automática no GitHub Actions
├── backend/
│   ├── app.py               # IA, memória, voz e documentos
│   ├── server.py            # servidor HTTP e rotas locais
│   └── launcher.py          # inicialização e encerramento seguro
├── desktop/
│   ├── main.cjs             # ciclo de vida do Electron e IPC
│   ├── preload.cjs          # ponte segura entre interface e Electron
│   └── app-resolver.cjs     # resolução de aplicativos autorizados
├── docs/                    # arquitetura e desenvolvimento
├── native/                  # reconhecimento leve e recursos visuais
├── scripts/                 # automação de desenvolvimento e empacotamento
├── src/
│   ├── app/
│   │   ├── apps.ts          # aplicativos e rotinas
│   │   ├── audio.ts         # microfone, palmas e transcrição
│   │   ├── bootstrap.ts     # eventos e inicialização
│   │   ├── chat.ts          # mensagens, anexos e streaming
│   │   ├── core.ts          # estado visual e partículas
│   │   ├── runtime.ts       # estado compartilhado tipado
│   │   ├── speech.ts        # síntese de voz
│   │   ├── system.ts        # saúde, instalação e preferências
│   │   └── types.ts         # contratos da aplicação
│   ├── main.ts              # composição dos módulos
│   └── style.css            # identidade visual
└── tests/                   # testes automatizados
```

A interface não depende mais de um arquivo TypeScript monolítico. O `src/main.ts` apenas compõe os controladores, enquanto cada domínio possui um módulo próprio.

## Preparação no VS Code

### Requisitos

- Windows 10 ou 11.
- Node.js 22 ou superior.
- npm 10 ou superior.
- Python 3.13 recomendado.
- Git.

### Instalação para desenvolvimento

```powershell
npm ci
npm run check
npm run build
```

Para iniciar o aplicativo desktop depois do build:

```powershell
npm run desktop
```

Para iniciar o núcleo local diretamente:

```powershell
python -m backend.launcher
```

Também existem scripts assistidos em `scripts/windows/`.

## Comandos disponíveis

| Comando | Função |
|---|---|
| `npm run dev` | inicia somente a interface Vite |
| `npm run typecheck` | valida o TypeScript sem gerar arquivos |
| `npm test` | executa os testes automatizados |
| `npm run check` | executa tipagem e testes |
| `npm run build` | limpa e compila a interface |
| `npm run desktop` | abre o Electron com o build atual |
| `npm run desktop:package` | gera a versão portátil para Windows |
| `npm run desktop:installer` | gera o instalador NSIS |

## Dados e privacidade

Por padrão, dados persistentes são mantidos no próprio computador:

- Windows: `%LOCALAPPDATA%\TRACE-AI`
- Outros sistemas: `.trace-data/`

O repositório não deve conter:

- `node_modules/`;
- `dist/`;
- `release/`;
- bancos SQLite;
- ambientes virtuais;
- modelos de IA;
- tokens, chaves ou arquivos `.env`.

Esses caminhos já estão protegidos pelo `.gitignore`.

## Segurança

- O renderer não recebe acesso direto ao Node.js.
- A comunicação com o Electron ocorre por uma API limitada no preload.
- Aplicativos precisam ser detectados e autorizados antes de serem abertos.
- Comandos arbitrários de terminal não são enviados ao modelo.
- Captura de tela, leitura e edição de arquivos dependem das permissões da interface.
- Downloads de componentes locais são iniciados apenas por ações explícitas do usuário.

## Build para Windows

A maneira recomendada é:

```powershell
npm ci
npm run check
npm run desktop:package
```

O resultado portátil será criado em `release/win-unpacked/`. A pasta `release/` é artefato de build e não deve ser versionada.

## Qualidade e validação

A suíte atual cobre:

- duplicidade de canais IPC;
- resolução segura de aplicativos;
- ativação por voz e palmas;
- interrupção de fala;
- OCR e documentos;
- streaming de respostas;
- limites de tamanho dos módulos da interface.

Consulte [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para os contratos internos e [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) para o fluxo de contribuição.

## Limitações atuais

- O reconhecimento leve depende dos recursos de fala disponíveis no Windows.
- Microfones e ambientes muito ruidosos podem exigir calibração.
- Alguns componentes opcionais exigem download inicial.
- Assinatura digital e atualização automática ainda dependem de infraestrutura de distribuição.
- Antes de publicar um instalador, é necessário testar microfone, sobreposição, aplicativos da Microsoft Store e empacotamento em uma máquina Windows limpa.

## Instalação completa e backup real

Para preparar o TRACE em um Windows novo, execute:

```text
INSTALAR_TRACE_COMPLETO.bat
```

Esse instalador prepara o aplicativo e também IA local, Whisper, Piper, voz pt-BR e leitura de documentos. Downloads são reutilizados quando os componentes já existem.

Depois que o TRACE estiver completo, execute:

```text
CRIAR_BACKUP_COMPLETO.bat
```

Ele cria no Desktop uma pasta restaurável com o código, memória, componentes de voz, bibliotecas de documentos e modelos do Ollama. Consulte [`docs/BACKUP_AND_RECOVERY.md`](docs/BACKUP_AND_RECOVERY.md).
