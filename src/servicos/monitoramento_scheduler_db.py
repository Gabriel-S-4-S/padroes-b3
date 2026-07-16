import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco


def agora_texto() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def criar_tabelas_monitoramento_scheduler() -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS scheduler_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),

            status TEXT NOT NULL DEFAULT 'offline',
            processo_iniciado_em TEXT,
            ultima_atividade_em TEXT,

            ultimo_scanner_programado TEXT,
            ultimo_scanner_inicio TEXT,
            ultimo_scanner_fim TEXT,
            ultimo_scanner_status TEXT,
            ultimo_scanner_erro TEXT,

            ultimo_scanner_candles_novos INTEGER NOT NULL DEFAULT 0,
            ultimo_scanner_oportunidades INTEGER NOT NULL DEFAULT 0,
            ultimo_scanner_emails_enviados INTEGER NOT NULL DEFAULT 0,
            ultimo_scanner_emails_ignorados INTEGER NOT NULL DEFAULT 0,
            ultimo_scanner_emails_falhas INTEGER NOT NULL DEFAULT 0,

            ultimo_laboratorio_programado TEXT,
            ultimo_laboratorio_inicio TEXT,
            ultimo_laboratorio_fim TEXT,
            ultimo_laboratorio_status TEXT,
            ultimo_laboratorio_erro TEXT,

            proximo_scanner TEXT,
            proximo_laboratorio TEXT,

            atualizado_em TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        INSERT OR IGNORE INTO scheduler_status (
            id,
            status,
            atualizado_em
        )
        VALUES (1, 'offline', ?)
        """,
        (agora_texto(),),
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS scheduler_execucoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            tipo TEXT NOT NULL,
            horario_programado TEXT,
            recuperacao INTEGER NOT NULL DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'iniciada',
            data_inicio TEXT NOT NULL,
            data_fim TEXT,
            duracao_segundos REAL,

            candles_novos INTEGER NOT NULL DEFAULT 0,
            oportunidades_encontradas INTEGER NOT NULL DEFAULT 0,
            emails_enviados INTEGER NOT NULL DEFAULT 0,
            emails_ignorados INTEGER NOT NULL DEFAULT 0,
            emails_falhas INTEGER NOT NULL DEFAULT 0,

            erro TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_scheduler_execucoes_tipo
        ON scheduler_execucoes(tipo)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_scheduler_execucoes_status
        ON scheduler_execucoes(status)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_scheduler_execucoes_data_inicio
        ON scheduler_execucoes(data_inicio)
        """
    )

    conexao.commit()
    conexao.close()


def atualizar_status_scheduler(
    *,
    status: str,
    proximo_scanner: str | None = None,
    proximo_laboratorio: str | None = None,
    processo_iniciado_em: str | None = None,
) -> None:
    criar_tabelas_monitoramento_scheduler()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE scheduler_status
        SET status = ?,
            proximo_scanner = COALESCE(?, proximo_scanner),
            proximo_laboratorio = COALESCE(?, proximo_laboratorio),
            processo_iniciado_em = COALESCE(
                ?,
                processo_iniciado_em
            ),
            ultima_atividade_em = ?,
            atualizado_em = ?
        WHERE id = 1
        """,
        (
            status,
            proximo_scanner,
            proximo_laboratorio,
            processo_iniciado_em,
            agora_texto(),
            agora_texto(),
        ),
    )

    conexao.commit()
    conexao.close()


def registrar_inicio_execucao(
    *,
    tipo: str,
    horario_programado: str | None,
    recuperacao: bool = False,
) -> int:
    criar_tabelas_monitoramento_scheduler()

    inicio = agora_texto()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO scheduler_execucoes (
            tipo,
            horario_programado,
            recuperacao,
            status,
            data_inicio
        )
        VALUES (?, ?, ?, 'iniciada', ?)
        """,
        (
            tipo,
            horario_programado,
            int(recuperacao),
            inicio,
        ),
    )

    execucao_id = int(cursor.lastrowid)

    if tipo == "scanner":
        cursor.execute(
            """
            UPDATE scheduler_status
            SET status = 'executando_scanner',
                ultimo_scanner_programado = ?,
                ultimo_scanner_inicio = ?,
                ultimo_scanner_status = 'iniciada',
                ultimo_scanner_erro = NULL,
                ultima_atividade_em = ?,
                atualizado_em = ?
            WHERE id = 1
            """,
            (
                horario_programado,
                inicio,
                inicio,
                inicio,
            ),
        )

    elif tipo == "laboratorio":
        cursor.execute(
            """
            UPDATE scheduler_status
            SET status = 'executando_laboratorio',
                ultimo_laboratorio_programado = ?,
                ultimo_laboratorio_inicio = ?,
                ultimo_laboratorio_status = 'iniciada',
                ultimo_laboratorio_erro = NULL,
                ultima_atividade_em = ?,
                atualizado_em = ?
            WHERE id = 1
            """,
            (
                horario_programado,
                inicio,
                inicio,
                inicio,
            ),
        )

    conexao.commit()
    conexao.close()

    return execucao_id


def registrar_fim_scanner(
    *,
    execucao_id: int,
    status: str,
    duracao_segundos: float,
    candles_novos: int = 0,
    oportunidades_encontradas: int = 0,
    emails_enviados: int = 0,
    emails_ignorados: int = 0,
    emails_falhas: int = 0,
    erro: str | None = None,
) -> None:
    criar_tabelas_monitoramento_scheduler()

    fim = agora_texto()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE scheduler_execucoes
        SET status = ?,
            data_fim = ?,
            duracao_segundos = ?,
            candles_novos = ?,
            oportunidades_encontradas = ?,
            emails_enviados = ?,
            emails_ignorados = ?,
            emails_falhas = ?,
            erro = ?
        WHERE id = ?
        """,
        (
            status,
            fim,
            float(duracao_segundos),
            int(candles_novos),
            int(oportunidades_encontradas),
            int(emails_enviados),
            int(emails_ignorados),
            int(emails_falhas),
            erro,
            execucao_id,
        ),
    )

    cursor.execute(
        """
        UPDATE scheduler_status
        SET status = 'online',
            ultimo_scanner_fim = ?,
            ultimo_scanner_status = ?,
            ultimo_scanner_erro = ?,
            ultimo_scanner_candles_novos = ?,
            ultimo_scanner_oportunidades = ?,
            ultimo_scanner_emails_enviados = ?,
            ultimo_scanner_emails_ignorados = ?,
            ultimo_scanner_emails_falhas = ?,
            ultima_atividade_em = ?,
            atualizado_em = ?
        WHERE id = 1
        """,
        (
            fim,
            status,
            erro,
            int(candles_novos),
            int(oportunidades_encontradas),
            int(emails_enviados),
            int(emails_ignorados),
            int(emails_falhas),
            fim,
            fim,
        ),
    )

    conexao.commit()
    conexao.close()


def registrar_fim_laboratorio(
    *,
    execucao_id: int,
    status: str,
    duracao_segundos: float,
    erro: str | None = None,
) -> None:
    criar_tabelas_monitoramento_scheduler()

    fim = agora_texto()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE scheduler_execucoes
        SET status = ?,
            data_fim = ?,
            duracao_segundos = ?,
            erro = ?
        WHERE id = ?
        """,
        (
            status,
            fim,
            float(duracao_segundos),
            erro,
            execucao_id,
        ),
    )

    cursor.execute(
        """
        UPDATE scheduler_status
        SET status = 'online',
            ultimo_laboratorio_fim = ?,
            ultimo_laboratorio_status = ?,
            ultimo_laboratorio_erro = ?,
            ultima_atividade_em = ?,
            atualizado_em = ?
        WHERE id = 1
        """,
        (
            fim,
            status,
            erro,
            fim,
            fim,
        ),
    )

    conexao.commit()
    conexao.close()


def marcar_scheduler_offline() -> None:
    criar_tabelas_monitoramento_scheduler()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE scheduler_status
        SET status = 'offline',
            ultima_atividade_em = ?,
            atualizado_em = ?
        WHERE id = 1
        """,
        (
            agora_texto(),
            agora_texto(),
        ),
    )

    conexao.commit()
    conexao.close()


def obter_status_scheduler() -> dict[str, Any]:
    criar_tabelas_monitoramento_scheduler()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scheduler_status
        WHERE id = 1
        LIMIT 1
        """
    )

    registro = cursor.fetchone()
    conexao.close()

    return dict(registro) if registro else {}


def listar_execucoes_scheduler(
    *,
    limite: int = 20,
) -> list[dict[str, Any]]:
    criar_tabelas_monitoramento_scheduler()

    limite_seguro = max(
        1,
        min(int(limite), 200),
    )

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scheduler_execucoes
        ORDER BY id DESC
        LIMIT ?
        """,
        (limite_seguro,),
    )

    registros = [
        dict(registro)
        for registro in cursor.fetchall()
    ]

    conexao.close()

    return registros