from auth.senha import verificar_senha
from auth.token import gerar_token

from usuarios.usuarios_db import (
    buscar_usuario_por_email,
    atualizar_ultimo_login,
    usuario_esta_ativo,
)


def fazer_login(email: str, senha: str):
    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        return {
            "autenticado": False,
            "mensagem": "Usuário não encontrado."
        }

    senha_hash = usuario[3]

    if not verificar_senha(senha, senha_hash):
        return {
            "autenticado": False,
            "mensagem": "Senha incorreta."
        }

    if not usuario_esta_ativo(usuario):
        return {
            "autenticado": False,
            "mensagem": "Usuário inativo ou assinatura expirada."
        }

    atualizar_ultimo_login(email)

    usuario_dict = {
        "id": usuario[0],
        "nome": usuario[1],
        "email": usuario[2],
        "api_key": usuario[4],
        "plano": usuario[5],
        "status": usuario[6],
        "expira_em": usuario[7],
        "role": usuario[10],
        "email_verificado": bool(usuario[11]),
    }

    token = gerar_token(usuario_dict)

    return {
        "autenticado": True,
        "mensagem": "Login realizado com sucesso.",
        "token": token,
        "usuario": usuario_dict,
    }