import html
import smtplib
from email.message import EmailMessage
from emails.email_service import (
    EMAIL_REMETENTE,
    EMAIL_SENHA_APP,
    EMAIL_SMTP_HOST,
    EMAIL_SMTP_PORT,
    URL_FRONTEND,
    validar_configuracao_email,
)


def formatar_decimal(valor):
    try:
        return f"{float(valor):.2f}".replace(
            ".",
            ",",
        )
    except (TypeError, ValueError):
        return "0,00"


def obter_valor(
    oportunidade,
    campo,
    padrao=None,
):
    try:
        valor = oportunidade[campo]
    except (KeyError, TypeError):
        return padrao

    if valor is None:
        return padrao

    try:
        if valor != valor:
            return padrao
    except Exception:
        pass

    if hasattr(valor, "item"):
        return valor.item()

    return valor


def enviar_email_oportunidade(
    *,
    destinatario: str,
    nome: str,
    oportunidade,
):
    validar_configuracao_email()

    acao = str(
        obter_valor(
            oportunidade,
            "acao",
            "Não informada",
        )
    )

    estrategia = str(
        obter_valor(
            oportunidade,
            "estrategia",
            "Não informada",
        )
    )

    horario_compra = str(
        obter_valor(
            oportunidade,
            "horario_compra",
            "Não informado",
        )
    )

    horario_venda = str(
        obter_valor(
            oportunidade,
            "horario_venda",
            "Não informado",
        )
    )

    horizonte_saida = obter_valor(
        oportunidade,
        "horizonte_saida",
        "Não informado",
    )

    taxa_acerto = formatar_decimal(
        obter_valor(
            oportunidade,
            "taxa_acerto",
            0,
        )
    )

    retorno_medio = formatar_decimal(
        obter_valor(
            oportunidade,
            "retorno_medio",
            0,
        )
    )

    score = formatar_decimal(
        obter_valor(
            oportunidade,
            "score",
            0,
        )
    )

    ocorrencias = obter_valor(
        oportunidade,
        "ocorrencias",
        0,
    )

    acertos = obter_valor(
        oportunidade,
        "acertos",
        0,
    )

    falhas = obter_valor(
        oportunidade,
        "falhas",
        0,
    )


    link_oportunidades = (
        f"{URL_FRONTEND}"
        "/cliente/dashboard/oportunidades"
    )

    mensagem = EmailMessage()

    mensagem["Subject"] = (
        f"Nova oportunidade em {acao} — Padrões B3"
    )

    mensagem["From"] = (
        f"Padrões B3 <{EMAIL_REMETENTE}>"
    )

    mensagem["To"] = destinatario

    mensagem.set_content(
        f"""
Olá, {nome}.

Uma nova oportunidade foi identificada pelo Padrões B3.

Ação: {acao}
Oportunidade: {estrategia}
Compra: fechamento das {horario_compra}
Venda: {horario_venda}
Horizonte de saída: {horizonte_saida} candle(s)
Taxa de acerto: {taxa_acerto}%
Retorno médio: {retorno_medio}%
Ocorrências: {ocorrencias}
Acertos: {acertos}
Falhas: {falhas}
Score: {score}/100


Acesse a plataforma:
{link_oportunidades}

As informações são baseadas em dados históricos e não
representam garantia de lucro ou recomendação individual
de investimento.
""".strip()
    )

    dados = [
        ("Ação", acao),
        ("Oportunidade", estrategia),
        (
            "Compra",
            f"Fechamento das {horario_compra}",
        ),
        ("Venda", horario_venda),
        (
            "Horizonte de saída",
            f"{horizonte_saida} candle(s)",
        ),
        ("Taxa de acerto", f"{taxa_acerto}%"),
        ("Retorno médio", f"{retorno_medio}%"),
        ("Ocorrências", ocorrencias),
        ("Acertos", acertos),
        ("Falhas", falhas),
        ("Score", f"{score}/100"),

    ]

    linhas_html = "".join(
        f"""
        <tr>
            <td style="
                padding: 12px;
                border-bottom: 1px solid #1e293b;
                color: #94a3b8;
                font-size: 13px;
            ">
                {html.escape(str(titulo))}
            </td>

            <td style="
                padding: 12px;
                border-bottom: 1px solid #1e293b;
                color: #ffffff;
                font-size: 14px;
                font-weight: bold;
                text-align: right;
            ">
                {html.escape(str(valor))}
            </td>
        </tr>
        """
        for titulo, valor in dados
    )

    mensagem.add_alternative(
        f"""
<!DOCTYPE html>
<html lang="pt-BR">
<body style="
    margin: 0;
    padding: 0;
    background: #05070b;
    font-family: Arial, Helvetica, sans-serif;
">
    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="padding: 32px 16px;"
    >
        <tr>
            <td align="center">
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                        max-width: 640px;
                        background: #07111f;
                        border: 1px solid #1e293b;
                        border-radius: 16px;
                    "
                >
                    <tr>
                        <td style="padding: 30px;">
                            <p style="
                                margin: 0;
                                color: #60a5fa;
                                font-size: 13px;
                                font-weight: bold;
                            ">
                                NOVA OPORTUNIDADE
                            </p>

                            <h1 style="
                                margin: 10px 0 0;
                                color: #ffffff;
                                font-size: 28px;
                            ">
                                {html.escape(acao)}
                            </h1>

                            <p style="
                                margin: 10px 0 0;
                                color: #94a3b8;
                                font-size: 15px;
                                line-height: 1.7;
                            ">
                                Olá, {html.escape(nome)}.
                                Uma nova oportunidade foi
                                identificada pelo scanner.
                            </p>

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                style="
                                    margin-top: 24px;
                                    border: 1px solid #1e293b;
                                    border-radius: 12px;
                                    overflow: hidden;
                                "
                            >
                                {linhas_html}
                            </table>

                            <div style="
                                margin-top: 24px;
                                text-align: center;
                            ">
                                <a
                                    href="{html.escape(link_oportunidades)}"
                                    style="
                                        display: inline-block;
                                        background: #2563eb;
                                        color: #ffffff;
                                        text-decoration: none;
                                        padding: 14px 24px;
                                        border-radius: 10px;
                                        font-size: 14px;
                                        font-weight: bold;
                                    "
                                >
                                    Ver oportunidade
                                </a>
                            </div>

                            <p style="
                                margin: 26px 0 0;
                                color: #64748b;
                                font-size: 12px;
                                line-height: 1.7;
                            ">
                                As informações são baseadas em
                                resultados estatísticos de dados
                                históricos e não representam
                                garantia de lucro ou recomendação
                                individual de investimento.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""".strip(),
        subtype="html",
    )

    try:
        with smtplib.SMTP_SSL(
            EMAIL_SMTP_HOST,
            EMAIL_SMTP_PORT,
            timeout=25,
        ) as servidor:
            servidor.login(
                EMAIL_REMETENTE,
                EMAIL_SENHA_APP,
            )

            servidor.send_message(mensagem)

        return True

    except smtplib.SMTPAuthenticationError as erro:
        raise RuntimeError(
            "O Gmail recusou a autenticação."
        ) from erro

    except smtplib.SMTPException as erro:
        raise RuntimeError(
            f"Erro SMTP ao enviar oportunidade: {erro}"
        ) from erro

    except OSError as erro:
        raise RuntimeError(
            "Não foi possível conectar ao Gmail."
        ) from erro