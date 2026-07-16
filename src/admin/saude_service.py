import os
import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco
from servicos.monitoramento_scheduler_db import (
    obter_status_scheduler,
)


LIMITE_MINUTOS_SCHEDULER_ONLINE = 2


def agora_texto() -> str:
    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def verificar_api() -> dict[str, Any]:
    return {
        "nome": "API",
        "status": "online",
        "mensagem": "A API está respondendo normalmente.",
    }


def verificar_banco() -> dict[str, Any]:
    conexao = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor()

        cursor.execute(
            "SELECT 1"
        )

        resultado = cursor.fetchone()

        if not resultado or resultado[0] != 1:
            raise RuntimeError(
                "O banco não retornou a resposta esperada."
            )

        return {
            "nome": "Banco de dados",
            "status": "online",
            "mensagem": "Conexão com o SQLite funcionando.",
        }

    except (
        sqlite3.Error,
        RuntimeError,
        OSError,
    ) as erro:
        return {
            "nome": "Banco de dados",
            "status": "erro",
            "mensagem": str(erro),
        }

    finally:
        if conexao is not None:
            conexao.close()


def converter_data(
    data_texto: str | None,
) -> datetime | None:
    if not data_texto:
        return None

    formatos = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    )

    for formato in formatos:
        try:
            return datetime.strptime(
                data_texto,
                formato,
            )
        except ValueError:
            continue

    return None


def verificar_scheduler() -> dict[str, Any]:
    try:
        status_scheduler = obter_status_scheduler()

        status_atual = str(
            status_scheduler.get(
                "status",
                "offline",
            )
        )

        ultima_atividade_texto = (
            status_scheduler.get(
                "ultima_atividade_em"
            )
        )

        ultima_atividade = converter_data(
            ultima_atividade_texto
        )

        if status_atual == "offline":
            return {
                "nome": "Scheduler",
                "status": "offline",
                "mensagem": (
                    "O scheduler está marcado como offline."
                ),
            }

        if ultima_atividade is None:
            return {
                "nome": "Scheduler",
                "status": "atencao",
                "mensagem": (
                    "O scheduler não possui registro "
                    "de atividade recente."
                ),
            }

        diferenca = (
            datetime.now() - ultima_atividade
        )

        minutos_sem_atividade = (
            diferenca.total_seconds() / 60
        )

        if (
            minutos_sem_atividade
            > LIMITE_MINUTOS_SCHEDULER_ONLINE
        ):
            return {
                "nome": "Scheduler",
                "status": "atencao",
                "mensagem": (
                    "O scheduler não registra atividade "
                    f"há {minutos_sem_atividade:.1f} minuto(s)."
                ),
            }

        if status_atual == "executando_scanner":
            mensagem = (
                "O scheduler está executando o scanner."
            )
        elif status_atual == "executando_laboratorio":
            mensagem = (
                "O scheduler está executando o laboratório."
            )
        else:
            mensagem = (
                "O scheduler está ativo e aguardando "
                "a próxima execução."
            )

        return {
            "nome": "Scheduler",
            "status": "online",
            "mensagem": mensagem,
        }

    except Exception as erro:
        return {
            "nome": "Scheduler",
            "status": "erro",
            "mensagem": str(erro),
        }


def verificar_smtp() -> dict[str, Any]:
    remetente = os.getenv(
        "EMAIL_REMETENTE",
        "",
    ).strip()

    senha = os.getenv(
        "EMAIL_SENHA_APP",
        "",
    ).strip()

    host = os.getenv(
        "EMAIL_SMTP_HOST",
        "",
    ).strip()

    porta = os.getenv(
        "EMAIL_SMTP_PORT",
        "",
    ).strip()

    campos_faltando = []

    if not remetente:
        campos_faltando.append(
            "EMAIL_REMETENTE"
        )

    if not senha:
        campos_faltando.append(
            "EMAIL_SENHA_APP"
        )

    if not host:
        campos_faltando.append(
            "EMAIL_SMTP_HOST"
        )

    if not porta:
        campos_faltando.append(
            "EMAIL_SMTP_PORT"
        )

    if campos_faltando:
        return {
            "nome": "SMTP",
            "status": "erro",
            "mensagem": (
                "Configuração incompleta: "
                + ", ".join(campos_faltando)
            ),
        }

    return {
        "nome": "SMTP",
        "status": "configurado",
        "mensagem": (
            f"SMTP configurado em {host}:{porta} "
            f"para {remetente}."
        ),
    }


def verificar_mercado_pago() -> dict[str, Any]:
    access_token = os.getenv(
        "MERCADO_PAGO_ACCESS_TOKEN",
        "",
    ).strip()

    webhook_secret = os.getenv(
        "MERCADO_PAGO_WEBHOOK_SECRET",
        "",
    ).strip()

    modo_teste = os.getenv(
        "MERCADO_PAGO_MODO_TESTE",
        "true",
    ).strip().lower()

    campos_faltando = []

    if not access_token:
        campos_faltando.append(
            "MERCADO_PAGO_ACCESS_TOKEN"
        )

    if not webhook_secret:
        campos_faltando.append(
            "MERCADO_PAGO_WEBHOOK_SECRET"
        )

    if campos_faltando:
        return {
            "nome": "Mercado Pago",
            "status": "erro",
            "mensagem": (
                "Configuração incompleta: "
                + ", ".join(campos_faltando)
            ),
        }

    ambiente = (
        "teste"
        if modo_teste in {
            "1",
            "true",
            "sim",
            "yes",
        }
        else "produção"
    )

    return {
        "nome": "Mercado Pago",
        "status": "configurado",
        "mensagem": (
            "Credenciais configuradas em modo "
            f"{ambiente}."
        ),
    }


def obter_saude_sistema() -> dict[str, Any]:
    servicos = [
        verificar_api(),
        verificar_banco(),
        verificar_scheduler(),
        verificar_smtp(),
        verificar_mercado_pago(),
    ]

    total = len(servicos)

    online = sum(
        1
        for servico in servicos
        if servico["status"]
        in {
            "online",
            "configurado",
        }
    )

    atencao = sum(
        1
        for servico in servicos
        if servico["status"] == "atencao"
    )

    erros = sum(
        1
        for servico in servicos
        if servico["status"]
        in {
            "erro",
            "offline",
        }
    )

    if erros > 0:
        status_geral = "erro"
    elif atencao > 0:
        status_geral = "atencao"
    else:
        status_geral = "online"

    return {
        "sucesso": True,
        "status_geral": status_geral,
        "verificado_em": agora_texto(),
        "total_servicos": total,
        "servicos_online": online,
        "servicos_atencao": atencao,
        "servicos_com_erro": erros,
        "servicos": servicos,
    }