from laboratorio.gerador_inteligente import gerar_estrategias_inteligentes
from banco.sqlite import carregar_estrategias_aprovadas


def executar_scanner(mercado, diagnostico=False):
    aprovadas = carregar_estrategias_aprovadas()

    if aprovadas.empty:
        if diagnostico:
            print("Estratégias aprovadas no banco: 0")
        return None

    estrategias = gerar_estrategias_inteligentes()

    oportunidades = []
    testadas = 0

    if diagnostico:
        print()
        print("=" * 50)
        print("DIAGNÓSTICO DO SCANNER")
        print("=" * 50)
        print("Estratégias aprovadas no banco:", len(aprovadas))

    for _, linha in aprovadas.iterrows():
        acao = linha["acao"]
        nome_estrategia = linha["estrategia"]

        ativo = mercado.ativos.get(acao)

        if ativo is None:
            continue

        if diagnostico:
            ultimo = ativo.ultimo_candle()
            print()
            print("Ação:", acao)
            print("Último candle:", ultimo.timestamp if ultimo else "Sem candle")
            print("Estratégia aprovada:", nome_estrategia)

        for estrategia in estrategias:
            if estrategia.nome != nome_estrategia:
                continue

            testadas += 1
            evento = estrategia.esta_acontecendo_agora(ativo)

            if evento is not None:
                oportunidades.append(linha)

                if diagnostico:
                    print("Status: ATIVA AGORA")
            else:
                if diagnostico:
                    print("Status: não está ativa")

    if diagnostico:
        print()
        print("Estratégias testadas agora:", testadas)
        print("Estratégias ativas agora:", len(oportunidades))

    if not oportunidades:
        return None

    oportunidades = sorted(
        oportunidades,
        key=lambda x: (
            x["score"],
            x["taxa_acerto"],
            x["retorno_medio"],
            x["ocorrencias"]
        ),
        reverse=True
    )

    return oportunidades[0]

def executar_scanner_todas(mercado, diagnostico=False):
    aprovadas = carregar_estrategias_aprovadas()

    if aprovadas.empty:
        return []

    estrategias = gerar_estrategias_inteligentes()
    oportunidades = []

    for _, linha in aprovadas.iterrows():
        acao = linha["acao"]
        nome_estrategia = linha["estrategia"]

        ativo = mercado.ativos.get(acao)

        if ativo is None:
            continue

        for estrategia in estrategias:
            if estrategia.nome != nome_estrategia:
                continue

            evento = estrategia.esta_acontecendo_agora(ativo)

            if evento is not None:
                oportunidades.append(linha)

    oportunidades = sorted(
        oportunidades,
        key=lambda x: (
            x["score"],
            x["taxa_acerto"],
            x["retorno_medio"],
            x["ocorrencias"]
        ),
        reverse=True
    )

    return oportunidades