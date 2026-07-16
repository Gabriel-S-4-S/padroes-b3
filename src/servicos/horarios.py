from datetime import date, datetime, time, timedelta


HORARIOS_SCANNER = (
    time(10, 35),
    time(11, 35),
    time(12, 35),
    time(13, 35),
    time(14, 35),
    time(15, 35),
    time(16, 35),
    time(17, 35),
)

HORARIO_LABORATORIO = time(2, 0)

DIAS_UTEIS = {
    0,  # segunda-feira
    1,  # terça-feira
    2,  # quarta-feira
    3,  # quinta-feira
    4,  # sexta-feira
}


def agora_local() -> datetime:
    return datetime.now()


def eh_dia_util(
    data_referencia: date | None = None,
) -> bool:
    if data_referencia is None:
        data_referencia = agora_local().date()

    return data_referencia.weekday() in DIAS_UTEIS


def eh_sabado(
    data_referencia: date | None = None,
) -> bool:
    if data_referencia is None:
        data_referencia = agora_local().date()

    return data_referencia.weekday() == 5


def eh_primeiro_sabado_mes(
    data_referencia: date | None = None,
) -> bool:
    if data_referencia is None:
        data_referencia = agora_local().date()

    return (
        data_referencia.weekday() == 5
        and data_referencia.day <= 7
    )


def horario_scanner_correspondente(
    momento: datetime | None = None,
    tolerancia_minutos: int = 10,
) -> time | None:
    """
    Retorna o horário programado quando o momento atual estiver
    dentro da janela normal de execução.

    Exemplo:
    horário programado: 10:35
    tolerância: 10 minutos

    A execução será válida entre 10:35:00 e 10:44:59.
    """

    if momento is None:
        momento = agora_local()

    if not eh_dia_util(momento.date()):
        return None

    for horario_programado in HORARIOS_SCANNER:
        inicio = datetime.combine(
            momento.date(),
            horario_programado,
        )

        fim = inicio + timedelta(
            minutes=tolerancia_minutos
        )

        if inicio <= momento < fim:
            return horario_programado

    return None


def horario_scanner_perdido(
    momento: datetime | None = None,
) -> datetime | None:
    """
    Retorna a execução mais recente do scanner que já deveria
    ter acontecido no dia atual.

    Exemplos:

    Serviço iniciou às 09:00:
    retorna None, pois nenhum horário foi perdido.

    Serviço iniciou às 14:10:
    retorna hoje às 13:35.

    Serviço iniciou às 18:00:
    retorna hoje às 17:35.

    Apenas a execução mais recente é recuperada, porque a
    atualização do Yahoo busca todos os candles que estiverem
    faltando desde o último timestamp salvo.
    """

    if momento is None:
        momento = agora_local()

    if not eh_dia_util(momento.date()):
        return None

    horarios_passados = []

    for horario_programado in HORARIOS_SCANNER:
        candidato = datetime.combine(
            momento.date(),
            horario_programado,
        )

        if candidato < momento:
            horarios_passados.append(candidato)

    if not horarios_passados:
        return None

    return max(horarios_passados)


def deve_executar_scanner(
    momento: datetime | None = None,
    tolerancia_minutos: int = 10,
) -> bool:
    return (
        horario_scanner_correspondente(
            momento=momento,
            tolerancia_minutos=tolerancia_minutos,
        )
        is not None
    )


def deve_executar_laboratorio(
    momento: datetime | None = None,
    tolerancia_minutos: int = 30,
) -> bool:
    """
    O laboratório pode iniciar no primeiro sábado do mês,
    a partir das 02:00, dentro da tolerância configurada.

    Com tolerância de 30 minutos:
    válido entre 02:00:00 e 02:29:59.
    """

    if momento is None:
        momento = agora_local()

    if not eh_primeiro_sabado_mes(
        momento.date()
    ):
        return False

    inicio = datetime.combine(
        momento.date(),
        HORARIO_LABORATORIO,
    )

    fim = inicio + timedelta(
        minutes=tolerancia_minutos
    )

    return inicio <= momento < fim


def horario_programado_laboratorio(
    momento: datetime | None = None,
) -> datetime | None:
    """
    Retorna o horário oficial do laboratório quando hoje for
    o primeiro sábado do mês.
    """

    if momento is None:
        momento = agora_local()

    if not eh_primeiro_sabado_mes(
        momento.date()
    ):
        return None

    return datetime.combine(
        momento.date(),
        HORARIO_LABORATORIO,
    )


def proximo_horario_scanner(
    momento: datetime | None = None,
) -> datetime:
    if momento is None:
        momento = agora_local()

    data_atual = momento.date()

    for deslocamento_dias in range(0, 8):
        data_candidata = (
            data_atual
            + timedelta(days=deslocamento_dias)
        )

        if not eh_dia_util(data_candidata):
            continue

        for horario_programado in HORARIOS_SCANNER:
            candidato = datetime.combine(
                data_candidata,
                horario_programado,
            )

            if candidato > momento:
                return candidato

    raise RuntimeError(
        "Não foi possível calcular o próximo horário do scanner."
    )


def primeiro_sabado_do_mes(
    ano: int,
    mes: int,
) -> date:
    primeiro_dia = date(
        year=ano,
        month=mes,
        day=1,
    )

    dias_ate_sabado = (
        5 - primeiro_dia.weekday()
    ) % 7

    return primeiro_dia + timedelta(
        days=dias_ate_sabado
    )


def proxima_execucao_laboratorio(
    momento: datetime | None = None,
) -> datetime:
    if momento is None:
        momento = agora_local()

    primeiro_sabado_atual = (
        primeiro_sabado_do_mes(
            ano=momento.year,
            mes=momento.month,
        )
    )

    candidato_atual = datetime.combine(
        primeiro_sabado_atual,
        HORARIO_LABORATORIO,
    )

    if candidato_atual > momento:
        return candidato_atual

    if momento.month == 12:
        proximo_ano = momento.year + 1
        proximo_mes = 1
    else:
        proximo_ano = momento.year
        proximo_mes = momento.month + 1

    primeiro_sabado_proximo = (
        primeiro_sabado_do_mes(
            ano=proximo_ano,
            mes=proximo_mes,
        )
    )

    return datetime.combine(
        primeiro_sabado_proximo,
        HORARIO_LABORATORIO,
    )


def formatar_momento(
    momento: datetime,
) -> str:
    return momento.strftime(
        "%d/%m/%Y às %H:%M:%S"
    )