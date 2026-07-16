from auth.senha import verificar_senha
from usuarios.usuarios_db import (
    alterar_senha_usuario,
    buscar_usuario_por_email,
)


def obter_dados_conta(email: str):
    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        return {
            "sucesso": False,
            "mensagem": "Usuário não encontrado.",
        }

    return {
        "sucesso": True,
        "usuario": {
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
        },
    }


def alterar_senha(
    email: str,
    senha_atual: str,
    nova_senha: str,
):
    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        return {
            "sucesso": False,
            "mensagem": "Usuário não encontrado.",
        }

    senha_hash_atual = usuario[3]

    if not verificar_senha(senha_atual, senha_hash_atual):
        return {
            "sucesso": False,
            "mensagem": "A senha atual está incorreta.",
        }

    if len(nova_senha) < 8:
        return {
            "sucesso": False,
            "mensagem": "A nova senha deve possuir pelo menos 8 caracteres.",
        }

    if senha_atual == nova_senha:
        return {
            "sucesso": False,
            "mensagem": "A nova senha deve ser diferente da senha atual.",
        }

    alterada = alterar_senha_usuario(
        email=email,
        nova_senha=nova_senha,
    )

    if not alterada:
        return {
            "sucesso": False,
            "mensagem": "Não foi possível alterar a senha.",
        }

    return {
        "sucesso": True,
        "mensagem": "Senha alterada com sucesso.",
    }