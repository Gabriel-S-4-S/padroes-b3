from modelos.avaliacao import Avaliacao

from config import (
    TAXA_MINIMA,
    OCORRENCIAS_MINIMAS,
    RETORNO_MINIMO,
)


def avaliar_analise(analise):
    motivos = []
    score = 0

    if analise.taxa_acerto >= TAXA_MINIMA:
        score += 40
        motivos.append("Taxa de acerto acima do mínimo.")
    else:
        motivos.append("Taxa de acerto abaixo do mínimo.")

    if analise.ocorrencias >= OCORRENCIAS_MINIMAS:
        score += 30
        motivos.append("Boa quantidade de ocorrências.")
    else:
        motivos.append("Poucas ocorrências históricas.")

    if analise.retorno_medio >= RETORNO_MINIMO:
        score += 30
        motivos.append("Retorno médio positivo e relevante.")
    else:
        motivos.append("Retorno médio abaixo do mínimo.")

    aprovado = (
        analise.taxa_acerto >= TAXA_MINIMA
        and analise.ocorrencias >= OCORRENCIAS_MINIMAS
        and analise.retorno_medio >= RETORNO_MINIMO
    )

    return Avaliacao(
        analise=analise,
        aprovado=aprovado,
        score=score,
        motivos=motivos,
    )


def escolher_melhor_avaliacao(avaliacoes):
    aprovadas = [a for a in avaliacoes if a.aprovado]

    if not aprovadas:
        return None

    return max(
        aprovadas,
        key=lambda a: (
            a.score,
            a.analise.taxa_acerto,
            a.analise.retorno_medio,
            a.analise.ocorrencias,
        ),
    )