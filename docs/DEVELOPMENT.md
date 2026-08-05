# Desenvolvimento

## Primeiro preparo

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\Activate.ps1
npm run check
```

O backend base não exige bibliotecas Python externas. Componentes opcionais são instalados pelo próprio TRACE quando autorizados.

## Fluxo recomendado

1. Crie uma branch específica.
2. Faça mudanças pequenas e relacionadas.
3. Execute `npm run check`.
4. Execute `npm run build`.
5. Compile o backend com `python -m compileall -q backend`.
6. Teste a interface no Electron.
7. Só então faça commit e push.

## Padrões

- TypeScript em modo estrito.
- Funções curtas e nomes explícitos.
- Estado mutável centralizado em `runtime.store`.
- Comunicação entre domínios pelos controladores tipados.
- Python com type hints nas interfaces públicas.
- Erros recuperáveis devem liberar novamente os campos da interface.
- Não registrar conversas, áudio, caminhos privados ou nomes de aplicativos em diagnósticos.

## Antes de abrir um pull request

```powershell
npm run check
npm run build
python -m compileall -q backend
```

Verifique também:

- nenhum arquivo gerado foi adicionado;
- nenhuma credencial foi incluída;
- o README ainda corresponde ao comportamento real;
- novas permissões possuem explicação visível ao usuário;
- novos canais IPC possuem teste de unicidade.
