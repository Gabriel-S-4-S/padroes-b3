from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth.cadastro import cadastrar_usuario
from auth.conta import alterar_senha, obter_dados_conta
from auth.login import fazer_login
from auth.permissoes import obter_usuario_autenticado
from auth.recuperacao_senha import (
    redefinir_senha_com_token,
    solicitar_recuperacao_senha,
)

from emails.email_service import enviar_email_recuperacao
from usuarios.usuarios_db import buscar_usuario_por_email


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)


class CadastroRequest(BaseModel):
    nome: str
    email: str
    senha: str


class LoginRequest(BaseModel):
    email: str
    senha: str


class AlterarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str


class EsqueciSenhaRequest(BaseModel):
    email: str


class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str


@router.post("/cadastro")
def cadastro(dados: CadastroRequest):
    return cadastrar_usuario(
        nome=dados.nome,
        email=dados.email,
        senha=dados.senha,
    )


@router.post("/login")
def login(dados: LoginRequest):
    return fazer_login(
        email=dados.email,
        senha=dados.senha,
    )


@router.get("/me")
def minha_conta(
    usuario=Depends(obter_usuario_autenticado),
):
    return obter_dados_conta(
        email=usuario["email"],
    )


@router.post("/alterar-senha")
def trocar_senha(
    dados: AlterarSenhaRequest,
    usuario=Depends(obter_usuario_autenticado),
):
    return alterar_senha(
        email=usuario["email"],
        senha_atual=dados.senha_atual,
        nova_senha=dados.nova_senha,
    )


@router.post("/esqueci-senha")
def esqueci_senha(dados: EsqueciSenhaRequest):
    email = dados.email.strip().lower()

    resultado = solicitar_recuperacao_senha(
        email=email,
    )

    if not resultado.get("sucesso"):
        # Mantém a mensagem já produzida pelo serviço de recuperação.
        return resultado

    token = (
        resultado.get("token_temporario")
        or resultado.get("token")
        or resultado.get("token_recuperacao")
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "O token de recuperação foi criado, "
                "mas não pôde ser localizado na resposta."
            ),
        )

    usuario = buscar_usuario_por_email(email)

    if usuario is None:
        # Evita revelar detalhes desnecessários sobre contas.
        return {
            "sucesso": True,
            "mensagem": (
                "Caso exista uma conta com este e-mail, "
                "as instruções de recuperação serão enviadas."
            ),
        }

    nome_usuario = usuario[1]

    try:
        enviar_email_recuperacao(
            destinatario=email,
            nome=nome_usuario,
            token=token,
            minutos_validade=30,
        )

    except RuntimeError as erro:
        print(
            "Erro ao enviar e-mail de recuperação "
            f"para {email}: {erro}"
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "O token foi gerado, mas não foi possível enviar "
                "o e-mail neste momento. Tente novamente em instantes."
            ),
        )

    # Não devolvemos mais o token na resposta.
    return {
        "sucesso": True,
        "mensagem": (
            "Enviamos um link de recuperação para o seu e-mail. "
            "Verifique também a caixa de spam."
        ),
    }


@router.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenhaRequest):
    return redefinir_senha_com_token(
        token=dados.token,
        nova_senha=dados.nova_senha,
    )