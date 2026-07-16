import pandas as pd


HORARIOS_ESPERADOS = [
    "10:30:00",
    "11:30:00",
    "12:30:00",
    "13:30:00",
    "14:30:00",
    "15:30:00",
    "16:30:00",
    "17:30:00",
]

def validar_base(dados: pd.DataFrame):
    print()
    print("=" * 50)
    print("VALIDAÇÃO DA BASE")
    print("=" * 50)

    problemas = False

    for acao in sorted(dados["acao"].unique()):
        df = dados[dados["acao"] == acao].copy()

        total_linhas = len(df)
        primeiro = df["timestamp"].min()
        ultimo = df["timestamp"].max()

        duplicados = df.duplicated(subset=["timestamp"]).sum()
        valores_vazios = df["close"].isna().sum()

        horarios = df["timestamp"].dt.time.astype(str).unique()
        horarios_fora = sorted(set(horarios) - set(HORARIOS_ESPERADOS))

        print()
        print(f"AÇÃO: {acao}")
        print(f"Linhas: {total_linhas}")
        print(f"Primeiro registro: {primeiro}")
        print(f"Último registro: {ultimo}")

        if duplicados > 0:
            problemas = True
            print(f"PROBLEMA: {duplicados} timestamps duplicados")

        if valores_vazios > 0:
            problemas = True
            print(f"PROBLEMA: {valores_vazios} preços vazios")

        if horarios_fora:
            problemas = True
            print(f"PROBLEMA: horários fora do padrão: {horarios_fora}")

    print()
    print("=" * 50)

    if problemas:
        print("VALIDAÇÃO FINAL: existem problemas na base.")
    else:
        print("VALIDAÇÃO FINAL: base aparentemente correta.")

    print("=" * 50)