from fastapi import APIRouter, Depends, Query

from auditoria.auditoria_db import listar_auditoria
from auth.permissoes import exigir_admin


router = APIRouter(
    prefix="/admin/auditoria",
    tags=["Admin - Auditoria"],
    dependencies=[Depends(exigir_admin)],
)


@router.get("")
def obter_auditoria(
    limite: int = Query(default=20, ge=1, le=500),
):
    registros = listar_auditoria(limite=limite)

    return {
        "quantidade": len(registros),
        "registros": registros,
    }