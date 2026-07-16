import hashlib
import hmac
import os
import uuid
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


CAMINHO_RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(CAMINHO_RAIZ / ".env")


MERCADO_PAGO_ACCESS_TOKEN = os.getenv(
    "MERCADO_PAGO_ACCESS_TOKEN",
    "",
).strip()

MERCADO_PAGO_WEBHOOK_SECRET = os.getenv(
    "MERCADO_PAGO_WEBHOOK_SECRET",
    "",
).strip()

MERCADO_PAGO_MODO_TESTE = os.getenv(
    "MERCADO_PAGO_MODO_TESTE",
    "true",
).strip().lower() == "true"

URL_FRONTEND = os.getenv(
    "URL_FRONTEND",
    "http://localhost:3000",
).rstrip("/")

URL_BACKEND = os.getenv(
    "URL_BACKEND",
    "http://127.0.0.1:8000",
).rstrip("/")

URL_BACKEND_PUBLICA = os.getenv(
    "URL_BACKEND_PUBLICA",
    "",
).rstrip("/")


URL_CRIAR_PREFERENCIA = (
    "https://api.mercadopago.com/checkout/preferences"
)

URL_CONSULTAR_PAGAMENTO = (
    "https://api.mercadopago.com/v1/payments/{pagamento_id}"
)


class ErroMercadoPago(RuntimeError):
    pass


def validar_configuracao_mercado_pago() -> None:
    if not MERCADO_PAGO_ACCESS_TOKEN:
        raise ErroMercadoPago(
            "MERCADO_PAGO_ACCESS_TOKEN não foi configurado no .env."
        )


def gerar_referencia_externa(
    usuario_id: int,
    plano_id: str,
) -> str:
    identificador = uuid.uuid4().hex

    return (
        f"padroesb3-"
        f"{usuario_id}-"
        f"{plano_id}-"
        f"{identificador}"
    )


def criar_preferencia_pagamento(
    *,
    usuario_id: int,
    nome: str,
    email: str,
    plano: dict[str, Any],
) -> dict[str, Any]:
    validar_configuracao_mercado_pago()

    referencia_externa = gerar_referencia_externa(
        usuario_id=usuario_id,
        plano_id=plano["id"],
    )

    preco_reais = plano["preco_centavos"] / 100

    dados_preferencia: dict[str, Any] = {
        "items": [
            {
                "id": plano["id"],
                "title": plano["nome"],
                "description": plano["descricao"],
                "category_id": "services",
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": preco_reais,
            }
        ],
        "payer": {
            "name": nome,
            "email": email,
        },
        "external_reference": referencia_externa,
        "statement_descriptor": "PADROES B3",
        "metadata": {
            "usuario_id": usuario_id,
            "usuario_email": email,
            "plano": plano["id"],
        },
    }

    # As URLs locais HTTP não são enviadas ao Mercado Pago.
    # Quando o frontend estiver publicado em HTTPS,
    # o retorno automático será habilitado.
    if URL_FRONTEND.startswith("https://"):
        dados_preferencia["back_urls"] = {
            "success": (
                f"{URL_FRONTEND}/cliente/dashboard/pagamento"
                "?resultado=sucesso"
            ),
            "pending": (
                f"{URL_FRONTEND}/cliente/dashboard/pagamento"
                "?resultado=pendente"
            ),
            "failure": (
                f"{URL_FRONTEND}/cliente/dashboard/pagamento"
                "?resultado=falha"
            ),
        }

        dados_preferencia["auto_return"] = "approved"

    # Durante os testes, URL_BACKEND_PUBLICA poderá conter
    # a URL temporária HTTPS.
    #
    # Na produção, deverá conter:
    # https://api.seudominio.com.br
    url_publica_webhook = (
        URL_BACKEND_PUBLICA
        if URL_BACKEND_PUBLICA.startswith("https://")
        else ""
    )

    if url_publica_webhook:
        dados_preferencia["notification_url"] = (
            f"{url_publica_webhook}"
            "/pagamentos/mercado-pago/webhook"
        )

    cabecalhos = {
        "Authorization": (
            f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}"
        ),
        "Content-Type": "application/json",
        "X-Idempotency-Key": uuid.uuid4().hex,
    }

    try:
        resposta = requests.post(
            URL_CRIAR_PREFERENCIA,
            headers=cabecalhos,
            json=dados_preferencia,
            timeout=25,
        )

    except requests.RequestException as erro:
        raise ErroMercadoPago(
            "Não foi possível conectar ao Mercado Pago."
        ) from erro

    try:
        dados_resposta = resposta.json()
    except ValueError as erro:
        raise ErroMercadoPago(
            "O Mercado Pago retornou uma resposta inválida."
        ) from erro

    if resposta.status_code not in {200, 201}:
        mensagem = (
            dados_resposta.get("message")
            or dados_resposta.get("error")
            or "Não foi possível criar o pagamento."
        )

        detalhes = dados_resposta.get("cause")

        if detalhes:
            mensagem = f"{mensagem} Detalhes: {detalhes}"

        raise ErroMercadoPago(mensagem)

    url_pagamento = dados_resposta.get("init_point")

    if (
        MERCADO_PAGO_MODO_TESTE
        and dados_resposta.get("sandbox_init_point")
    ):
        url_pagamento = dados_resposta["sandbox_init_point"]

    if not url_pagamento:
        raise ErroMercadoPago(
            "O Mercado Pago não retornou a URL do checkout."
        )

    return {
        "preferencia_id": dados_resposta.get("id"),
        "referencia_externa": referencia_externa,
        "url_pagamento": url_pagamento,
        "modo_teste": MERCADO_PAGO_MODO_TESTE,
    }


def consultar_pagamento(
    pagamento_id: str | int,
) -> dict[str, Any]:
    validar_configuracao_mercado_pago()

    identificador = str(pagamento_id).strip()

    if not identificador:
        raise ErroMercadoPago(
            "O ID do pagamento não foi informado."
        )

    url = URL_CONSULTAR_PAGAMENTO.format(
        pagamento_id=identificador
    )

    cabecalhos = {
        "Authorization": (
            f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}"
        ),
        "Accept": "application/json",
    }

    try:
        resposta = requests.get(
            url,
            headers=cabecalhos,
            timeout=25,
        )

    except requests.RequestException as erro:
        raise ErroMercadoPago(
            "Não foi possível consultar o pagamento."
        ) from erro

    try:
        dados = resposta.json()
    except ValueError as erro:
        raise ErroMercadoPago(
            "O Mercado Pago retornou uma resposta inválida."
        ) from erro

    if resposta.status_code != 200:
        mensagem = (
            dados.get("message")
            or dados.get("error")
            or "Pagamento não encontrado."
        )

        raise ErroMercadoPago(mensagem)

    return dados


def extrair_assinatura_webhook(
    x_signature: str,
) -> tuple[str | None, str | None]:
    timestamp = None
    assinatura = None

    for parte in x_signature.split(","):
        chave, separador, valor = parte.partition("=")

        if not separador:
            continue

        chave = chave.strip()
        valor = valor.strip()

        if chave == "ts":
            timestamp = valor

        elif chave == "v1":
            assinatura = valor

    return timestamp, assinatura


def validar_assinatura_webhook(
    *,
    data_id: str,
    x_request_id: str,
    x_signature: str,
) -> bool:
    """
    Valida a assinatura HMAC enviada pelo Mercado Pago.

    Durante o desenvolvimento inicial, se o secret ainda não
    estiver configurado, o webhook será recusado.
    """

    if not MERCADO_PAGO_WEBHOOK_SECRET:
        return False

    timestamp, assinatura_recebida = (
        extrair_assinatura_webhook(x_signature)
    )

    if not timestamp or not assinatura_recebida:
        return False

    identificador = str(data_id).strip().lower()
    request_id = str(x_request_id).strip()

    manifesto = (
        f"id:{identificador};"
        f"request-id:{request_id};"
        f"ts:{timestamp};"
    )

    assinatura_calculada = hmac.new(
        MERCADO_PAGO_WEBHOOK_SECRET.encode("utf-8"),
        manifesto.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(
        assinatura_calculada,
        assinatura_recebida,
    )