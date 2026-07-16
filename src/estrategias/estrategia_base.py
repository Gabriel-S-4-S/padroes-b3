from abc import ABC, abstractmethod


class EstrategiaBase(ABC):
    nome = "Estratégia Base"

    @abstractmethod
    def encontrar_eventos(self, ativo):
        pass

    @abstractmethod
    def esta_acontecendo_agora(self, ativo):
        pass