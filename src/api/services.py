from datetime import datetime

from banco.sqlite import (
    contar_registros,
    carregar_historico,
    carregar_oportunidade_gratis,
    carregar_oportunidades_premium,
    contar_estrategias_aprovadas,
    contar_oportunidades_ativas,
)

from usuarios.usuarios_db import listar_usuarios


def obter_status():
    dados = carregar_historico()

    return {
        "acoes": int(dados["acao"].nunique()),
        "candles": int(contar_registros()),
        "linhas_carregadas": int(len(dados)),
    }


def obter_oportunidade_gratis():
    oportunidade = carregar_oportunidade_gratis()

    if oportunidade is None:
        return {
            "tem_oportunidade": False,
            "mensagem": "Nenhuma oportunidade disponível no momento.",
        }

    return {
        "tem_oportunidade": True,
        "oportunidade": oportunidade,
    }


def obter_oportunidades_premium():
    oportunidades = carregar_oportunidades_premium()

    return {
        "quantidade": len(oportunidades),
        "oportunidades": oportunidades,
    }


def assinatura_esta_ativa(usuario: dict) -> bool:
    if usuario["status"] != "ativo":
        return False

    if usuario["plano"] not in ["mensal", "anual"]:
        return False

    expira_em = usuario.get("expira_em")

    if not expira_em:
        return False

    try:
        data_expiracao = datetime.strptime(
            expira_em,
            "%Y-%m-%d %H:%M:%S",
        )
    except ValueError:
        return False

    return data_expiracao >= datetime.now()


def obter_resumo_admin():
    dados = carregar_historico()
    usuarios = listar_usuarios()

    assinaturas_ativas = sum(
        1
        for usuario in usuarios
        if assinatura_esta_ativa(usuario)
    )

    usuarios_gratuitos = sum(
        1
        for usuario in usuarios
        if usuario["plano"] == "gratis"
    )

    return {
        "usuarios_cadastrados": len(usuarios),
        "assinaturas_ativas": assinaturas_ativas,
        "usuarios_gratuitos": usuarios_gratuitos,
        "acoes": int(dados["acao"].nunique()),
        "candles": int(contar_registros()),
        "linhas_carregadas": int(len(dados)),
        "estrategias_aprovadas": int(
            contar_estrategias_aprovadas()
        ),
        "oportunidades_ativas": int(
            contar_oportunidades_ativas()
        ),
    }