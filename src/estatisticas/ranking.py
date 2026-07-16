def escolher_melhor_estatistica(estatisticas):
    estatisticas_validas = [
        e for e in estatisticas
        if e is not None
        and e.ocorrencias >= 20
        and e.taxa_acerto > 50
        and e.retorno_medio > 0
    ]

    if not estatisticas_validas:
        return None

    return max(
        estatisticas_validas,
        key=lambda e: (e.taxa_acerto, e.retorno_medio, e.ocorrencias)
    )