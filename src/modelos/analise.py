from dataclasses import dataclass


@dataclass(frozen=True)
class Analise:
    acao: str
    estrategia: str
    horario: str

    horizonte_saida: int

    horario_compra: str
    horario_venda: str
    descricao_compra: str
    descricao_venda: str

    ocorrencias: int
    acertos: int
    falhas: int

    taxa_acerto: float
    retorno_medio: float
    maior_lucro: float
    maior_prejuizo: float

    ultima_ocorrencia: str