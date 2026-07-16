import hashlib

from assinaturas.assinaturas import (
    rebaixar_assinaturas_vencidas,
)
from emails.oportunidade_email import (
    enviar_email_oportunidade,
)
from notificacoes.notificacoes_db import (
    criar_tabela_notificacoes,
    listar_usuarios_premium_ativos,
    marcar_notificacao_com_erro,
    marcar_notificacao_enviada,
    notificacao_ja_registrada,
    registrar_notificacao_pendente,
)


def obter_valor(
    oportunidade,
    campo,
    padrao="",
):
    try:
        valor = oportunidade[campo]
    except (KeyError, TypeError):
        return padrao

    if valor is None:
        return padrao

    try:
        if valor != valor:
            return padrao
    except Exception:
        pass

    if hasattr(valor, "item"):
        return valor.item()

    return valor


def gerar_chave_oportunidade(
    oportunidade,
):
    partes = [
        obter_valor(
            oportunidade,
            "acao",
        ),
        obter_valor(
            oportunidade,
            "estrategia",
        ),
        obter_valor(
            oportunidade,
            "horario_compra",
        ),
        obter_valor(
            oportunidade,
            "horario_venda",
        ),
        obter_valor(
            oportunidade,
            "horizonte_saida",
        ),
        obter_valor(
            oportunidade,
            "evento_em",
        ),
    ]

    texto = "|".join(
        str(parte).strip()
        for parte in partes
    )

    return hashlib.sha256(
        texto.encode("utf-8")
    ).hexdigest()


def notificar_oportunidades_premium(
    oportunidades,
):
    criar_tabela_notificacoes()
    rebaixar_assinaturas_vencidas()

    if not oportunidades:
        return {
            "sucesso": True,
            "oportunidades": 0,
            "usuarios_premium": 0,
            "enviadas": 0,
            "ignoradas": 0,
            "falhas": 0,
        }

    usuarios = listar_usuarios_premium_ativos()

    if not usuarios:
        return {
            "sucesso": True,
            "oportunidades": len(oportunidades),
            "usuarios_premium": 0,
            "enviadas": 0,
            "ignoradas": 0,
            "falhas": 0,
        }

    enviadas = 0
    ignoradas = 0
    falhas = 0

    for oportunidade in oportunidades:
        chave = gerar_chave_oportunidade(
            oportunidade
        )

        acao = str(
            obter_valor(
                oportunidade,
                "acao",
                "Não informada",
            )
        )

        estrategia = str(
            obter_valor(
                oportunidade,
                "estrategia",
                "Não informada",
            )
        )

        evento_em = str(
            obter_valor(
                oportunidade,
                "evento_em",
                "",
            )
        ) or None

        for usuario in usuarios:
            if notificacao_ja_registrada(
                usuario_id=usuario["id"],
                oportunidade_chave=chave,
            ):
                ignoradas += 1
                continue

            notificacao_id = (
                registrar_notificacao_pendente(
                    usuario_id=usuario["id"],
                    usuario_email=usuario["email"],
                    oportunidade_chave=chave,
                    acao=acao,
                    estrategia=estrategia,
                    evento_em=evento_em,
                )
            )

            if notificacao_id is None:
                ignoradas += 1
                continue

            try:
                enviar_email_oportunidade(
                    destinatario=usuario["email"],
                    nome=usuario["nome"],
                    oportunidade=oportunidade,
                )

                marcar_notificacao_enviada(
                    notificacao_id
                )

                enviadas += 1

            except Exception as erro:
                marcar_notificacao_com_erro(
                    notificacao_id=notificacao_id,
                    erro=str(erro),
                )

                falhas += 1

                print(
                    "Erro ao enviar oportunidade "
                    f"{acao} para "
                    f"{usuario['email']}: {erro}"
                )

    return {
        "sucesso": falhas == 0,
        "oportunidades": len(oportunidades),
        "usuarios_premium": len(usuarios),
        "enviadas": enviadas,
        "ignoradas": ignoradas,
        "falhas": falhas,
    }