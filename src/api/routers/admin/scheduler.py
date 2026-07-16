from fastapi import APIRouter, Depends, Query

from auth.permissoes import exigir_admin
from servicos.monitoramento_scheduler_db import (
    listar_execucoes_scheduler,
    obter_status_scheduler,
)


router = APIRouter(
    prefix="/admin/scheduler",
    tags=["Admin - Scheduler"],
    dependencies=[Depends(exigir_admin)],
)


@router.get("/status")
def status_scheduler(
    administrador=Depends(exigir_admin),
):
    return {
        "sucesso": True,
        "status": obter_status_scheduler(),
    }


@router.get("/execucoes")
def execucoes_scheduler(
    limite: int = Query(
        default=20,
        ge=1,
        le=200,
    ),
    administrador=Depends(exigir_admin),
):
    registros = listar_execucoes_scheduler(
        limite=limite,
    )

    return {
        "sucesso": True,
        "quantidade": len(registros),
        "execucoes": registros,
    }


@router.get("/resumo")
def resumo_scheduler(
    limite: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    administrador=Depends(exigir_admin),
):
    status = obter_status_scheduler()

    execucoes = listar_execucoes_scheduler(
        limite=limite,
    )

    return {
        "sucesso": True,
        "status": status,
        "quantidade_execucoes": len(execucoes),
        "execucoes": execucoes,
    }