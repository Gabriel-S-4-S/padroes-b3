from datetime import date


class Pregao:
    def __init__(self, data: date):
        self.data = data
        self.candles = []

    def adicionar_candle(self, candle):
        self.candles.append(candle)

    def ordenar_candles(self):
        self.candles.sort(key=lambda candle: candle.timestamp)

    def total_candles(self):
        return len(self.candles)

    def primeiro_candle(self):
        return self.candles[0] if self.candles else None

    def ultimo_candle(self):
        return self.candles[-1] if self.candles else None

    def preco_abertura(self):
        primeiro = self.primeiro_candle()
        return primeiro.close if primeiro else None

    def preco_fechamento(self):
        ultimo = self.ultimo_candle()
        return ultimo.close if ultimo else None

    def variacao_percentual(self):
        abertura = self.preco_abertura()
        fechamento = self.preco_fechamento()

        if abertura is None or fechamento is None or abertura == 0:
            return None

        return ((fechamento - abertura) / abertura) * 100