import json
from datetime import datetime
from pathlib import Path
from typing import Any


CAMINHO_ARQUIVO_ESTADO = (
    Path(__file__).resolve().parent
    / "estado_scheduler.json"
)


def estado_padrao() -> dict[str, Any]:
    return {
        "ultimo_scanner": None,
        "ultimo_laboratorio": None,
    }


def carregar_estado() -> dict[str, Any]:
    if not CAMINHO_ARQUIVO_ESTADO.exists():
        return estado_padrao()

    try:
        conteudo = CAMINHO_ARQUIVO_ESTADO.read_text(
            encoding="utf-8"
        )

        dados = json.loads(conteudo)

        if not isinstance(dados, dict):
            return estado_padrao()

        return {
            "ultimo_scanner": dados.get(
                "ultimo_scanner"
            ),
            "ultimo_laboratorio": dados.get(
                "ultimo_laboratorio"
            ),
        }

    except (
        OSError,
        json.JSONDecodeError,
        TypeError,
    ):
        return estado_padrao()


def salvar_estado(
    estado: dict[str, Any],
) -> None:
    estado_normalizado = {
        "ultimo_scanner": estado.get(
            "ultimo_scanner"
        ),
        "ultimo_laboratorio": estado.get(
            "ultimo_laboratorio"
        ),
    }

    conteudo = json.dumps(
        estado_normalizado,
        ensure_ascii=False,
        indent=4,
    )

    arquivo_temporario = (
        CAMINHO_ARQUIVO_ESTADO.with_suffix(
            ".tmp"
        )
    )

    arquivo_temporario.write_text(
        conteudo,
        encoding="utf-8",
    )

    arquivo_temporario.replace(
        CAMINHO_ARQUIVO_ESTADO
    )


def normalizar_momento(
    momento: datetime,
) -> str:
    return momento.replace(
        microsecond=0
    ).isoformat()


def converter_momento(
    valor: str | None,
) -> datetime | None:
    if not valor:
        return None

    try:
        return datetime.fromisoformat(valor)

    except ValueError:
        return None


def scanner_ja_executado(
    horario_programado: datetime,
) -> bool:
    estado = carregar_estado()

    ultimo_scanner = converter_momento(
        estado.get("ultimo_scanner")
    )

    if ultimo_scanner is None:
        return False

    return (
        ultimo_scanner
        == horario_programado.replace(
            microsecond=0
        )
    )


def marcar_scanner_executado(
    horario_programado: datetime,
) -> None:
    estado = carregar_estado()

    estado["ultimo_scanner"] = (
        normalizar_momento(
            horario_programado
        )
    )

    salvar_estado(estado)


def laboratorio_ja_executado(
    horario_programado: datetime,
) -> bool:
    estado = carregar_estado()

    ultimo_laboratorio = converter_momento(
        estado.get("ultimo_laboratorio")
    )

    if ultimo_laboratorio is None:
        return False

    return (
        ultimo_laboratorio
        == horario_programado.replace(
            microsecond=0
        )
    )


def marcar_laboratorio_executado(
    horario_programado: datetime,
) -> None:
    estado = carregar_estado()

    estado["ultimo_laboratorio"] = (
        normalizar_momento(
            horario_programado
        )
    )

    salvar_estado(estado)


def limpar_estado() -> None:
    salvar_estado(
        estado_padrao()
    )


def obter_resumo_estado() -> dict[str, str | None]:
    estado = carregar_estado()

    ultimo_scanner = converter_momento(
        estado.get("ultimo_scanner")
    )

    ultimo_laboratorio = converter_momento(
        estado.get("ultimo_laboratorio")
    )

    return {
        "ultimo_scanner": (
            ultimo_scanner.strftime(
                "%d/%m/%Y às %H:%M:%S"
            )
            if ultimo_scanner
            else None
        ),
        "ultimo_laboratorio": (
            ultimo_laboratorio.strftime(
                "%d/%m/%Y às %H:%M:%S"
            )
            if ultimo_laboratorio
            else None
        ),
    }