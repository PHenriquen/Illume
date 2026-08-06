# Noa

> **Inteligência local. Presença real.**

Noa é uma companhia digital local para Windows com conversa por texto e voz, memória persistente, leitura de documentos e ações executadas somente dentro de permissões definidas pelo usuário.

O objetivo não é criar apenas mais uma interface para modelos de linguagem. Noa busca reunir inteligência local, contexto autorizado e automação segura em uma experiência desktop coerente, verificável e pessoal.

> **Estado atual:** versão `1.0.2` — Living Core. O projeto possui uma base funcional, mas ainda deve ser tratado como software em desenvolvimento antes de uma distribuição pública ampla.

## Visão

Noa deve ser:

- **local por padrão**, mantendo histórico e dados sensíveis no dispositivo sempre que possível;
- **transparente**, mostrando modelo ativo, estado, permissões e uso de rede;
- **útil**, capaz de agir em aplicativos, arquivos e rotinas autorizadas;
- **controlável**, separando sugestão, aprovação, execução e resultado;
- **presente sem ser invasiva**, com painel completo, modo compacto e voz opcional;
- **confiável**, explicando falhas em vez de fingir que uma ação foi concluída.

Leia a definição completa em [`docs/PRODUCT.md`](docs/PRODUCT.md), a identidade em [`docs/BRAND.md`](docs/BRAND.md) e as referências de pesquisa em [`docs/REFERENCES.md`](docs/REFERENCES.md).

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
│   └── launcher.py          # ciclo de vida do núcleo local
├── desktop/
│   ├── main.cjs             # janelas, bandeja, IPC e integração com Windows
│   ├── preload.cjs          # ponte segura para o renderer
│   └── app-resolver.cjs     # resolução de aplicativos autorizados
├── docs/                    # produto, marca, arquitetura e desenvolvimento
├── native/                  # reconhecimento leve e recursos visuais
├── scripts/                 # instalação, diagnóstico, backup e build
├── src/
│   ├── app/
│   │   ├── apps.ts          # aplicativos e rotinas
│   │   ├── audio.ts         # microfone, palmas e transcrição
│   │   ├── bootstrap.ts     # eventos, migrações e inicialização
│   │   ├── chat.ts          # mensagens, anexos e streaming
│   │   ├── core.ts          # estado visual e partículas
│   │   ├── runtime.ts       # estado compartilhado tipado
│   │   ├── speech.ts        # síntese de voz
│   │   ├── system.ts        # saúde, instalação e preferências
│   │   └── types.ts         # contratos da aplicação
│   ├── main.ts              # composition root
│   └── style.css            # composição da identidade visual
└── tests/                   # testes automatizados
```

A arquitetura atual possui três superfícies principais:

1. **Renderer TypeScript:** interface, conversa, áudio e preferências;
2. **Processo principal Electron:** janelas, bandeja, atalhos, IPC e ações nativas;
3. **Backend Python:** IA local, memória, documentos, STT, TTS e API local.

Consulte [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tecnologias

- **Interface:** TypeScript, Vite, HTML e CSS;
- **Desktop:** Electron e Electron Builder;
- **Backend:** Python 3.13 e biblioteca padrão;
- **Dados:** SQLite local;
- **IA local:** Ollama e Qwen;
- **Voz:** Whisper.cpp, Piper e recursos do Windows;
- **Qualidade:** Node Test Runner, TypeScript e GitHub Actions.

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

## Dados e privacidade

Por padrão, dados persistentes são mantidos no computador do usuário. O projeto não deve versionar:

- bancos SQLite;
- históricos pessoais;
- modelos de IA;
- componentes baixados;
- tokens, chaves ou arquivos `.env`;
- `node_modules`, `dist` ou `release`.

O uso de um provedor remoto deve ser exibido claramente. A marca não pode afirmar que uma sessão é inteiramente local quando áudio, texto, documentos ou contexto forem enviados para outro serviço.

## Segurança

- o renderer não recebe acesso direto ao Node.js;
- a comunicação com Electron ocorre por uma API limitada no preload;
- aplicativos precisam ser detectados e autorizados;
- comandos arbitrários de terminal não são entregues diretamente ao modelo;
- captura de tela e acesso a arquivos dependem de consentimento;
- componentes locais são instalados somente após ação explícita;
- operações persistentes e externas devem possuir confirmação proporcional ao risco.

## Pesquisa e diferenciação

O desenvolvimento considera referências como Leon, Open Interpreter, OpenVoiceOS, Home Assistant Assist, Open WebUI, Ollama, LM Studio e MCP. A pesquisa serve para comparar padrões de voz, memória, ferramentas, permissões e modelos locais — não para copiar identidade ou transformar Noa em uma colagem de produtos.

A identidade própria da Noa é a combinação de:

- foco inicial em Windows;
- IA local acessível;
- presença compacta e painel completo;
- memória revisável;
- documentos e contexto selecionados;
- ações tipadas e auditáveis;
- instalação orientada a usuários que não desejam montar a pilha manualmente.

## Roadmap imediato

### 1. Rebranding seguro

- migrar a interface pública de TRACE para Noa;
- substituir ícone, textos, instalador e documentação;
- preservar dados existentes e compatibilidade de atualização;
- manter identificadores internos legados somente quando necessários à migração.

### 2. Núcleo de ações

- separar intenção, autorização, execução e resultado;
- criar contratos tipados;
- registrar ações e falhas;
- adicionar testes de segurança.

### 3. Voz confiável

- estruturar pipeline de áudio explícito;
- adicionar VAD;
- melhorar wake word, calibração e interrupção;
- impedir listeners concorrentes.

### 4. Memória controlável

- separar histórico, preferências e contexto temporário;
- permitir revisão, edição, exportação e exclusão;
- registrar origem e finalidade de cada memória.

## Limitações atuais

- microfones e ambientes ruidosos ainda podem exigir calibração;
- alguns componentes opcionais dependem de download inicial;
- assinatura digital e atualização automática exigem infraestrutura de distribuição;
- o aplicativo precisa ser validado em uma instalação limpa do Windows;
- a migração completa da identidade TRACE para Noa ainda está em andamento.

## Compatibilidade durante o rebranding

Alguns nomes internos, diretórios de dados, identificadores de pacote e scripts ainda podem usar `TRACE` temporariamente. Eles não devem ser renomeados de forma abrupta, pois isso pode quebrar atualização, backup ou acesso aos dados existentes. A migração será feita com compatibilidade explícita.

## Licença

O repositório está atualmente marcado como `UNLICENSED`. Antes de incentivar contribuições ou distribuição pública, é necessário definir uma política de licença coerente com o código, a marca Noa e os componentes de terceiros.
