from fastapi import APIRouter, Depends

from auth.permissoes import obter_usuario_autenticado

from banco.sqlite import (
    carregar_oportunidade_gratis,
    carregar_oportunidades_premium,
)


router = APIRouter(
    prefix="/cliente/oportunidades",
    tags=["Cliente - Oportunidades"],
)


def limpar_valor(valor):
    """
    Converte valores do pandas/numpy para tipos nativos
    aceitos pelo JSON.
    """

    if hasattr(valor, "item"):
        return valor.item()

    # Trata NaN.
    if valor != valor:
        return None

    return valor


def converter_registro(registro: dict):
    return {
        chave: limpar_valor(valor)
        for chave, valor in registro.items()
    }


@router.get("")
def listar_oportunidades_cliente(
    usuario=Depends(obter_usuario_autenticado),
):
    plano = usuario["plano"]
    role = usuario["role"]

    possui_premium = (
        role == "admin"
        or plano in {"mensal", "anual"}
    )

    if possui_premium:
        oportunidades_brutas = carregar_oportunidades_premium()

        oportunidades = [
            converter_registro(oportunidade)
            for oportunidade in oportunidades_brutas
        ]

        return {
            "plano": plano,
            "acesso": "premium",
            "quantidade": len(oportunidades),
            "oportunidades": oportunidades,
        }

    oportunidade_gratis = carregar_oportunidade_gratis()

    if oportunidade_gratis is None:
        return {
            "plano": plano,
            "acesso": "gratis",
            "quantidade": 0,
            "oportunidades": [],
            "mensagem": (
                "Nenhuma oportunidade gratuita está disponível "
                "no momento."
            ),
        }

    oportunidade = converter_registro(
        oportunidade_gratis
    )

    return {
        "plano": plano,
        "acesso": "gratis",
        "quantidade": 1,
        "oportunidades": [oportunidade],
        "mensagem": (
            "Conta gratuita: somente uma oportunidade está disponível."
        ),
    }