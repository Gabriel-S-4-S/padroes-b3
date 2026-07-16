from dataclasses import dataclass
from modelos.analise import Analise


@dataclass(frozen=True)
class Avaliacao:
    analise: Analise
    aprovado: bool
    score: float
    motivos: list[str]