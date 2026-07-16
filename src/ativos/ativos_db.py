import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco


TABELAS_DADOS_ATIVO = [
    "historico",
    "estrategias_aprovadas",
    "oportunidades_ativas",
    "oportunidades_historico",
    "notificacoes_oportunidades",
]


def agora_texto() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def criar_tabelas_ativos() -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ativos_catalogo (
            ticker TEXT PRIMARY KEY,
            ticker_yahoo TEXT NOT NULL,

            ativo_b3 INTEGER NOT NULL DEFAULT 1,
            valido_yahoo INTEGER NOT NULL DEFAULT 0,

            ausencias_consecutivas INTEGER NOT NULL DEFAULT 0,

            data_primeira_deteccao TEXT NOT NULL,
            data_ultima_deteccao TEXT NOT NULL,
            data_ultima_validacao_yahoo TEXT,

            data_remocao TEXT,
            motivo_remocao TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sincronizacoes_ativos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            data_inicio TEXT NOT NULL,
            data_fim TEXT,

            sucesso_b3 INTEGER NOT NULL DEFAULT 0,

            encontrados_b3 INTEGER NOT NULL DEFAULT 0,
            validos_yahoo INTEGER NOT NULL DEFAULT 0,
            adicionados INTEGER NOT NULL DEFAULT 0,
            removidos INTEGER NOT NULL DEFAULT 0,

            mensagem TEXT
        )
        """
    )

    conexao.commit()
    conexao.close()


def iniciar_sincronizacao() -> int:
    criar_tabelas_ativos()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO sincronizacoes_ativos (
            data_inicio,
            sucesso_b3,
            encontrados_b3,
            validos_yahoo,
            adicionados,
            removidos
        )
        VALUES (?, 0, 0, 0, 0, 0)
        """,
        (agora_texto(),),
    )

    sincronizacao_id = int(cursor.lastrowid)

    conexao.commit()
    conexao.close()

    return sincronizacao_id


def finalizar_sincronizacao(
    *,
    sincronizacao_id: int,
    sucesso_b3: bool,
    encontrados_b3: int,
    validos_yahoo: int,
    adicionados: int,
    removidos: int,
    mensagem: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE sincronizacoes_ativos
        SET data_fim = ?,
            sucesso_b3 = ?,
            encontrados_b3 = ?,
            validos_yahoo = ?,
            adicionados = ?,
            removidos = ?,
            mensagem = ?
        WHERE id = ?
        """,
        (
            agora_texto(),
            int(sucesso_b3),
            encontrados_b3,
            validos_yahoo,
            adicionados,
            removidos,
            mensagem,
            sincronizacao_id,
        ),
    )

    conexao.commit()
    conexao.close()


def listar_ativos_catalogo(
    apenas_ativos: bool = True,
) -> list[dict[str, Any]]:
    criar_tabelas_ativos()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    if apenas_ativos:
        cursor.execute(
            """
            SELECT *
            FROM ativos_catalogo
            WHERE ativo_b3 = 1
            ORDER BY ticker
            """
        )
    else:
        cursor.execute(
            """
            SELECT *
            FROM ativos_catalogo
            ORDER BY ticker
            """
        )

    registros = [
        dict(registro)
        for registro in cursor.fetchall()
    ]

    conexao.close()

    return registros


def buscar_tickers_ativos() -> set[str]:
    return {
        registro["ticker"]
        for registro in listar_ativos_catalogo(
            apenas_ativos=True
        )
    }


def registrar_ou_atualizar_ativo(
    *,
    ticker: str,
    valido_yahoo: bool,
) -> bool:
    """
    Retorna True quando o ticker ainda não existia
    ou havia sido removido anteriormente.
    """

    criar_tabelas_ativos()

    ticker = ticker.strip().upper()
    ticker_yahoo = f"{ticker}.SA"
    agora = agora_texto()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT ticker, ativo_b3
        FROM ativos_catalogo
        WHERE ticker = ?
        """,
        (ticker,),
    )

    existente = cursor.fetchone()

    novo_ou_reativado = (
        existente is None
        or int(existente["ativo_b3"]) == 0
    )

    if existente is None:
        cursor.execute(
            """
            INSERT INTO ativos_catalogo (
                ticker,
                ticker_yahoo,
                ativo_b3,
                valido_yahoo,
                ausencias_consecutivas,
                data_primeira_deteccao,
                data_ultima_deteccao,
                data_ultima_validacao_yahoo,
                data_remocao,
                motivo_remocao
            )
            VALUES (?, ?, 1, ?, 0, ?, ?, ?, NULL, NULL)
            """,
            (
                ticker,
                ticker_yahoo,
                int(valido_yahoo),
                agora,
                agora,
                agora,
            ),
        )
    else:
        cursor.execute(
            """
            UPDATE ativos_catalogo
            SET ticker_yahoo = ?,
                ativo_b3 = 1,
                valido_yahoo = ?,
                ausencias_consecutivas = 0,
                data_ultima_deteccao = ?,
                data_ultima_validacao_yahoo = ?,
                data_remocao = NULL,
                motivo_remocao = NULL
            WHERE ticker = ?
            """,
            (
                ticker_yahoo,
                int(valido_yahoo),
                agora,
                agora,
                ticker,
            ),
        )

    conexao.commit()
    conexao.close()

    return novo_ou_reativado


def registrar_validacao_yahoo(
    *,
    ticker: str,
    valido: bool,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE ativos_catalogo
        SET valido_yahoo = ?,
            data_ultima_validacao_yahoo = ?
        WHERE ticker = ?
        """,
        (
            int(valido),
            agora_texto(),
            ticker.strip().upper(),
        ),
    )

    conexao.commit()
    conexao.close()


def incrementar_ausencia(ticker: str) -> int:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE ativos_catalogo
        SET ausencias_consecutivas =
            ausencias_consecutivas + 1
        WHERE ticker = ?
          AND ativo_b3 = 1
        """,
        (ticker.strip().upper(),),
    )

    cursor.execute(
        """
        SELECT ausencias_consecutivas
        FROM ativos_catalogo
        WHERE ticker = ?
        """,
        (ticker.strip().upper(),),
    )

    registro = cursor.fetchone()
    conexao.commit()
    conexao.close()

    return int(registro[0]) if registro else 0


def marcar_ativo_removido(
    *,
    ticker: str,
    motivo: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE ativos_catalogo
        SET ativo_b3 = 0,
            valido_yahoo = 0,
            data_remocao = ?,
            motivo_remocao = ?
        WHERE ticker = ?
        """,
        (
            agora_texto(),
            motivo,
            ticker.strip().upper(),
        ),
    )

    conexao.commit()
    conexao.close()


def tabela_existe(
    cursor: sqlite3.Cursor,
    tabela: str,
) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
        LIMIT 1
        """,
        (tabela,),
    )

    return cursor.fetchone() is not None


def tabela_possui_coluna(
    cursor: sqlite3.Cursor,
    tabela: str,
    coluna: str,
) -> bool:
    cursor.execute(f'PRAGMA table_info("{tabela}")')

    colunas = {
        str(registro[1])
        for registro in cursor.fetchall()
    }

    return coluna in colunas


def apagar_dados_do_ativo(
    ticker: str,
) -> dict[str, int]:
    """
    Apaga histórico, oportunidades, estratégias e notificações
    ligadas ao ticker.

    Somente as tabelas explicitamente permitidas são alteradas.
    """

    ticker = ticker.strip().upper()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    resultado: dict[str, int] = {}

    try:
        cursor.execute("BEGIN IMMEDIATE")

        for tabela in TABELAS_DADOS_ATIVO:
            if not tabela_existe(cursor, tabela):
                continue

            if not tabela_possui_coluna(
                cursor,
                tabela,
                "acao",
            ):
                continue

            cursor.execute(
                f'DELETE FROM "{tabela}" WHERE acao = ?',
                (ticker,),
            )

            resultado[tabela] = max(
                cursor.rowcount,
                0,
            )

        conexao.commit()

    except Exception:
        conexao.rollback()
        raise

    finally:
        conexao.close()

    return resultado