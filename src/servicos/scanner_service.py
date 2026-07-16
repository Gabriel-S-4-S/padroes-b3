from banco.sqlite import (
    carregar_historico,
    contar_oportunidades_historico,
    contar_registros,
    limpar_oportunidades_ativas,
    salvar_oportunidades_ativas,
    salvar_oportunidades_historico,
)

from coletor.atualizar_banco import atualizar_banco_yahoo
from logs.logger import logger
from modelos.mercado import Mercado
from notificacoes.notificador_oportunidades import (
    notificar_oportunidades_premium,
)
from scanner.scanner import executar_scanner_todas


def mostrar_oportunidades(oportunidades):
    print()
    print("=" * 50)
    print("OPORTUNIDADES AGORA")
    print("=" * 50)

    if not oportunidades:
        print(
            "Nenhuma oportunidade de alta confiança encontrada."
        )
        return

    for indice, oportunidade in enumerate(
        oportunidades,
        start=1,
    ):
        print()
        print(f"{indice}º")
        print("AÇÃO:", oportunidade["acao"])
        print("PADRÃO:", oportunidade["estrategia"])
        print("COMPRA:", oportunidade["horario_compra"])
        print("VENDA:", oportunidade["horario_venda"])

        print(
            f"TAXA DE ACERTO: "
            f"{oportunidade['taxa_acerto']:.2f}%"
        )

        print(
            "OCORRÊNCIAS:",
            oportunidade["ocorrencias"],
        )

        print(
            "ACERTOS:",
            oportunidade["acertos"],
        )

        print(
            "FALHAS:",
            oportunidade["falhas"],
        )

        print(
            f"RETORNO MÉDIO: "
            f"{oportunidade['retorno_medio']:.2f}%"
        )

        print(
            f"SCORE: "
            f"{oportunidade['score']:.0f}/100"
        )

        print("-" * 50)


def criar_mercado():
    dados = carregar_historico()

    if dados is None or dados.empty:
        raise RuntimeError(
            "Não há histórico disponível para criar o mercado."
        )

    mercado = Mercado.a_partir_dataframe(dados)

    return dados, mercado


def salvar_resultados_scanner(oportunidades):
    limpar_oportunidades_ativas()

    salvas_ativas = salvar_oportunidades_ativas(
        oportunidades
    )

    salvas_historico = (
        salvar_oportunidades_historico(
            oportunidades
        )
    )

    return {
        "salvas_ativas": salvas_ativas,
        "salvas_historico": salvas_historico,
    }


def enviar_notificacoes(oportunidades):
    return notificar_oportunidades_premium(
        oportunidades
    )


def executar_scanner_service():
    logger.info(
        "========== NOVA EXECUÇÃO DO SCANNER =========="
    )

    print()
    print("=" * 50)
    print("INICIANDO SERVIÇO DO SCANNER")
    print("=" * 50)

    print("Atualizando candles...")

    novos = atualizar_banco_yahoo()

    logger.info(
        f"Candles novos adicionados: {novos}"
    )

    print("Carregando histórico e criando mercado...")

    dados, mercado = criar_mercado()

    print(
        f"Mercado criado com "
        f"{mercado.total_ativos()} ativo(s)."
    )

    print("Executando scanner...")

    oportunidades = executar_scanner_todas(
        mercado
    )

    logger.info(
        f"Oportunidades encontradas: "
        f"{len(oportunidades)}"
    )

    print("Salvando oportunidades...")

    resultado_salvamento = (
        salvar_resultados_scanner(
            oportunidades
        )
    )

    salvas_ativas = resultado_salvamento[
        "salvas_ativas"
    ]

    salvas_historico = resultado_salvamento[
        "salvas_historico"
    ]

    logger.info(
        f"Oportunidades ativas salvas: "
        f"{salvas_ativas}"
    )

    logger.info(
        f"Oportunidades salvas no histórico: "
        f"{salvas_historico}"
    )

    print("Enviando notificações Premium...")

    resultado_notificacoes = (
        enviar_notificacoes(
            oportunidades
        )
    )

    logger.info(
        "Notificações Premium: "
        f"enviadas="
        f"{resultado_notificacoes['enviadas']} | "
        f"ignoradas="
        f"{resultado_notificacoes['ignoradas']} | "
        f"falhas="
        f"{resultado_notificacoes['falhas']}"
    )

    print()
    print("=" * 50)
    print("RESUMO DA EXECUÇÃO")
    print("=" * 50)

    print(
        f"Candles novos adicionados: {novos}"
    )

    print(
        f"Registros armazenados: "
        f"{contar_registros()}"
    )

    print(
        f"Ações encontradas: "
        f"{dados['acao'].nunique()}"
    )

    print(
        f"Linhas carregadas: {len(dados)}"
    )

    print(
        f"Oportunidades ativas salvas: "
        f"{salvas_ativas}"
    )

    print(
        f"Oportunidades salvas no histórico: "
        f"{salvas_historico}"
    )

    print(
        f"Total no histórico: "
        f"{contar_oportunidades_historico()}"
    )

    print(
        "E-mails Premium enviados:",
        resultado_notificacoes["enviadas"],
    )

    print(
        "E-mails ignorados por duplicidade:",
        resultado_notificacoes["ignoradas"],
    )

    print(
        "Falhas de envio:",
        resultado_notificacoes["falhas"],
    )

    mostrar_oportunidades(oportunidades)

    logger.info(
        "Execução do scanner finalizada com sucesso."
    )

    return {
        "sucesso": True,
        "candles_novos": novos,
        "registros": contar_registros(),
        "acoes": int(
            dados["acao"].nunique()
        ),
        "linhas": len(dados),
        "oportunidades_encontradas": len(
            oportunidades
        ),
        "oportunidades_ativas_salvas": (
            salvas_ativas
        ),
        "oportunidades_historico_salvas": (
            salvas_historico
        ),
        "emails_enviados": (
            resultado_notificacoes["enviadas"]
        ),
        "emails_ignorados": (
            resultado_notificacoes["ignoradas"]
        ),
        "emails_com_falha": (
            resultado_notificacoes["falhas"]
        ),
    }