def validar_ticker_yahoo(
    ticker: str,
    tentativas: int = 3,
) -> bool:
    ticker_yahoo = f"{ticker}.SA"

    periodos = [
        "5d",
        "1mo",
        "3mo",
        "1y",
    ]

    for periodo in periodos:
        parametros = {
            "range": periodo,
            "interval": "1d",
            "events": "history",
        }

        for tentativa in range(
            1,
            tentativas + 1,
        ):
            try:
                resposta = requests.get(
                    URL_YAHOO.format(
                        ticker=ticker_yahoo
                    ),
                    headers=CABECALHOS,
                    params=parametros,
                    timeout=15,
                )

                if resposta.status_code == 404:
                    break

                if resposta.status_code == 429:
                    time.sleep(2 * tentativa)
                    continue

                resposta.raise_for_status()

                dados = resposta.json()

                resultado = (
                    dados.get("chart", {})
                    .get("result")
                )

                if not resultado:
                    break

                timestamps = resultado[0].get(
                    "timestamp"
                )

                if timestamps:
                    return True

                break

            except (
                requests.RequestException,
                ValueError,
                KeyError,
                TypeError,
            ):
                if tentativa < tentativas:
                    time.sleep(tentativa)
                    continue

                break

    return False