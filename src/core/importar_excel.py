import pandas as pd
from pathlib import Path


def importar_planilha(caminho_planilha):
    caminho_planilha = Path(caminho_planilha)

    if not caminho_planilha.exists():
        raise FileNotFoundError(f"Planilha não encontrada: {caminho_planilha}")

    abas = pd.read_excel(caminho_planilha, sheet_name=None)

    lista_dados = []

    for nome_aba, df in abas.items():
        df = df.copy()

        if "timestamp" not in df.columns or "close" not in df.columns:
            print(f"Aba ignorada: {nome_aba}")
            continue

        df = df[["timestamp", "close"]]
        df["acao"] = nome_aba

        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df["close"] = pd.to_numeric(df["close"], errors="coerce")

        df = df.dropna(subset=["timestamp", "close"])

        lista_dados.append(df)

    if not lista_dados:
        raise ValueError("Nenhuma aba válida encontrada.")

    dados = pd.concat(lista_dados, ignore_index=True)

    dados = dados.sort_values(["acao", "timestamp"]).reset_index(drop=True)

    return dados