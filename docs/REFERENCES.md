# Pesquisa e referências da Noa

Este documento registra referências de produto e arquitetura usadas para amadurecer a Noa. O objetivo é aprender com soluções existentes sem copiar marca, interface ou implementação.

## Método

Para cada funcionalidade relevante:

1. definir o problema antes de procurar uma solução;
2. consultar documentação, repositório ou especificação oficial;
3. comparar pelo menos duas abordagens quando houver decisão arquitetural importante;
4. registrar o que será aproveitado, adaptado ou rejeitado;
5. validar compatibilidade com Windows, execução local, desempenho e modelo de permissões da Noa;
6. implementar uma versão mínima testável antes de ampliar o escopo.

Fontes secundárias podem ajudar na descoberta, mas decisões técnicas devem se apoiar preferencialmente em fontes primárias.

## Referências principais

### Leon

- Site: https://getleon.ai/
- Repositório: https://github.com/leon-ai/leon

**O que observar**

- separação entre skills, actions, tools e funções;
- contexto explícito sobre o ambiente;
- memória em camadas;
- modos de execução controlado e agentivo;
- identidade consistente do assistente.

**O que não copiar**

- personalidade, nome ou linguagem visual;
- arquitetura completa antes de a Noa estabilizar ações básicas;
- autonomia ampla sem limites adequados ao desktop.

### Open Interpreter Desktop

- Documentação: https://www.openinterpreter.com/docs/desktop/install
- Projeto: https://www.openinterpreter.com/

**O que observar**

- seleção explícita de uma pasta de trabalho;
- permissões do sistema apresentadas durante a configuração;
- escolha de provedor e modelo;
- instalação automática de componentes de voz;
- agente orientado a tarefas reais no desktop.

**O que adaptar**

A Noa deve usar escopos claros de arquivos e contexto, mas preservar uma experiência mais pessoal, persistente e leve para Windows.

### OpenVoiceOS

- Site: https://www.openvoiceos.org/
- Organização: https://github.com/OpenVoiceOS

**O que observar**

- privacidade por padrão;
- componentes substituíveis de voz;
- independência de dispositivo;
- arquitetura comunitária e modular.

**Limite para a Noa**

Noa não pretende ser um sistema operacional para dispositivos de voz. Seu foco inicial é um aplicativo desktop integrado ao Windows.

### Home Assistant Assist

- Pipeline de voz: https://developers.home-assistant.io/docs/voice/pipelines/
- Assistente local: https://www.home-assistant.io/voice_control/voice_remote_local_assistant

**O que observar**

- pipeline explícito de palavra de ativação, fala, intenção e síntese;
- uso de VAD para evitar captura e transmissão desnecessárias;
- estados de pipeline observáveis;
- componentes locais de wake word, STT e TTS.

**Aplicação na Noa**

O áudio deve ser tratado como uma máquina de estados verificável, e não como listeners independentes que competem entre si.

### Open WebUI

- Repositório: https://github.com/open-webui/open-webui
- Desktop: https://github.com/open-webui/desktop

**O que observar**

- suporte a modelos locais e provedores compatíveis;
- memória persistente controlável;
- voz com múltiplos provedores;
- ferramentas e extensibilidade;
- experiência de configuração de modelos.

**Limite para a Noa**

Noa não deve virar apenas uma interface genérica para modelos. A identidade central continua sendo companhia local, contexto do dispositivo e ações autorizadas.

### Ollama

- Repositório: https://github.com/ollama/ollama
- Site: https://ollama.com/

**O que observar**

- instalação e gerenciamento de modelos;
- API local;
- compatibilidade com modelos distintos;
- diagnóstico de disponibilidade e recursos.

**Decisão atual**

Ollama permanece como provedor local padrão, mas o núcleo deve evitar acoplamento que impeça suporte futuro a servidores OpenAI-compatible.

### LM Studio

- Organização: https://github.com/lmstudio-ai
- Documentação: https://github.com/lmstudio-ai/docs

**O que observar**

- servidor de API local;
- seleção e carregamento de modelos;
- tool calling;
- evolução de suporte a MCP.

**Aplicação futura**

Avaliar como provedor alternativo, não como dependência obrigatória.

### Model Context Protocol

- Organização: https://github.com/modelcontextprotocol
- Especificação: https://modelcontextprotocol.io/

**O que observar**

- contratos padronizados de ferramentas e recursos;
- isolamento entre cliente e servidor de ferramentas;
- descoberta de capacidades;
- consentimento e risco de servidores externos.

**Decisão atual**

MCP é uma possibilidade para a fase de extensibilidade. A Noa deve estabilizar primeiro seu próprio modelo de permissões e ações tipadas.

## Síntese das inspirações

| Referência | Aprendizado principal para a Noa |
|---|---|
| Leon | skills e memória com arquitetura explícita |
| Open Interpreter | escopo de trabalho e permissões do desktop |
| OpenVoiceOS | voz modular e privacidade |
| Home Assistant Assist | pipeline de áudio observável e VAD |
| Open WebUI | provedores, memória e configuração de modelos |
| Ollama | execução local simples |
| LM Studio | alternativa de servidor local |
| MCP | extensibilidade padronizada futura |

## Identidade própria da Noa

A combinação que deve permanecer exclusiva é:

- aplicativo nativo para Windows;
- companhia digital com nome e voz configuráveis;
- operação local como padrão;
- painel completo e presença compacta;
- memória revisável;
- documentos e contexto selecionados;
- ações tipadas com confirmação e auditoria;
- instalação orientada para usuários que não querem montar manualmente uma pilha de IA.

## Registro de decisões

Toda decisão baseada em pesquisa deve ser adicionada à documentação de arquitetura ou a um ADR contendo:

- contexto;
- opções avaliadas;
- decisão;
- consequências;
- fontes consultadas;
- critério para revisão futura.
