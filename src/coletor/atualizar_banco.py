import pandas as pd

from config import ACOES
from coletor.coletor_yahoo import buscar_acao_yahoo
from banco.sqlite import (
    obter_ultimo_timestamp,
    salvar_historico,
)


PERIODO_CARGA_INICIAL = "1y"
PERIODO_ATUALIZACAO = "5d"
INTERVALO = "1h"


def preparar_dados(
    dados: pd.DataFrame,
    acao: str,
) -> pd.DataFrame:
    if dados is None or dados.empty:
        return pd.DataFrame()

    dados = dados.copy()

    if "timestamp" not in dados.columns:
        raise ValueError(
            f"A resposta de {acao} não possui a coluna timestamp."
        )

    dados["acao"] = acao
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


def carregar_historico_inicial(
    acao: str,
) -> pd.DataFrame:
    print(
        f"{acao}: ativo sem histórico. "
        f"Iniciando carga de {PERIODO_CARGA_INICIAL}."
    )

    dados = buscar_acao_yahoo(
        acao,
        periodo=PERIODO_CARGA_INICIAL,
        intervalo=INTERVALO,
    )

    return preparar_dados(
        dados=dados,
        acao=acao,
    )


def carregar_atualizacao(
    acao: str,
    ultimo_timestamp,
) -> pd.DataFrame:
    dados = buscar_acao_yahoo(
        acao,
        periodo=PERIODO_ATUALIZACAO,
        intervalo=INTERVALO,
    )

    dados = preparar_dados(
        dados=dados,
        acao=acao,
    )

    if dados.empty:
        return dados

    ultimo_timestamp = pd.to_datetime(
        ultimo_timestamp
    )

    return dados[
        dados["timestamp"] > ultimo_timestamp
    ]


def atualizar_acao(
    acao: str,
) -> int:
    ultimo_timestamp = obter_ultimo_timestamp(
        acao
    )

    if ultimo_timestamp:
        dados = carregar_atualizacao(
            acao=acao,
            ultimo_timestamp=ultimo_timestamp,
        )
    else:
        dados = carregar_historico_inicial(
            acao=acao,
        )

    if dados.empty:
        print(
            f"Nenhum candle novo ou histórico disponível "
            f"para {acao}."
        )
        return 0

    salvar_historico(dados)

    quantidade = len(dados)

    print(
        f"{quantidade} candle(s) salvo(s) "
        f"para {acao}."
    )

    return quantidade


def atualizar_banco_yahoo():
    total_novos = 0
    total_sucesso = 0
    total_sem_dados = 0
    total_erros = 0

    quantidade_acoes = len(ACOES)

    for indice, acao in enumerate(
        ACOES,
        start=1,
    ):
        print()
        print(
            f"[{indice}/{quantidade_acoes}] "
            f"Atualizando {acao}..."
        )

        try:
            quantidade = atualizar_acao(
                acao
            )

            total_novos += quantidade

            if quantidade > 0:
                total_sucesso += 1
            else:
                total_sem_dados += 1

        except Exception as erro:
            total_erros += 1

            print(
                f"Erro ao buscar {acao}: {erro}"
            )

            continue

    print()
    print("=" * 50)
    print("RESUMO DA ATUALIZAÇÃO DO BANCO")
    print("=" * 50)
    print(
        f"Ativos processados: {quantidade_acoes}"
    )
    print(
        f"Ativos com dados salvos: {total_sucesso}"
    )
    print(
        f"Ativos sem dados novos: {total_sem_dados}"
    )
    print(
        f"Ativos com erro: {total_erros}"
    )
    print(
        f"Total de candles salvos: {total_novos}"
    )

    return total_novos