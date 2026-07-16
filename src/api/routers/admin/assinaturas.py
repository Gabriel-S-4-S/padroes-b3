from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from auth.permissoes import exigir_admin
from usuarios.usuarios_db import listar_usuarios


router = APIRouter(
    prefix="/admin/assinaturas",
    tags=["Admin - Assinaturas"],
    dependencies=[Depends(exigir_admin)],
)


def converter_data(data_texto):
    if not data_texto:
        return None

    try:
        return datetime.strptime(
            data_texto,
            "%Y-%m-%d %H:%M:%S",
        )
    except ValueError:
        return None


def classificar_assinatura(usuario):
    agora = datetime.now()
    expira_em = converter_data(usuario.get("expira_em"))

    if usuario["status"] == "cancelado":
        return "cancelada"

    if usuario["plano"] == "gratis":
        return "gratuita"

    if expira_em is None:
        return "sem_expiracao"

    if expira_em < agora:
        return "vencida"

    limite_proximo_vencimento = agora + timedelta(days=7)

    if expira_em <= limite_proximo_vencimento:
        return "proxima_vencimento"

    return "ativa"


def montar_assinatura(usuario):
    return {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "email": usuario["email"],
        "plano": usuario["plano"],
        "status": usuario["status"],
        "expira_em": usuario["expira_em"],
        "data_criacao": usuario["data_criacao"],
        "ultimo_login": usuario["ultimo_login"],
        "role": usuario["role"],
        "classificacao": classificar_assinatura(usuario),
    }


@router.get("")
def listar_assinaturas(
    administrador=Depends(exigir_admin),
):
    usuarios = listar_usuarios()

    assinaturas = [
        montar_assinatura(usuario)
        for usuario in usuarios
        if usuario["plano"] in ["mensal", "anual"]
        or usuario["status"] == "cancelado"
    ]

    totais = {
        "todas": len(assinaturas),
        "mensais": sum(
            1
            for assinatura in assinaturas
            if assinatura["plano"] == "mensal"
        ),
        "anuais": sum(
            1
            for assinatura in assinaturas
            if assinatura["plano"] == "anual"
        ),
        "ativas": sum(
            1
            for assinatura in assinaturas
            if assinatura["classificacao"] == "ativa"
        ),
        "proximas_vencimento": sum(
            1
            for assinatura in assinaturas
            if assinatura["classificacao"] == "proxima_vencimento"
        ),
        "vencidas": sum(
            1
            for assinatura in assinaturas
            if assinatura["classificacao"] == "vencida"
        ),
        "canceladas": sum(
            1
            for assinatura in assinaturas
            if assinatura["classificacao"] == "cancelada"
        ),
    }

    return {
        "quantidade": len(assinaturas),
        "totais": totais,
        "assinaturas": assinaturas,
    }