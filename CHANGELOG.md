# Changelog

## Unreleased

### Engenharia

- README reorganizado para mostrar implementação, decisões técnicas, limitações e caminhos reais do código.
- `noaNative` e `AssistantState` introduzidos como nomes preferenciais, mantendo aliases temporários do TRACE para compatibilidade.
- Testes de migração adicionados para impedir remoção acidental da camada de compatibilidade.
- Testes Python adicionados para escopo de ações, confirmação por risco e integridade da trilha de auditoria.
- `npm run check` passa a validar TypeScript, testes Node e testes do backend.
- ADRs adicionados para local-first, fronteira Electron/Python e ações nativas controladas.
- Script `npm run metrics:portfolio` adicionado para medições reproduzíveis sem publicar números não verificados.
- Plano de demonstração de portfólio documentado com fluxo de sucesso e falha.

## 1.0.2 — Living Core

### Produto

- Núcleo visual responsivo e indicador de processamento.
- Ativação principal por “Acorde, Trace”.
- Duas palmas mantidas como recurso experimental opt-in.
- Conversa em streaming, OCR local, documentos e aplicativos autorizados.

### Engenharia

- Frontend dividido em controladores de domínio.
- `src/main.ts` reduzido a composition root.
- Backend HTTP separado dos serviços de IA.
- Código Electron reformatado para leitura e manutenção.
- Teste arquitetural para impedir novos arquivos monolíticos.
- GitHub Actions para tipagem, testes, build e compilação Python.
- Remoção de dependências, builds, executáveis e relatórios antigos do pacote de código-fonte.
- Scripts de desenvolvimento agrupados em `scripts/`.
