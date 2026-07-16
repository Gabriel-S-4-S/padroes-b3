import base64
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any
from urllib.parse import quote

import requests


URL_BASE = (
    "https://sistemaswebb3-listados.b3.com.br/"
    "listedCompaniesProxy/CompanyCall"
)

URL_EMPRESAS = f"{URL_BASE}/GetInitialCompanies"
URL_DETALHE = f"{URL_BASE}/GetDetail"

TAMANHO_PAGINA = 120
MAXIMO_PAGINAS = 20
MAX_WORKERS = 6

PADRAO_TICKER = re.compile(r"^[A-Z]{4}\d{1,2}$")

CABECALHOS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Origin": "https://www.b3.com.br",
    "Referer": (
        "https://www.b3.com.br/pt_br/"
        "produtos-e-servicos/negociacao/"
        "renda-variavel/empresas-listadas.htm"
    ),
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/149.0.0.0 Safari/537.36"
    ),
}


class ErroB3(RuntimeError):
    pass


def codificar_parametros(parametros: dict[str, Any]) -> str:
    """
    A API pública utilizada pela própria página da B3 recebe
    os parâmetros em JSON codificado com Base64.
    """

    texto = json.dumps(
        parametros,
        ensure_ascii=False,
        separators=(",", ":"),
    )

    codificado = base64.b64encode(
        texto.encode("utf-8")
    ).decode("ascii")

    # O Base64 pode conter caracteres reservados em uma URL.
    return quote(codificado, safe="")


def fazer_requisicao_json(
    url: str,
    tentativas: int = 3,
) -> dict[str, Any]:
    ultimo_erro: Exception | None = None

    for tentativa in range(1, tentativas + 1):
        try:
            resposta = requests.get(
                url,
                headers=CABECALHOS,
                timeout=30,
            )

            if resposta.status_code == 429:
                time.sleep(tentativa * 3)
                continue

            resposta.raise_for_status()

            dados = resposta.json()

            if not isinstance(dados, dict):
                raise ErroB3(
                    "A B3 retornou um formato inesperado."
                )

            return dados

        except (
            requests.RequestException,
            ValueError,
            ErroB3,
        ) as erro:
            ultimo_erro = erro

            if tentativa < tentativas:
                time.sleep(tentativa * 2)

    raise ErroB3(
        f"Não foi possível consultar a B3: {ultimo_erro}"
    )


def buscar_pagina_empresas(
    pagina: int,
) -> dict[str, Any]:
    parametros = {
        "language": "pt-br",
        "pageNumber": pagina,
        "pageSize": TAMANHO_PAGINA,
    }

    token = codificar_parametros(parametros)

    return fazer_requisicao_json(
        f"{URL_EMPRESAS}/{token}"
    )


def listar_empresas_b3() -> list[dict[str, Any]]:
    """
    Obtém as companhias apresentadas na consulta de empresas
    listadas da B3.

    A API limita a quantidade de registros por página, por isso
    percorremos todas as páginas até não haver mais resultados.
    """

    empresas: list[dict[str, Any]] = []
    codigos_cvm_encontrados: set[str] = set()

    for pagina in range(1, MAXIMO_PAGINAS + 1):
        dados = buscar_pagina_empresas(pagina)

        resultados = dados.get("results") or []

        if not isinstance(resultados, list):
            raise ErroB3(
                "A lista de empresas retornada pela B3 é inválida."
            )

        if not resultados:
            break

        novos_na_pagina = 0

        for empresa in resultados:
            if not isinstance(empresa, dict):
                continue

            codigo_cvm = str(
                empresa.get("codeCVM") or ""
            ).strip()

            if not codigo_cvm:
                continue

            if codigo_cvm in codigos_cvm_encontrados:
                continue

            codigos_cvm_encontrados.add(codigo_cvm)
            empresas.append(empresa)
            novos_na_pagina += 1

        print(
            f"B3: página {pagina} | "
            f"registros recebidos: {len(resultados)} | "
            f"novos: {novos_na_pagina}"
        )

        # Uma página incompleta normalmente indica a última página.
        if len(resultados) < TAMANHO_PAGINA:
            break

    if not empresas:
        raise ErroB3(
            "A B3 não retornou nenhuma empresa listada."
        )

    return empresas


def buscar_detalhe_empresa(
    codigo_cvm: str,
) -> dict[str, Any]:
    parametros = {
        "codeCVM": str(codigo_cvm),
        "language": "pt-br",
    }

    token = codificar_parametros(parametros)

    return fazer_requisicao_json(
        f"{URL_DETALHE}/{token}"
    )


def ticker_representa_acao(
    codigo: str,
    isin: str,
) -> bool:
    """
    Inclui ações ON/PN e units.

    A consulta detalhada também pode devolver direitos,
    recibos e códigos de subscrição. Por isso não usamos
    apenas o número final do ticker.

    Exemplos de padrões ISIN:
    - ACNOR: ação ordinária;
    - ACNPR: ação preferencial;
    - UNT: unit;
    - CDA: certificado de depósito de ações/unit.
    """

    codigo = codigo.strip().upper()
    isin = isin.strip().upper()

    if not PADRAO_TICKER.fullmatch(codigo):
        return False

    sufixo = re.search(r"(\d{1,2})$", codigo)

    if sufixo is None:
        return False

    numero = sufixo.group(1)

    if numero in {"3", "4", "5", "6", "7", "8"}:
        return (
            "ACNOR" in isin
            or "ACNPR" in isin
        )

    if numero == "11":
        return (
            "UNT" in isin
            or "CDA" in isin
        )

    return False


def extrair_tickers_detalhe(
    detalhe: dict[str, Any],
) -> set[str]:
    tickers: set[str] = set()

    # status A representa companhia ativa na consulta da B3.
    status_empresa = str(
        detalhe.get("status") or ""
    ).strip().upper()

    possui_cotacao = str(
        detalhe.get("hasQuotation") or ""
    ).strip().upper()

    if status_empresa and status_empresa != "A":
        return tickers

    if possui_cotacao and possui_cotacao != "S":
        return tickers

    codigos = detalhe.get("otherCodes") or []

    if not isinstance(codigos, list):
        return tickers

    for registro in codigos:
        if not isinstance(registro, dict):
            continue

        codigo = str(
            registro.get("code") or ""
        ).strip().upper()

        isin = str(
            registro.get("isin") or ""
        ).strip().upper()

        if ticker_representa_acao(
            codigo=codigo,
            isin=isin,
        ):
            tickers.add(codigo)

    return tickers


def consultar_empresa(
    empresa: dict[str, Any],
) -> tuple[str, set[str], str | None]:
    codigo_cvm = str(
        empresa.get("codeCVM") or ""
    ).strip()

    nome = str(
        empresa.get("tradingName")
        or empresa.get("companyName")
        or codigo_cvm
    ).strip()

    try:
        detalhe = buscar_detalhe_empresa(codigo_cvm)
        tickers = extrair_tickers_detalhe(detalhe)

        return nome, tickers, None

    except Exception as erro:
        return nome, set(), str(erro)


def obter_acoes_oficiais_b3() -> list[str]:
    empresas = listar_empresas_b3()

    tickers: set[str] = set()
    erros: list[str] = []

    print()
    print(
        f"Consultando detalhes de "
        f"{len(empresas)} empresas na B3..."
    )

    with ThreadPoolExecutor(
        max_workers=MAX_WORKERS
    ) as executor:
        tarefas = {
            executor.submit(
                consultar_empresa,
                empresa,
            ): empresa
            for empresa in empresas
        }

        total = len(tarefas)

        for indice, tarefa in enumerate(
            as_completed(tarefas),
            start=1,
        ):
            nome, tickers_empresa, erro = tarefa.result()

            if erro:
                erros.append(f"{nome}: {erro}")
            else:
                tickers.update(tickers_empresa)

            print(
                f"B3 detalhes: {indice}/{total} | "
                f"{nome} | "
                f"{len(tickers_empresa)} ticker(s)"
            )

    if erros:
        print()
        print(
            f"Aviso: {len(erros)} empresa(s) não puderam "
            "ser consultadas nesta execução."
        )

        for erro in erros[:10]:
            print(" -", erro)

    if len(tickers) < 200:
        raise ErroB3(
            "A consulta detalhada retornou apenas "
            f"{len(tickers)} ações/units. "
            "A sincronização foi cancelada por segurança."
        )

    print()
    print(
        "Ações e units encontradas na B3:",
        len(tickers),
    )

    return sorted(tickers)