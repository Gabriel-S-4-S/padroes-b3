import json
from decimal import Decimal, InvalidOperation
from typing import Any

from assinaturas.assinaturas import ativar_assinatura

from pagamentos.mercado_pago_service import (
    consultar_pagamento,
)

from pagamentos.pagamentos_db import (
    atualizar_pagamento,
    buscar_por_referencia,
    desfazer_processamento,
    marcar_como_processado,
)


class ErroProcessamentoPagamento(RuntimeError):
    pass


def converter_reais_para_centavos(
    valor: Any,
) -> int:
    try:
        decimal = Decimal(str(valor))
    except (InvalidOperation, TypeError, ValueError) as erro:
        raise ErroProcessamentoPagamento(
            "O valor do pagamento é inválido."
        ) from erro

    return int(
        (decimal * Decimal("100")).quantize(
            Decimal("1")
        )
    )


def processar_pagamento_mercado_pago(
    pagamento_id: str | int,
) -> dict[str, Any]:
    pagamento_mp = consultar_pagamento(
        pagamento_id=pagamento_id,
    )

    referencia_externa = str(
        pagamento_mp.get("external_reference") or ""
    ).strip()

    if not referencia_externa:
        raise ErroProcessamentoPagamento(
            "O pagamento não possui referência externa."
        )

    pagamento_local = buscar_por_referencia(
        referencia_externa
    )

    if pagamento_local is None:
        raise ErroProcessamentoPagamento(
            "O pagamento não pertence a uma cobrança cadastrada."
        )

    status_pagamento = str(
        pagamento_mp.get("status") or "desconhecido"
    )

    status_detalhe = pagamento_mp.get(
        "status_detail"
    )

    meio_pagamento = pagamento_mp.get(
        "payment_method_id"
    )

    tipo_pagamento = pagamento_mp.get(
        "payment_type_id"
    )

    data_aprovacao = pagamento_mp.get(
        "date_approved"
    )

    valor_recebido_centavos = (
        converter_reais_para_centavos(
            pagamento_mp.get("transaction_amount")
        )
    )

    valor_esperado_centavos = int(
        pagamento_local["valor_centavos"]
    )

    moeda = str(
        pagamento_mp.get("currency_id") or ""
    ).upper()

    if moeda != pagamento_local["moeda"]:
        raise ErroProcessamentoPagamento(
            "A moeda do pagamento é diferente da cobrança."
        )

    if valor_recebido_centavos != valor_esperado_centavos:
        raise ErroProcessamentoPagamento(
            "O valor pago é diferente do valor esperado."
        )

    resposta_json = json.dumps(
        pagamento_mp,
        ensure_ascii=False,
        default=str,
    )

    atualizado = atualizar_pagamento(
        referencia_externa=referencia_externa,
        pagamento_id=str(pagamento_mp["id"]),
        status_pagamento=status_pagamento,
        status_detalhe=status_detalhe,
        meio_pagamento=meio_pagamento,
        tipo_pagamento=tipo_pagamento,
        data_aprovacao=data_aprovacao,
        resposta_mercado_pago=resposta_json,
    )

    if not atualizado:
        raise ErroProcessamentoPagamento(
            "Não foi possível atualizar o pagamento local."
        )

    if status_pagamento != "approved":
        return {
            "sucesso": True,
            "ativado": False,
            "status": status_pagamento,
            "mensagem": (
                "Pagamento atualizado, mas ainda não foi aprovado."
            ),
        }

    # Esta operação é atômica no sentido de que somente
    # a primeira notificação conseguirá alterar 0 para 1.
    primeiro_processamento = marcar_como_processado(
        referencia_externa=referencia_externa,
    )

    if not primeiro_processamento:
        return {
            "sucesso": True,
            "ativado": False,
            "ja_processado": True,
            "status": status_pagamento,
            "mensagem": (
                "Este pagamento já havia sido processado."
            ),
        }

    try:
        resultado_assinatura = ativar_assinatura(
            email=pagamento_local["usuario_email"],
            plano=pagamento_local["plano"],
        )

    except Exception:
        desfazer_processamento(
            referencia_externa=referencia_externa,
        )
        raise

    if not resultado_assinatura.get("sucesso"):
        desfazer_processamento(
            referencia_externa=referencia_externa,
        )

        raise ErroProcessamentoPagamento(
            resultado_assinatura.get("mensagem")
            or "Não foi possível ativar a assinatura."
        )

    return {
        "sucesso": True,
        "ativado": True,
        "status": status_pagamento,
        "plano": pagamento_local["plano"],
        "usuario_email": pagamento_local["usuario_email"],
        "expira_em": resultado_assinatura.get("expira_em"),
        "mensagem": "Pagamento aprovado e plano ativado.",
    }