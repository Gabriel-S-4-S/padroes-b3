from estrategias.sequencias import EstrategiaSequencia
from estrategias.sequencia_horario import EstrategiaSequenciaHorario
from estrategias.sequencia_horario_dia import EstrategiaSequenciaHorarioDia

HORARIOS = [
    "10:30:00",
    "11:30:00",
    "12:30:00",
    "13:30:00",
    "14:30:00",
    "15:30:00",
    "16:30:00",
]


def gerar_estrategias():
    estrategias = []

    for tipo in ["alta", "queda"]:
        for quantidade in [1, 2, 3, 4, 5]:
            estrategias.append(
                EstrategiaSequencia(tipo, quantidade)
            )

    for horario in HORARIOS:
        for tipo in ["alta", "queda"]:
            for quantidade in [1, 2, 3, 4, 5]:
                estrategias.append(
                    EstrategiaSequenciaHorario(tipo, quantidade, horario)
                )

    for horario in HORARIOS:
        for dia_semana in [0, 1, 2, 3, 4]:
            for tipo in ["alta", "queda"]:
                for quantidade in [1, 2, 3, 4, 5]:
                    estrategias.append(
                        EstrategiaSequenciaHorarioDia(
                            tipo,
                            quantidade,
                            horario,
                            dia_semana
                        )
                    )

    return estrategias