import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco


def agora_texto():
    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def criar_tabela_notificacoes():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notificacoes_oportunidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,
            usuario_email TEXT NOT NULL,

            oportunidade_chave TEXT NOT NULL,
            acao TEXT NOT NULL,
            estrategia TEXT NOT NULL,
            evento_em TEXT,

            status TEXT NOT NULL DEFAULT 'pendente',
            erro TEXT,

            data_criacao TEXT NOT NULL,
            data_envio TEXT,

            UNIQUE (
                usuario_id,
                oportunidade_chave
            ),

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_notificacoes_oportunidade_chave
        ON notificacoes_oportunidades(
            oportunidade_chave
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_notificacoes_usuario
        ON notificacoes_oportunidades(
            usuario_id
        )
        """
    )

    conexao.commit()
    conexao.close()


def listar_usuarios_premium_ativos():
    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    agora = agora_texto()

    cursor.execute(
        """
        SELECT
            id,
            nome,
            email,
            plano,
            status,
            expira_em
        FROM usuarios
        WHERE plano IN ('mensal', 'anual')
          AND status = 'ativo'
          AND expira_em IS NOT NULL
          AND expira_em > ?
          AND email IS NOT NULL
          AND TRIM(email) <> ''
        ORDER BY id
        """,
        (agora,),
    )

    usuarios = [
        dict(registro)
        for registro in cursor.fetchall()
    ]

    conexao.close()

    return usuarios


def notificacao_ja_registrada(
    usuario_id: int,
    oportunidade_chave: str,
):
    criar_tabela_notificacoes()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM notificacoes_oportunidades
        WHERE usuario_id = ?
          AND oportunidade_chave = ?
        LIMIT 1
        """,
        (
            usuario_id,
            oportunidade_chave,
        ),
    )

    existe = cursor.fetchone() is not None

    conexao.close()

    return existe


def registrar_notificacao_pendente(
    *,
    usuario_id: int,
    usuario_email: str,
    oportunidade_chave: str,
    acao: str,
    estrategia: str,
    evento_em: str | None,
):
    criar_tabela_notificacoes()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO notificacoes_oportunidades (
                usuario_id,
                usuario_email,
                oportunidade_chave,
                acao,
                estrategia,
                evento_em,
                status,
                data_criacao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                usuario_id,
                usuario_email.strip().lower(),
                oportunidade_chave,
                acao,
                estrategia,
                evento_em,
                "pendente",
                agora_texto(),
            ),
        )

        notificacao_id = cursor.lastrowid

        conexao.commit()

        return int(notificacao_id)

    except sqlite3.IntegrityError:
        return None

    finally:
        conexao.close()


def marcar_notificacao_enviada(
    notificacao_id: int,
):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE notificacoes_oportunidades
        SET status = 'enviada',
            erro = NULL,
            data_envio = ?
        WHERE id = ?
        """,
        (
            agora_texto(),
            notificacao_id,
        ),
    )

    conexao.commit()
    conexao.close()


def marcar_notificacao_com_erro(
    notificacao_id: int,
    erro: str,
):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE notificacoes_oportunidades
        SET status = 'erro',
            erro = ?
        WHERE id = ?
        """,
        (
            str(erro)[:1000],
            notificacao_id,
        ),
    )

    conexao.commit()
    conexao.close()


def listar_notificacoes_usuario(
    usuario_id: int,
    limite: int = 100,
) -> list[dict[str, Any]]:
    criar_tabela_notificacoes()

    limite = max(1, min(int(limite), 500))

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM notificacoes_oportunidades
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (
            usuario_id,
            limite,
        ),
    )

    registros = [
        dict(registro)
        for registro in cursor.fetchall()
    ]

    conexao.close()

    return registros