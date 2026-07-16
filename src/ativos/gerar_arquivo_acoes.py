from pathlib import Path


CAMINHO_SRC = Path(__file__).resolve().parents[1]
PASTA_CONFIG = CAMINHO_SRC / "configuracoes"
ARQUIVO_ACOES = PASTA_CONFIG / "acoes.py"


def gerar_arquivo_acoes(
    tickers: list[str],
) -> Path:
    PASTA_CONFIG.mkdir(
        parents=True,
        exist_ok=True,
    )

    init_config = PASTA_CONFIG / "__init__.py"

    if not init_config.exists():
        init_config.write_text(
            "",
            encoding="utf-8",
        )

    linhas = [
        '"""Arquivo gerado automaticamente.',
        "",
        "Não altere manualmente.",
        'Execute `python atualizar_lista_acoes.py`."',
        '"""',
        "",
        "ACOES = [",
    ]

    for ticker in sorted(set(tickers)):
        linhas.append(f'    "{ticker}",')

    linhas.extend(
        [
            "]",
            "",
        ]
    )

    ARQUIVO_ACOES.write_text(
        "\n".join(linhas),
        encoding="utf-8",
    )

    return ARQUIVO_ACOES