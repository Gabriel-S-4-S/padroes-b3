from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from banco.sqlite import carregar_estrategias_aprovadas
from laboratorio.gerador_inteligente import (
    gerar_estrategias_inteligentes,
)

FUSO_BRASIL = ZoneInfo("America/Sao_Paulo")


def executar_scanner(
    mercado,
    diagnostico: bool = False,
):
    """
    Retorna somente a melhor oportunidade válida
    encontrada pelo scanner.
    """

    oportunidades = executar_scanner_todas(
        mercado=mercado,
        diagnostico=diagnostico,
    )

    if not oportunidades:
        return None

    return oportunidades[0]


def executar_scanner_todas(
    mercado,
    diagnostico: bool = False,
):
    """
    Executa todas as estratégias aprovadas e retorna:

    - somente oportunidades ainda válidas;
    - somente a melhor estratégia de cada ação;
    - oportunidades ordenadas por qualidade estatística;
    - data e horário previstos para a venda;
    - identificação de venda em pregão posterior.
    """

    aprovadas = carregar_estrategias_aprovadas()

    if aprovadas.empty:
        if diagnostico:
            print(
                "Estratégias aprovadas no banco: 0"
            )

        return []

    estrategias = gerar_estrategias_inteligentes()

    estrategias_por_nome = {
        estrategia.nome: estrategia
        for estrategia in estrategias
    }

    agora = obter_agora_brasil()

    oportunidades_encontradas = []

    estrategias_testadas = 0
    vencidas_descartadas = 0
    sem_saida_calculada = 0

    if diagnostico:
        print()
        print("=" * 70)
        print("DIAGNÓSTICO DO SCANNER")
        print("=" * 70)

        print(
            "Estratégias aprovadas:",
            len(aprovadas),
        )

        print(
            "Horário atual:",
            agora.strftime(
                "%d/%m/%Y %H:%M:%S"
            ),
        )

    for _, linha_original in aprovadas.iterrows():
        acao = str(
            linha_original.get(
                "acao",
                "",
            )
        ).strip()

        nome_estrategia = str(
            linha_original.get(
                "estrategia",
                "",
            )
        ).strip()

        if not acao or not nome_estrategia:
            continue

        ativo = mercado.ativos.get(acao)

        if ativo is None:
            if diagnostico:
                print()
                print("AÇÃO:", acao)
                print(
                    "STATUS: ativo não encontrado "
                    "no mercado"
                )

            continue

        estrategia = estrategias_por_nome.get(
            nome_estrategia
        )

        if estrategia is None:
            if diagnostico:
                print()
                print("AÇÃO:", acao)
                print(
                    "ESTRATÉGIA:",
                    nome_estrategia,
                )
                print(
                    "STATUS: estratégia não encontrada"
                )

            continue

        estrategias_testadas += 1

        evento = estrategia.esta_acontecendo_agora(
            ativo
        )

        if diagnostico:
            print()
            print("AÇÃO:", acao)
            print(
                "ESTRATÉGIA:",
                nome_estrategia,
            )

            ultimo_candle = ativo.ultimo_candle()

            print(
                "ÚLTIMO CANDLE:",
                (
                    ultimo_candle.timestamp
                    if ultimo_candle
                    else "Sem candle"
                ),
            )

        if evento is None:
            if diagnostico:
                print(
                    "STATUS: não está ativa"
                )

            continue

        horizonte_saida = converter_inteiro(
            linha_original.get(
                "horizonte_saida",
                0,
            )
        )

        if horizonte_saida <= 0:
            if diagnostico:
                print(
                    "STATUS: horizonte de saída "
                    "inválido"
                )

            continue

        timestamp_compra = normalizar_datetime(
            evento.timestamp
        )

        timestamp_venda = calcular_timestamp_venda(
            ativo=ativo,
            timestamp_compra=timestamp_compra,
            horizonte_saida=horizonte_saida,
        )

        if timestamp_venda is None:
            sem_saida_calculada += 1

            if diagnostico:
                print(
                    "STATUS: não foi possível "
                    "calcular a saída"
                )

            continue

        oportunidade_vencida = (
            agora > timestamp_venda
        )

        if oportunidade_vencida:
            vencidas_descartadas += 1

            if diagnostico:
                print(
                    "STATUS: DESCARTADA"
                )
                print(
                    "MOTIVO: horário de venda "
                    "já passou"
                )
                print(
                    "VENDA PREVISTA:",
                    timestamp_venda.strftime(
                        "%d/%m/%Y %H:%M:%S"
                    ),
                )

            continue

        pregoes_ate_venda = calcular_pregoes_ate_venda(
            data_compra=timestamp_compra.date(),
            data_venda=timestamp_venda.date(),
        )

        venda_proximo_pregao = (
            timestamp_venda.date()
            > timestamp_compra.date()
        )

        linha = linha_original.copy()

        linha["horario_compra"] = (
            timestamp_compra.strftime(
                "%H:%M:%S"
            )
        )

        linha["horario_venda"] = (
            timestamp_venda.strftime(
                "%H:%M:%S"
            )
        )

        linha["data_compra"] = (
            timestamp_compra.strftime(
                "%Y-%m-%d"
            )
        )

        linha["data_venda_prevista"] = (
            timestamp_venda.strftime(
                "%Y-%m-%d"
            )
        )

        linha["timestamp_compra"] = (
            timestamp_compra.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        linha["timestamp_venda_prevista"] = (
            timestamp_venda.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        linha["venda_proximo_pregao"] = (
            venda_proximo_pregao
        )

        linha["pregoes_ate_venda"] = (
            pregoes_ate_venda
        )

        linha["status_oportunidade"] = "ativa"

        oportunidades_encontradas.append(
            linha
        )

        if diagnostico:
            print("STATUS: ATIVA")

            print(
                "COMPRA:",
                timestamp_compra.strftime(
                    "%d/%m/%Y %H:%M:%S"
                ),
            )

            print(
                "VENDA:",
                formatar_descricao_venda(
                    timestamp_compra,
                    timestamp_venda,
                    pregoes_ate_venda,
                ),
            )

            print(
                "HORIZONTE:",
                horizonte_saida,
                "candle(s)",
            )

    oportunidades_unicas = (
        selecionar_melhor_por_acao(
            oportunidades_encontradas
        )
    )

    oportunidades_ordenadas = sorted(
        oportunidades_unicas,
        key=chave_ordenacao,
        reverse=True,
    )

    if diagnostico:
        repetidas_removidas = (
            len(oportunidades_encontradas)
            - len(oportunidades_unicas)
        )

        print()
        print("=" * 70)
        print("RESULTADO FINAL DO SCANNER")
        print("=" * 70)

        print(
            "Estratégias testadas:",
            estrategias_testadas,
        )

        print(
            "Oportunidades encontradas:",
            len(oportunidades_encontradas),
        )

        print(
            "Oportunidades vencidas removidas:",
            vencidas_descartadas,
        )

        print(
            "Saídas que não puderam ser calculadas:",
            sem_saida_calculada,
        )

        print(
            "Oportunidades repetidas removidas:",
            repetidas_removidas,
        )

        print(
            "Ações únicas com oportunidade:",
            len(oportunidades_ordenadas),
        )

        if oportunidades_ordenadas:
            print()
            print("RANKING FINAL")

            for indice, oportunidade in enumerate(
                oportunidades_ordenadas,
                start=1,
            ):
                print()
                print(
                    f"{indice}º",
                    oportunidade.get("acao"),
                )

                print(
                    "ESTRATÉGIA:",
                    oportunidade.get(
                        "estrategia"
                    ),
                )

                print(
                    "SCORE:",
                    oportunidade.get("score"),
                )

                print(
                    "VENDA:",
                    oportunidade.get(
                        "timestamp_venda_prevista"
                    ),
                )

    return oportunidades_ordenadas


def calcular_timestamp_venda(
    ativo,
    timestamp_compra: datetime,
    horizonte_saida: int,
) -> datetime | None:
    """
    Calcula o candle real de venda.

    Primeiro utiliza candles já existentes no histórico.
    Quando a saída ultrapassa o último candle disponível,
    projeta os próximos candles com base na grade de
    horários observada no próprio ativo.
    """

    if horizonte_saida <= 0:
        return None

    candles = ativo.candles

    if not candles:
        return None

    indice_compra = localizar_indice_candle(
        candles=candles,
        timestamp=timestamp_compra,
    )

    if indice_compra is None:
        return None

    indice_venda = (
        indice_compra
        + horizonte_saida
    )

    if indice_venda < len(candles):
        return normalizar_datetime(
            candles[indice_venda].timestamp
        )

    quantidade_futura = (
        indice_venda
        - (len(candles) - 1)
    )

    ultimo_timestamp = normalizar_datetime(
        candles[-1].timestamp
    )

    horarios_pregao = obter_grade_horarios(
        ativo
    )

    if not horarios_pregao:
        return None

    return projetar_candles_futuros(
        timestamp_inicial=ultimo_timestamp,
        quantidade_candles=quantidade_futura,
        horarios_pregao=horarios_pregao,
    )


def localizar_indice_candle(
    candles,
    timestamp: datetime,
) -> int | None:
    for indice in range(
        len(candles) - 1,
        -1,
        -1,
    ):
        timestamp_candle = normalizar_datetime(
            candles[indice].timestamp
        )

        if timestamp_candle == timestamp:
            return indice

    return None


def obter_grade_horarios(
    ativo,
) -> list[time]:
    """
    Obtém a grade normal de horários observada no ativo.

    Dá preferência aos pregões mais recentes e completos.
    Isso evita fixar manualmente horários do mercado.
    """

    grades = []

    datas_ordenadas = sorted(
        ativo.pregoes.keys(),
        reverse=True,
    )

    for data_pregao in datas_ordenadas[:30]:
        pregao = ativo.pregoes[data_pregao]

        horarios = [
            normalizar_datetime(
                candle.timestamp
            ).time()
            for candle in pregao.candles
        ]

        horarios = remover_horarios_repetidos(
            horarios
        )

        if horarios:
            grades.append(horarios)

    if not grades:
        horarios = [
            normalizar_datetime(
                candle.timestamp
            ).time()
            for candle in ativo.candles
        ]

        return remover_horarios_repetidos(
            horarios
        )

    maior_quantidade = max(
        len(grade)
        for grade in grades
    )

    grades_completas = [
        grade
        for grade in grades
        if len(grade) == maior_quantidade
    ]

    return grades_completas[0]


def remover_horarios_repetidos(
    horarios,
) -> list[time]:
    unicos = sorted(
        {
            horario.replace(
                tzinfo=None
            )
            for horario in horarios
        }
    )

    return unicos


def projetar_candles_futuros(
    timestamp_inicial: datetime,
    quantidade_candles: int,
    horarios_pregao: list[time],
) -> datetime | None:
    """
    Avança pela grade de candles.

    Quando termina o pregão atual, passa para o próximo
    dia útil. Finais de semana são ignorados.

    Posteriormente, no deploy, poderemos integrar um
    calendário oficial para também ignorar feriados da B3.
    """

    if (
        quantidade_candles <= 0
        or not horarios_pregao
    ):
        return timestamp_inicial

    timestamp_atual = timestamp_inicial

    for _ in range(quantidade_candles):
        proximo_horario = obter_proximo_horario(
            horario_atual=timestamp_atual.time(),
            horarios_pregao=horarios_pregao,
        )

        if proximo_horario is not None:
            timestamp_atual = datetime.combine(
                timestamp_atual.date(),
                proximo_horario,
            )

            continue

        proxima_data = proximo_dia_util(
            timestamp_atual.date()
        )

        timestamp_atual = datetime.combine(
            proxima_data,
            horarios_pregao[0],
        )

    return timestamp_atual


def obter_proximo_horario(
    horario_atual: time,
    horarios_pregao: list[time],
) -> time | None:
    horario_sem_fuso = horario_atual.replace(
        tzinfo=None
    )

    for horario in horarios_pregao:
        if horario > horario_sem_fuso:
            return horario

    return None


def proximo_dia_util(
    data_atual: date,
) -> date:
    proxima_data = (
        data_atual
        + timedelta(days=1)
    )

    while proxima_data.weekday() >= 5:
        proxima_data += timedelta(days=1)

    return proxima_data


def calcular_pregoes_ate_venda(
    data_compra: date,
    data_venda: date,
) -> int:
    if data_venda <= data_compra:
        return 0

    quantidade = 0
    data_atual = data_compra

    while data_atual < data_venda:
        data_atual = proximo_dia_util(
            data_atual
        )

        quantidade += 1

    return quantidade


def selecionar_melhor_por_acao(
    oportunidades,
):
    """
    Mantém somente uma oportunidade para cada ação.

    Critérios:
    1. score;
    2. taxa de acerto;
    3. retorno médio;
    4. ocorrências;
    5. menor horizonte de saída.
    """

    melhores_por_acao = {}

    for oportunidade in oportunidades:
        acao = str(
            oportunidade.get(
                "acao",
                "",
            )
        ).strip()

        if not acao:
            continue

        melhor_atual = melhores_por_acao.get(
            acao
        )

        if melhor_atual is None:
            melhores_por_acao[acao] = (
                oportunidade
            )

            continue

        if chave_ordenacao(
            oportunidade
        ) > chave_ordenacao(
            melhor_atual
        ):
            melhores_por_acao[acao] = (
                oportunidade
            )

    return list(
        melhores_por_acao.values()
    )


def chave_ordenacao(
    oportunidade,
):
    horizonte_saida = converter_numero(
        oportunidade.get(
            "horizonte_saida",
            0,
        )
    )

    return (
        converter_numero(
            oportunidade.get("score")
        ),
        converter_numero(
            oportunidade.get(
                "taxa_acerto"
            )
        ),
        converter_numero(
            oportunidade.get(
                "retorno_medio"
            )
        ),
        converter_numero(
            oportunidade.get(
                "ocorrencias"
            )
        ),
        -horizonte_saida,
    )


def formatar_descricao_venda(
    timestamp_compra: datetime,
    timestamp_venda: datetime,
    pregoes_ate_venda: int,
) -> str:
    horario = timestamp_venda.strftime(
        "%H:%M:%S"
    )

    if (
        timestamp_venda.date()
        == timestamp_compra.date()
    ):
        return horario

    if pregoes_ate_venda == 1:
        return (
            f"próximo dia às {horario}"
        )

    return (
        f"{pregoes_ate_venda} dias depois, "
        f"às {horario}"
    )


def obter_agora_brasil() -> datetime:
    """
    Retorna o horário atual de São Paulo sem timezone,
    compatível com os timestamps atuais do projeto.
    """

    return datetime.now(
        FUSO_BRASIL
    ).replace(
        tzinfo=None
    )


def normalizar_datetime(
    valor,
) -> datetime:
    if isinstance(valor, datetime):
        return valor.replace(
            tzinfo=None
        )

    if hasattr(valor, "to_pydatetime"):
        resultado = valor.to_pydatetime()

        return resultado.replace(
            tzinfo=None
        )

    return datetime.fromisoformat(
        str(valor)
    ).replace(
        tzinfo=None
    )


def converter_numero(
    valor,
) -> float:
    if valor is None:
        return 0.0

    try:
        numero = float(valor)

        if numero != numero:
            return 0.0

        return numero

    except (TypeError, ValueError):
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
            return 0.0


def converter_inteiro(
    valor,
) -> int:
    try:
        return int(
            converter_numero(valor)
        )
    except (TypeError, ValueError):
        return 0