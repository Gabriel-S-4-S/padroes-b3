PLANOS = {
    "gratis": {
        "id": "gratis",
        "nome": "Grátis",
        "preco_centavos": 0,
        "preco_formatado": "R$ 0,00",
        "periodicidade": "sem cobrança",
        "duracao_dias": None,
        "descricao": (
            "Plano para conhecer a plataforma com acesso limitado."
        ),
        "beneficios": [
            "Acesso a 1 oportunidade quando houver sinal",
            "Taxa de acerto da oportunidade",
            "Retorno médio histórico",
            "Área do cliente",
            "Alteração e recuperação de senha",
        ],
    },
    "mensal": {
        "id": "mensal",
        "nome": "Premium Mensal",
        "preco_centavos": 500,
        "preco_formatado": "R$ 5,00",
        "periodicidade": "mensal",
        "duracao_dias": 30,
        "descricao": (
            "Acesso completo às oportunidades durante 30 dias."
        ),
        "beneficios": [
            "Acesso a todas as oportunidades disponíveis",
            "Estatísticas completas das oportunidades",
            "Taxa de acerto e retorno médio",
            "Quantidade de ocorrências históricas",
            "Atualizações durante o pregão",
            "Cancelamento a qualquer momento",
        ],
    },
    "anual": {
        "id": "anual",
        "nome": "Premium Anual",
        "preco_centavos": 4000,
        "preco_formatado": "R$ 40,00",
        "periodicidade": "anual",
        "duracao_dias": 365,
        "descricao": (
            "Acesso completo durante 12 meses com economia."
        ),
        "beneficios": [
            "Todos os benefícios do plano mensal",
            "Acesso Premium por 12 meses",
            "Equivale a aproximadamente R$ 3,33 por mês",
            "Economia de R$ 20,00 em comparação a 12 mensalidades",
            "Menos renovações",
            "Acesso contínuo às oportunidades",
        ],
    },
}


def listar_planos():
    return list(PLANOS.values())


def buscar_plano(plano_id: str):
    if not plano_id:
        return None

    return PLANOS.get(plano_id.strip().lower())


def plano_pago_valido(plano_id: str) -> bool:
    return plano_id in {"mensal", "anual"}