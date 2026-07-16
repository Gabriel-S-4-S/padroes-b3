from banco.sqlite import criar_tabelas, contar_registros
from coletor.atualizar_banco import atualizar_banco_yahoo


def main():
    criar_tabelas()

    novos = atualizar_banco_yahoo()

    print()
    print("=" * 50)
    print("ATUALIZAÇÃO CONCLUÍDA")
    print("=" * 50)
    print(f"Candles novos adicionados: {novos}")
    print(f"Registros armazenados: {contar_registros()}")


if __name__ == "__main__":
    main()