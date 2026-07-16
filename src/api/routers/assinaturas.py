from fastapi import APIRouter, Depends
from pydantic import BaseModel

from assinaturas.assinaturas import (
    ativar_assinatura,
    renovar_assinatura,
    cancelar_assinatura,
)

from auth.permissoes import exigir_admin


router = APIRouter(
    prefix="/assinaturas",
    tags=["Assinaturas"],
    dependencies=[Depends(exigir_admin)],
)


class AssinaturaRequest(BaseModel):
    email: str
    plano: str


class CancelamentoRequest(BaseModel):
    email: str


@router.post("/ativar")
def ativar(
    dados: AssinaturaRequest,
    administrador=Depends(exigir_admin),
):
    return ativar_assinatura(
        email=dados.email,
        plano=dados.plano,
    )


@router.post("/renovar")
def renovar(
    dados: AssinaturaRequest,
    administrador=Depends(exigir_admin),
):
    return renovar_assinatura(
        email=dados.email,
        plano=dados.plano,
    )


@router.post("/cancelar")
def cancelar(
    dados: CancelamentoRequest,
    administrador=Depends(exigir_admin),
):
    return cancelar_assinatura(
        email=dados.email,
    )