# Changelog

## 1.0.2 — Living Core

### Produto

- Núcleo visual responsivo e indicador de processamento.
- Ativação principal por “Acorde, Trace”.
- Duas palmas mantidas como recurso experimental opt-in.
- Conversa em streaming, OCR local, documentos e aplicativos autorizados.

### Engenharia

- Frontend dividido em controladores menores.
- `src/main.ts` usado apenas para iniciar e conectar os módulos.
- Backend HTTP separado da interface desktop.
- Testes para arquitetura, resolução de aplicativos e compatibilidade da migração.
- GitHub Actions para tipagem, testes, build e compilação Python.
- Scripts de instalação e backup organizados em `scripts/windows/`.
