from laboratorio.laboratorio import executar_laboratorio
from logs.logger import logger


def executar_laboratorio_service(
    *,
    top: int | None = 20,
    reprocessar_todos: bool = False,
):
    logger.info(
        "========== NOVA EXECUÇÃO DO LABORATÓRIO =========="
    )

    print()
    print("=" * 60)
    print("INICIANDO SERVIÇO DO LABORATÓRIO")
    print("=" * 60)
    print(
        "Modo:",
        (
            "reprocessamento completo"
            if reprocessar_todos
            else "processamento incremental"
        ),
    )

    try:
        resultado = executar_laboratorio(
            top=top,
            reprocessar_todos=reprocessar_todos,
        )

        logger.info(
            "Execução do laboratório finalizada com sucesso."
        )

        return {
            "sucesso": True,
            "resultado": resultado,
        }

    except KeyboardInterrupt:
        logger.info(
            "Execução do laboratório interrompida pelo usuário."
        )

        print()
        print(
            "Laboratório interrompido. "
            "O progresso concluído foi preservado."
        )

        raise

    except Exception as erro:
        logger.erro(
            "Erro durante a execução do laboratório: "
            f"{erro}"
        )

        print()
        print("=" * 60)
        print("ERRO NO SERVIÇO DO LABORATÓRIO")
        print("=" * 60)
        print(erro)

        return {
            "sucesso": False,
            "erro": str(erro),
        }