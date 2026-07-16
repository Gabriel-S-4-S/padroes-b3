from modelos.padrao import Padrao


def analisar_sequencia_atual(ativo, evento):
    if evento is None:
        return None

    candles = ativo.candles
    quantidade = evento.valor
    horario_atual = evento.timestamp.strftime("%H:%M:%S")

    ocorrencias = 0
    acertos = 0
    falhas = 0
    retornos = []

    for i in range(quantidade, len(candles) - 1):
        candle_atual = candles[i]
        proximo = candles[i + 1]

        if candle_atual.timestamp.strftime("%H:%M:%S") != horario_atual:
            continue

        sequencia_ok = True

        for j in range(quantidade):
            atual = candles[i - j]
            anterior = candles[i - j - 1]

            if evento.tipo == "QUEDAS_CONSECUTIVAS":
                if atual.close >= anterior.close:
                    sequencia_ok = False
                    break

            if evento.tipo == "ALTAS_CONSECUTIVAS":
                if atual.close <= anterior.close:
                    sequencia_ok = False
                    break

        if not sequencia_ok:
            continue

        retorno = ((proximo.close - candle_atual.close) / candle_atual.close) * 100

        ocorrencias += 1
        retornos.append(retorno)

        if retorno > 0:
            acertos += 1
        else:
            falhas += 1

    if ocorrencias == 0:
        return None

    taxa_acerto = (acertos / ocorrencias) * 100
    retorno_medio = sum(retornos) / len(retornos)

    return Padrao(
        acao=ativo.ticker,
        tipo=evento.tipo,
        descricao=f"{evento.descricao} às {horario_atual}",
        valor=evento.valor,
        horario=horario_atual,
        ocorrencias=ocorrencias,
        acertos=acertos,
        falhas=falhas,
        taxa_acerto=taxa_acerto,
        retorno_medio=retorno_medio
    )