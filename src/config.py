from pathlib import Path
from dotenv import load_dotenv
import os
from configuracoes.acoes import ACOES

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

CAMINHO_PLANILHA = BASE_DIR / "dados" / "PADRÕES B3.xlsx"
CAMINHO_BANCO = BASE_DIR / "banco_dados" / "historico.db"
PASTA_LOGS = BASE_DIR / "logs"





HORARIOS_PREGAO = [
    "10:30:00",
    "11:30:00",
    "12:30:00",
    "13:30:00",
    "14:30:00",
    "15:30:00",
    "16:30:00",
]


TAXA_MINIMA = 70
OCORRENCIAS_MINIMAS = 50
RETORNO_MINIMO = 0.20


HORIZONTES_SAIDA = [1, 2, 3, 4, 5]


PERIODO_YAHOO = "5d"
INTERVALO_YAHOO = "1h"

API_KEY = os.getenv("API_KEY", "chave-dev-padrao")

PERIODO_HISTORICO_YAHOO = "730d"

JWT_SECRET = os.getenv("JWT_SECRET", "jwt-secret-dev")
JWT_EXPIRACAO_HORAS = 24