from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.token import validar_token
from usuarios.usuarios_db import (
    buscar_usuario_por_email,
    usuario_esta_ativo,
)


esquema_bearer = HTTPBearer(auto_error=False)


def obter_usuario_autenticado(
    credenciais: HTTPAuthorizationCredentials = Depends(esquema_bearer),
):
    if credenciais is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso não informado.",
        )

    if credenciais.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de autenticação inválido.",
        )

    payload = validar_token(credenciais.credentials)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    email = payload.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificação de usuário.",
        )

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )

    if not usuario_esta_ativo(usuario):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo ou assinatura expirada.",
        )

    return {
        "id": usuario[0],
        "nome": usuario[1],
        "email": usuario[2],
        "plano": usuario[5],
        "status": usuario[6],
        "expira_em": usuario[7],
        "role": usuario[10],
        "email_verificado": bool(usuario[11]),
    }


def exigir_admin(
    usuario=Depends(obter_usuario_autenticado),
):
    if usuario["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores.",
        )

    return usuario


def exigir_premium(
    usuario=Depends(obter_usuario_autenticado),
):
    if usuario["role"] == "admin":
        return usuario

    if usuario["plano"] not in ["mensal", "anual"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="É necessária uma assinatura Premium ativa.",
        )

    return usuario