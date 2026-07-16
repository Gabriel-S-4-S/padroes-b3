from modelos.evento import Evento


def quedas_consecutivas(ativo):
    candles = ativo.candles

    if len(candles) < 2:
        return None

    quantidade = 0
    inicio = None

    for i in range(len(candles) - 1, 0, -1):
        atual = candles[i]
        anterior = candles[i - 1]

        if atual.close < anterior.close:
            quantidade += 1
            inicio = anterior.timestamp
        else:
            break

    if quantidade == 0:
        return None

    ultimo = candles[-1]

    return Evento(
        tipo="QUEDAS_CONSECUTIVAS",
        acao=ativo.ticker,
        timestamp=ultimo.timestamp,
        descricao=f"{quantidade} queda(s) consecutiva(s)",
        valor=quantidade
    )


def altas_consecutivas(ativo):
    candles = ativo.candles

    if len(candles) < 2:
        return None

    quantidade = 0

    for i in range(len(candles) - 1, 0, -1):
        atual = candles[i]
        anterior = candles[i - 1]

        if atual.close > anterior.close:
            quantidade += 1
        else:
            break

    if quantidade == 0:
        return None

    ultimo = candles[-1]

    return Evento(
        tipo="ALTAS_CONSECUTIVAS",
        acao=ativo.ticker,
        timestamp=ultimo.timestamp,
        descricao=f"{quantidade} alta(s) consecutiva(s)",
        valor=quantidade
    )