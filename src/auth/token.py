from datetime import datetime, timedelta

import jwt

from config import JWT_SECRET, JWT_EXPIRACAO_HORAS


ALGORITMO = "HS256"


def gerar_token(usuario: dict):
    expiracao = datetime.utcnow() + timedelta(
        hours=JWT_EXPIRACAO_HORAS
    )

    payload = {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "email": usuario["email"],
        "plano": usuario["plano"],
        "status": usuario["status"],
        "role": usuario.get("role", "usuario"),
        "exp": expiracao,
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=ALGORITMO,
    )

    return token


def validar_token(token: str):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[ALGORITMO],
        )

        return payload

    except jwt.ExpiredSignatureError:
        return None

    except jwt.InvalidTokenError:
        return None