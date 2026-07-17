from datetime import datetime

from src.emails.email_service import (
    enviar_email_plano_vence_7_dias,
    enviar_email_plano_vence_amanha,
    enviar_email_plano_expirou,
)

from src.usuarios.usuarios_db import (
    listar_usuarios_para_verificar_vencimento,
    marcar_email_aviso_7_dias,
    marcar_email_aviso_1_dia,
    marcar_email_plano_expirado,
    cancelar_usuario,
)


def verificar_vencimentos() -> None:

    agora = datetime.now()

    usuarios = listar_usuarios_para_verificar_vencimento()

    for usuario in usuarios:

        if not usuario["expira_em"]:
            continue

        expira_em = datetime.fromisoformat(usuario["expira_em"])

        dias_restantes = (expira_em.date() - agora.date()).days

        # ------------------------------------
        # Vence em 7 dias
        # ------------------------------------

        if (
            dias_restantes == 7
            and not usuario["email_aviso_7_dias"]
        ):

            enviar_email_plano_vence_7_dias(
                usuario["email"],
                usuario["nome"],
            )

            marcar_email_aviso_7_dias(
                usuario["email"],
            )

            continue

        # ------------------------------------
        # Vence amanhã
        # ------------------------------------

        if (
            dias_restantes == 1
            and not usuario["email_aviso_1_dia"]
        ):

            enviar_email_plano_vence_amanha(
                usuario["email"],
                usuario["nome"],
            )

            marcar_email_aviso_1_dia(
                usuario["email"],
            )

            continue

        # ------------------------------------
        # Plano expirado
        # ------------------------------------

        if (
            dias_restantes < 0
            and not usuario["email_plano_expirado"]
        ):

            cancelar_usuario(
                usuario["email"],
            )

            enviar_email_plano_expirou(
                usuario["email"],
                usuario["nome"],
            )

            marcar_email_plano_expirado(
                usuario["email"],
            )