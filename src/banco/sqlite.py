import sqlite3
from datetime import datetime

import pandas as pd

from config import CAMINHO_BANCO


def conectar_banco():
    CAMINHO_BANCO.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(CAMINHO_BANCO)


def criar_tabelas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS historico_precos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            close REAL NOT NULL,
            UNIQUE(acao, timestamp)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS estrategias_aprovadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            estrategia TEXT NOT NULL,
            horario_compra TEXT NOT NULL,
            horario_venda TEXT NOT NULL,
            horizonte_saida INTEGER NOT NULL,
            taxa_acerto REAL NOT NULL,
            ocorrencias INTEGER NOT NULL,
            acertos INTEGER NOT NULL,
            falhas INTEGER NOT NULL,
            retorno_medio REAL NOT NULL,
            maior_lucro REAL NOT NULL,
            maior_prejuizo REAL NOT NULL,
            ultima_ocorrencia TEXT NOT NULL,
            score REAL NOT NULL,
            data_criacao TEXT NOT NULL,
            UNIQUE(acao, estrategia, horizonte_saida)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS oportunidades_ativas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            estrategia TEXT NOT NULL,
            horario_compra TEXT NOT NULL,
            horario_venda TEXT NOT NULL,
            horizonte_saida INTEGER NOT NULL,
            taxa_acerto REAL NOT NULL,
            ocorrencias INTEGER NOT NULL,
            acertos INTEGER NOT NULL,
            falhas INTEGER NOT NULL,
            retorno_medio REAL NOT NULL,
            score REAL NOT NULL,
            tipo_acesso TEXT NOT NULL,
            data_geracao TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS oportunidades_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            estrategia TEXT NOT NULL,
            horario_compra TEXT NOT NULL,
            horario_venda TEXT NOT NULL,
            horizonte_saida INTEGER NOT NULL,
            taxa_acerto REAL NOT NULL,
            ocorrencias INTEGER NOT NULL,
            acertos INTEGER NOT NULL,
            falhas INTEGER NOT NULL,
            retorno_medio REAL NOT NULL,
            score REAL NOT NULL,
            data_geracao TEXT NOT NULL,
            UNIQUE(acao, estrategia, horario_compra, horario_venda, data_geracao)
        )
    """)

    conexao.commit()
    conexao.close()


def salvar_historico(dados):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    registros = []

    for _, linha in dados.iterrows():
        registros.append((
            linha["acao"],
            str(linha["timestamp"]),
            float(linha["close"]),
        ))

    cursor.executemany("""
        INSERT OR IGNORE INTO historico_precos (acao, timestamp, close)
        VALUES (?, ?, ?)
    """, registros)

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_registros():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("SELECT COUNT(*) FROM historico_precos")
    total = cursor.fetchone()[0]

    conexao.close()
    return total


def obter_ultimo_timestamp(acao):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT MAX(timestamp)
        FROM historico_precos
        WHERE acao = ?
    """, (acao,))

    resultado = cursor.fetchone()[0]

    conexao.close()
    return resultado


def carregar_historico():
    conexao = conectar_banco()

    query = """
        SELECT acao, timestamp, close
        FROM historico_precos
        ORDER BY acao, timestamp
    """

    dados = pd.read_sql_query(query, conexao)
    conexao.close()

    dados["timestamp"] = pd.to_datetime(dados["timestamp"])
    dados["close"] = pd.to_numeric(dados["close"], errors="coerce")

    return dados


def limpar_estrategias_aprovadas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("DELETE FROM estrategias_aprovadas")

    conexao.commit()
    conexao.close()


def salvar_estrategias_aprovadas(avaliacoes):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    registros = []
    data_criacao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for avaliacao in avaliacoes:
        analise = avaliacao.analise

        registros.append((
            analise.acao,
            analise.estrategia,
            analise.horario_compra,
            analise.horario_venda,
            analise.horizonte_saida,
            analise.taxa_acerto,
            analise.ocorrencias,
            analise.acertos,
            analise.falhas,
            analise.retorno_medio,
            analise.maior_lucro,
            analise.maior_prejuizo,
            analise.ultima_ocorrencia,
            avaliacao.score,
            data_criacao,
        ))

    cursor.executemany("""
        INSERT OR REPLACE INTO estrategias_aprovadas (
            acao,
            estrategia,
            horario_compra,
            horario_venda,
            horizonte_saida,
            taxa_acerto,
            ocorrencias,
            acertos,
            falhas,
            retorno_medio,
            maior_lucro,
            maior_prejuizo,
            ultima_ocorrencia,
            score,
            data_criacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, registros)

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_estrategias_aprovadas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("SELECT COUNT(*) FROM estrategias_aprovadas")
    total = cursor.fetchone()[0]

    conexao.close()
    return total


def carregar_estrategias_aprovadas():
    conexao = conectar_banco()

    query = """
        SELECT *
        FROM estrategias_aprovadas
        ORDER BY score DESC, taxa_acerto DESC, retorno_medio DESC
    """

    dados = pd.read_sql_query(query, conexao)
    conexao.close()

    return dados


def corrigir_timestamps_meia_hora():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE historico_precos
        SET timestamp = datetime(timestamp, '+30 minutes')
        WHERE strftime('%M:%S', timestamp) = '00:00'
    """)

    conexao.commit()
    conexao.close()


def limpar_oportunidades_ativas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("DELETE FROM oportunidades_ativas")

    conexao.commit()
    conexao.close()


def salvar_oportunidades_ativas(oportunidades):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    data_geracao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    registros = []

    for oportunidade in oportunidades:
        registros.append((
            oportunidade["acao"],
            oportunidade["estrategia"],
            oportunidade["horario_compra"],
            oportunidade["horario_venda"],
            int(oportunidade["horizonte_saida"]),
            float(oportunidade["taxa_acerto"]),
            int(oportunidade["ocorrencias"]),
            int(oportunidade["acertos"]),
            int(oportunidade["falhas"]),
            float(oportunidade["retorno_medio"]),
            float(oportunidade["score"]),
            "premium",
            data_geracao,
        ))

    cursor.executemany("""
        INSERT INTO oportunidades_ativas (
            acao,
            estrategia,
            horario_compra,
            horario_venda,
            horizonte_saida,
            taxa_acerto,
            ocorrencias,
            acertos,
            falhas,
            retorno_medio,
            score,
            tipo_acesso,
            data_geracao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, registros)

    conexao.commit()
    conexao.close()

    return len(registros)


def carregar_oportunidades_ativas():
    conexao = conectar_banco()

    query = """
        SELECT *
        FROM oportunidades_ativas
        ORDER BY score DESC, taxa_acerto DESC, retorno_medio DESC
    """

    dados = pd.read_sql_query(query, conexao)
    conexao.close()

    return dados


def carregar_oportunidades_premium():
    dados = carregar_oportunidades_ativas()

    if dados.empty:
        return []

    return dados.to_dict(orient="records")


def carregar_oportunidade_gratis():
    dados = carregar_oportunidades_ativas()

    if dados.empty:
        return None

    dados = dados.sort_values(
        by=["score", "taxa_acerto", "retorno_medio"],
        ascending=[True, True, True],
    )

    oportunidade = dados.iloc[0]

    return oportunidade.to_dict()


def contar_oportunidades_ativas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("SELECT COUNT(*) FROM oportunidades_ativas")
    total = cursor.fetchone()[0]

    conexao.close()
    return total


def salvar_oportunidades_historico(oportunidades):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    data_geracao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    registros = []

    for oportunidade in oportunidades:
        registros.append((
            oportunidade["acao"],
            oportunidade["estrategia"],
            oportunidade["horario_compra"],
            oportunidade["horario_venda"],
            int(oportunidade["horizonte_saida"]),
            float(oportunidade["taxa_acerto"]),
            int(oportunidade["ocorrencias"]),
            int(oportunidade["acertos"]),
            int(oportunidade["falhas"]),
            float(oportunidade["retorno_medio"]),
            float(oportunidade["score"]),
            data_geracao,
        ))

    cursor.executemany("""
        INSERT OR IGNORE INTO oportunidades_historico (
            acao,
            estrategia,
            horario_compra,
            horario_venda,
            horizonte_saida,
            taxa_acerto,
            ocorrencias,
            acertos,
            falhas,
            retorno_medio,
            score,
            data_geracao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, registros)

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_oportunidades_historico():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("SELECT COUNT(*) FROM oportunidades_historico")
    total = cursor.fetchone()[0]

    conexao.close()
    return total