from .ativo import Ativo
from .candle import Candle

class Mercado:
    def __init__(self):
        self.ativos = {}

    @classmethod
    def a_partir_dataframe(cls, dados):
        mercado = cls()

        for _, linha in dados.iterrows():
            ticker = linha["acao"]

            if ticker not in mercado.ativos:
                mercado.ativos[ticker] = Ativo(ticker)

            candle = Candle(
                acao=ticker,
                timestamp=linha["timestamp"],
                close=float(linha["close"])
            )

            mercado.ativos[ticker].adicionar_candle(candle)

        for ativo in mercado.ativos.values():
            ativo.ordenar_candles()
            ativo.organizar_pregoes()

        return mercado

    def total_ativos(self):
        return len(self.ativos)

    def total_candles(self):
        return sum(ativo.total_candles() for ativo in self.ativos.values())