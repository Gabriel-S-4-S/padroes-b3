from fastapi import APIRouter, Depends

from auth.permissoes import exigir_admin
from banco.sqlite import (
    carregar_oportunidades_ativas,
    contar_oportunidades_historico,
)


router = APIRouter(
    prefix="/admin/oportunidades",
    tags=["Admin - Oportunidades"],
    dependencies=[Depends(exigir_admin)],
)


def limpar_valor(valor):
    if hasattr(valor, "item"):
        return valor.item()

    return valor


def converter_registro(registro):
    return {
        chave: limpar_valor(valor)
        for chave, valor in registro.items()
    }


@router.get("")
def listar_oportunidades(
    administrador=Depends(exigir_admin),
):
    dados = carregar_oportunidades_ativas()

    if dados.empty:
        oportunidades = []
    else:
        oportunidades = [
            converter_registro(registro)
            for registro in dados.to_dict(orient="records")
        ]

    return {
        "quantidade": len(oportunidades),
        "total_historico": int(
            contar_oportunidades_historico()
        ),
        "oportunidades": oportunidades,
    }