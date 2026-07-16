from fastapi import APIRouter, Depends

from admin.saude_service import obter_saude_sistema
from auth.permissoes import exigir_admin


router = APIRouter(
    prefix="/admin/saude",
    tags=["Admin - Saúde do Sistema"],
    dependencies=[Depends(exigir_admin)],
)


@router.get("")
def saude_sistema(
    administrador=Depends(exigir_admin),
):
    return obter_saude_sistema()