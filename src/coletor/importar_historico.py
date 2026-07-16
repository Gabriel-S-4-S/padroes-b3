import pandas as pd

from config import (
    ACOES,
    PERIODO_HISTORICO_YAHOO,
    INTERVALO_YAHOO,
)

from coletor.coletor_yahoo import buscar_acao_yahoo

from banco.sqlite import (
    criar_tabelas,
    salvar_historico,
    contar_registros,
    carregar_historico,
)

from logs.logger import logger


MINIMO_CANDLES_HISTORICO = 500


def preparar_dados(
    dados: pd.DataFrame,
    acao: str,
) -> pd.DataFrame:
    if dados is None or dados.empty:
        return pd.DataFrame()

    dados = dados.copy()

    if "timestamp" not in dados.columns:
        raise ValueError(
            f"A resposta do Yahoo para {acao} "
            "não possui a coluna timestamp."
        )

    dados["acao"] = acao.strip().upper()

    dados["timestamp"] = pd.to_datetime(
        dados["timestamp"],
        errors="coerce",
    )

    dados = dados.dropna(
        subset=["timestamp"]
    )

    dados = dados.drop_duplicates(
        subset=["acao", "timestamp"],
        keep="last",
    )

    dados = dados.sort_values(
        "timestamp"
    )

    return dados


def contar_candles_por_acao() -> dict[str, int]:
    historico = carregar_historico()

    if historico is None or historico.empty:
        return {}

    if "acao" not in historico.columns:
        return {}

    historico = historico.copy()

    historico["acao"] = (
        historico["acao"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    contagens = (
        historico.groupby("acao")
        .size()
        .to_dict()
    )

    return {
        str(acao): int(quantidade)
        for acao, quantidade in contagens.items()
    }


def precisa_importar_historico(
    acao: str,
    contagens: dict[str, int],
) -> bool:
    quantidade_atual = int(
        contagens.get(acao, 0)
    )

    return (
        quantidade_atual
        < MINIMO_CANDLES_HISTORICO
    )


def importar_historico_acao(
    acao: str,
) -> int:
    dados = buscar_acao_yahoo(
        acao,
        periodo=PERIODO_HISTORICO_YAHOO,
        intervalo=INTERVALO_YAHOO,
    )

    dados = preparar_dados(
        dados=dados,
        acao=acao,
    )

    if dados.empty:
        print(
            f"Nenhum histórico disponível para {acao}."
        )

        return 0

    salvos = salvar_historico(dados)

    return int(salvos or 0)


def importar_historico_inicial():
    criar_tabelas()

    contagens = contar_candles_por_acao()

    total_ativos = len(ACOES)

    total_importados = 0
    total_ignorados = 0
    total_sem_dados = 0
    total_erros = 0
    total_salvo = 0

    print()
    print("=" * 60)
    print("IMPORTAÇÃO HISTÓRICA DOS ATIVOS")
    print("=" * 60)
    print(
        "Período solicitado:",
        PERIODO_HISTORICO_YAHOO,
    )
    print(
        "Intervalo:",
        INTERVALO_YAHOO,
    )
    print(
        "Mínimo considerado suficiente:",
        MINIMO_CANDLES_HISTORICO,
        "candles",
    )
    print(
        "Ativos na lista:",
        total_ativos,
    )

    for indice, acao in enumerate(
        ACOES,
        start=1,
    ):
        acao = acao.strip().upper()

        quantidade_atual = int(
            contagens.get(acao, 0)
        )

        print()
        print(
            f"[{indice}/{total_ativos}] "
            f"Verificando {acao}..."
        )
        print(
            f"Candles existentes: {quantidade_atual}"
        )

        if not precisa_importar_historico(
            acao=acao,
            contagens=contagens,
        ):
            total_ignorados += 1

            print(
                f"{acao}: histórico já possui "
                f"{quantidade_atual} candles. "
                "Carga inicial ignorada."
            )

            continue

        print(
            f"{acao}: histórico insuficiente. "
            f"Baixando {PERIODO_HISTORICO_YAHOO}..."
        )

        try:
            salvos = importar_historico_acao(
                acao
            )

            if salvos <= 0:
                total_sem_dados += 1

                logger.info(
                    f"Nenhum histórico novo salvo "
                    f"para {acao}."
                )

                continue

            total_importados += 1
            total_salvo += salvos

            # Atualiza a contagem usada durante
            # esta própria execução.
            contagens[acao] = (
                quantidade_atual + salvos
            )

            print(
                f"{salvos} registro(s) processado(s) "
                f"para {acao}."
            )

            logger.info(
                f"Histórico importado para {acao}: "
                f"{salvos} registro(s)."
            )

        except Exception as erro:
            total_erros += 1

            print(
                f"Erro ao importar {acao}: {erro}"
            )

            logger.erro(
                f"Erro ao importar histórico "
                f"de {acao}: {erro}"
            )

            continue

    print()
    print("=" * 60)
    print("IMPORTAÇÃO FINALIZADA")
    print("=" * 60)
    print(
        f"Ativos analisados: {total_ativos}"
    )
    print(
        f"Ativos com histórico importado: "
        f"{total_importados}"
    )
    print(
        f"Ativos já completos e ignorados: "
        f"{total_ignorados}"
    )
    print(
        f"Ativos sem dados disponíveis: "
        f"{total_sem_dados}"
    )
    print(
        f"Ativos com erro: {total_erros}"
    )
    print(
        f"Registros processados nesta execução: "
        f"{total_salvo}"
    )
    print(
        f"Total de registros no banco: "
        f"{contar_registros()}"
    )

    logger.info(
        "Importação histórica finalizada. "
        f"Ativos importados: {total_importados}. "
        f"Ignorados: {total_ignorados}. "
        f"Sem dados: {total_sem_dados}. "
        f"Erros: {total_erros}. "
        f"Registros processados: {total_salvo}."
    )

    return {
        "ativos_analisados": total_ativos,
        "ativos_importados": total_importados,
        "ativos_ignorados": total_ignorados,
        "ativos_sem_dados": total_sem_dados,
        "ativos_com_erro": total_erros,
        "registros_processados": total_salvo,
        "total_banco": contar_registros(),
    }