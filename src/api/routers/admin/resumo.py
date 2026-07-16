from fastapi import APIRouter, Depends

from api.services import obter_resumo_admin
from auth.permissoes import exigir_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin - Resumo"],
    dependencies=[Depends(exigir_admin)],
)


@router.get("/resumo")
def resumo_administrativo(
    administrador=Depends(exigir_admin),
):
    return obter_resumo_admin()