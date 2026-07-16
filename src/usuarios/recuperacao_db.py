import hashlib
from datetime import datetime

from banco.sqlite import conectar_banco


def criar_tabela_recuperacao_senha():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recuperacao_senha (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_email TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expira_em TEXT NOT NULL,
            utilizado INTEGER NOT NULL DEFAULT 0,
            data_criacao TEXT NOT NULL,
            data_utilizacao TEXT
        )
    """)

    conexao.commit()
    conexao.close()


def gerar_hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def salvar_token_recuperacao(
    email: str,
    token: str,
    expira_em: str,
):
    criar_tabela_recuperacao_senha()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    token_hash = gerar_hash_token(token)
    data_criacao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Invalida tokens anteriores ainda não utilizados.
    cursor.execute("""
        UPDATE recuperacao_senha
        SET utilizado = 1
        WHERE usuario_email = ?
          AND utilizado = 0
    """, (email,))

    cursor.execute("""
        INSERT INTO recuperacao_senha (
            usuario_email,
            token_hash,
            expira_em,
            utilizado,
            data_criacao
        )
        VALUES (?, ?, ?, 0, ?)
    """, (
        email,
        token_hash,
        expira_em,
        data_criacao,
    ))

    conexao.commit()
    conexao.close()


def buscar_token_recuperacao(token: str):
    criar_tabela_recuperacao_senha()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    token_hash = gerar_hash_token(token)

    cursor.execute("""
        SELECT
            id,
            usuario_email,
            token_hash,
            expira_em,
            utilizado,
            data_criacao,
            data_utilizacao
        FROM recuperacao_senha
        WHERE token_hash = ?
    """, (token_hash,))

    registro = cursor.fetchone()
    conexao.close()

    return registro


def marcar_token_como_utilizado(token: str):
    criar_tabela_recuperacao_senha()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    token_hash = gerar_hash_token(token)
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE recuperacao_senha
        SET utilizado = 1,
            data_utilizacao = ?
        WHERE token_hash = ?
    """, (
        agora,
        token_hash,
    ))

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0