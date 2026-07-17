import os
import sqlite3
from typing import Any

from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests
from google.oauth2 import id_token

from auth.token import gerar_token
from usuarios.usuarios_db import (
    atualizar_dados_google,
    atualizar_ultimo_login,
    buscar_usuario_por_email,
    buscar_usuario_por_google_id,
    criar_usuario_google,
    usuario_esta_ativo,
    vincular_conta_google,
)


def obter_google_client_id() -> str:
    client_id = os.getenv(
        "GOOGLE_CLIENT_ID",
        "",
    ).strip()

    if not client_id:
        raise RuntimeError(
            "A variável GOOGLE_CLIENT_ID não foi configurada."
        )

    return client_id


def validar_credencial_google(
    credential: str,
) -> dict[str, Any]:
    """
    Valida o ID Token recebido do Google.

    A biblioteca verifica:
    - assinatura do token;
    - validade;
    - emissor;
    - público-alvo, usando o Client ID;
    - integridade da credencial.
    """

    credential_limpa = credential.strip()

    if not credential_limpa:
        raise ValueError(
            "A credencial do Google não foi informada."
        )

    client_id = obter_google_client_id()

    try:
        dados_google = id_token.verify_oauth2_token(
            credential_limpa,
            requests.Request(),
            client_id,
        )

    except ValueError as erro:
        raise ValueError(
            "A credencial do Google é inválida ou expirou."
        ) from erro

    except GoogleAuthError as erro:
        raise RuntimeError(
            "Não foi possível validar a credencial com o Google."
        ) from erro

    emissor = str(
        dados_google.get("iss", "")
    ).strip()

    emissores_validos = {
        "accounts.google.com",
        "https://accounts.google.com",
    }

    if emissor not in emissores_validos:
        raise ValueError(
            "O emissor da credencial do Google é inválido."
        )

    google_id = str(
        dados_google.get("sub", "")
    ).strip()

    email = str(
        dados_google.get("email", "")
    ).strip().lower()

    nome = str(
        dados_google.get("name", "")
    ).strip()

    foto_perfil = str(
        dados_google.get("picture", "")
    ).strip() or None

    email_verificado = bool(
        dados_google.get("email_verified")
    )

    if not google_id:
        raise ValueError(
            "O Google não retornou o identificador da conta."
        )

    if not email:
        raise ValueError(
            "O Google não retornou o endereço de e-mail."
        )

    if not email_verificado:
        raise ValueError(
            "O endereço de e-mail da conta Google não foi verificado."
        )

    if not nome:
        nome = email.split("@")[0]

    return {
        "google_id": google_id,
        "email": email,
        "nome": nome,
        "foto_perfil": foto_perfil,
    }


def transformar_usuario_em_dict(
    usuario,
) -> dict[str, Any]:
    """
    Mantém o mesmo formato de resposta utilizado pelo
    login tradicional com e-mail e senha.
    """

    return {
        "id": usuario[0],
        "nome": usuario[1],
        "email": usuario[2],
        "api_key": usuario[4],
        "plano": usuario[5],
        "status": usuario[6],
        "expira_em": usuario[7],
        "role": usuario[10],
        "email_verificado": bool(usuario[11]),
        "google_id": usuario[12],
        "provedor_login": usuario[13],
        "foto_perfil": usuario[14],
    }


def localizar_ou_criar_usuario_google(
    *,
    google_id: str,
    email: str,
    nome: str,
    foto_perfil: str | None,
):
    """
    Ordem de busca:

    1. Procura pelo identificador permanente do Google.
    2. Procura uma conta já cadastrada com o mesmo e-mail.
    3. Vincula o Google à conta existente.
    4. Caso não exista, cria uma conta gratuita.
    """

    usuario_google = buscar_usuario_por_google_id(
        google_id
    )

    if usuario_google is not None:
        email_atual = str(
            usuario_google[2]
        ).strip().lower()

        # Atualiza nome e foto quando o e-mail continua
        # sendo o mesmo da conta já vinculada.
        if email_atual == email:
            atualizar_dados_google(
                google_id=google_id,
                nome=nome,
                email=email,
                foto_perfil=foto_perfil,
            )

        return buscar_usuario_por_google_id(
            google_id
        )

    usuario_email = buscar_usuario_por_email(
        email
    )

    if usuario_email is not None:
        google_id_existente = usuario_email[12]

        if (
            google_id_existente
            and str(google_id_existente) != google_id
        ):
            raise ValueError(
                "Este e-mail já está vinculado a outra conta Google."
            )

        vinculado = vincular_conta_google(
            email=email,
            google_id=google_id,
            nome=nome,
            foto_perfil=foto_perfil,
        )

        if not vinculado:
            raise RuntimeError(
                "Não foi possível vincular a conta Google."
            )

        return buscar_usuario_por_google_id(
            google_id
        )

    try:
        criar_usuario_google(
            nome=nome,
            email=email,
            google_id=google_id,
            foto_perfil=foto_perfil,
        )

    except sqlite3.IntegrityError:
        # Proteção contra duas requisições simultâneas
        # tentando criar a mesma conta.
        usuario_google = buscar_usuario_por_google_id(
            google_id
        )

        if usuario_google is not None:
            return usuario_google

        usuario_email = buscar_usuario_por_email(
            email
        )

        if usuario_email is not None:
            return usuario_email

        raise RuntimeError(
            "Não foi possível criar a conta com o Google."
        )

    return buscar_usuario_por_google_id(
        google_id
    )


def fazer_login_google(
    *,
    credential: str,
) -> dict[str, Any]:
    dados_google = validar_credencial_google(
        credential
    )

    usuario = localizar_ou_criar_usuario_google(
        google_id=dados_google["google_id"],
        email=dados_google["email"],
        nome=dados_google["nome"],
        foto_perfil=dados_google["foto_perfil"],
    )

    if usuario is None:
        raise RuntimeError(
            "A conta não pôde ser localizada após o login."
        )

    if not usuario_esta_ativo(usuario):
        return {
            "autenticado": False,
            "mensagem": (
                "Usuário inativo ou assinatura expirada."
            ),
        }

    email_usuario = usuario[2]

    atualizar_ultimo_login(
        email_usuario
    )

    # Busca novamente para retornar os dados atualizados.
    usuario_atualizado = buscar_usuario_por_google_id(
        dados_google["google_id"]
    )

    if usuario_atualizado is not None:
        usuario = usuario_atualizado

    usuario_dict = transformar_usuario_em_dict(
        usuario
    )

    token = gerar_token(
        usuario_dict
    )

    return {
        "autenticado": True,
        "mensagem": (
            "Login com Google realizado com sucesso."
        ),
        "token": token,
        "usuario": usuario_dict,
        "novo_usuario": (
            usuario_dict["provedor_login"] == "google"
        ),
    }