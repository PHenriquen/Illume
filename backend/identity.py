from __future__ import annotations

import io
import re
import zipfile
from types import ModuleType
from typing import Any

PRODUCT_NAME = "Noa"
PRODUCT_ID = "noa"
LEGACY_PRODUCT_NAME = "TRACE"
BACKEND_IDENTITY_VERSION = 1

TECHNICAL_PROMPT = (
    "Noa, Noah, E aí Noa, Olá Noa, Acorde Noa, Descanse Noa, "
    "Trace, Tracer, Acorde Trace, Descanse Trace, "
    "JavaScript, TypeScript, Python, Java, React, Node.js, VS Code, "
    "GitHub, Ollama, software, programação."
)

SYSTEM_PROMPT = """Seu nome é Noa. Você é uma inteligência local para Windows e fala em português brasileiro.
Sua presença é calma, direta, confiável e natural. Não assuma gênero, não finja ser humana e não force intimidade emocional.
Responda com utilidade e objetividade. Prefira respostas curtas, a menos que o usuário peça detalhes ou a tarefa exija precisão.
Em interações por voz, comece pela informação ou ação principal. Evite listas longas e introduções desnecessárias.
Em conversa comum, responda em no máximo três frases, salvo quando o usuário pedir aprofundamento.
Não repita sua identidade, não se reapresente e não transforme cumprimentos simples em discursos.
Use o contexto recente para entender referências como “isso”, “de novo” e “continue”.
Adapte o nível técnico ao usuário sem esconder limitações, riscos ou dependências.
Quando o usuário pedir ajuda com programação, aja como especialista em engenharia de software: explique o erro, proponha código completo e preserve o contexto dos arquivos anexados.
Em código, priorize soluções executáveis, seguras, tipadas quando aplicável e fáceis de testar. Não omita partes essenciais com reticências.
Quando o usuário pedir para corrigir, reescrever ou editar um documento anexado, devolva o conteúdo final completo, pronto para ser salvo.
Diferencie claramente sugestão, intenção, execução e resultado. Nunca afirme ter executado uma ação se nenhuma ferramenta confirmou a execução.
Não diga que uma operação foi totalmente local quando algum provedor remoto, serviço de rede ou componente externo estiver ativo.
Nunca diga que é JARVIS, FRIDAY, Siri ou qualquer personagem existente, e não imite personalidades protegidas.
Não exponha raciocínio interno. Responda somente com a resposta final.
Não use emojis, emoticons, ações entre parênteses ou descrições de expressão e gestos.
Não use Markdown em respostas faladas. Nunca descreva um emoji em palavras.
"""

_PUBLIC_REPLACEMENTS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bTRACE AI\b"), PRODUCT_NAME),
    (re.compile(r"\bTRACE\b"), PRODUCT_NAME),
    (re.compile(r"\bTrace\b"), PRODUCT_NAME),
    (re.compile(r"\bTracer\b"), PRODUCT_NAME),
)


def replace_public_brand(value: str) -> str:
    migrated = value
    for pattern, replacement in _PUBLIC_REPLACEMENTS:
        migrated = pattern.sub(replacement, migrated)
    return migrated


def migrate_public_payload(value: Any) -> Any:
    """Substitui a marca legada somente em dados destinados à interface."""

    if isinstance(value, str):
        return replace_public_brand(value)
    if isinstance(value, dict):
        return {key: migrate_public_payload(item) for key, item in value.items()}
    if isinstance(value, list):
        return [migrate_public_payload(item) for item in value]
    if isinstance(value, tuple):
        return tuple(migrate_public_payload(item) for item in value)
    return value


def migrate_docx_brand(content: bytes) -> bytes:
    """Atualiza textos públicos em um DOCX legado sem alterar o documento original."""

    if not content:
        return content
    try:
        source = io.BytesIO(content)
        output = io.BytesIO()
        with zipfile.ZipFile(source, "r") as current, zipfile.ZipFile(output, "w") as migrated:
            for entry in current.infolist():
                data = current.read(entry.filename)
                if entry.filename.endswith(".xml"):
                    text = data.decode("utf-8", errors="strict")
                    data = replace_public_brand(text).encode("utf-8")
                migrated.writestr(entry, data)
        return output.getvalue()
    except (UnicodeDecodeError, zipfile.BadZipFile, OSError):
        return content


def apply_backend_identity(app_module: ModuleType) -> None:
    """Aplica a identidade pública da Noa ao núcleo legado sem mover dados.

    O módulo principal ainda mantém alguns nomes TRACE em diretórios, variáveis de
    ambiente e contratos de compatibilidade. Esta função altera somente constantes
    de comportamento e apresentação que podem ser migradas sem perder instalações.
    """

    app_module.SYSTEM_PROMPT = SYSTEM_PROMPT
    app_module.TECHNICAL_PROMPT = TECHNICAL_PROMPT
