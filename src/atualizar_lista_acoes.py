from ativos.sincronizador_ativos import (
    sincronizar_ativos,
)


def main():
    print()
    print("=" * 60)
    print("ATUALIZAÇÃO AUTOMÁTICA DOS ATIVOS DA B3")
    print("=" * 60)

    confirmar = input(
        "A rotina poderá remover históricos de ativos "
        "deslistados após 3 confirmações. Continuar? "
        "[S/N]: "
    ).strip().upper()

    if confirmar != "S":
        print("Operação cancelada.")
        return

    try:
        resultado = sincronizar_ativos(
            apagar_historico_removidos=False
        )

        print()
        print("=" * 60)
        print("RESULTADO")
        print("=" * 60)
        print(
            "Ativos encontrados na B3:",
            resultado["encontrados_b3"],
        )
        print(
            "Ativos válidos no Yahoo:",
            resultado["validos_yahoo"],
        )
        print(
            "Ativos adicionados:",
            resultado["adicionados"],
        )
        print(
            "Ativos removidos:",
            resultado["removidos"],
        )
        print(
            "Arquivo gerado:",
            resultado["arquivo_gerado"],
        )

        for removido in resultado[
            "removidos_detalhes"
        ]:
            print()
            print(
                "REMOVIDO:",
                removido["ticker"],
            )
            print(
                "Dados apagados:",
                removido["dados_apagados"],
            )

    except Exception as erro:
        print()
        print("ERRO NA SINCRONIZAÇÃO")
        print(erro)


if __name__ == "__main__":
    main()