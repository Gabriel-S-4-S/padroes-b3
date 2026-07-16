import sqlite3

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel

from auth.conta import obter_dados_conta
from auth.permissoes import obter_usuario_autenticado

from pagamentos.mercado_pago_service import (
    ErroMercadoPago,
    criar_preferencia_pagamento,
)

from pagamentos.pagamentos_db import (
    registrar_preferencia_pagamento,
)

from planos.planos_service import (
    buscar_plano,
    plano_pago_valido,
)


router = APIRouter(
    prefix="/assinaturas",
    tags=["Assinaturas - Cliente"],
)


class IniciarAssinaturaRequest(BaseModel):
    plano: str


@router.post("/iniciar")
def iniciar_assinatura(
    dados: IniciarAssinaturaRequest,
    usuario_token=Depends(obter_usuario_autenticado),
):
    plano_id = dados.plano.strip().lower()
    plano = buscar_plano(plano_id)

    if plano is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plano não encontrado.",
        )

    if not plano_pago_valido(plano_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "O plano gratuito não precisa de pagamento."
            ),
        )

    resultado_conta = obter_dados_conta(
        email=usuario_token["email"],
    )

    usuario = resultado_conta.get("usuario")

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada.",
        )

    if usuario["role"] != "usuario":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Contas administrativas não podem contratar "
                "planos pela área do cliente."
            ),
        )

    if (
        usuario["plano"] == plano_id
        and usuario["status"] == "ativo"
    ):
        return {
            "sucesso": False,
            "mensagem": (
                f"O plano {plano['nome']} já é o plano atual."
            ),
        }

    try:
        pagamento = criar_preferencia_pagamento(
            usuario_id=usuario["id"],
            nome=usuario["nome"],
            email=usuario["email"],
            plano=plano,
        )

    except ErroMercadoPago as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        ) from erro

    try:
        pagamento_local_id = registrar_preferencia_pagamento(
            usuario_id=usuario["id"],
            usuario_email=usuario["email"],
            plano=plano_id,
            valor_centavos=plano["preco_centavos"],
            preferencia_id=pagamento["preferencia_id"],
            referencia_externa=(
                pagamento["referencia_externa"]
            ),
            modo_teste=pagamento["modo_teste"],
        )

    except sqlite3.IntegrityError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Esta preferência de pagamento já foi registrada."
            ),
        ) from erro

    return {
        "sucesso": True,
        "pagamento_disponivel": True,
        "mensagem": "Checkout criado com sucesso.",
        "pagamento_local_id": pagamento_local_id,
        "plano": plano,
        "checkout": {
            "preferencia_id": pagamento["preferencia_id"],
            "referencia_externa": (
                pagamento["referencia_externa"]
            ),
            "url_pagamento": pagamento["url_pagamento"],
            "modo_teste": pagamento["modo_teste"],
        },
    }