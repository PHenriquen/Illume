# Changelog

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
