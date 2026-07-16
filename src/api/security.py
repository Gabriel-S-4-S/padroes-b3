from fastapi import Header, HTTPException

from config import API_KEY


def verificar_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Acesso não autorizado."
        )

    return True