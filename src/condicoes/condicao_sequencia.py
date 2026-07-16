from .condicao_base import CondicaoBase


class CondicaoSequencia(CondicaoBase):
    def __init__(self, tipo: str, quantidade: int):
        if tipo not in ["alta", "queda"]:
            raise ValueError("Tipo deve ser 'alta' ou 'queda'.")

        self.tipo = tipo
        self.quantidade = quantidade
        self.nome = f"{quantidade} {tipo}(s) consecutiva(s)"

    def verificar(self, candles, indice):
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