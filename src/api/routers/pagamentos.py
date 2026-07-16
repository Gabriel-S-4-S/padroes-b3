from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Request,
    status,
)

from auth.permissoes import obter_usuario_autenticado

from pagamentos.mercado_pago_service import (
    ErroMercadoPago,
    validar_assinatura_webhook,
)

from pagamentos.pagamentos_db import (
    listar_pagamentos_usuario,
)

from pagamentos.processador_pagamento import (
    ErroProcessamentoPagamento,
    processar_pagamento_mercado_pago,
)


router = APIRouter(
    prefix="/pagamentos",
    tags=["Pagamentos"],
)


def extrair_data_id(
    corpo: dict[str, Any],
    data_id_query: str | None,
) -> str | None:
    if data_id_query:
        return str(data_id_query)

    data = corpo.get("data")

    if isinstance(data, dict) and data.get("id"):
        return str(data["id"])

    if corpo.get("id"):
        return str(corpo["id"])

    return None


@router.post("/mercado-pago/webhook")
async def webhook_mercado_pago(
    request: Request,
    data_id: str | None = Query(
        default=None,
        alias="data.id",
    ),
    tipo_query: str | None = Query(
        default=None,
        alias="type",
    ),
    x_signature: str | None = Header(
        default=None,
        alias="x-signature",
    ),
    x_request_id: str | None = Header(
        default=None,
        alias="x-request-id",
    ),
):
    try:
        corpo = await request.json()
    except Exception:
        corpo = {}

    pagamento_id = extrair_data_id(
        corpo=corpo,
        data_id_query=data_id,
    )

    tipo_evento = (
        tipo_query
        or corpo.get("type")
        or corpo.get("topic")
    )

    # Eventos diferentes de payment são confirmados,
    # mas não são processados por esta rota.
    if tipo_evento not in {
        "payment",
        None,
    }:
        return {
            "recebido": True,
            "processado": False,
            "motivo": "Tipo de evento ignorado.",
        }

    if not pagamento_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A notificação não contém o ID do pagamento.",
        )

    if not x_signature or not x_request_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Assinatura do webhook não informada.",
        )

    assinatura_valida = validar_assinatura_webhook(
        data_id=pagamento_id,
        x_request_id=x_request_id,
        x_signature=x_signature,
    )

    if not assinatura_valida:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Assinatura do webhook inválida.",
        )

    try:
        resultado = processar_pagamento_mercado_pago(
            pagamento_id=pagamento_id,
        )

    except ErroMercadoPago as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        ) from erro

    except ErroProcessamentoPagamento as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(erro),
        ) from erro

    return {
        "recebido": True,
        "processado": True,
        "resultado": resultado,
    }


@router.get("/meus")
def meus_pagamentos(
    limite: int = 100,
    usuario=Depends(obter_usuario_autenticado),
):
    pagamentos = listar_pagamentos_usuario(
        usuario_id=usuario["id"],
        limite=limite,
    )

    return {
        "quantidade": len(pagamentos),
        "pagamentos": pagamentos,
    }


@router.post("/sincronizar/{pagamento_id}")
def sincronizar_pagamento(
    pagamento_id: str,
    usuario=Depends(obter_usuario_autenticado),
):
    """
    Rota auxiliar para desenvolvimento.

    Ela consulta o Mercado Pago diretamente. O processador só
    aceitará o pagamento se a referência estiver cadastrada,
    o valor for correto e o pagamento estiver aprovado.
    """

    try:
        resultado = processar_pagamento_mercado_pago(
            pagamento_id=pagamento_id,
        )

    except ErroMercadoPago as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        ) from erro

    except ErroProcessamentoPagamento as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(erro),
        ) from erro

    if (
        resultado.get("usuario_email")
        and resultado["usuario_email"].lower()
        != usuario["email"].lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este pagamento pertence a outra conta.",
        )

    return resultado