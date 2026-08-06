# Voz e ativação da Noa

## Palavra principal

A palavra de ativação oficial é **Noa**.

Comandos recomendados:

- `Acorde, Noa` — inicia uma sessão por voz;
- `Olá, Noa` ou `Oi, Noa` — inicia uma sessão de forma natural;
- `E aí, Noa` — alternativa informal;
- `Descanse, Noa` ou `Durma, Noa` — encerra a presença compacta e a sessão de voz.

A interface deve ensinar primeiro `Acorde, Noa`, porque é a frase mais explícita e menos propensa a ativações acidentais.

## Compatibilidade temporária

Durante o rebranding, `Trace` e `Tracer` permanecem como aliases legados da palavra de ativação. Eles existem apenas para evitar que uma instalação atual deixe de responder imediatamente após a atualização.

A compatibilidade segue estas regras:

1. `Noa` é sempre apresentada como palavra principal;
2. ativações legadas continuam funcionando sem alterar dados ou preferências;
3. o listener informa internamente se a frase usada foi principal ou legada;
4. aliases antigos podem ser removidos somente após uma versão de migração documentada;
5. IDs IPC, diretórios e chaves `trace-*` não devem ser confundidos com a identidade falada — eles permanecem temporariamente por compatibilidade técnica.

## Pipeline

```text
repouso
  -> frase reconhecida pelo listener leve do Windows
  -> abertura da superfície compacta
  -> captura do comando
  -> transcrição
  -> interpretação
  -> resposta
  -> síntese opcional
  -> repouso
```

O listener leve reconhece apenas um vocabulário curto de ativação e repouso. Conversas completas continuam sendo transcritas pelo mecanismo configurado depois que a sessão é aberta.

## Segurança e privacidade

- o listener nativo usa uma gramática pequena, não uma transcrição contínua de conversas;
- frases com baixa confiança ou duração muito curta são ignoradas;
- o áudio do comando só é processado depois de uma ativação válida, clique manual ou gesto de palmas habilitado;
- o usuário pode desligar a escuta ambiente a qualquer momento;
- falhas no listener não devem bloquear o botão manual nem as palmas opcionais.

## Critérios de qualidade

- baixa taxa de ativações falsas;
- resposta consistente para `Acorde, Noa`;
- `Descanse, Noa` sempre interrompe fala e captura em andamento;
- aliases antigos não aparecem como orientação principal na interface;
- estados de escuta, processamento e fala permanecem visíveis;
- wake word, palmas e botão manual convergem para o mesmo pipeline, sem listeners concorrentes.
