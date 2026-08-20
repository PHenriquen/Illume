# Desenvolvimento

## Primeiro preparo

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\Activate.ps1
npm run check
```

O backend base usado pelos testes de arquitetura e segurança não exige bibliotecas Python externas. Componentes opcionais de voz, documentos e modelos são preparados separadamente quando necessários.

## Fluxo que uso para mudanças

1. Crio uma branch para uma mudança específica.
2. Tento reproduzir o problema antes de editar o código quando existe um bug claro.
3. Mudo a menor fronteira que resolve o problema.
4. Adiciono ou ajusto um teste quando a falha pode voltar.
5. Executo `npm run check`.
6. Executo `npm run build`.
7. Testo o fluxo afetado no Electron/Windows quando a mudança envolve IPC, áudio, arquivos ou ações nativas.
8. Só então faço commit e push.

Prefiro commits pequenos que contam o que mudou de verdade, por exemplo:

```text
fix duplicate microphone listeners after wake
add test for file scope rejection
refactor native bridge with Noa compatibility alias
handle failed app launch without reporting success
```

Evito juntar documentação, refactor amplo, feature nova e correções não relacionadas no mesmo commit.

## Padrões

- TypeScript em modo estrito.
- `src/main.ts` continua sendo apenas o composition root.
- Estado mutável compartilhado fica centralizado e possui um dono claro.
- Comunicação entre domínios usa controladores/contratos explícitos.
- O renderer não recebe acesso direto a Node.js, `fs`, `child_process` ou shell.
- Python usa type hints nas interfaces públicas quando eles melhoram o contrato.
- Ações nativas precisam retornar resultado estruturado; texto gerado não comprova execução.
- Erros recuperáveis devem devolver a interface a um estado utilizável.
- Não registrar conversas, áudio, caminhos privados, tokens ou nomes sensíveis de aplicativos em diagnósticos públicos.
- Identificadores legados do TRACE só são removidos quando existe migração/compatibilidade testada.

## Testes

```powershell
npm run typecheck
npm test
npm run test:backend
npm run check
```

Os testes Node protegem arquitetura, integração e a migração gradual de nomes. Os testes Python cobrem comportamento independente de UI, como escopo de ações e integridade da trilha de auditoria.

Quando um bug real vira teste, o nome do teste deve descrever o comportamento esperado, não a implementação interna.

## Medições locais

Para registrar tempo de validação/build e tamanho do `dist` com informações do ambiente:

```powershell
npm run metrics:portfolio
```

Essas medições são para comparação reproduzível. Não devem virar números de marketing no README sem ambiente e método registrados.

## Antes de abrir um pull request

```powershell
npm run check
npm run build
python -m compileall -q backend
```

Verifique também:

- nenhum arquivo gerado, banco, modelo ou histórico pessoal foi adicionado;
- nenhuma credencial, token ou chave foi incluída;
- o README ainda corresponde ao comportamento real;
- novas permissões possuem motivo e resultado observável;
- novos canais IPC possuem dono único;
- uma mudança de nome não quebra dados locais ou empacotamento;
- limitações conhecidas relevantes continuam documentadas.
