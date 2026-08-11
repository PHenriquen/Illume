# Noa

> **Inteligência local. Presença real.**

Noa é uma companhia digital local para Windows com conversa por texto e voz, memória persistente, leitura de documentos e ações executadas somente dentro de permissões definidas pelo usuário.

O objetivo não é criar apenas mais uma interface para modelos de linguagem. Noa reúne inteligência local, contexto autorizado, automação segura e engenharia de software desktop em uma experiência coerente e verificável.

> **Estado atual:** versão `1.0.2` — Living Core. A base principal é funcional, mas o projeto ainda deve ser tratado como software em desenvolvimento antes de uma distribuição pública ampla.

## Visão

Noa deve ser:

- **local por padrão**, mantendo histórico e dados sensíveis no dispositivo sempre que possível;
- **transparente**, mostrando modelo ativo, estado, permissões e uso de rede;
- **útil**, capaz de agir em aplicativos, arquivos e rotinas autorizadas;
- **controlável**, separando sugestão, aprovação, execução e resultado;
- **presente sem ser invasiva**, com painel completo, modo compacto e voz opcional;
- **confiável**, explicando falhas em vez de fingir que uma ação foi concluída.

Leia também [`docs/PRODUCT.md`](docs/PRODUCT.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/BRAND.md`](docs/BRAND.md) e [`docs/ENGINEERING_LABS.md`](docs/ENGINEERING_LABS.md).

## Capacidades atuais

- IA local por Ollama, com modelo Qwen configurável;
- conversa em streaming;
- memória local em SQLite e histórico persistente;
- entrada por texto, microfone, palavra de ativação e duas palmas opcionais;
- resposta por voz do Windows ou mecanismo neural local;
- painel Electron, bandeja e sobreposição compacta;
- leitura local de texto, código, PDF, DOCX e imagens autorizadas;
- abertura de aplicativos e rotinas a partir de uma lista permitida;
- exportação de respostas em TXT, PDF e DOCX;
- testes automatizados para arquitetura, permissões e resolução de aplicativos.

## Princípio operacional

```text
Entender -> Planejar -> Verificar permissão -> Executar -> Confirmar -> Registrar
```

O modelo não deve receber acesso irrestrito ao computador. Ações do sistema precisam passar por contratos explícitos, allowlists, escopos de arquivo ou confirmação do usuário.

## Arquitetura

```text
NOA/
├── .github/workflows/       # validação automática
├── backend/
│   ├── app.py               # IA, memória, voz e documentos
│   ├── server.py            # servidor HTTP e rotas locais
│   ├── launcher.py          # ciclo de vida do núcleo local
│   ├── security.py          # policy engine e auditoria assinada
│   └── ml_intent.py         # classificador local treinável
├── desktop/
│   ├── main.cjs             # janelas, bandeja, IPC e integração com Windows
│   ├── preload.cjs          # ponte segura para o renderer
│   └── app-resolver.cjs     # resolução de aplicativos autorizados
├── docs/                    # produto, marca, arquitetura e engenharia
├── native/
│   ├── assets/              # recursos nativos
│   └── labs/                # experimentos C++ de baixo nível
├── scripts/                 # instalação, diagnóstico, backup e build
├── src/                     # renderer TypeScript
└── tests/                   # testes automatizados
```

A arquitetura possui três superfícies principais:

1. **Renderer TypeScript:** interface, conversa, áudio e preferências;
2. **Processo principal Electron:** janelas, bandeja, atalhos, IPC e ações nativas;
3. **Backend Python:** IA local, memória, documentos, STT, TTS e API local.

Os laboratórios adicionam uma quarta frente experimental: **segurança aplicada, ML treinável e computação nativa C++**, sem obrigar a runtime principal a depender deles.

## Tecnologias

- **Interface:** TypeScript, Vite, HTML e CSS;
- **Desktop:** Electron e Electron Builder;
- **Backend:** Python 3.13;
- **Dados:** SQLite local;
- **IA:** Ollama/Qwen + laboratório de ML local;
- **Voz:** Whisper.cpp, Piper e recursos do Windows;
- **Segurança:** allowlists, escopos, consentimento, policy engine e auditoria HMAC experimental;
- **Baixo nível:** laboratório C++ para áudio/concorrência;
- **Qualidade:** Node Test Runner, TypeScript e GitHub Actions.

## Engineering Labs

Para ampliar o portfólio sem descaracterizar a Noa, o projeto possui experimentos isolados e executáveis:

- `backend/security.py`: autorização por política e trilha de auditoria encadeada com HMAC;
- `backend/ml_intent.py`: ciclo completo de ML pequeno — dataset, treino, inferência e confiança;
- `native/labs/audio_ring_buffer.cpp`: estrutura C++ de baixa latência com atomics e memória explícita.

Esses módulos são **experimentais** e só devem entrar no caminho crítico da aplicação quando houver testes, benchmarks e ganho real de produto.

## Preparação para desenvolvimento

### Requisitos

- Windows 10 ou 11;
- Node.js 22 ou superior;
- npm 10 ou superior;
- Python 3.13 recomendado;
- Git;
- Ollama para o provedor local padrão.

### Instalação

```powershell
npm ci
npm run check
npm run build
```

Para abrir o aplicativo desktop:

```powershell
npm run desktop
```

Para iniciar somente o núcleo Python:

```powershell
python -m backend.launcher
```

Para testar o classificador local treinável:

```powershell
python -m backend.ml_intent
```

## Comandos

| Comando | Função |
|---|---|
| `npm run dev` | inicia a interface Vite |
| `npm run typecheck` | valida TypeScript |
| `npm test` | executa testes automatizados |
| `npm run check` | executa tipagem e testes |
| `npm run build` | limpa e compila a interface |
| `npm run desktop` | abre o Electron |
| `npm run desktop:package` | gera a versão portátil para Windows |
| `npm run desktop:installer` | gera o instalador NSIS |
| `npm run setup:status` | verifica componentes locais |
| `npm run setup:all` | prepara componentes opcionais |

## Dados, privacidade e segurança

Por padrão, dados persistentes são mantidos no computador do usuário. O projeto não deve versionar bancos SQLite, históricos pessoais, modelos baixados, tokens, chaves, arquivos `.env`, `node_modules`, `dist` ou `release`.

Camadas de proteção existentes ou em evolução incluem:

- renderer sem acesso direto ao Node.js;
- API limitada no preload Electron;
- aplicativos e arquivos autorizados por escopo;
- confirmação proporcional ao risco;
- comandos arbitrários não entregues diretamente ao modelo;
- auditoria verificável como laboratório de segurança;
- separação entre intenção, autorização, execução e resultado.

## Roadmap imediato

### 1. Núcleo de ações seguro

- consolidar contratos tipados;
- integrar gradualmente policy engine e auditoria;
- adicionar testes de abuso, path traversal e permissões.

### 2. Voz confiável e performance

- VAD e calibração;
- melhorar wake word e interrupção;
- impedir listeners concorrentes;
- medir se uma ponte C++ nativa traz benefício real ao áudio.

### 3. ML local pragmático

- ampliar e versionar dataset de intenções;
- medir precisão, recall e matriz de confusão;
- usar o classificador apenas quando superar regras simples em latência/confiabilidade.

### 4. Memória controlável

- separar histórico, preferências e contexto temporário;
- permitir revisão, edição, exportação e exclusão;
- registrar origem e finalidade de cada memória.

## Limitações atuais

- microfones e ambientes ruidosos ainda podem exigir calibração;
- alguns componentes opcionais dependem de download inicial;
- assinatura digital e atualização automática exigem infraestrutura de distribuição;
- os laboratórios de segurança, ML e C++ ainda não fazem parte do caminho crítico de produção;
- o aplicativo precisa ser validado em uma instalação limpa do Windows.

## Licença

O repositório está atualmente marcado como `UNLICENSED`. Antes de incentivar contribuições ou distribuição pública, é necessário definir uma política de licença coerente com o código, a marca Noa e os componentes de terceiros.
