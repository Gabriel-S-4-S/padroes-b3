from .pregao import Pregao


class Ativo:
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.candles = []
        self.pregoes = {}

    def adicionar_candle(self, candle):
        self.candles.append(candle)

    def ordenar_candles(self):
        self.candles.sort(key=lambda candle: candle.timestamp)

    def organizar_pregoes(self):
        self.pregoes = {}

        for candle in self.candles:
            data = candle.timestamp.date()

            if data not in self.pregoes:
                self.pregoes[data] = Pregao(data)

            self.pregoes[data].adicionar_candle(candle)

        for pregao in self.pregoes.values():
            pregao.ordenar_candles()

    def total_candles(self):
        return len(self.candles)

    def total_pregoes(self):
        return len(self.pregoes)

    def primeiro_candle(self):
        return self.candles[0] if self.candles else None

    def ultimo_candle(self):
        return self.candles[-1] if self.candles else None