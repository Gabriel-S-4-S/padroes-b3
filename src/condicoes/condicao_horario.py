from .condicao_base import CondicaoBase


class CondicaoHorario(CondicaoBase):
    def __init__(self, horario: str):
        self.horario = horario
        self.nome = f"às {horario}"

    def verificar(self, candles, indice):
        candle = candles[indice]
        return candle.timestamp.strftime("%H:%M:%S") == self.horario