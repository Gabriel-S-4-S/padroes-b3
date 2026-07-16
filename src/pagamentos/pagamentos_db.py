import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco


def agora_texto() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def criar_tabela_pagamentos() -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pagamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,
            usuario_email TEXT NOT NULL,

            plano TEXT NOT NULL,
            valor_centavos INTEGER NOT NULL,
            moeda TEXT NOT NULL DEFAULT 'BRL',

            preferencia_id TEXT,
            referencia_externa TEXT NOT NULL UNIQUE,
            pagamento_id TEXT UNIQUE,

            status TEXT NOT NULL DEFAULT 'criado',
            status_detalhe TEXT,

            meio_pagamento TEXT,
            tipo_pagamento TEXT,

            modo_teste INTEGER NOT NULL DEFAULT 1,

            data_criacao TEXT NOT NULL,
            data_atualizacao TEXT NOT NULL,
            data_aprovacao TEXT,

            processado INTEGER NOT NULL DEFAULT 0,
            data_processamento TEXT,

            resposta_mercado_pago TEXT,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_pagamentos_usuario_id
        ON pagamentos(usuario_id)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_pagamentos_usuario_email
        ON pagamentos(usuario_email)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_pagamentos_preferencia_id
        ON pagamentos(preferencia_id)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_pagamentos_pagamento_id
        ON pagamentos(pagamento_id)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_pagamentos_status
        ON pagamentos(status)
        """
    )

    conexao.commit()
    conexao.close()


def registrar_preferencia_pagamento(
    *,
    usuario_id: int,
    usuario_email: str,
    plano: str,
    valor_centavos: int,
    preferencia_id: str,
    referencia_externa: str,
    modo_teste: bool,
) -> int:
    criar_tabela_pagamentos()

    agora = agora_texto()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO pagamentos (
            usuario_id,
            usuario_email,
            plano,
            valor_centavos,
            moeda,
            preferencia_id,
            referencia_externa,
            status,
            modo_teste,
            data_criacao,
            data_atualizacao,
            processado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            usuario_id,
            usuario_email.strip().lower(),
            plano,
            valor_centavos,
            "BRL",
            preferencia_id,
            referencia_externa,
            "criado",
            int(modo_teste),
            agora,
            agora,
            0,
        ),
    )

    pagamento_local_id = cursor.lastrowid

    conexao.commit()
    conexao.close()

    return int(pagamento_local_id)


def buscar_por_referencia(
    referencia_externa: str,
) -> dict[str, Any] | None:
    criar_tabela_pagamentos()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM pagamentos
        WHERE referencia_externa = ?
        LIMIT 1
        """,
        (referencia_externa,),
    )

    registro = cursor.fetchone()
    conexao.close()

    return dict(registro) if registro else None


def buscar_por_pagamento_id(
    pagamento_id: str,
) -> dict[str, Any] | None:
    criar_tabela_pagamentos()

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM pagamentos
        WHERE pagamento_id = ?
        LIMIT 1
        """,
        (str(pagamento_id),),
    )

    registro = cursor.fetchone()
    conexao.close()

    return dict(registro) if registro else None


def atualizar_pagamento(
    *,
    referencia_externa: str,
    pagamento_id: str,
    status_pagamento: str,
    status_detalhe: str | None,
    meio_pagamento: str | None,
    tipo_pagamento: str | None,
    data_aprovacao: str | None,
    resposta_mercado_pago: str,
) -> bool:
    criar_tabela_pagamentos()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE pagamentos
        SET pagamento_id = ?,
            status = ?,
            status_detalhe = ?,
            meio_pagamento = ?,
            tipo_pagamento = ?,
            data_aprovacao = ?,
            resposta_mercado_pago = ?,
            data_atualizacao = ?
        WHERE referencia_externa = ?
        """,
        (
            str(pagamento_id),
            status_pagamento,
            status_detalhe,
            meio_pagamento,
            tipo_pagamento,
            data_aprovacao,
            resposta_mercado_pago,
            agora_texto(),
            referencia_externa,
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def marcar_como_processado(
    *,
    referencia_externa: str,
) -> bool:
    """
    Só marca quando ainda não foi processado.

    Isso impede que duas notificações iguais liberem
    duas vezes a mesma assinatura.
    """

    criar_tabela_pagamentos()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE pagamentos
        SET processado = 1,
            data_processamento = ?,
            data_atualizacao = ?
        WHERE referencia_externa = ?
          AND processado = 0
        """,
        (
            agora_texto(),
            agora_texto(),
            referencia_externa,
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def desfazer_processamento(
    *,
    referencia_externa: str,
) -> None:
    """
    Usado apenas se a ativação da assinatura falhar
    depois de o pagamento ser marcado.
    """

    criar_tabela_pagamentos()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE pagamentos
        SET processado = 0,
            data_processamento = NULL,
            data_atualizacao = ?
        WHERE referencia_externa = ?
        """,
        (
            agora_texto(),
            referencia_externa,
        ),
    )

    conexao.commit()
    conexao.close()


def listar_pagamentos_usuario(
    *,
    usuario_id: int,
    limite: int = 100,
) -> list[dict[str, Any]]:
    criar_tabela_pagamentos()

    limite_seguro = max(1, min(int(limite), 500))

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT
            id,
            plano,
            valor_centavos,
            moeda,
            preferencia_id,
            referencia_externa,
            pagamento_id,
            status,
            status_detalhe,
            meio_pagamento,
            tipo_pagamento,
            modo_teste,
            data_criacao,
            data_atualizacao,
            data_aprovacao,
            processado,
            data_processamento
        FROM pagamentos
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (
            usuario_id,
            limite_seguro,
        ),
    )

    registros = [
        dict(registro)
        for registro in cursor.fetchall()
    ]

    conexao.close()

    return registros