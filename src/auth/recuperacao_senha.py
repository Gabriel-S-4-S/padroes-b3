import secrets
from datetime import datetime, timedelta

from usuarios.recuperacao_db import (
    buscar_token_recuperacao,
    marcar_token_como_utilizado,
    salvar_token_recuperacao,
)

from usuarios.usuarios_db import (
    alterar_senha_usuario,
    buscar_usuario_por_email,
)


TEMPO_EXPIRACAO_MINUTOS = 30


def solicitar_recuperacao_senha(email: str):
    email = email.strip().lower()

    usuario = buscar_usuario_por_email(email)

    # Retorno genérico para não revelar se o e-mail existe.
    resposta = {
        "sucesso": True,
        "mensagem": (
            "Se o e-mail estiver cadastrado, você receberá "
            "as instruções para redefinir a senha."
        ),
    }

    if usuario is None:
        return resposta

    token = secrets.token_urlsafe(48)

    expira_em = (
        datetime.now() + timedelta(minutes=TEMPO_EXPIRACAO_MINUTOS)
    ).strftime("%Y-%m-%d %H:%M:%S")

    salvar_token_recuperacao(
        email=email,
        token=token,
        expira_em=expira_em,
    )

    # Somente para desenvolvimento.
    # Depois esse token será enviado por e-mail e não retornará na API.
    resposta["token_temporario"] = token
    resposta["expira_em"] = expira_em

    return resposta


def redefinir_senha_com_token(
    token: str,
    nova_senha: str,
):
    if len(nova_senha) < 8:
        return {
            "sucesso": False,
            "mensagem": "A nova senha deve possuir pelo menos 8 caracteres.",
        }

    registro = buscar_token_recuperacao(token)

    if registro is None:
        return {
            "sucesso": False,
            "mensagem": "Token inválido ou inexistente.",
        }

    usuario_email = registro[1]
    expira_em = registro[3]
    utilizado = bool(registro[4])

    if utilizado:
        return {
            "sucesso": False,
            "mensagem": "Este token já foi utilizado.",
        }

    data_expiracao = datetime.strptime(
        expira_em,
        "%Y-%m-%d %H:%M:%S",
    )

    if datetime.now() > data_expiracao:
        return {
            "sucesso": False,
            "mensagem": "O token de recuperação expirou.",
        }

    alterada = alterar_senha_usuario(
        email=usuario_email,
        nova_senha=nova_senha,
    )

    if not alterada:
        return {
            "sucesso": False,
            "mensagem": "Não foi possível redefinir a senha.",
        }

    marcar_token_como_utilizado(token)

    return {
        "sucesso": True,
        "mensagem": "Senha redefinida com sucesso.",
    }