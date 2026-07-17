import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

CAMINHO_RAIZ = Path(__file__).resolve().parents[2]
CAMINHO_ENV = CAMINHO_RAIZ / ".env"

load_dotenv(CAMINHO_ENV)


EMAIL_REMETENTE = os.getenv("EMAIL_REMETENTE", "").strip()
EMAIL_SENHA_APP = os.getenv("EMAIL_SENHA_APP", "").replace(" ", "").strip()
EMAIL_SMTP_HOST = os.getenv(
    "EMAIL_SMTP_HOST",
    "smtp.gmail.com",
).strip()

EMAIL_SMTP_PORT = int(
    os.getenv(
        "EMAIL_SMTP_PORT",
        "465",
    )
)

URL_FRONTEND = os.getenv(
    "URL_FRONTEND",
    "http://localhost:3000",
).rstrip("/")

def validar_configuracao_email() -> None:
    campos_ausentes = []

    if not EMAIL_REMETENTE:
        campos_ausentes.append("EMAIL_REMETENTE")

    if not EMAIL_SENHA_APP:
        campos_ausentes.append("EMAIL_SENHA_APP")

    if not EMAIL_SMTP_HOST:
        campos_ausentes.append("EMAIL_SMTP_HOST")

    if campos_ausentes:
        campos = ", ".join(campos_ausentes)

        raise RuntimeError(
            f"Configuração de e-mail incompleta no .env: {campos}"
        )


def montar_link_redefinicao(token: str) -> str:
    return (
        f"{URL_FRONTEND}/cliente/redefinir-senha"
        f"?token={token}"
    )


def enviar_email_recuperacao(
    destinatario: str,
    nome: str,
    token: str,
    minutos_validade: int = 30,
) -> bool:
    validar_configuracao_email()

    destinatario = destinatario.strip().lower()
    nome = nome.strip() or "cliente"

    link_redefinicao = montar_link_redefinicao(token)

    mensagem = EmailMessage()

    mensagem["Subject"] = "Redefinição de senha — Padrões B3"
    mensagem["From"] = f"Padrões B3 <{EMAIL_REMETENTE}>"
    mensagem["To"] = destinatario

    mensagem.set_content(
        f"""
Olá, {nome}.

Recebemos uma solicitação para redefinir a senha da sua conta no Padrões B3.

Acesse o link abaixo para escolher uma nova senha:

{link_redefinicao}

Este link é válido por {minutos_validade} minutos.

Caso você não tenha solicitado a redefinição, ignore este e-mail.

Padrões B3
Análise estatística aplicada ao mercado.
""".strip()
    )

    mensagem.add_alternative(
        f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #05070b;
        font-family: Arial, Helvetica, sans-serif;
        color: #ffffff;
    "
>
    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="background-color: #05070b; padding: 32px 16px;"
    >
        <tr>
            <td align="center">
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                        max-width: 600px;
                        background-color: #07111f;
                        border: 1px solid #1e293b;
                        border-radius: 16px;
                        overflow: hidden;
                    "
                >
                    <tr>
                        <td
                            style="
                                padding: 32px;
                                border-bottom: 1px solid #1e293b;
                            "
                        >
                            <div
                                style="
                                    display: inline-block;
                                    background-color: #2563eb;
                                    color: #ffffff;
                                    font-weight: bold;
                                    border-radius: 10px;
                                    padding: 12px 14px;
                                    margin-right: 12px;
                                "
                            >
                                B3
                            </div>

                            <span
                                style="
                                    font-size: 20px;
                                    font-weight: bold;
                                    vertical-align: middle;
                                "
                            >
                                Padrões B3
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px;">
                            <p
                                style="
                                    margin: 0 0 12px;
                                    color: #60a5fa;
                                    font-size: 14px;
                                    font-weight: bold;
                                "
                            >
                                Recuperação de acesso
                            </p>

                            <h1
                                style="
                                    margin: 0 0 20px;
                                    font-size: 28px;
                                    line-height: 1.3;
                                "
                            >
                                Redefina sua senha
                            </h1>

                            <p
                                style="
                                    margin: 0 0 16px;
                                    color: #cbd5e1;
                                    font-size: 16px;
                                    line-height: 1.7;
                                "
                            >
                                Olá, {nome}.
                            </p>

                            <p
                                style="
                                    margin: 0 0 24px;
                                    color: #94a3b8;
                                    font-size: 15px;
                                    line-height: 1.7;
                                "
                            >
                                Recebemos uma solicitação para
                                redefinir a senha da sua conta.
                                Clique no botão abaixo para escolher
                                uma nova senha.
                            </p>

                            <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                            >
                                <tr>
                                    <td
                                        style="
                                            border-radius: 10px;
                                            background-color: #2563eb;
                                        "
                                    >
                                        <a
                                            href="{link_redefinicao}"
                                            style="
                                                display: inline-block;
                                                padding: 14px 24px;
                                                color: #ffffff;
                                                text-decoration: none;
                                                font-size: 15px;
                                                font-weight: bold;
                                            "
                                        >
                                            Redefinir minha senha
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p
                                style="
                                    margin: 24px 0 0;
                                    color: #64748b;
                                    font-size: 13px;
                                    line-height: 1.6;
                                "
                            >
                                Este link é válido por
                                {minutos_validade} minutos.
                            </p>

                            <p
                                style="
                                    margin: 24px 0 0;
                                    color: #64748b;
                                    font-size: 13px;
                                    line-height: 1.6;
                                "
                            >
                                Caso o botão não funcione, copie e cole
                                este endereço no navegador:
                            </p>

                            <p
                                style="
                                    margin: 8px 0 0;
                                    color: #60a5fa;
                                    font-size: 12px;
                                    line-height: 1.6;
                                    word-break: break-all;
                                "
                            >
                                {link_redefinicao}
                            </p>

                            <div
                                style="
                                    margin-top: 28px;
                                    padding-top: 20px;
                                    border-top: 1px solid #1e293b;
                                "
                            >
                                <p
                                    style="
                                        margin: 0;
                                        color: #64748b;
                                        font-size: 12px;
                                        line-height: 1.6;
                                    "
                                >
                                    Se você não solicitou esta
                                    redefinição, ignore este e-mail.
                                    Sua senha continuará a mesma.
                                </p>
                            </div>
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
            timeout=20,
        ) as servidor:
            servidor.login(
                EMAIL_REMETENTE,
                EMAIL_SENHA_APP,
            )

            servidor.send_message(mensagem)

        return True

    except smtplib.SMTPAuthenticationError as erro:
        raise RuntimeError(
            "O Gmail recusou a autenticação. "
            "Confirme o e-mail e a senha de app."
        ) from erro

    except smtplib.SMTPRecipientsRefused as erro:
        raise RuntimeError(
            "O endereço de e-mail do destinatário foi recusado."
        ) from erro

    except smtplib.SMTPException as erro:
        raise RuntimeError(
            f"Erro SMTP ao enviar o e-mail: {erro}"
        ) from erro

    except OSError as erro:
        raise RuntimeError(
            "Não foi possível conectar ao servidor do Gmail."
        ) from erro

def _enviar_email_plano(
    destinatario: str,
    nome: str,
    assunto: str,
    categoria: str,
    titulo: str,
    texto_principal: str,
    texto_secundario: str,
    texto_botao: str,
) -> bool:
    validar_configuracao_email()

    destinatario = destinatario.strip().lower()
    nome = nome.strip() or "cliente"

    link_planos = f"{URL_FRONTEND}/planos"

    mensagem = EmailMessage()

    mensagem["Subject"] = assunto
    mensagem["From"] = f"Padrões B3 <{EMAIL_REMETENTE}>"
    mensagem["To"] = destinatario

    mensagem.set_content(
        f"""
Olá, {nome}.

{texto_principal}

{texto_secundario}

Acesse:

{link_planos}

Equipe Padrões B3
""".strip()
    )

    mensagem.add_alternative(
        f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #05070b;
        font-family: Arial, Helvetica, sans-serif;
        color: #ffffff;
    "
>
    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
            background-color: #05070b;
            padding: 32px 16px;
        "
    >
        <tr>
            <td align="center">
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                        max-width: 600px;
                        background-color: #07111f;
                        border: 1px solid #1e293b;
                        border-radius: 16px;
                        overflow: hidden;
                    "
                >
                    <tr>
                        <td
                            style="
                                padding: 32px;
                                border-bottom: 1px solid #1e293b;
                            "
                        >
                            <div
                                style="
                                    display: inline-block;
                                    background-color: #2563eb;
                                    color: #ffffff;
                                    font-weight: bold;
                                    border-radius: 10px;
                                    padding: 12px 14px;
                                    margin-right: 12px;
                                "
                            >
                                B3
                            </div>

                            <span
                                style="
                                    font-size: 20px;
                                    font-weight: bold;
                                    vertical-align: middle;
                                "
                            >
                                Padrões B3
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px;">
                            <p
                                style="
                                    margin: 0 0 12px;
                                    color: #60a5fa;
                                    font-size: 14px;
                                    font-weight: bold;
                                "
                            >
                                {categoria}
                            </p>

                            <h1
                                style="
                                    margin: 0 0 20px;
                                    font-size: 28px;
                                    line-height: 1.3;
                                "
                            >
                                {titulo}
                            </h1>

                            <p
                                style="
                                    margin: 0 0 16px;
                                    color: #cbd5e1;
                                    font-size: 16px;
                                    line-height: 1.7;
                                "
                            >
                                Olá, {nome}.
                            </p>

                            <p
                                style="
                                    margin: 0 0 16px;
                                    color: #94a3b8;
                                    font-size: 15px;
                                    line-height: 1.7;
                                "
                            >
                                {texto_principal}
                            </p>

                            <p
                                style="
                                    margin: 0 0 24px;
                                    color: #94a3b8;
                                    font-size: 15px;
                                    line-height: 1.7;
                                "
                            >
                                {texto_secundario}
                            </p>

                            <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                            >
                                <tr>
                                    <td
                                        style="
                                            border-radius: 10px;
                                            background-color: #2563eb;
                                        "
                                    >
                                        <a
                                            href="{link_planos}"
                                            style="
                                                display: inline-block;
                                                padding: 14px 24px;
                                                color: #ffffff;
                                                text-decoration: none;
                                                font-size: 15px;
                                                font-weight: bold;
                                            "
                                        >
                                            {texto_botao}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p
                                style="
                                    margin: 24px 0 0;
                                    color: #64748b;
                                    font-size: 13px;
                                    line-height: 1.6;
                                "
                            >
                                Caso o botão não funcione, copie e cole
                                este endereço no navegador:
                            </p>

                            <p
                                style="
                                    margin: 8px 0 0;
                                    color: #60a5fa;
                                    font-size: 12px;
                                    line-height: 1.6;
                                    word-break: break-all;
                                "
                            >
                                {link_planos}
                            </p>

                            <div
                                style="
                                    margin-top: 28px;
                                    padding-top: 20px;
                                    border-top: 1px solid #1e293b;
                                "
                            >
                                <p
                                    style="
                                        margin: 0;
                                        color: #64748b;
                                        font-size: 12px;
                                        line-height: 1.6;
                                    "
                                >
                                    Padrões B3<br>
                                    Análise estatística aplicada ao mercado.
                                </p>
                            </div>
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
            timeout=20,
        ) as servidor:
            servidor.login(
                EMAIL_REMETENTE,
                EMAIL_SENHA_APP,
            )

            servidor.send_message(mensagem)

        return True

    except smtplib.SMTPAuthenticationError as erro:
        raise RuntimeError(
            "O Gmail recusou a autenticação. "
            "Confirme o e-mail e a senha de app."
        ) from erro

    except smtplib.SMTPRecipientsRefused as erro:
        raise RuntimeError(
            "O endereço de e-mail do destinatário foi recusado."
        ) from erro

    except smtplib.SMTPException as erro:
        raise RuntimeError(
            f"Erro SMTP ao enviar o e-mail: {erro}"
        ) from erro

    except OSError as erro:
        raise RuntimeError(
            "Não foi possível conectar ao servidor do Gmail."
        ) from erro


def enviar_email_plano_vence_7_dias(
    destinatario: str,
    nome: str,
) -> bool:
    return _enviar_email_plano(
        destinatario=destinatario,
        nome=nome,
        assunto="Seu plano vence em 7 dias — Padrões B3",
        categoria="Aviso de vencimento",
        titulo="Seu plano vence em 7 dias",
        texto_principal=(
            "Seu plano do Padrões B3 está próximo do vencimento."
        ),
        texto_secundario=(
            "Renove antecipadamente para continuar recebendo "
            "oportunidades e utilizando todos os recursos da "
            "plataforma sem interrupções."
        ),
        texto_botao="Renovar plano",
    )


def enviar_email_plano_vence_amanha(
    destinatario: str,
    nome: str,
) -> bool:
    return _enviar_email_plano(
        destinatario=destinatario,
        nome=nome,
        assunto="Seu plano vence amanhã — Padrões B3",
        categoria="Aviso de vencimento",
        titulo="Seu plano vence amanhã",
        texto_principal=(
            "Seu plano do Padrões B3 expira amanhã."
        ),
        texto_secundario=(
            "Renove agora para evitar a interrupção do acesso "
            "aos recursos exclusivos para assinantes."
        ),
        texto_botao="Renovar agora",
    )


def enviar_email_plano_expirou(
    destinatario: str,
    nome: str,
) -> bool:
    return _enviar_email_plano(
        destinatario=destinatario,
        nome=nome,
        assunto="Seu plano expirou — Padrões B3",
        categoria="Plano encerrado",
        titulo="Seu plano expirou",
        texto_principal=(
            "O período contratado do seu plano chegou ao fim."
        ),
        texto_secundario=(
            "Sua conta continua existindo normalmente, porém os "
            "recursos exclusivos para assinantes foram desativados. "
            "Para voltar a utilizar todos os recursos, basta renovar "
            "o plano."
        ),
        texto_botao="Reativar acesso",
    )