from banco.sqlite import (
    carregar_historico,
    contar_oportunidades_historico,
    contar_registros,
    limpar_oportunidades_ativas,
    salvar_oportunidades_ativas,
    salvar_oportunidades_historico,
)
from coletor.atualizar_banco import (
    atualizar_banco_yahoo,
)
from logs.logger import logger
from modelos.mercado import Mercado
from notificacoes.notificador_oportunidades import (
    notificar_oportunidades_premium,
)
from scanner.scanner import (
    executar_scanner_todas,
)


def obter_valor(
    oportunidade,
    campo: str,
    padrao=None,
):
    """
    Obtém um campo de dicionários, Series do pandas
    ou objetos semelhantes.
    """

    try:
        valor = oportunidade.get(
            campo,
            padrao,
        )
    except AttributeError:
        try:
            valor = oportunidade[campo]
        except (
            KeyError,
            TypeError,
            IndexError,
        ):
            return padrao

    return padrao if valor is None else valor


def converter_numero(
    valor,
    padrao: float = 0.0,
) -> float:
    try:
        numero = float(valor)

        if numero != numero:
            return padrao

        return numero

    except (
        TypeError,
        ValueError,
    ):
        texto = str(valor).strip()

        texto = texto.replace(
            "%",
            "",
        )

        texto = texto.replace(
            ",",
            ".",
        )

        try:
            return float(texto)
        except ValueError:
            return padrao


def converter_inteiro(
    valor,
    padrao: int = 0,
) -> int:
    try:
        return int(
            converter_numero(
                valor,
                padrao,
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return padrao


def converter_booleano(
    valor,
) -> bool:
    if isinstance(valor, bool):
        return valor

    if isinstance(
        valor,
        (int, float),
    ):
        return bool(valor)

    texto = str(valor).strip().lower()

    return texto in {
        "1",
        "true",
        "sim",
        "yes",
    }


def formatar_descricao_venda(
    oportunidade,
) -> str:
    """
    Retorna uma descrição clara da saída.

    Exemplos:
    - 15:30:00
    - próximo pregão às 12:30:00
    - 2 pregões depois, às 11:30:00
    """

    horario_venda = str(
        obter_valor(
            oportunidade,
            "horario_venda",
            "Não informado",
        )
    )

    venda_proximo_pregao = converter_booleano(
        obter_valor(
            oportunidade,
            "venda_proximo_pregao",
            False,
        )
    )

    pregoes_ate_venda = converter_inteiro(
        obter_valor(
            oportunidade,
            "pregoes_ate_venda",
            0,
        )
    )

    if not venda_proximo_pregao:
        return horario_venda

    if pregoes_ate_venda <= 1:
        return (
            f"próximo pregão às "
            f"{horario_venda}"
        )

    return (
        f"{pregoes_ate_venda} pregões depois, "
        f"às {horario_venda}"
    )


def mostrar_oportunidades(
    oportunidades,
) -> None:
    print()
    print("=" * 60)
    print("OPORTUNIDADES AGORA")
    print("=" * 60)

    if not oportunidades:
        print(
            "Nenhuma oportunidade válida de alta "
            "confiança encontrada."
        )
        return

    for indice, oportunidade in enumerate(
        oportunidades,
        start=1,
    ):
        acao = obter_valor(
            oportunidade,
            "acao",
            "Não informada",
        )

        estrategia = obter_valor(
            oportunidade,
            "estrategia",
            "Não informada",
        )

        horario_compra = obter_valor(
            oportunidade,
            "horario_compra",
            "Não informado",
        )

        timestamp_compra = obter_valor(
            oportunidade,
            "timestamp_compra",
            None,
        )

        timestamp_venda = obter_valor(
            oportunidade,
            "timestamp_venda_prevista",
            None,
        )

        horizonte_saida = converter_inteiro(
            obter_valor(
                oportunidade,
                "horizonte_saida",
                0,
            )
        )

        taxa_acerto = converter_numero(
            obter_valor(
                oportunidade,
                "taxa_acerto",
                0,
            )
        )

        ocorrencias = converter_inteiro(
            obter_valor(
                oportunidade,
                "ocorrencias",
                0,
            )
        )

        acertos = converter_inteiro(
            obter_valor(
                oportunidade,
                "acertos",
                0,
            )
        )

        falhas = converter_inteiro(
            obter_valor(
                oportunidade,
                "falhas",
                0,
            )
        )

        retorno_medio = converter_numero(
            obter_valor(
                oportunidade,
                "retorno_medio",
                0,
            )
        )

        score = converter_numero(
            obter_valor(
                oportunidade,
                "score",
                0,
            )
        )

        print()
        print(f"{indice}º")
        print("AÇÃO:", acao)
        print("PADRÃO:", estrategia)

        print(
            "COMPRA:",
            horario_compra,
        )

        print(
            "VENDA:",
            formatar_descricao_venda(
                oportunidade
            ),
        )

        if horizonte_saida > 0:
            print(
                "HORIZONTE:",
                f"{horizonte_saida} candle(s)",
            )

        if timestamp_compra:
            print(
                "DATA E HORA DA COMPRA:",
                timestamp_compra,
            )

        if timestamp_venda:
            print(
                "DATA E HORA PREVISTA DA VENDA:",
                timestamp_venda,
            )

        print(
            "TAXA DE ACERTO:",
            f"{taxa_acerto:.2f}%",
        )

        print(
            "OCORRÊNCIAS:",
            ocorrencias,
        )

        print(
            "ACERTOS:",
            acertos,
        )

        print(
            "FALHAS:",
            falhas,
        )

        print(
            "RETORNO MÉDIO:",
            f"{retorno_medio:.2f}%",
        )

        print(
            "SCORE:",
            f"{score:.0f}/100",
        )

        print("-" * 60)


def criar_mercado():
    dados = carregar_historico()

    if dados is None or dados.empty:
        raise RuntimeError(
            "Não há histórico disponível para criar "
            "o mercado."
        )

    mercado = Mercado.a_partir_dataframe(
        dados
    )

    return dados, mercado


def salvar_resultados_scanner(
    oportunidades,
):
    """
    Substitui as oportunidades ativas antigas pelas
    oportunidades finais da execução atual.

    A lista recebida já vem do scanner:
    - sem oportunidades vencidas;
    - sem repetição da mesma ação;
    - ordenada pela qualidade estatística.
    """

    limpar_oportunidades_ativas()

    salvas_ativas = (
        salvar_oportunidades_ativas(
            oportunidades
        )
    )

    salvas_historico = (
        salvar_oportunidades_historico(
            oportunidades
        )
    )

    return {
        "salvas_ativas": salvas_ativas,
        "salvas_historico": salvas_historico,
    }


def enviar_notificacoes(
    oportunidades,
):
    """
    Envia somente as oportunidades finais e válidas.

    Dessa forma, uma mesma ação não gera vários e-mails
    por estratégias muito parecidas.
    """

    if not oportunidades:
        return {
            "enviadas": 0,
            "ignoradas": 0,
            "falhas": 0,
        }

    resultado = (
        notificar_oportunidades_premium(
            oportunidades
        )
    )

    if not isinstance(
        resultado,
        dict,
    ):
        return {
            "enviadas": 0,
            "ignoradas": 0,
            "falhas": 0,
        }

    return {
        "enviadas": int(
            resultado.get(
                "enviadas",
                0,
            )
        ),
        "ignoradas": int(
            resultado.get(
                "ignoradas",
                0,
            )
        ),
        "falhas": int(
            resultado.get(
                "falhas",
                0,
            )
        ),
    }


def executar_scanner_service():
    logger.info(
        "========== NOVA EXECUÇÃO DO SCANNER =========="
    )

    print()
    print("=" * 60)
    print("INICIANDO SERVIÇO DO SCANNER")
    print("=" * 60)

    print("Atualizando candles...")

    novos = atualizar_banco_yahoo()

    logger.info(
        "Candles novos adicionados: "
        f"{novos}"
    )

    print(
        "Carregando histórico e criando mercado..."
    )

    dados, mercado = criar_mercado()

    total_ativos = mercado.total_ativos()
    total_registros = contar_registros()
    total_acoes = int(
        dados["acao"].nunique()
    )
    total_linhas = len(dados)

    print(
        f"Mercado criado com "
        f"{total_ativos} ativo(s)."
    )

    print("Executando scanner...")

    oportunidades = executar_scanner_todas(
        mercado=mercado,
    )

    total_oportunidades = len(
        oportunidades
    )

    logger.info(
        "Oportunidades finais encontradas: "
        f"{total_oportunidades}"
    )

    print(
        "Substituindo oportunidades antigas "
        "pelo resultado atual..."
    )

    resultado_salvamento = (
        salvar_resultados_scanner(
            oportunidades
        )
    )

    salvas_ativas = resultado_salvamento[
        "salvas_ativas"
    ]

    salvas_historico = resultado_salvamento[
        "salvas_historico"
    ]

    logger.info(
        "Oportunidades ativas salvas: "
        f"{salvas_ativas}"
    )

    logger.info(
        "Oportunidades salvas no histórico: "
        f"{salvas_historico}"
    )

    print(
        "Enviando notificações Premium..."
    )

    resultado_notificacoes = (
        enviar_notificacoes(
            oportunidades
        )
    )

    emails_enviados = (
        resultado_notificacoes[
            "enviadas"
        ]
    )

    emails_ignorados = (
        resultado_notificacoes[
            "ignoradas"
        ]
    )

    emails_com_falha = (
        resultado_notificacoes[
            "falhas"
        ]
    )

    logger.info(
        "Notificações Premium: "
        f"enviadas={emails_enviados} | "
        f"ignoradas={emails_ignorados} | "
        f"falhas={emails_com_falha}"
    )

    total_historico = (
        contar_oportunidades_historico()
    )

    print()
    print("=" * 60)
    print("RESUMO DA EXECUÇÃO")
    print("=" * 60)

    print(
        "Candles novos adicionados:",
        novos,
    )

    print(
        "Registros armazenados:",
        total_registros,
    )

    print(
        "Ações encontradas:",
        total_acoes,
    )

    print(
        "Linhas carregadas:",
        total_linhas,
    )

    print(
        "Ações únicas com oportunidade válida:",
        total_oportunidades,
    )

    print(
        "Oportunidades ativas salvas:",
        salvas_ativas,
    )

    print(
        "Oportunidades salvas no histórico:",
        salvas_historico,
    )

    print(
        "Total de registros no histórico:",
        total_historico,
    )

    print(
        "E-mails Premium enviados:",
        emails_enviados,
    )

    print(
        "E-mails ignorados por duplicidade:",
        emails_ignorados,
    )

    print(
        "Falhas de envio:",
        emails_com_falha,
    )

    mostrar_oportunidades(
        oportunidades
    )

    logger.info(
        "Execução do scanner finalizada com sucesso."
    )

    return {
        "sucesso": True,
        "candles_novos": novos,
        "registros": total_registros,
        "acoes": total_acoes,
        "linhas": total_linhas,
        "oportunidades_encontradas": (
            total_oportunidades
        ),
        "oportunidades_ativas_salvas": (
            salvas_ativas
        ),
        "oportunidades_historico_salvas": (
            salvas_historico
        ),
        "emails_enviados": emails_enviados,
        "emails_ignorados": emails_ignorados,
        "emails_com_falha": emails_com_falha,
    }