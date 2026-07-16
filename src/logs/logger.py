from datetime import datetime

from config import PASTA_LOGS


class Logger:

    def __init__(self):
        PASTA_LOGS.mkdir(parents=True, exist_ok=True)

        hoje = datetime.now().strftime("%Y-%m-%d")

        self.arquivo = PASTA_LOGS / f"{hoje}.log"

    def escrever(self, mensagem):
        agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with open(self.arquivo, "a", encoding="utf-8") as arquivo:
            arquivo.write(f"[{agora}] {mensagem}\n")

    def info(self, mensagem):
        self.escrever(f"[INFO] {mensagem}")

    def erro(self, mensagem):
        self.escrever(f"[ERRO] {mensagem}")

    def aviso(self, mensagem):
        self.escrever(f"[AVISO] {mensagem}")


logger = Logger()