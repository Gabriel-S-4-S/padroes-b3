from typing import Any

from ativos.ativos_db import (
    apagar_dados_do_ativo,
    buscar_tickers_ativos,
    finalizar_sincronizacao,
    incrementar_ausencia,
    iniciar_sincronizacao,
    marcar_ativo_removido,
    registrar_ou_atualizar_ativo,
)

from ativos.b3_service import (
    ErroB3,
    obter_acoes_oficiais_b3,
)

from ativos.gerar_arquivo_acoes import (
    gerar_arquivo_acoes,
)

from ativos.yahoo_service import (
    validar_tickers_yahoo,
)


LIMITE_AUSENCIAS_PARA_REMOCAO = 3
MINIMO_ATIVOS_B3_ACEITAVEL = 200


def sincronizar_ativos(
    *,
    apagar_historico_removidos: bool = True,
) -> dict[str, Any]:
    sincronizacao_id = iniciar_sincronizacao()

    encontrados_b3 = 0
    validos_yahoo = 0
    adicionados = 0
    removidos = 0

    try:
        tickers_b3 = obter_acoes_oficiais_b3()
        encontrados_b3 = len(tickers_b3)

        if encontrados_b3 < MINIMO_ATIVOS_B3_ACEITAVEL:
            raise ErroB3(
                "A lista retornada pela B3 possui apenas "
                f"{encontrados_b3} ativos. "
                "A sincronização foi cancelada por segurança."
            )

        atuais_antes = buscar_tickers_ativos()
        conjunto_b3 = set(tickers_b3)

        validacoes_yahoo = validar_tickers_yahoo(
            tickers_b3
        )

        tickers_utilizaveis: list[str] = []

        for ticker in tickers_b3:
            valido_yahoo = validacoes_yahoo.get(
                ticker,
                False,
            )

            if valido_yahoo:
                validos_yahoo += 1
                tickers_utilizaveis.append(ticker)

            novo = registrar_ou_atualizar_ativo(
                ticker=ticker,
                valido_yahoo=valido_yahoo,
            )

            if novo:
                adicionados += 1

        ausentes_b3 = atuais_antes - conjunto_b3

        removidos_detalhes = []

        for ticker in sorted(ausentes_b3):
            ausencias = incrementar_ausencia(
                ticker
            )

            print(
                f"{ticker}: ausente da B3 por "
                f"{ausencias} sincronização(ões)."
            )

            if (
                ausencias
                < LIMITE_AUSENCIAS_PARA_REMOCAO
            ):
                continue

            dados_apagados = {}

            if apagar_historico_removidos:
                dados_apagados = apagar_dados_do_ativo(
                    ticker
                )

            marcar_ativo_removido(
                ticker=ticker,
                motivo=(
                    "Ausente por "
                    f"{ausencias} sincronizações oficiais "
                    "consecutivas da B3."
                ),
            )

            removidos += 1

            removidos_detalhes.append(
                {
                    "ticker": ticker,
                    "ausencias": ausencias,
                    "dados_apagados": dados_apagados,
                }
            )

        arquivo = gerar_arquivo_acoes(
            tickers_utilizaveis
        )

        mensagem = (
            "Sincronização concluída. "
            f"B3: {encontrados_b3}; "
            f"Yahoo válidos: {validos_yahoo}; "
            f"adicionados: {adicionados}; "
            f"removidos: {removidos}."
        )

        finalizar_sincronizacao(
            sincronizacao_id=sincronizacao_id,
            sucesso_b3=True,
            encontrados_b3=encontrados_b3,
            validos_yahoo=validos_yahoo,
            adicionados=adicionados,
            removidos=removidos,
            mensagem=mensagem,
        )

        return {
            "sucesso": True,
            "encontrados_b3": encontrados_b3,
            "validos_yahoo": validos_yahoo,
            "adicionados": adicionados,
            "removidos": removidos,
            "arquivo_gerado": str(arquivo),
            "removidos_detalhes": removidos_detalhes,
            "mensagem": mensagem,
        }

    except Exception as erro:
        finalizar_sincronizacao(
            sincronizacao_id=sincronizacao_id,
            sucesso_b3=False,
            encontrados_b3=encontrados_b3,
            validos_yahoo=validos_yahoo,
            adicionados=adicionados,
            removidos=removidos,
            mensagem=str(erro),
        )

        raise