from banco.sqlite import (
    criar_tabelas,
    carregar_historico,
    contar_registros,
    limpar_oportunidades_ativas,
    salvar_oportunidades_ativas,
    salvar_oportunidades_historico,
    contar_oportunidades_historico,
)

from coletor.atualizar_banco import atualizar_banco_yahoo
from modelos.mercado import Mercado
from scanner.scanner import executar_scanner_todas
from logs.logger import logger

from notificacoes.notificador_oportunidades import (
    notificar_oportunidades_premium,
)


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

    for i, oportunidade in enumerate(
        oportunidades,
        start=1,
    ):
        print()
        print(f"{i}º")
        print("AÇÃO:", oportunidade["acao"])
        print(
            "PADRÃO:",
            oportunidade["estrategia"],
        )
        print(
            "COMPRA:",
            oportunidade["horario_compra"],
        )
        print(
            "VENDA:",
            oportunidade["horario_venda"],
        )
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
        print(
            "EVENTO EM:",
            oportunidade.get(
                "evento_em",
                "Não informado",
            ),
        )
        print("-" * 50)


def executar_sistema():
    logger.info(
        "========== NOVA EXECUÇÃO =========="
    )

    criar_tabelas()

    novos = atualizar_banco_yahoo()

    logger.info(
        f"Candles novos adicionados: {novos}"
    )

    dados = carregar_historico()
    mercado = Mercado.a_partir_dataframe(dados)

    oportunidades = executar_scanner_todas(
        mercado
    )

    logger.info(
        f"Oportunidades encontradas: "
        f"{len(oportunidades)}"
    )

    limpar_oportunidades_ativas()

    salvas_ativas = salvar_oportunidades_ativas(
        oportunidades
    )

    salvas_historico = (
        salvar_oportunidades_historico(
            oportunidades
        )
    )

    logger.info(
        f"Oportunidades ativas salvas: "
        f"{salvas_ativas}"
    )

    logger.info(
        f"Oportunidades salvas no histórico: "
        f"{salvas_historico}"
    )

    resultado_notificacoes = (
        notificar_oportunidades_premium(
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
        "Execução finalizada com sucesso."
    )


def main():
    try:
        executar_sistema()

    except Exception as erro:
        logger.erro(
            "Erro inesperado na execução principal: "
            f"{erro}"
        )

        print()
        print("=" * 50)
        print("ERRO NA EXECUÇÃO")
        print("=" * 50)
        print(
            "Ocorreu um erro durante a execução "
            "do sistema."
        )
        print(
            "Verifique o arquivo de log para "
            "mais detalhes."
        )
        print("Erro:", erro)


if __name__ == "__main__":
    main()