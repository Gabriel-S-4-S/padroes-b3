from usuarios.usuarios_db import (
    buscar_usuario_por_email,
    criar_usuario,
)


def cadastrar_usuario(
    nome: str,
    email: str,
    senha: str,
):
    nome = nome.strip()
    email = email.strip().lower()

    if len(nome) < 3:
        return {
            "sucesso": False,
            "mensagem": "O nome deve possuir pelo menos 3 caracteres.",
        }

    if "@" not in email or "." not in email:
        return {
            "sucesso": False,
            "mensagem": "Informe um endereço de e-mail válido.",
        }

    if len(senha) < 8:
        return {
            "sucesso": False,
            "mensagem": "A senha deve possuir pelo menos 8 caracteres.",
        }

    usuario_existente = buscar_usuario_por_email(email)

    if usuario_existente is not None:
        return {
            "sucesso": False,
            "mensagem": "Já existe uma conta cadastrada com este e-mail.",
        }

    criar_usuario(
        nome=nome,
        email=email,
        senha=senha,
        plano="gratis",
        expira_em=None,
        role="usuario",
    )

    return {
        "sucesso": True,
        "mensagem": "Conta criada com sucesso.",
        "usuario": {
            "nome": nome,
            "email": email,
            "plano": "gratis",
            "role": "usuario",
        },
    }