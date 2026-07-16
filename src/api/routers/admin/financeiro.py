from fastapi import APIRouter, Depends, Query

from admin.financeiro_service import (
    obter_resumo_financeiro_admin,
)
from auth.permissoes import exigir_admin


router = APIRouter(
    prefix="/admin/financeiro",
    tags=["Admin - Financeiro"],
    dependencies=[Depends(exigir_admin)],
)


@router.get("/resumo")
def resumo_financeiro(
    ano: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
        description=(
            "Ano usado no gráfico de receita mensal. "
            "Quando não informado, usa o ano atual."
        ),
    ),
    administrador=Depends(exigir_admin),
):
    return obter_resumo_financeiro_admin(
        ano=ano,
    )