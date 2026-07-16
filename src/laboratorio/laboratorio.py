import sqlite3
import time
from datetime import datetime, timedelta
from typing import Any

import pandas as pd

from banco.sqlite import (
    carregar_historico,
    conectar_banco,
    contar_estrategias_aprovadas,
    contar_registros,
    criar_tabelas,
    salvar_estrategias_aprovadas,
)

from condicoes.condicao_dia_semana import (
    CondicaoDiaSemana,
)
from condicoes.condicao_horario import (
    CondicaoHorario,
)
from condicoes.condicao_media_movel import (
    CondicaoMediaMovel,
)
from condicoes.condicao_sequencia import (
    CondicaoSequencia,
)

from confianca.motor_confianca import avaliar_analise
from estrategias.estrategia_composta import (
    EstrategiaComposta,
)
from estatisticas.backtest import (
    calcular_backtest_estrategia,
)
from logs.logger import logger
from modelos.mercado import Mercado

from config import (
    HORARIOS_PREGAO,
    HORIZONTES_SAIDA,
)


# Altere este número sempre que mudar:
# - as condições;
# - os critérios do laboratório;
# - os horizontes;
# - a estrutura das estratégias.
VERSAO_LABORATORIO = "evolutivo-v2"

DIAS_SEMANA = [0, 1, 2, 3, 4]
TIPOS = ["alta", "queda"]
QUANTIDADES = [1, 2, 3, 4, 5]
PERIODOS_MEDIA = [9, 20]

QUANTIDADE_CAMADAS = 3
MINIMO_CANDLES_PARA_ANALISE = 100

TABELA_PROGRESSO = "laboratorio_progresso"


def agora_texto() -> str:
    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def formatar_data_br(data) -> str:
    if data is None:
        return "Não informado"

    if isinstance(data, str):
        data_convertida = pd.to_datetime(
            data,
            errors="coerce",
        )

        if pd.isna(data_convertida):
            return data

        data = data_convertida.to_pydatetime()

    if isinstance(data, pd.Timestamp):
        data = data.to_pydatetime()

    return data.strftime("%d/%m/%Y às %H:%M")


def formatar_duracao(segundos: float) -> str:
    segundos = max(0, int(segundos))

    return str(
        timedelta(seconds=segundos)
    )


def calcular_tempo_desde(
    data_texto: str | None,
) -> str:
    if not data_texto:
        return "Não informado"

    data = pd.to_datetime(
        data_texto,
        errors="coerce",
    )

    if pd.isna(data):
        return str(data_texto)

    agora = datetime.now()
    data_python = data.to_pydatetime()
    diferenca = agora - data_python
    dias = diferenca.days

    if dias == 0:
        return (
            f"Hoje às "
            f"{data_python.strftime('%H:%M')}"
        )

    if dias == 1:
        return (
            f"Ontem às "
            f"{data_python.strftime('%H:%M')}"
        )

    return (
        f"{formatar_data_br(data_python)} "
        f"({dias} dias atrás)"
    )


def criar_tabela_progresso() -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {TABELA_PROGRESSO} (
            ticker TEXT PRIMARY KEY,

            versao_laboratorio TEXT NOT NULL,

            total_candles INTEGER NOT NULL,
            ultimo_timestamp TEXT,

            estrategias_testadas INTEGER NOT NULL DEFAULT 0,
            estrategias_aprovadas INTEGER NOT NULL DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'pendente',
            erro TEXT,

            data_inicio TEXT,
            data_conclusao TEXT,
            duracao_segundos REAL
        )
        """
    )

    cursor.execute(
        f"""
        CREATE INDEX IF NOT EXISTS
        idx_laboratorio_progresso_status
        ON {TABELA_PROGRESSO}(status)
        """
    )

    conexao.commit()
    conexao.close()


def limpar_progresso_laboratorio() -> None:
    criar_tabela_progresso()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        DELETE FROM {TABELA_PROGRESSO}
        """
    )

    conexao.commit()
    conexao.close()


def iniciar_processamento_ativo(
    *,
    ticker: str,
    total_candles: int,
    ultimo_timestamp: str | None,
) -> None:
    criar_tabela_progresso()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        INSERT INTO {TABELA_PROGRESSO} (
            ticker,
            versao_laboratorio,
            total_candles,
            ultimo_timestamp,
            estrategias_testadas,
            estrategias_aprovadas,
            status,
            erro,
            data_inicio,
            data_conclusao,
            duracao_segundos
        )
        VALUES (?, ?, ?, ?, 0, 0, 'processando', NULL, ?, NULL, NULL)

        ON CONFLICT(ticker) DO UPDATE SET
            versao_laboratorio = excluded.versao_laboratorio,
            total_candles = excluded.total_candles,
            ultimo_timestamp = excluded.ultimo_timestamp,
            estrategias_testadas = 0,
            estrategias_aprovadas = 0,
            status = 'processando',
            erro = NULL,
            data_inicio = excluded.data_inicio,
            data_conclusao = NULL,
            duracao_segundos = NULL
        """,
        (
            ticker,
            VERSAO_LABORATORIO,
            total_candles,
            ultimo_timestamp,
            agora_texto(),
        ),
    )

    conexao.commit()
    conexao.close()


def concluir_processamento_ativo(
    *,
    ticker: str,
    total_candles: int,
    ultimo_timestamp: str | None,
    estrategias_testadas: int,
    estrategias_aprovadas: int,
    duracao_segundos: float,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        UPDATE {TABELA_PROGRESSO}
        SET versao_laboratorio = ?,
            total_candles = ?,
            ultimo_timestamp = ?,
            estrategias_testadas = ?,
            estrategias_aprovadas = ?,
            status = 'concluido',
            erro = NULL,
            data_conclusao = ?,
            duracao_segundos = ?
        WHERE ticker = ?
        """,
        (
            VERSAO_LABORATORIO,
            total_candles,
            ultimo_timestamp,
            estrategias_testadas,
            estrategias_aprovadas,
            agora_texto(),
            float(duracao_segundos),
            ticker,
        ),
    )

    conexao.commit()
    conexao.close()


def registrar_erro_ativo(
    *,
    ticker: str,
    erro: str,
    duracao_segundos: float,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        UPDATE {TABELA_PROGRESSO}
        SET status = 'erro',
            erro = ?,
            data_conclusao = ?,
            duracao_segundos = ?
        WHERE ticker = ?
        """,
        (
            str(erro)[:2000],
            agora_texto(),
            float(duracao_segundos),
            ticker,
        ),
    )

    conexao.commit()
    conexao.close()


def buscar_progresso_ativo(
    ticker: str,
) -> dict[str, Any] | None:
    criar_tabela_progresso()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        f"""
        SELECT *
        FROM {TABELA_PROGRESSO}
        WHERE ticker = ?
        LIMIT 1
        """,
        (ticker,),
    )

    registro = cursor.fetchone()
    conexao.close()

    return dict(registro) if registro else None


def ativo_precisa_processar(
    *,
    ticker: str,
    total_candles: int,
    ultimo_timestamp: str | None,
    reprocessar_todos: bool,
) -> bool:
    if reprocessar_todos:
        return True

    progresso = buscar_progresso_ativo(ticker)

    if progresso is None:
        return True

    if progresso["status"] != "concluido":
        return True

    if (
        progresso["versao_laboratorio"]
        != VERSAO_LABORATORIO
    ):
        return True

    if int(progresso["total_candles"]) != total_candles:
        return True

    timestamp_anterior = str(
        progresso["ultimo_timestamp"] or ""
    )

    timestamp_atual = str(
        ultimo_timestamp or ""
    )

    if timestamp_anterior != timestamp_atual:
        return True

    return False


def excluir_estrategias_do_ativo(
    ticker: str,
) -> int:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'estrategias_aprovadas'
        LIMIT 1
        """
    )

    if cursor.fetchone() is None:
        conexao.close()
        return 0

    cursor.execute(
        """
        DELETE FROM estrategias_aprovadas
        WHERE acao = ?
        """,
        (ticker,),
    )

    removidas = max(
        cursor.rowcount,
        0,
    )

    conexao.commit()
    conexao.close()

    return removidas


def limpar_todas_estrategias() -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'estrategias_aprovadas'
        LIMIT 1
        """
    )

    if cursor.fetchone() is not None:
        cursor.execute(
            """
            DELETE FROM estrategias_aprovadas
            """
        )

    conexao.commit()
    conexao.close()


def gerar_extras():
    extras = []

    for horario in HORARIOS_PREGAO:
        extras.append(
            CondicaoHorario(horario)
        )

    for dia in DIAS_SEMANA:
        extras.append(
            CondicaoDiaSemana(dia)
        )

    for periodo in PERIODOS_MEDIA:
        for posicao in ["acima", "abaixo"]:
            extras.append(
                CondicaoMediaMovel(
                    periodo,
                    posicao,
                )
            )

    return extras


def pode_adicionar(
    condicoes,
    nova,
) -> bool:
    tipos_existentes = {
        type(condicao)
        for condicao in condicoes
    }

    return type(nova) not in tipos_existentes


def avaliar_melhor_saida(
    ativo,
    estrategia,
):
    melhor = None

    for horizonte in HORIZONTES_SAIDA:
        analise = calcular_backtest_estrategia(
            ativo,
            estrategia,
            horizonte_saida=horizonte,
        )

        if analise is None:
            continue

        avaliacao = avaliar_analise(analise)

        if not avaliacao.aprovado:
            continue

        if melhor is None:
            melhor = avaliacao
            continue

        chave_nova = (
            avaliacao.score,
            avaliacao.analise.taxa_acerto,
            avaliacao.analise.retorno_medio,
            avaliacao.analise.ocorrencias,
        )

        chave_atual = (
            melhor.score,
            melhor.analise.taxa_acerto,
            melhor.analise.retorno_medio,
            melhor.analise.ocorrencias,
        )

        if chave_nova > chave_atual:
            melhor = avaliacao

    return melhor


def remover_duplicadas(
    avaliacoes,
):
    melhores = {}

    for avaliacao in avaliacoes:
        analise = avaliacao.analise

        chave = (
            analise.acao,
            analise.estrategia,
            analise.horario_compra,
        )

        atual = melhores.get(chave)

        if atual is None:
            melhores[chave] = avaliacao
            continue

        chave_nova = (
            avaliacao.score,
            avaliacao.analise.taxa_acerto,
            avaliacao.analise.retorno_medio,
            avaliacao.analise.ocorrencias,
        )

        chave_atual = (
            atual.score,
            atual.analise.taxa_acerto,
            atual.analise.retorno_medio,
            atual.analise.ocorrencias,
        )

        if chave_nova > chave_atual:
            melhores[chave] = avaliacao

    return sorted(
        melhores.values(),
        key=lambda avaliacao: (
            avaliacao.score,
            avaliacao.analise.taxa_acerto,
            avaliacao.analise.retorno_medio,
            avaliacao.analise.ocorrencias,
        ),
        reverse=True,
    )


def analisar_ativo(
    ativo,
    extras,
):
    aprovadas = []
    estrategias_testadas = 0

    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            base = [
                CondicaoSequencia(
                    tipo,
                    quantidade,
                )
            ]

            camadas = [base]

            for _ in range(
                QUANTIDADE_CAMADAS
            ):
                novas_camadas = []
                chaves_novas = set()

                for condicoes in camadas:
                    estrategia = EstrategiaComposta(
                        condicoes
                    )

                    estrategias_testadas += 1

                    avaliacao = avaliar_melhor_saida(
                        ativo,
                        estrategia,
                    )

                    if avaliacao is not None:
                        aprovadas.append(avaliacao)

                    for extra in extras:
                        if not pode_adicionar(
                            condicoes,
                            extra,
                        ):
                            continue

                        nova_combinacao = [
                            *condicoes,
                            extra,
                        ]

                        nomes = tuple(
                            condicao.nome
                            for condicao
                            in nova_combinacao
                        )

                        if len(nomes) != len(set(nomes)):
                            continue

                        # Impede que a mesma combinação
                        # seja adicionada repetidamente.
                        chave_combinacao = tuple(
                            sorted(nomes)
                        )

                        if (
                            chave_combinacao
                            in chaves_novas
                        ):
                            continue

                        chaves_novas.add(
                            chave_combinacao
                        )

                        novas_camadas.append(
                            nova_combinacao
                        )

                camadas = novas_camadas

                if not camadas:
                    break

    finais = remover_duplicadas(
        aprovadas
    )

    return {
        "estrategias_testadas": estrategias_testadas,
        "aprovadas": finais,
    }


def obter_resumo_historico(
    dados: pd.DataFrame,
) -> dict[str, dict[str, Any]]:
    dados = dados.copy()

    dados["acao"] = (
        dados["acao"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    dados["timestamp"] = pd.to_datetime(
        dados["timestamp"],
        errors="coerce",
    )

    dados = dados.dropna(
        subset=["acao", "timestamp"]
    )

    agrupado = dados.groupby("acao")[
        "timestamp"
    ].agg(
        total_candles="count",
        ultimo_timestamp="max",
    )

    resumo = {}

    for ticker, linha in agrupado.iterrows():
        resumo[str(ticker)] = {
            "total_candles": int(
                linha["total_candles"]
            ),
            "ultimo_timestamp": (
                linha["ultimo_timestamp"]
                .strftime("%Y-%m-%d %H:%M:%S")
            ),
        }

    return resumo


def mostrar_aprovadas(
    avaliacoes,
    top: int | None,
) -> None:
    print()
    print("=" * 60)
    print("PADRÕES APROVADOS NESTA EXECUÇÃO")
    print("=" * 60)

    if not avaliacoes:
        print(
            "Nenhum novo padrão aprovado "
            "nesta execução."
        )
        return

    lista = (
        avaliacoes
        if top is None
        else avaliacoes[:top]
    )

    for posicao, avaliacao in enumerate(
        lista,
        start=1,
    ):
        analise = avaliacao.analise

        print()
        print(f"{posicao}º")
        print("Ação:", analise.acao)
        print(
            "Estratégia:",
            analise.estrategia,
        )
        print(
            "Compra:",
            analise.descricao_compra,
        )
        print(
            "Venda:",
            analise.descricao_venda,
        )
        print(
            "Melhor saída:",
            f"{analise.horizonte_saida} "
            "candle(s) depois",
        )
        print(
            f"Score: "
            f"{avaliacao.score:.0f}/100"
        )
        print(
            f"Taxa de acerto: "
            f"{analise.taxa_acerto:.2f}%"
        )
        print(
            "Ocorrências:",
            analise.ocorrencias,
        )
        print(
            "Acertos:",
            analise.acertos,
        )
        print(
            "Falhas:",
            analise.falhas,
        )
        print(
            f"Retorno médio: "
            f"{analise.retorno_medio:.2f}%"
        )
        print(
            f"Maior lucro: "
            f"{analise.maior_lucro:.2f}%"
        )
        print(
            f"Maior prejuízo: "
            f"{analise.maior_prejuizo:.2f}%"
        )
        print(
            "Última ocorrência:",
            calcular_tempo_desde(
                analise.ultima_ocorrencia
            ),
        )
        print("-" * 60)


def executar_laboratorio(
    top: int | None = 20,
    reprocessar_todos: bool = False,
):
    criar_tabelas()
    criar_tabela_progresso()

    dados = carregar_historico()

    if dados is None or dados.empty:
        print(
            "Não há histórico disponível "
            "para executar o laboratório."
        )
        return

    mercado = Mercado.a_partir_dataframe(
        dados
    )

    resumo_historico = obter_resumo_historico(
        dados
    )

    if reprocessar_todos:
        print()
        print(
            "Reprocessamento completo solicitado."
        )
        print(
            "As estratégias e o progresso anteriores "
            "serão apagados."
        )

        limpar_todas_estrategias()
        limpar_progresso_laboratorio()

    ativos_para_processar = []
    ativos_ignorados = []
    ativos_sem_historico_suficiente = []

    for ticker, ativo in sorted(
        mercado.ativos.items()
    ):
        resumo = resumo_historico.get(
            ticker,
            {},
        )

        total_candles = int(
            resumo.get("total_candles", 0)
        )

        ultimo_timestamp = resumo.get(
            "ultimo_timestamp"
        )

        if (
            total_candles
            < MINIMO_CANDLES_PARA_ANALISE
        ):
            ativos_sem_historico_suficiente.append(
                ticker
            )
            continue

        precisa_processar = ativo_precisa_processar(
            ticker=ticker,
            total_candles=total_candles,
            ultimo_timestamp=ultimo_timestamp,
            reprocessar_todos=reprocessar_todos,
        )

        if precisa_processar:
            ativos_para_processar.append(
                (
                    ticker,
                    ativo,
                    total_candles,
                    ultimo_timestamp,
                )
            )
        else:
            ativos_ignorados.append(ticker)

    inicio_periodo = pd.to_datetime(
        dados["timestamp"],
        errors="coerce",
    ).min()

    fim_periodo = pd.to_datetime(
        dados["timestamp"],
        errors="coerce",
    ).max()

    print()
    print("=" * 60)
    print("LABORATÓRIO PRINCIPAL - PADRÕES B3")
    print("=" * 60)
    print(
        "Versão:",
        VERSAO_LABORATORIO,
    )
    print(
        "Registros no banco:",
        contar_registros(),
    )
    print(
        "Período analisado:",
        f"{formatar_data_br(inicio_periodo)} "
        f"até {formatar_data_br(fim_periodo)}",
    )
    print(
        "Ações no mercado:",
        mercado.total_ativos(),
    )
    print(
        "Ações para processar:",
        len(ativos_para_processar),
    )
    print(
        "Ações já atualizadas e ignoradas:",
        len(ativos_ignorados),
    )
    print(
        "Ações sem histórico suficiente:",
        len(
            ativos_sem_historico_suficiente
        ),
    )

    if not ativos_para_processar:
        print()
        print(
            "Nenhum ativo precisa ser processado."
        )
        print(
            "Estratégias aprovadas no banco:",
            contar_estrategias_aprovadas(),
        )
        return

    extras = gerar_extras()

    inicio_geral = time.time()
    tempos_concluidos = []

    total_testadas = 0
    total_aprovadas_execucao = 0
    total_erros = 0

    aprovadas_execucao = []

    quantidade_total = len(
        ativos_para_processar
    )

    for indice, item in enumerate(
        ativos_para_processar,
        start=1,
    ):
        (
            ticker,
            ativo,
            total_candles,
            ultimo_timestamp,
        ) = item

        inicio_ativo = time.time()

        media_tempo = (
            sum(tempos_concluidos)
            / len(tempos_concluidos)
            if tempos_concluidos
            else 0
        )

        restantes = (
            quantidade_total - indice + 1
        )

        estimativa_restante = (
            media_tempo * restantes
        )

        print()
        print("=" * 60)
        print(
            f"[{indice}/{quantidade_total}] "
            f"ANALISANDO {ticker}"
        )
        print("=" * 60)
        print(
            "Candles:",
            total_candles,
        )

        if tempos_concluidos:
            print(
                "Tempo médio por ativo:",
                formatar_duracao(media_tempo),
            )
            print(
                "Tempo restante estimado:",
                formatar_duracao(
                    estimativa_restante
                ),
            )

        iniciar_processamento_ativo(
            ticker=ticker,
            total_candles=total_candles,
            ultimo_timestamp=ultimo_timestamp,
        )

        try:
            resultado = analisar_ativo(
                ativo=ativo,
                extras=extras,
            )

            aprovadas = resultado[
                "aprovadas"
            ]

            estrategias_testadas = int(
                resultado[
                    "estrategias_testadas"
                ]
            )

            # Substitui apenas os resultados
            # do ativo que acabou de ser analisado.
            removidas = (
                excluir_estrategias_do_ativo(
                    ticker
                )
            )

            if aprovadas:
                salvar_estrategias_aprovadas(
                    aprovadas
                )

            duracao_ativo = (
                time.time() - inicio_ativo
            )

            concluir_processamento_ativo(
                ticker=ticker,
                total_candles=total_candles,
                ultimo_timestamp=ultimo_timestamp,
                estrategias_testadas=(
                    estrategias_testadas
                ),
                estrategias_aprovadas=len(
                    aprovadas
                ),
                duracao_segundos=duracao_ativo,
            )

            tempos_concluidos.append(
                duracao_ativo
            )

            total_testadas += (
                estrategias_testadas
            )

            total_aprovadas_execucao += len(
                aprovadas
            )

            aprovadas_execucao.extend(
                aprovadas
            )

            print(
                "Estratégias anteriores removidas:",
                removidas,
            )
            print(
                "Estratégias testadas:",
                estrategias_testadas,
            )
            print(
                "Estratégias aprovadas:",
                len(aprovadas),
            )
            print(
                "Tempo do ativo:",
                formatar_duracao(
                    duracao_ativo
                ),
            )

            logger.info(
                f"Laboratório concluído para "
                f"{ticker}. "
                f"Testadas: "
                f"{estrategias_testadas}. "
                f"Aprovadas: {len(aprovadas)}. "
                f"Duração: {duracao_ativo:.2f}s."
            )

        except KeyboardInterrupt:
            duracao_ativo = (
                time.time() - inicio_ativo
            )

            registrar_erro_ativo(
                ticker=ticker,
                erro=(
                    "Execução interrompida "
                    "pelo usuário."
                ),
                duracao_segundos=duracao_ativo,
            )

            print()
            print(
                "Laboratório interrompido."
            )
            print(
                "O progresso dos ativos concluídos "
                "foi preservado."
            )
            print(
                "Execute novamente para continuar."
            )

            raise

        except Exception as erro:
            total_erros += 1

            duracao_ativo = (
                time.time() - inicio_ativo
            )

            registrar_erro_ativo(
                ticker=ticker,
                erro=str(erro),
                duracao_segundos=duracao_ativo,
            )

            print(
                f"Erro ao analisar {ticker}: "
                f"{erro}"
            )

            logger.erro(
                f"Erro no laboratório para "
                f"{ticker}: {erro}"
            )

            continue

    duracao_total = (
        time.time() - inicio_geral
    )

    aprovadas_execucao = sorted(
        aprovadas_execucao,
        key=lambda avaliacao: (
            avaliacao.score,
            avaliacao.analise.taxa_acerto,
            avaliacao.analise.retorno_medio,
            avaliacao.analise.ocorrencias,
        ),
        reverse=True,
    )

    print()
    print("=" * 60)
    print("LABORATÓRIO FINALIZADO")
    print("=" * 60)
    print(
        "Ativos processados:",
        len(tempos_concluidos),
    )
    print(
        "Ativos com erro:",
        total_erros,
    )
    print(
        "Estratégias testadas nesta execução:",
        total_testadas,
    )
    print(
        "Estratégias aprovadas nesta execução:",
        total_aprovadas_execucao,
    )
    print(
        "Estratégias aprovadas no banco:",
        contar_estrategias_aprovadas(),
    )
    print(
        "Tempo total:",
        formatar_duracao(duracao_total),
    )

    mostrar_aprovadas(
        avaliacoes=aprovadas_execucao,
        top=top,
    )