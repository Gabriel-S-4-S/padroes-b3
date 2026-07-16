from modelos.evento import Evento
from .estrategia_base import EstrategiaBase


class EstrategiaSequencia(EstrategiaBase):
    def __init__(self, tipo: str, quantidade: int):
        self.tipo = tipo
        self.quantidade = quantidade

        if tipo not in ["alta", "queda"]:
            raise ValueError("Tipo deve ser 'alta' ou 'queda'.")

        self.nome = f"{quantidade} {tipo}(s) consecutiva(s)"

    def _verificar_no_indice(self, candles, indice):
        if indice < self.quantidade:
            return False

        for j in range(self.quantidade):
            atual = candles[indice - j]
            anterior = candles[indice - j - 1]

            if self.tipo == "alta" and atual.close <= anterior.close:
                return False

            if self.tipo == "queda" and atual.close >= anterior.close:
                return False

        return True

    def encontrar_eventos(self, ativo):
        eventos = []
        candles = ativo.candles

        for i in range(self.quantidade, len(candles) - 1):
            if self._verificar_no_indice(candles, i):
                candle = candles[i]

                eventos.append(
                    Evento(
                        tipo=f"SEQUENCIA_{self.tipo.upper()}",
                        acao=ativo.ticker,
                        timestamp=candle.timestamp,
                        descricao=self.nome,
                        valor=self.quantidade
                    )
                )

        return eventos

    def esta_acontecendo_agora(self, ativo):
        candles = ativo.candles

        if not candles:
            return None

        indice = len(candles) - 1

        if self._verificar_no_indice(candles, indice):
            candle = candles[indice]

            return Evento(
                tipo=f"SEQUENCIA_{self.tipo.upper()}",
                acao=ativo.ticker,
                timestamp=candle.timestamp,
                descricao=self.nome,
                valor=self.quantidade
            )

        return None