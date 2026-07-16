from .condicao_base import CondicaoBase


DIAS_SEMANA = {
    0: "segunda-feira",
    1: "terça-feira",
    2: "quarta-feira",
    3: "quinta-feira",
    4: "sexta-feira",
}


class CondicaoDiaSemana(CondicaoBase):
    def __init__(self, dia_semana: int):
        self.dia_semana = dia_semana
        self.nome = f"na {DIAS_SEMANA[dia_semana]}"

    def verificar(self, candles, indice):
        candle = candles[indice]
        return candle.timestamp.weekday() == self.dia_semana