from .condicao_base import CondicaoBase


class CondicaoMediaMovel(CondicaoBase):
    def __init__(self, periodo: int, posicao: str):
        if posicao not in ["acima", "abaixo"]:
            raise ValueError("posicao deve ser 'acima' ou 'abaixo'.")

        self.periodo = periodo
        self.posicao = posicao
        self.nome = f"preço {posicao} da média de {periodo}"

    def verificar(self, candles, indice):
        if indice < self.periodo:
            return False

        candle_atual = candles[indice]

        candles_media = candles[indice - self.periodo:indice]

        media = sum(c.close for c in candles_media) / self.periodo

        if self.posicao == "acima":
            return candle_atual.close > media

        if self.posicao == "abaixo":
            return candle_atual.close < media

        return False