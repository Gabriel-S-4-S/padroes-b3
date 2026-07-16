from datetime import datetime
import uuid

from banco.sqlite import conectar_banco
from auth.senha import gerar_hash_senha
import sqlite3
import time

def criar_tabela_usuarios():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            api_key TEXT NOT NULL UNIQUE,
            plano TEXT NOT NULL DEFAULT 'gratis',
            status TEXT NOT NULL DEFAULT 'ativo',
            expira_em TEXT,
            data_criacao TEXT NOT NULL,
            ultimo_login TEXT,
            role TEXT NOT NULL DEFAULT 'usuario',
            email_verificado INTEGER NOT NULL DEFAULT 0
        )
    """)

    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN role TEXT NOT NULL DEFAULT 'usuario'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN email_verificado INTEGER NOT NULL DEFAULT 0")
    except Exception:
        pass

    conexao.commit()
    conexao.close()


def criar_usuario(nome, email, senha, plano="gratis", expira_em=None, role="usuario"):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    senha_hash = gerar_hash_senha(senha)
    api_key = str(uuid.uuid4())
    data_criacao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO usuarios (
            nome,
            email,
            senha_hash,
            api_key,
            plano,
            status,
            expira_em,
            data_criacao,
            role,
            email_verificado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        nome,
        email,
        senha_hash,
        api_key,
        plano,
        "ativo",
        expira_em,
        data_criacao,
        role,
        0,
    ))

    conexao.commit()
    conexao.close()

    return api_key


def buscar_usuario_por_email(email):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT *
        FROM usuarios
        WHERE email = ?
    """, (email,))

    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def buscar_usuario_por_api_key(api_key):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT *
        FROM usuarios
        WHERE api_key = ?
    """, (api_key,))

    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def atualizar_ultimo_login(email: str) -> bool:
    conexao = None

    try:
        agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conexao = conectar_banco()

        # Espera no máximo 1 segundo se o SQLite estiver ocupado.
        conexao.execute("PRAGMA busy_timeout = 1000")

        cursor = conexao.cursor()

        cursor.execute("""
            UPDATE usuarios
            SET ultimo_login = ?
            WHERE email = ?
        """, (
            agora,
            email,
        ))

        conexao.commit()
        return cursor.rowcount > 0

    except sqlite3.OperationalError as erro:
        if conexao is not None:
            conexao.rollback()

        if "locked" in str(erro).lower():
            # Não bloqueia o login apenas por não registrar o horário.
            return False

        raise

    finally:
        if conexao is not None:
            conexao.close()


def alterar_plano(email, plano, expira_em=None):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET plano = ?,
            expira_em = ?
        WHERE email = ?
    """, (plano, expira_em, email))

    conexao.commit()
    conexao.close()


def ativar_usuario(email):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET status = 'ativo'
        WHERE email = ?
    """, (email,))

    conexao.commit()
    conexao.close()


def cancelar_usuario(email):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET status = 'cancelado'
        WHERE email = ?
    """, (email,))

    conexao.commit()
    conexao.close()


def definir_role(email, role):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET role = ?
        WHERE email = ?
    """, (role, email))

    conexao.commit()
    conexao.close()


def verificar_email(email):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET email_verificado = 1
        WHERE email = ?
    """, (email,))

    conexao.commit()
    conexao.close()


def usuario_esta_ativo(usuario):
    if usuario is None:
        return False

    status = usuario[6]
    expira_em = usuario[7]

    if status != "ativo":
        return False

    if expira_em is None:
        return True

    agora = datetime.now()
    data_expiracao = datetime.strptime(expira_em, "%Y-%m-%d %H:%M:%S")

    return data_expiracao >= agora


def listar_usuarios():
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT 
            id,
            nome,
            email,
            plano,
            status,
            expira_em,
            data_criacao,
            ultimo_login,
            role,
            email_verificado
        FROM usuarios
        ORDER BY id DESC
    """)

    usuarios = cursor.fetchall()
    conexao.close()

    resultado = []

    for usuario in usuarios:
        resultado.append({
            "id": usuario[0],
            "nome": usuario[1],
            "email": usuario[2],
            "plano": usuario[3],
            "status": usuario[4],
            "expira_em": usuario[5],
            "data_criacao": usuario[6],
            "ultimo_login": usuario[7],
            "role": usuario[8],
            "email_verificado": bool(usuario[9]),
        })

    return resultado

def alterar_senha_usuario(email: str, nova_senha: str):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    nova_senha_hash = gerar_hash_senha(nova_senha)

    cursor.execute("""
        UPDATE usuarios
        SET senha_hash = ?
        WHERE email = ?
    """, (
        nova_senha_hash,
        email,
    ))

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0

def buscar_usuario_por_id(usuario_id: int):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT *
        FROM usuarios
        WHERE id = ?
    """, (usuario_id,))

    usuario = cursor.fetchone()

    conexao.close()
    return usuario


def atualizar_dados_usuario(
    usuario_id: int,
    nome: str,
    email: str,
    role: str,
    email_verificado: bool,
):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE usuarios
        SET nome = ?,
            email = ?,
            role = ?,
            email_verificado = ?
        WHERE id = ?
    """, (
        nome,
        email,
        role,
        int(email_verificado),
        usuario_id,
    ))

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def redefinir_senha_admin(
    usuario_id: int,
    nova_senha: str,
):
    conexao = conectar_banco()
    cursor = conexao.cursor()

    nova_senha_hash = gerar_hash_senha(nova_senha)

    cursor.execute("""
        UPDATE usuarios
        SET senha_hash = ?
        WHERE id = ?
    """, (
        nova_senha_hash,
        usuario_id,
    ))

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0