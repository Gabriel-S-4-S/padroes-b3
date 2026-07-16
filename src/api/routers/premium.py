from fastapi import APIRouter, Depends

from api.services import obter_oportunidades_premium
from auth.permissoes import exigir_premium


router = APIRouter(
    prefix="/premium",
    tags=["Premium"],
)


@router.get("/")
def premium(
    usuario=Depends(exigir_premium),
):
    return {
        "usuario": {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "plano": usuario["plano"],
            "role": usuario["role"],
        },
        **obter_oportunidades_premium(),
    }