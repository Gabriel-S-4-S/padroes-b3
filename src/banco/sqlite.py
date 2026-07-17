import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

import pandas as pd

from config import CAMINHO_BANCO


FUSO_BRASIL = ZoneInfo(
    "America/Sao_Paulo"
)


def obter_agora_brasil() -> datetime:
    return datetime.now(
        FUSO_BRASIL
    ).replace(
        tzinfo=None
    )


def formatar_datetime_banco(
    valor: datetime,
) -> str:
    return valor.strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def conectar_banco():
    CAMINHO_BANCO.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    conexao = sqlite3.connect(
        CAMINHO_BANCO,
        timeout=10,
    )

    conexao.execute(
        "PRAGMA busy_timeout = 10000"
    )

    return conexao


def coluna_existe(
    cursor,
    tabela: str,
    coluna: str,
) -> bool:
    cursor.execute(
        f"PRAGMA table_info({tabela})"
    )

    colunas = cursor.fetchall()

    return any(
        item[1] == coluna
        for item in colunas
    )


def adicionar_coluna_se_necessario(
    cursor,
    tabela: str,
    coluna: str,
    definicao: str,
) -> None:
    if coluna_existe(
        cursor,
        tabela,
        coluna,
    ):
        return

    cursor.execute(
        f"""
        ALTER TABLE {tabela}
        ADD COLUMN {coluna} {definicao}
        """
    )


def criar_tabelas():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS historico_precos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            close REAL NOT NULL,
            UNIQUE(acao, timestamp)
        )
        """
    )

    cursor.execute(
        """
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
            UNIQUE(
                acao,
                estrategia,
                horizonte_saida
            )
        )
        """
    )

    cursor.execute(
        """
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
            data_geracao TEXT NOT NULL,

            data_compra TEXT,
            data_venda_prevista TEXT,
            timestamp_compra TEXT,
            timestamp_venda_prevista TEXT,

            venda_proximo_pregao INTEGER
                NOT NULL DEFAULT 0,

            pregoes_ate_venda INTEGER
                NOT NULL DEFAULT 0,

            status_oportunidade TEXT
                NOT NULL DEFAULT 'ativa'
        )
        """
    )

    cursor.execute(
        """
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

            data_compra TEXT,
            data_venda_prevista TEXT,
            timestamp_compra TEXT,
            timestamp_venda_prevista TEXT,

            venda_proximo_pregao INTEGER
                NOT NULL DEFAULT 0,

            pregoes_ate_venda INTEGER
                NOT NULL DEFAULT 0,

            status_oportunidade TEXT
                NOT NULL DEFAULT 'ativa',

            UNIQUE(
                acao,
                estrategia,
                horario_compra,
                horario_venda,
                data_geracao
            )
        )
        """
    )

    # Migração automática para bancos já existentes.
    novas_colunas = [
        (
            "data_compra",
            "TEXT",
        ),
        (
            "data_venda_prevista",
            "TEXT",
        ),
        (
            "timestamp_compra",
            "TEXT",
        ),
        (
            "timestamp_venda_prevista",
            "TEXT",
        ),
        (
            "venda_proximo_pregao",
            "INTEGER NOT NULL DEFAULT 0",
        ),
        (
            "pregoes_ate_venda",
            "INTEGER NOT NULL DEFAULT 0",
        ),
        (
            "status_oportunidade",
            "TEXT NOT NULL DEFAULT 'ativa'",
        ),
    ]

    for tabela in (
        "oportunidades_ativas",
        "oportunidades_historico",
    ):
        for coluna, definicao in novas_colunas:
            adicionar_coluna_se_necessario(
                cursor=cursor,
                tabela=tabela,
                coluna=coluna,
                definicao=definicao,
            )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_historico_precos_acao_timestamp
        ON historico_precos(
            acao,
            timestamp
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_estrategias_aprovadas_ranking
        ON estrategias_aprovadas(
            score DESC,
            taxa_acerto DESC,
            retorno_medio DESC
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_oportunidades_ativas_venda
        ON oportunidades_ativas(
            timestamp_venda_prevista
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_oportunidades_ativas_ranking
        ON oportunidades_ativas(
            score DESC,
            taxa_acerto DESC,
            retorno_medio DESC
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_oportunidades_historico_venda
        ON oportunidades_historico(
            timestamp_venda_prevista
        )
        """
    )

    conexao.commit()
    conexao.close()


def obter_valor(
    registro,
    campo: str,
    padrao=None,
):
    try:
        valor = registro.get(
            campo,
            padrao,
        )
    except AttributeError:
        try:
            valor = registro[campo]
        except (
            KeyError,
            TypeError,
            IndexError,
        ):
            return padrao

    if valor is None:
        return padrao

    try:
        if pd.isna(valor):
            return padrao
    except (
        TypeError,
        ValueError,
    ):
        pass

    return valor


def converter_texto(
    valor,
    padrao: str = "",
) -> str:
    if valor is None:
        return padrao

    try:
        if pd.isna(valor):
            return padrao
    except (
        TypeError,
        ValueError,
    ):
        pass

    texto = str(valor).strip()

    return texto or padrao


def converter_inteiro(
    valor,
    padrao: int = 0,
) -> int:
    try:
        if pd.isna(valor):
            return padrao
    except (
        TypeError,
        ValueError,
    ):
        pass

    try:
        return int(float(valor))
    except (
        TypeError,
        ValueError,
    ):
        return padrao


def converter_real(
    valor,
    padrao: float = 0.0,
) -> float:
    try:
        if pd.isna(valor):
            return padrao
    except (
        TypeError,
        ValueError,
    ):
        pass

    try:
        return float(valor)
    except (
        TypeError,
        ValueError,
    ):
        texto = str(valor).strip()

        texto = texto.replace(
            "%",
            "",
        )

        texto = texto.replace(
            ",",
            ".",
        )

        try:
            return float(texto)
        except ValueError:
            return padrao


def converter_booleano_inteiro(
    valor,
) -> int:
    if isinstance(valor, bool):
        return int(valor)

    if isinstance(
        valor,
        (int, float),
    ):
        return int(bool(valor))

    texto = str(valor).strip().lower()

    return int(
        texto in {
            "1",
            "true",
            "sim",
            "yes",
        }
    )


def salvar_historico(
    dados,
):
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    registros = []

    for _, linha in dados.iterrows():
        registros.append(
            (
                linha["acao"],
                str(linha["timestamp"]),
                float(linha["close"]),
            )
        )

    cursor.executemany(
        """
        INSERT OR IGNORE INTO historico_precos (
            acao,
            timestamp,
            close
        )
        VALUES (?, ?, ?)
        """,
        registros,
    )

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_registros():
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM historico_precos
        """
    )

    total = cursor.fetchone()[0]

    conexao.close()

    return total


def obter_ultimo_timestamp(
    acao,
):
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT MAX(timestamp)
        FROM historico_precos
        WHERE acao = ?
        """,
        (acao,),
    )

    resultado = cursor.fetchone()[0]

    conexao.close()

    return resultado


def carregar_historico():
    criar_tabelas()

    conexao = conectar_banco()

    query = """
        SELECT
            acao,
            timestamp,
            close
        FROM historico_precos
        ORDER BY
            acao,
            timestamp
    """

    dados = pd.read_sql_query(
        query,
        conexao,
    )

    conexao.close()

    if dados.empty:
        return dados

    dados["timestamp"] = pd.to_datetime(
        dados["timestamp"],
        errors="coerce",
    )

    dados["close"] = pd.to_numeric(
        dados["close"],
        errors="coerce",
    )

    dados = dados.dropna(
        subset=[
            "acao",
            "timestamp",
            "close",
        ]
    )

    return dados


def limpar_estrategias_aprovadas():
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        DELETE FROM estrategias_aprovadas
        """
    )

    conexao.commit()
    conexao.close()


def salvar_estrategias_aprovadas(
    avaliacoes,
):
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    registros = []

    data_criacao = formatar_datetime_banco(
        obter_agora_brasil()
    )

    for avaliacao in avaliacoes:
        analise = avaliacao.analise

        registros.append(
            (
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
            )
        )

    if registros:
        cursor.executemany(
            """
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
            VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?
            )
            """,
            registros,
        )

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_estrategias_aprovadas():
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM estrategias_aprovadas
        """
    )

    total = cursor.fetchone()[0]

    conexao.close()

    return total


def carregar_estrategias_aprovadas():
    criar_tabelas()

    conexao = conectar_banco()

    query = """
        SELECT *
        FROM estrategias_aprovadas
        ORDER BY
            score DESC,
            taxa_acerto DESC,
            retorno_medio DESC,
            ocorrencias DESC
    """

    dados = pd.read_sql_query(
        query,
        conexao,
    )

    conexao.close()

    return dados


def corrigir_timestamps_meia_hora():
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE historico_precos
        SET timestamp = datetime(
            timestamp,
            '+30 minutes'
        )
        WHERE strftime(
            '%M:%S',
            timestamp
        ) = '00:00'
        """
    )

    conexao.commit()
    conexao.close()


def limpar_oportunidades_ativas():
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        DELETE FROM oportunidades_ativas
        """
    )

    conexao.commit()
    conexao.close()


def remover_oportunidades_ativas_expiradas():
    """
    Remove oportunidades cuja data e hora previstas
    de venda já passaram.

    Isso permite que a oportunidade desapareça do painel
    mesmo antes da próxima execução completa do scanner.
    """

    criar_tabelas()

    agora_texto = formatar_datetime_banco(
        obter_agora_brasil()
    )

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        DELETE FROM oportunidades_ativas
        WHERE
            timestamp_venda_prevista IS NOT NULL
            AND TRIM(
                timestamp_venda_prevista
            ) <> ''
            AND datetime(
                timestamp_venda_prevista
            ) < datetime(?)
        """,
        (agora_texto,),
    )

    removidas = cursor.rowcount

    conexao.commit()
    conexao.close()

    return removidas


def atualizar_historico_expirado():
    """
    Mantém o histórico, mas altera seu status quando
    o horário previsto da venda já passou.
    """

    criar_tabelas()

    agora_texto = formatar_datetime_banco(
        obter_agora_brasil()
    )

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE oportunidades_historico
        SET status_oportunidade = 'expirada'
        WHERE
            status_oportunidade = 'ativa'
            AND timestamp_venda_prevista IS NOT NULL
            AND TRIM(
                timestamp_venda_prevista
            ) <> ''
            AND datetime(
                timestamp_venda_prevista
            ) < datetime(?)
        """,
        (agora_texto,),
    )

    atualizadas = cursor.rowcount

    conexao.commit()
    conexao.close()

    return atualizadas


def preparar_registro_oportunidade(
    oportunidade,
    data_geracao: str,
    incluir_tipo_acesso: bool,
):
    acao = converter_texto(
        obter_valor(
            oportunidade,
            "acao",
        )
    )

    estrategia = converter_texto(
        obter_valor(
            oportunidade,
            "estrategia",
        )
    )

    horario_compra = converter_texto(
        obter_valor(
            oportunidade,
            "horario_compra",
        ),
        "Não informado",
    )

    horario_venda = converter_texto(
        obter_valor(
            oportunidade,
            "horario_venda",
        ),
        "Não informado",
    )

    horizonte_saida = converter_inteiro(
        obter_valor(
            oportunidade,
            "horizonte_saida",
        )
    )

    taxa_acerto = converter_real(
        obter_valor(
            oportunidade,
            "taxa_acerto",
        )
    )

    ocorrencias = converter_inteiro(
        obter_valor(
            oportunidade,
            "ocorrencias",
        )
    )

    acertos = converter_inteiro(
        obter_valor(
            oportunidade,
            "acertos",
        )
    )

    falhas = converter_inteiro(
        obter_valor(
            oportunidade,
            "falhas",
        )
    )

    retorno_medio = converter_real(
        obter_valor(
            oportunidade,
            "retorno_medio",
        )
    )

    score = converter_real(
        obter_valor(
            oportunidade,
            "score",
        )
    )

    data_compra = converter_texto(
        obter_valor(
            oportunidade,
            "data_compra",
        )
    ) or None

    data_venda_prevista = converter_texto(
        obter_valor(
            oportunidade,
            "data_venda_prevista",
        )
    ) or None

    timestamp_compra = converter_texto(
        obter_valor(
            oportunidade,
            "timestamp_compra",
        )
    ) or None

    timestamp_venda_prevista = (
        converter_texto(
            obter_valor(
                oportunidade,
                "timestamp_venda_prevista",
            )
        )
        or None
    )

    venda_proximo_pregao = (
        converter_booleano_inteiro(
            obter_valor(
                oportunidade,
                "venda_proximo_pregao",
                False,
            )
        )
    )

    pregoes_ate_venda = converter_inteiro(
        obter_valor(
            oportunidade,
            "pregoes_ate_venda",
            0,
        )
    )

    status_oportunidade = converter_texto(
        obter_valor(
            oportunidade,
            "status_oportunidade",
            "ativa",
        ),
        "ativa",
    )

    if incluir_tipo_acesso:
        tipo_acesso = converter_texto(
            obter_valor(
                oportunidade,
                "tipo_acesso",
                "premium",
            ),
            "premium",
        )

        return (
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
            data_geracao,
            data_compra,
            data_venda_prevista,
            timestamp_compra,
            timestamp_venda_prevista,
            venda_proximo_pregao,
            pregoes_ate_venda,
            status_oportunidade,
        )

    return (
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
        data_geracao,
        data_compra,
        data_venda_prevista,
        timestamp_compra,
        timestamp_venda_prevista,
        venda_proximo_pregao,
        pregoes_ate_venda,
        status_oportunidade,
    )


def salvar_oportunidades_ativas(
    oportunidades,
):
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    data_geracao = formatar_datetime_banco(
        obter_agora_brasil()
    )

    registros = [
        preparar_registro_oportunidade(
            oportunidade=oportunidade,
            data_geracao=data_geracao,
            incluir_tipo_acesso=True,
        )
        for oportunidade in oportunidades
    ]

    if registros:
        cursor.executemany(
            """
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
                data_geracao,
                data_compra,
                data_venda_prevista,
                timestamp_compra,
                timestamp_venda_prevista,
                venda_proximo_pregao,
                pregoes_ate_venda,
                status_oportunidade
            )
            VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?
            )
            """,
            registros,
        )

    conexao.commit()
    conexao.close()

    return len(registros)


def carregar_oportunidades_ativas():
    remover_oportunidades_ativas_expiradas()
    atualizar_historico_expirado()

    conexao = conectar_banco()

    query = """
        SELECT *
        FROM oportunidades_ativas
        WHERE status_oportunidade = 'ativa'
        ORDER BY
            score DESC,
            taxa_acerto DESC,
            retorno_medio DESC,
            ocorrencias DESC
    """

    dados = pd.read_sql_query(
        query,
        conexao,
    )

    conexao.close()

    if not dados.empty:
        dados["venda_proximo_pregao"] = (
            dados[
                "venda_proximo_pregao"
            ].astype(bool)
        )

    return dados


def carregar_oportunidades_premium():
    dados = carregar_oportunidades_ativas()

    if dados.empty:
        return []

    return dados.to_dict(
        orient="records"
    )


def carregar_oportunidade_gratis():
    dados = carregar_oportunidades_ativas()

    if dados.empty:
        return None

    dados = dados.sort_values(
        by=[
            "score",
            "taxa_acerto",
            "retorno_medio",
        ],
        ascending=[
            True,
            True,
            True,
        ],
    )

    oportunidade = dados.iloc[0]

    return oportunidade.to_dict()


def contar_oportunidades_ativas():
    remover_oportunidades_ativas_expiradas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM oportunidades_ativas
        WHERE status_oportunidade = 'ativa'
        """
    )

    total = cursor.fetchone()[0]

    conexao.close()

    return total


def salvar_oportunidades_historico(
    oportunidades,
):
    criar_tabelas()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    data_geracao = formatar_datetime_banco(
        obter_agora_brasil()
    )

    registros = [
        preparar_registro_oportunidade(
            oportunidade=oportunidade,
            data_geracao=data_geracao,
            incluir_tipo_acesso=False,
        )
        for oportunidade in oportunidades
    ]

    if registros:
        cursor.executemany(
            """
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
                data_geracao,
                data_compra,
                data_venda_prevista,
                timestamp_compra,
                timestamp_venda_prevista,
                venda_proximo_pregao,
                pregoes_ate_venda,
                status_oportunidade
            )
            VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?
            )
            """,
            registros,
        )

    conexao.commit()
    conexao.close()

    return len(registros)


def contar_oportunidades_historico():
    criar_tabelas()
    atualizar_historico_expirado()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM oportunidades_historico
        """
    )

    total = cursor.fetchone()[0]

    conexao.close()

    return total