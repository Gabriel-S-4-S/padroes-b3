from abc import ABC, abstractmethod


class CondicaoBase(ABC):
    nome = "Condição Base"

    @abstractmethod
    def verificar(self, candles, indice):
        pass