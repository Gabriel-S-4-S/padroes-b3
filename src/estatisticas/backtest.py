from modelos.analise import Analise


def calcular_backtest_estrategia(ativo, estrategia, horizonte_saida=1):
    eventos = estrategia.encontrar_eventos(ativo)
    candles = ativo.candles

    retornos = []
    acertos = 0
    falhas = 0

    horario_compra = None
    horario_venda = None
    ultima_ocorrencia = None

    mapa_indices = {
        candle.timestamp: i
        for i, candle in enumerate(candles)
    }

    for evento in eventos:
        indice = mapa_indices.get(evento.timestamp)

        if indice is None:
            continue

        indice_venda = indice + horizonte_saida

        if indice_venda >= len(candles):
            continue

        candle_compra = candles[indice]
        candle_venda = candles[indice_venda]

        retorno = ((candle_venda.close - candle_compra.close) / candle_compra.close) * 100

        retornos.append(retorno)

        horario_compra = candle_compra.timestamp.strftime("%H:%M:%S")
        horario_venda = candle_venda.timestamp.strftime("%H:%M:%S")
        ultima_ocorrencia = candle_compra.timestamp.strftime("%Y-%m-%d %H:%M:%S")

        if retorno > 0:
            acertos += 1
        else:
            falhas += 1

    ocorrencias = len(retornos)

    if ocorrencias == 0:
        return None

    taxa_acerto = (acertos / ocorrencias) * 100
    retorno_medio = sum(retornos) / ocorrencias

    return Analise(
        acao=ativo.ticker,
        estrategia=estrategia.nome,
        horario=horario_compra or "Não definido",

        horizonte_saida=horizonte_saida,

        horario_compra=horario_compra or "Não definido",
        horario_venda=horario_venda or "Não definido",
        descricao_compra=f"Comprar no fechamento do candle das {horario_compra}",
        descricao_venda=f"Vender no fechamento do candle +{horizonte_saida}, às {horario_venda}",

        ocorrencias=ocorrencias,
        acertos=acertos,
        falhas=falhas,
        taxa_acerto=taxa_acerto,
        retorno_medio=retorno_medio,
        maior_lucro=max(retornos),
        maior_prejuizo=min(retornos),
        ultima_ocorrencia=ultima_ocorrencia or "Não definido",
    )