from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Evento:
    tipo: str
    acao: str
    timestamp: datetime
    descricao: str
    valor: float | int | str | None = None