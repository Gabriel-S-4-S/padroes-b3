import sqlite3
from datetime import datetime
from typing import Any

from banco.sqlite import conectar_banco
from pagamentos.pagamentos_db import criar_tabela_pagamentos


MESES_PT_BR = {
    1: "Jan",
    2: "Fev",
    3: "Mar",
    4: "Abr",
    5: "Mai",
    6: "Jun",
    7: "Jul",
    8: "Ago",
    9: "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
}


def criar_tabelas_necessarias() -> None:
    criar_tabela_pagamentos()


def obter_receitas(
    cursor: sqlite3.Cursor,
) -> dict[str, int]:
    hoje = datetime.now().strftime("%Y-%m-%d")
    mes_atual = datetime.now().strftime("%Y-%m")

    cursor.execute(
        """
        SELECT COALESCE(SUM(valor_centavos), 0)
        FROM pagamentos
        WHERE status = 'approved'
          AND processado = 1
          AND modo_teste = 0
          AND substr(
                COALESCE(
                    data_aprovacao,
                    data_processamento,
                    data_atualizacao
                ),
                1,
                10
              ) = ?
        """,
        (hoje,),
    )

    receita_hoje = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COALESCE(SUM(valor_centavos), 0)
        FROM pagamentos
        WHERE status = 'approved'
          AND processado = 1
          AND modo_teste = 0
          AND substr(
                COALESCE(
                    data_aprovacao,
                    data_processamento,
                    data_atualizacao
                ),
                1,
                7
              ) = ?
        """,
        (mes_atual,),
    )

    receita_mes = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COALESCE(SUM(valor_centavos), 0)
        FROM pagamentos
        WHERE status = 'approved'
          AND processado = 1
          AND modo_teste = 0
        """
    )

    receita_total = int(
        cursor.fetchone()[0] or 0
    )

    return {
        "receita_hoje_centavos": receita_hoje,
        "receita_mes_centavos": receita_mes,
        "receita_total_centavos": receita_total,
    }


def obter_usuarios(
    cursor: sqlite3.Cursor,
) -> dict[str, int]:
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM usuarios
        """
    )

    usuarios_total = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM usuarios
        WHERE LOWER(TRIM(plano)) = 'mensal'
          AND LOWER(TRIM(status)) = 'ativo'
        """
    )

    premium_mensal = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM usuarios
        WHERE LOWER(TRIM(plano)) = 'anual'
          AND LOWER(TRIM(status)) = 'ativo'
        """
    )

    premium_anual = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM usuarios
        WHERE LOWER(TRIM(plano)) = 'gratis'
        """
    )

    gratuitos = int(
        cursor.fetchone()[0] or 0
    )

    return {
        "usuarios_total": usuarios_total,
        "premium_mensal": premium_mensal,
        "premium_anual": premium_anual,
        "gratuitos": gratuitos,
    }


def obter_conversao(
    cursor: sqlite3.Cursor,
) -> dict[str, int | float]:
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM usuarios
        """
    )

    cadastros = int(
        cursor.fetchone()[0] or 0
    )

    cursor.execute(
        """
        SELECT COUNT(DISTINCT usuario_id)
        FROM pagamentos
        WHERE status = 'approved'
          AND processado = 1
          AND modo_teste = 0
        """
    )

    assinaturas = int(
        cursor.fetchone()[0] or 0
    )

    taxa_conversao = 0.0

    if cadastros > 0:
        taxa_conversao = round(
            (assinaturas / cadastros) * 100,
            2,
        )

    return {
        "cadastros": cadastros,
        "assinaturas": assinaturas,
        "taxa_conversao": taxa_conversao,
    }


def obter_receita_mensal(
    cursor: sqlite3.Cursor,
    ano: int,
) -> list[dict[str, Any]]:
    cursor.execute(
        """
        SELECT
            CAST(
                substr(
                    COALESCE(
                        data_aprovacao,
                        data_processamento,
                        data_atualizacao
                    ),
                    6,
                    2
                )
                AS INTEGER
            ) AS mes,
            COALESCE(
                SUM(valor_centavos),
                0
            ) AS valor_centavos
        FROM pagamentos
        WHERE status = 'approved'
          AND processado = 1
          AND modo_teste = 0
          AND substr(
                COALESCE(
                    data_aprovacao,
                    data_processamento,
                    data_atualizacao
                ),
                1,
                4
              ) = ?
        GROUP BY mes
        ORDER BY mes
        """,
        (str(ano),),
    )

    valores_por_mes = {
        int(registro[0]): int(
            registro[1] or 0
        )
        for registro in cursor.fetchall()
    }

    resultado = []

    for numero_mes in range(1, 13):
        resultado.append(
            {
                "mes_numero": numero_mes,
                "mes": MESES_PT_BR[numero_mes],
                "valor_centavos": valores_por_mes.get(
                    numero_mes,
                    0,
                ),
            }
        )

    return resultado


def obter_resumo_financeiro_admin(
    ano: int | None = None,
) -> dict[str, Any]:
    criar_tabelas_necessarias()

    ano_consulta = (
        int(ano)
        if ano is not None
        else datetime.now().year
    )

    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    try:
        receitas = obter_receitas(cursor)
        usuarios = obter_usuarios(cursor)
        conversao = obter_conversao(cursor)

        receita_mensal = obter_receita_mensal(
            cursor=cursor,
            ano=ano_consulta,
        )

        return {
            "ano": ano_consulta,
            **receitas,
            **usuarios,
            **conversao,
            "receita_mensal": receita_mensal,
        }

    finally:
        conexao.close()