from modelos.evento import Evento
from .estrategia_base import EstrategiaBase


DIAS_SEMANA = {
    0: "segunda-feira",
    1: "terça-feira",
    2: "quarta-feira",
    3: "quinta-feira",
    4: "sexta-feira",
}


class EstrategiaSequenciaHorarioDia(EstrategiaBase):
    def __init__(self, tipo: str, quantidade: int, horario: str, dia_semana: int):
        self.tipo = tipo
        self.quantidade = quantidade
        self.horario = horario
        self.dia_semana = dia_semana

        if tipo not in ["alta", "queda"]:
            raise ValueError("Tipo deve ser 'alta' ou 'queda'.")

        self.nome = (
            f"{quantidade} {tipo}(s) consecutiva(s) "
            f"às {horario} na {DIAS_SEMANA[dia_semana]}"
        )

    def _verificar_no_indice(self, candles, indice):
        if indice < self.quantidade:
            return False

        candle = candles[indice]

        if candle.timestamp.strftime("%H:%M:%S") != self.horario:
            return False

        if candle.timestamp.weekday() != self.dia_semana:
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
                        tipo=f"SEQUENCIA_{self.tipo.upper()}_HORARIO_DIA",
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
                tipo=f"SEQUENCIA_{self.tipo.upper()}_HORARIO_DIA",
                acao=ativo.ticker,
                timestamp=candle.timestamp,
                descricao=self.nome,
                valor=self.quantidade
            )

        return None