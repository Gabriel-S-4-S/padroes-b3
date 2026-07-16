from banco.sqlite import (
    criar_tabelas,
    carregar_historico,
    contar_registros,
    salvar_estrategias_aprovadas,
    contar_estrategias_aprovadas,
)

from modelos.mercado import Mercado
from estatisticas.backtest import calcular_backtest_estrategia
from confianca.motor_confianca import avaliar_analise
from laboratorio.gerador_inteligente import gerar_estrategias_inteligentes

from config import HORIZONTES_SAIDA

def chave_padrao(avaliacao):
    analise = avaliacao.analise
    return (
        analise.acao,
        analise.estrategia,
        analise.horario_compra,
    )


def escolher_melhores_saidas(avaliacoes_aprovadas):
    melhores = {}

    for avaliacao in avaliacoes_aprovadas:
        chave = chave_padrao(avaliacao)

        if chave not in melhores:
            melhores[chave] = avaliacao
            continue

        atual = melhores[chave]

        if (
            avaliacao.score,
            avaliacao.analise.taxa_acerto,
            avaliacao.analise.retorno_medio,
            avaliacao.analise.ocorrencias,
        ) > (
            atual.score,
            atual.analise.taxa_acerto,
            atual.analise.retorno_medio,
            atual.analise.ocorrencias,
        ):
            melhores[chave] = avaliacao

    return list(melhores.values())


def executar_laboratorio(top=None):
    criar_tabelas()

    dados = carregar_historico()
    mercado = Mercado.a_partir_dataframe(dados)

    estrategias = gerar_estrategias_inteligentes()

    avaliacoes_todas = []
    avaliacoes_aprovadas = []

    for ativo in mercado.ativos.values():
        for estrategia in estrategias:
            for horizonte in HORIZONTES_SAIDA:
                analise = calcular_backtest_estrategia(
                    ativo,
                    estrategia,
                    horizonte_saida=horizonte,
                )

                if analise is None:
                    continue

                avaliacao = avaliar_analise(analise)
                avaliacoes_todas.append(avaliacao)

                if avaliacao.aprovado:
                    avaliacoes_aprovadas.append(avaliacao)

    melhores_aprovadas = escolher_melhores_saidas(avaliacoes_aprovadas)

    melhores_aprovadas = sorted(
        melhores_aprovadas,
        key=lambda a: (
            a.score,
            a.analise.taxa_acerto,
            a.analise.retorno_medio,
            a.analise.ocorrencias,
        ),
        reverse=True,
    )


    salvar_estrategias_aprovadas(melhores_aprovadas)

    print()
    print("=" * 60)
    print("LABORATÓRIO DE PADRÕES B3")
    print("=" * 60)
    print(f"Registros no banco: {contar_registros()}")
    print(f"Ações analisadas: {mercado.total_ativos()}")
    print(f"Estratégias testadas: {len(estrategias)}")
    print(f"Padrões analisados: {len(avaliacoes_todas)}")
    print(f"Padrões aprovados antes do filtro de melhor saída: {len(avaliacoes_aprovadas)}")
    print(f"Padrões aprovados finais: {len(melhores_aprovadas)}")
    print(f"Estratégias salvas no banco: {contar_estrategias_aprovadas()}")

    print()
    print("=" * 60)
    print("PADRÕES APROVADOS")
    print("=" * 60)

    if not melhores_aprovadas:
        print("Nenhum padrão aprovado encontrado.")
        return

    lista_para_mostrar = melhores_aprovadas if top is None else melhores_aprovadas[:top]

    for posicao, avaliacao in enumerate(lista_para_mostrar, start=1):
        analise = avaliacao.analise

        print()
        print(f"{posicao}º")
        print("Ação:", analise.acao)
        print("Estratégia:", analise.estrategia)
        print("Compra:", analise.descricao_compra)
        print("Venda:", analise.descricao_venda)
        print(f"Melhor saída: {analise.horizonte_saida} candle(s) depois")
        print(f"Score: {avaliacao.score:.0f}/100")
        print(f"Taxa de acerto: {analise.taxa_acerto:.2f}%")
        print("Ocorrências:", analise.ocorrencias)
        print("Acertos:", analise.acertos)
        print("Falhas:", analise.falhas)
        print(f"Retorno médio: {analise.retorno_medio:.2f}%")
        print(f"Maior lucro: {analise.maior_lucro:.2f}%")
        print(f"Maior prejuízo: {analise.maior_prejuizo:.2f}%")
        print("-" * 60)