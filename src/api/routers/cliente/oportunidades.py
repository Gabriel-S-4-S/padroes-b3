from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends

from auth.permissoes import (
    obter_usuario_autenticado,
)
from banco.sqlite import (
    carregar_oportunidade_gratis,
    carregar_oportunidades_premium,
)


router = APIRouter(
    prefix="/cliente/oportunidades",
    tags=["Cliente - Oportunidades"],
)


def limpar_valor(
    valor: Any,
):
    """
    Converte valores do pandas/numpy para tipos nativos
    aceitos pelo JSON.
    """

    if valor is None:
        return None

    if hasattr(valor, "item"):
        valor = valor.item()

    try:
        if valor != valor:
            return None
    except (
        TypeError,
        ValueError,
    ):
        pass

    return valor


def converter_booleano(
    valor: Any,
) -> bool:
    if isinstance(valor, bool):
        return valor

    if isinstance(
        valor,
        (int, float),
    ):
        return bool(valor)

    texto = str(valor).strip().lower()

    return texto in {
        "1",
        "true",
        "sim",
        "yes",
    }


def converter_inteiro(
    valor: Any,
    padrao: int = 0,
) -> int:
    try:
        return int(float(valor))
    except (
        TypeError,
        ValueError,
    ):
        return padrao


def converter_real(
    valor: Any,
    padrao: float = 0.0,
) -> float:
    try:
        return float(valor)
    except (
        TypeError,
        ValueError,
    ):
        texto = str(valor).strip()

        texto = texto.replace(
            "%",
            "",
        )

        texto = texto.replace(
            ",",
            ".",
        )

        try:
            return float(texto)
        except ValueError:
            return padrao


def converter_texto(
    valor: Any,
    padrao: str = "",
) -> str:
    if valor is None:
        return padrao

    texto = str(valor).strip()

    return texto or padrao


def formatar_descricao_venda(
    horario_venda: str,
    venda_proximo_pregao: bool,
    pregoes_ate_venda: int,
) -> str:
    if not venda_proximo_pregao:
        return horario_venda

    if pregoes_ate_venda <= 1:
        return (
            f"Próximo pregão às "
            f"{horario_venda}"
        )

    return (
        f"{pregoes_ate_venda} pregões depois, "
        f"às {horario_venda}"
    )


def formatar_data_hora(
    valor: Any,
) -> str | None:
    texto = converter_texto(
        valor
    )

    if not texto:
        return None

    try:
        data = datetime.fromisoformat(
            texto.replace(
                "Z",
                "+00:00",
            )
        )

        return data.strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    except ValueError:
        return texto


def converter_registro(
    registro: dict,
) -> dict:
    registro_limpo = {
        chave: limpar_valor(valor)
        for chave, valor in registro.items()
    }

    horario_compra = converter_texto(
        registro_limpo.get(
            "horario_compra"
        ),
        "Não informado",
    )

    horario_venda = converter_texto(
        registro_limpo.get(
            "horario_venda"
        ),
        "Não informado",
    )

    venda_proximo_pregao = (
        converter_booleano(
            registro_limpo.get(
                "venda_proximo_pregao",
                False,
            )
        )
    )

    pregoes_ate_venda = converter_inteiro(
        registro_limpo.get(
            "pregoes_ate_venda",
            0,
        )
    )

    timestamp_compra = formatar_data_hora(
        registro_limpo.get(
            "timestamp_compra"
        )
    )

    timestamp_venda_prevista = (
        formatar_data_hora(
            registro_limpo.get(
                "timestamp_venda_prevista"
            )
        )
    )

    return {
        "id": registro_limpo.get("id"),

        "acao": converter_texto(
            registro_limpo.get("acao")
        ),

        "estrategia": converter_texto(
            registro_limpo.get(
                "estrategia"
            )
        ),

        "horario_compra": horario_compra,

        "horario_venda": horario_venda,

        "descricao_venda": (
            formatar_descricao_venda(
                horario_venda=horario_venda,
                venda_proximo_pregao=(
                    venda_proximo_pregao
                ),
                pregoes_ate_venda=(
                    pregoes_ate_venda
                ),
            )
        ),

        "horizonte_saida": (
            converter_inteiro(
                registro_limpo.get(
                    "horizonte_saida",
                    0,
                )
            )
        ),

        "taxa_acerto": converter_real(
            registro_limpo.get(
                "taxa_acerto",
                0,
            )
        ),

        "ocorrencias": converter_inteiro(
            registro_limpo.get(
                "ocorrencias",
                0,
            )
        ),

        "acertos": converter_inteiro(
            registro_limpo.get(
                "acertos",
                0,
            )
        ),

        "falhas": converter_inteiro(
            registro_limpo.get(
                "falhas",
                0,
            )
        ),

        "retorno_medio": converter_real(
            registro_limpo.get(
                "retorno_medio",
                0,
            )
        ),

        "score": converter_real(
            registro_limpo.get(
                "score",
                0,
            )
        ),

        "tipo_acesso": converter_texto(
            registro_limpo.get(
                "tipo_acesso"
            ),
            "premium",
        ),

        "data_geracao": formatar_data_hora(
            registro_limpo.get(
                "data_geracao"
            )
        ),

        "data_compra": converter_texto(
            registro_limpo.get(
                "data_compra"
            )
        ) or None,

        "data_venda_prevista": converter_texto(
            registro_limpo.get(
                "data_venda_prevista"
            )
        ) or None,

        "timestamp_compra": timestamp_compra,

        "timestamp_venda_prevista": (
            timestamp_venda_prevista
        ),

        "venda_proximo_pregao": (
            venda_proximo_pregao
        ),

        "pregoes_ate_venda": (
            pregoes_ate_venda
        ),

        "status_oportunidade": (
            converter_texto(
                registro_limpo.get(
                    "status_oportunidade"
                ),
                "ativa",
            )
        ),
    }


@router.get("")
def listar_oportunidades_cliente(
    usuario=Depends(
        obter_usuario_autenticado
    ),
):
    plano = usuario["plano"]
    role = usuario["role"]

    possui_premium = (
        role == "admin"
        or plano in {
            "mensal",
            "anual",
        }
    )

    if possui_premium:
        oportunidades_brutas = (
            carregar_oportunidades_premium()
        )

        oportunidades = [
            converter_registro(
                oportunidade
            )
            for oportunidade
            in oportunidades_brutas
        ]

        return {
            "plano": plano,
            "acesso": "premium",
            "quantidade": len(
                oportunidades
            ),
            "oportunidades": oportunidades,
        }

    oportunidade_gratis = (
        carregar_oportunidade_gratis()
    )

    if oportunidade_gratis is None:
        return {
            "plano": plano,
            "acesso": "gratis",
            "quantidade": 0,
            "oportunidades": [],
            "mensagem": (
                "Nenhuma oportunidade gratuita "
                "está disponível no momento."
            ),
        }

    oportunidade = converter_registro(
        oportunidade_gratis
    )

    return {
        "plano": plano,
        "acesso": "gratis",
        "quantidade": 1,
        "oportunidades": [
            oportunidade
        ],
        "mensagem": (
            "Conta gratuita: somente uma "
            "oportunidade está disponível."
        ),
    }