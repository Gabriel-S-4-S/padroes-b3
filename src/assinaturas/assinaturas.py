from datetime import datetime, timedelta

from auditoria.auditoria_db import registrar_auditoria
from banco.sqlite import conectar_banco
from usuarios.usuarios_db import (
    buscar_usuario_por_email,
    alterar_plano,
    ativar_usuario,
)


PLANOS = {
    "gratis": 0,
    "mensal": 30,
    "anual": 365,
}


def agora_texto():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def calcular_expiracao(plano):
    plano = plano.strip().lower()

    if plano not in PLANOS:
        raise ValueError("Plano inválido.")

    dias = PLANOS[plano]

    if dias == 0:
        return None

    return (
        datetime.now() + timedelta(days=dias)
    ).strftime("%Y-%m-%d %H:%M:%S")


def ativar_assinatura(email, plano):
    email = email.strip().lower()
    plano = plano.strip().lower()

    if plano not in PLANOS:
        return {
            "sucesso": False,
            "mensagem": (
                "Plano inválido. Use gratis, mensal ou anual."
            ),
        }

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        return {
            "sucesso": False,
            "mensagem": "Usuário não encontrado.",
        }

    expira_em = calcular_expiracao(plano)

    alterar_plano(
        email=email,
        plano=plano,
        expira_em=expira_em,
    )

    ativar_usuario(email)

    registrar_auditoria(
        tipo="assinatura",
        acao="ativar_assinatura",
        usuario_email=email,
        responsavel="admin/sistema",
        detalhes=(
            f"Plano ativado: {plano} | "
            f"Expira em: {expira_em}"
        ),
    )

    return {
        "sucesso": True,
        "mensagem": "Assinatura ativada com sucesso.",
        "email": email,
        "plano": plano,
        "status": "ativo",
        "expira_em": expira_em,
    }


def cancelar_assinatura(email):
    email = email.strip().lower()

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        return {
            "sucesso": False,
            "mensagem": "Usuário não encontrado.",
        }

    plano_anterior = usuario[5]
    expira_em_anterior = usuario[7]

    alterar_plano(
        email=email,
        plano="gratis",
        expira_em=None,
    )

    ativar_usuario(email)

    registrar_auditoria(
        tipo="assinatura",
        acao="cancelar_assinatura",
        usuario_email=email,
        responsavel="admin/sistema",
        detalhes=(
            "Assinatura cancelada. "
            f"Plano anterior: {plano_anterior} | "
            f"Expiração anterior: {expira_em_anterior} | "
            "Novo plano: gratis"
        ),
    )

    return {
        "sucesso": True,
        "mensagem": (
            "Assinatura cancelada. "
            "A conta foi transferida para o plano gratuito."
        ),
        "email": email,
        "plano": "gratis",
        "status": "ativo",
        "expira_em": None,
    }


def renovar_assinatura(email, plano):
    email = email.strip().lower()
    plano = plano.strip().lower()

    resultado = ativar_assinatura(
        email=email,
        plano=plano,
    )

    if resultado.get("sucesso"):
        registrar_auditoria(
            tipo="assinatura",
            acao="renovar_assinatura",
            usuario_email=email,
            responsavel="admin/sistema",
            detalhes=(
                f"Assinatura renovada. "
                f"Plano: {plano} | "
                f"Nova expiração: {resultado.get('expira_em')}"
            ),
        )

        resultado["mensagem"] = (
            "Assinatura renovada com sucesso."
        )

    return resultado


def rebaixar_assinaturas_vencidas():
    agora = agora_texto()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT
            id,
            email,
            plano,
            expira_em
        FROM usuarios
        WHERE plano IN ('mensal', 'anual')
          AND expira_em IS NOT NULL
          AND expira_em <= ?
        """,
        (agora,),
    )

    usuarios_vencidos = cursor.fetchall()

    if not usuarios_vencidos:
        conexao.close()

        return {
            "sucesso": True,
            "quantidade": 0,
            "usuarios": [],
        }

    ids_vencidos = [
        usuario[0]
        for usuario in usuarios_vencidos
    ]

    placeholders = ",".join(
        "?"
        for _ in ids_vencidos
    )

    cursor.execute(
        f"""
        UPDATE usuarios
        SET plano = 'gratis',
            status = 'ativo',
            expira_em = NULL
        WHERE id IN ({placeholders})
        """,
        ids_vencidos,
    )

    conexao.commit()
    conexao.close()

    usuarios_alterados = []

    for usuario in usuarios_vencidos:
        usuario_id = usuario[0]
        email = usuario[1]
        plano_anterior = usuario[2]
        expirava_em = usuario[3]

        registrar_auditoria(
            tipo="assinatura",
            acao="assinatura_vencida",
            usuario_email=email,
            responsavel="sistema",
            detalhes=(
                "Assinatura vencida automaticamente. "
                f"Plano anterior: {plano_anterior} | "
                f"Expirava em: {expirava_em} | "
                "Novo plano: gratis"
            ),
        )

        usuarios_alterados.append(
            {
                "id": usuario_id,
                "email": email,
                "plano_anterior": plano_anterior,
                "expirava_em": expirava_em,
                "plano_atual": "gratis",
                "status": "ativo",
            }
        )

    return {
        "sucesso": True,
        "quantidade": len(usuarios_alterados),
        "usuarios": usuarios_alterados,
    }