from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Candle:
    acao: str
    timestamp: datetime
    close: float