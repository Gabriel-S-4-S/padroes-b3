from dataclasses import dataclass


@dataclass(frozen=True)
class Padrao:
    acao: str
    tipo: str
    descricao: str
    valor: int | float | str
    horario: str
    ocorrencias: int
    acertos: int
    falhas: int
    taxa_acerto: float
    retorno_medio: float