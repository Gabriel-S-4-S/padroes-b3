import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from assinaturas.assinaturas import (
    ativar_assinatura,
    cancelar_assinatura,
)

from auditoria.auditoria_db import registrar_auditoria
from auth.permissoes import exigir_admin

from usuarios.usuarios_db import (
    atualizar_dados_usuario,
    buscar_usuario_por_email,
    buscar_usuario_por_id,
    criar_usuario,
    listar_usuarios,
    redefinir_senha_admin,
)


router = APIRouter(
    prefix="/admin/usuarios",
    tags=["Admin - Usuários"],
    dependencies=[Depends(exigir_admin)],
)


PLANOS_VALIDOS = {"gratis", "mensal", "anual"}
ROLES_VALIDAS = {"usuario", "admin"}


class NovoUsuario(BaseModel):
    nome: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=5, max_length=180)
    senha: str = Field(min_length=8, max_length=200)
    plano: str = "gratis"
    role: str = "usuario"


class AtualizarUsuarioRequest(BaseModel):
    nome: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=5, max_length=180)
    role: str = "usuario"
    email_verificado: bool = False


class RedefinirSenhaAdminRequest(BaseModel):
    nova_senha: str = Field(min_length=8, max_length=200)


class EmailRequest(BaseModel):
    email: str


class PlanoRequest(BaseModel):
    email: str
    plano: str


def usuario_para_dict(usuario):
    if usuario is None:
        return None

    return {
        "id": usuario[0],
        "nome": usuario[1],
        "email": usuario[2],
        "plano": usuario[5],
        "status": usuario[6],
        "expira_em": usuario[7],
        "data_criacao": usuario[8],
        "ultimo_login": usuario[9],
        "role": usuario[10],
        "email_verificado": bool(usuario[11]),
    }


@router.get("")
def usuarios(
    administrador=Depends(exigir_admin),
):
    lista = listar_usuarios()

    return {
        "quantidade": len(lista),
        "usuarios": lista,
    }


@router.get("/{usuario_id}")
def obter_usuario(
    usuario_id: int,
    administrador=Depends(exigir_admin),
):
    usuario = buscar_usuario_por_id(usuario_id)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return {
        "usuario": usuario_para_dict(usuario),
    }


@router.post("/criar")
def criar(
    dados: NovoUsuario,
    administrador=Depends(exigir_admin),
):
    nome = dados.nome.strip()
    email = dados.email.strip().lower()
    plano = dados.plano.strip().lower()
    role = dados.role.strip().lower()

    if plano not in PLANOS_VALIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plano inválido. Use 'gratis', 'mensal' ou 'anual'.",
        )

    if role not in ROLES_VALIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permissão inválida. Use 'usuario' ou 'admin'.",
        )

    usuario_existente = buscar_usuario_por_email(email)

    if usuario_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta cadastrada com este e-mail.",
        )

    try:
        api_key = criar_usuario(
            nome=nome,
            email=email,
            senha=dados.senha,
            plano="gratis",
            expira_em=None,
            role=role,
        )

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta cadastrada com este e-mail.",
        )

    resultado_assinatura = None

    if plano in {"mensal", "anual"}:
        resultado_assinatura = ativar_assinatura(
            email=email,
            plano=plano,
        )

        if not resultado_assinatura.get("sucesso"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    resultado_assinatura.get("mensagem")
                    or "O usuário foi criado, mas não foi possível ativar o plano."
                ),
            )

    registrar_auditoria(
        tipo="usuario",
        acao="criar_usuario",
        usuario_email=email,
        responsavel=administrador["email"],
        detalhes=(
            f"Usuário criado manualmente. "
            f"Plano: {plano} | Permissão: {role}"
        ),
    )

    resposta = {
        "sucesso": True,
        "mensagem": "Usuário criado com sucesso.",
        "usuario": {
            "nome": nome,
            "email": email,
            "plano": plano,
            "role": role,
        },
        "api_key": api_key,
    }

    if resultado_assinatura is not None:
        resposta["expira_em"] = resultado_assinatura.get("expira_em")

    return resposta


@router.put("/{usuario_id}")
def atualizar_usuario(
    usuario_id: int,
    dados: AtualizarUsuarioRequest,
    administrador=Depends(exigir_admin),
):
    usuario_atual = buscar_usuario_por_id(usuario_id)

    if usuario_atual is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    nome = dados.nome.strip()
    email = dados.email.strip().lower()
    role = dados.role.strip().lower()

    if role not in ROLES_VALIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permissão inválida. Use 'usuario' ou 'admin'.",
        )

    usuario_com_email = buscar_usuario_por_email(email)

    if (
        usuario_com_email is not None
        and usuario_com_email[0] != usuario_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe outra conta usando este e-mail.",
        )

    atualizado = atualizar_dados_usuario(
        usuario_id=usuario_id,
        nome=nome,
        email=email,
        role=role,
        email_verificado=dados.email_verificado,
    )

    if not atualizado:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível atualizar o usuário.",
        )

    registrar_auditoria(
        tipo="usuario",
        acao="editar_usuario",
        usuario_email=email,
        responsavel=administrador["email"],
        detalhes=(
            f"Dados do usuário atualizados. "
            f"Permissão: {role} | "
            f"E-mail verificado: {dados.email_verificado}"
        ),
    )

    usuario_atualizado = buscar_usuario_por_id(usuario_id)

    return {
        "sucesso": True,
        "mensagem": "Usuário atualizado com sucesso.",
        "usuario": usuario_para_dict(usuario_atualizado),
    }


@router.post("/{usuario_id}/redefinir-senha")
def redefinir_senha(
    usuario_id: int,
    dados: RedefinirSenhaAdminRequest,
    administrador=Depends(exigir_admin),
):
    usuario = buscar_usuario_por_id(usuario_id)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    alterada = redefinir_senha_admin(
        usuario_id=usuario_id,
        nova_senha=dados.nova_senha,
    )

    if not alterada:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível redefinir a senha.",
        )

    registrar_auditoria(
        tipo="usuario",
        acao="redefinir_senha",
        usuario_email=usuario[2],
        responsavel=administrador["email"],
        detalhes="Senha redefinida manualmente pelo administrador.",
    )

    return {
        "sucesso": True,
        "mensagem": "Senha redefinida com sucesso.",
    }


@router.post("/ativar")
def ativar(
    dados: PlanoRequest,
    administrador=Depends(exigir_admin),
):
    email = dados.email.strip().lower()
    plano = dados.plano.strip().lower()

    if plano not in {"mensal", "anual"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use o plano 'mensal' ou 'anual'.",
        )

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return ativar_assinatura(
        email=email,
        plano=plano,
    )


@router.post("/cancelar")
def cancelar(
    dados: EmailRequest,
    administrador=Depends(exigir_admin),
):
    email = dados.email.strip().lower()

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return cancelar_assinatura(
        email=email,
    )