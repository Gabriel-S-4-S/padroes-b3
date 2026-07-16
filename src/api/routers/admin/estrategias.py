from fastapi import APIRouter, Depends

from auth.permissoes import exigir_admin
from banco.sqlite import carregar_estrategias_aprovadas


router = APIRouter(
    prefix="/admin/estrategias",
    tags=["Admin - Estratégias"],
    dependencies=[Depends(exigir_admin)],
)


def limpar_valor(valor):
    if hasattr(valor, "item"):
        return valor.item()

    if valor != valor:
        return None

    return valor


def converter_registro(registro):
    return {
        chave: limpar_valor(valor)
        for chave, valor in registro.items()
    }


@router.get("")
def listar_estrategias(
    administrador=Depends(exigir_admin),
):
    dados = carregar_estrategias_aprovadas()

    if dados.empty:
        estrategias = []
    else:
        estrategias = [
            converter_registro(registro)
            for registro in dados.to_dict(orient="records")
        ]

    return {
        "quantidade": len(estrategias),
        "estrategias": estrategias,
    }