from dataclasses import dataclass


@dataclass(frozen=True)
class Estatistica:
    acao: str
    descricao: str
    horario: str

    ocorrencias: int
    acertos: int
    falhas: int

    taxa_acerto: float
    retorno_medio: float
    maior_lucro: float
    maior_prejuizo: float

    def resumo(self):
        return (
            f"{self.acao} | {self.descricao} | "
            f"Acerto: {self.taxa_acerto:.2f}% | "
            f"Ocorrências: {self.ocorrencias} | "
            f"Acertos: {self.acertos} | "
            f"Falhas: {self.falhas} | "
            f"Retorno médio: {self.retorno_medio:.2f}%"
        )