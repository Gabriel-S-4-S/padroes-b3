from modelos.evento import Evento


class EstrategiaComposta:

    def __init__(self, condicoes):
        self.condicoes = condicoes

        self.nome = " + ".join(
            condicao.nome
            for condicao in condicoes
        )

    def _verificar(self, candles, indice):

        for condicao in self.condicoes:
            if not condicao.verificar(candles, indice):
                return False

        return True

    def encontrar_eventos(self, ativo):

        eventos = []

        candles = ativo.candles

        for indice in range(len(candles)):

            if self._verificar(candles, indice):

                candle = candles[indice]

                eventos.append(
                    Evento(
                        tipo="ESTRATEGIA_COMPOSTA",
                        acao=ativo.ticker,
                        timestamp=candle.timestamp,
                        descricao=self.nome,
                        valor=1
                    )
                )

        return eventos

    def esta_acontecendo_agora(self, ativo):

        candles = ativo.candles

        if not candles:
            return None

        indice = len(candles) - 1

        if self._verificar(candles, indice):

            candle = candles[indice]

            return Evento(
                tipo="ESTRATEGIA_COMPOSTA",
                acao=ativo.ticker,
                timestamp=candle.timestamp,
                descricao=self.nome,
                valor=1
            )

        return None