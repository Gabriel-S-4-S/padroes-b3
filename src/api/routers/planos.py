from fastapi import APIRouter

from planos.planos_service import listar_planos


router = APIRouter(
    prefix="/planos",
    tags=["Planos"],
)


@router.get("")
def obter_planos():
    planos = listar_planos()

    return {
        "quantidade": len(planos),
        "planos": planos,
    }