import pandas as pd
import yfinance as yf

from config import PERIODO_YAHOO, INTERVALO_YAHOO


def buscar_acao_yahoo(
    ticker: str,
    periodo=PERIODO_YAHOO,
    intervalo=INTERVALO_YAHOO
):
    ticker_yahoo = f"{ticker}.SA"

    try:
        acao = yf.Ticker(ticker_yahoo)

        df = acao.history(
            period=periodo,
            interval=intervalo,
            raise_errors=False
        )

        if df.empty:
            raise ValueError(f"Nenhum dado encontrado para {ticker}")

        df = df.reset_index()

        if "Datetime" in df.columns:
            coluna_tempo = "Datetime"
        elif "Date" in df.columns:
            coluna_tempo = "Date"
        else:
            coluna_tempo = df.columns[0]

        if "Close" not in df.columns:
            raise ValueError(
                f"Coluna Close não encontrada para {ticker}. Colunas: {list(df.columns)}"
            )

        df = df[[coluna_tempo, "Close"]].copy()
        df.columns = ["timestamp", "close"]

        df["timestamp"] = (
            pd.to_datetime(df["timestamp"], errors="coerce")
            .dt.tz_localize(None)
        )

        df["timestamp"] = df["timestamp"] + pd.Timedelta(minutes=30)
        df["close"] = pd.to_numeric(df["close"], errors="coerce")

        df = df.dropna(subset=["timestamp", "close"])
        df = df.drop_duplicates(subset=["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

        return df

    except Exception as erro:
        raise ValueError(f"Erro ao buscar {ticker}: {erro}")