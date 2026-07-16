from condicoes.condicao_sequencia import CondicaoSequencia
from condicoes.condicao_horario import CondicaoHorario
from condicoes.condicao_dia_semana import CondicaoDiaSemana
from condicoes.condicao_media_movel import CondicaoMediaMovel

from estrategias.estrategia_composta import EstrategiaComposta

from config import HORARIOS_PREGAO


DIAS_SEMANA = [0, 1, 2, 3, 4]

TIPOS = ["alta", "queda"]
QUANTIDADES = [1, 2, 3, 4, 5]

PERIODOS_MEDIA = [9, 20]


def gerar_estrategias_inteligentes():
    estrategias = []

    # 1. Sequência simples
    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            estrategias.append(
                EstrategiaComposta([
                    CondicaoSequencia(tipo, quantidade)
                ])
            )

    # 2. Sequência + horário
    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            for horario in HORARIOS_PREGAO:
                estrategias.append(
                    EstrategiaComposta([
                        CondicaoSequencia(tipo, quantidade),
                        CondicaoHorario(horario)
                    ])
                )

    # 3. Sequência + horário + dia
    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            for horario in HORARIOS_PREGAO:
                for dia in DIAS_SEMANA:
                    estrategias.append(
                        EstrategiaComposta([
                            CondicaoSequencia(tipo, quantidade),
                            CondicaoHorario(horario),
                            CondicaoDiaSemana(dia)
                        ])
                    )

    # 4. Sequência + média móvel
    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            for periodo in PERIODOS_MEDIA:
                for posicao in ["acima", "abaixo"]:
                    estrategias.append(
                        EstrategiaComposta([
                            CondicaoSequencia(tipo, quantidade),
                            CondicaoMediaMovel(periodo, posicao)
                        ])
                    )

    # 5. Sequência + horário + média móvel
    for tipo in TIPOS:
        for quantidade in QUANTIDADES:
            for horario in HORARIOS_PREGAO:
                for periodo in PERIODOS_MEDIA:
                    for posicao in ["acima", "abaixo"]:
                        estrategias.append(
                            EstrategiaComposta([
                                CondicaoSequencia(tipo, quantidade),
                                CondicaoHorario(horario),
                                CondicaoMediaMovel(periodo, posicao)
                            ])
                        )

    return estrategias