from datetime import datetime
import sqlite3
import uuid
from auth.senha import gerar_hash_senha
from banco.sqlite import conectar_banco

def agora_texto() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalizar_email(email: str) -> str:
    return email.strip().lower()


def criar_tabela_usuarios() -> None:
    """
    Cria a tabela de usuários e adiciona automaticamente
    as colunas necessárias para login com Google.

    As novas colunas foram adicionadas no final da tabela
    para preservar os índices usados nos registros antigos.
    """

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
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
            email_verificado INTEGER NOT NULL DEFAULT 0,

            google_id TEXT,
            provedor_login TEXT NOT NULL DEFAULT 'senha',
            foto_perfil TEXT
        )
        """
    )

    colunas_adicionais = [
        (
            "role",
            "TEXT NOT NULL DEFAULT 'usuario'",
        ),
        (
            "email_verificado",
            "INTEGER NOT NULL DEFAULT 0",
        ),
        (
            "google_id",
            "TEXT",
        ),
        (
            "provedor_login",
            "TEXT NOT NULL DEFAULT 'senha'",
        ),
        (
            "foto_perfil",
            "TEXT",
        ),
        (
            "email_aviso_7_dias",
            "INTEGER NOT NULL DEFAULT 0",
        ),
        (
            "email_aviso_1_dia",
            "INTEGER NOT NULL DEFAULT 0",
        ),
        (
            "email_plano_expirado",
            "INTEGER NOT NULL DEFAULT 0",
        ),
    ]

    for nome_coluna, definicao in colunas_adicionais:
        try:
            cursor.execute(
                f"""
                ALTER TABLE usuarios
                ADD COLUMN {nome_coluna} {definicao}
                """
            )
        except sqlite3.OperationalError as erro:
            # Ignora somente quando a coluna já existe.
            if "duplicate column name" not in str(erro).lower():
                conexao.close()
                raise

    cursor.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_usuarios_google_id
        ON usuarios(google_id)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_usuarios_email
        ON usuarios(email)
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS
        idx_usuarios_provedor_login
        ON usuarios(provedor_login)
        """
    )

    conexao.commit()
    conexao.close()


def criar_usuario(
    nome: str,
    email: str,
    senha: str,
    plano: str = "gratis",
    expira_em: str | None = None,
    role: str = "usuario",
) -> str:
    criar_tabela_usuarios()

    email_normalizado = normalizar_email(email)

    conexao = conectar_banco()
    cursor = conexao.cursor()

    senha_hash = gerar_hash_senha(senha)
    api_key = str(uuid.uuid4())

    cursor.execute(
        """
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
            email_verificado,
            google_id,
            provedor_login,
            foto_perfil
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            nome.strip(),
            email_normalizado,
            senha_hash,
            api_key,
            plano,
            "ativo",
            expira_em,
            agora_texto(),
            role,
            0,
            None,
            "senha",
            None,
        ),
    )

    conexao.commit()
    conexao.close()

    return api_key


def criar_usuario_google(
    *,
    nome: str,
    email: str,
    google_id: str,
    foto_perfil: str | None = None,
    plano: str = "gratis",
    role: str = "usuario",
) -> str:
    """
    Cria uma nova conta autenticada pelo Google.

    A tabela antiga exige senha_hash. Por compatibilidade,
    é criada uma senha interna aleatória que o usuário não
    conhece e não utiliza para fazer login.
    """

    criar_tabela_usuarios()

    email_normalizado = normalizar_email(email)
    google_id_normalizado = google_id.strip()

    if not google_id_normalizado:
        raise ValueError(
            "O identificador da conta Google é obrigatório."
        )

    senha_interna = str(uuid.uuid4())
    senha_hash = gerar_hash_senha(senha_interna)
    api_key = str(uuid.uuid4())

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO usuarios (
            nome,
            email,
            senha_hash,
            api_key,
            plano,
            status,
            expira_em,
            data_criacao,
            ultimo_login,
            role,
            email_verificado,
            google_id,
            provedor_login,
            foto_perfil
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            nome.strip(),
            email_normalizado,
            senha_hash,
            api_key,
            plano,
            "ativo",
            None,
            agora_texto(),
            agora_texto(),
            role,
            1,
            google_id_normalizado,
            "google",
            foto_perfil,
        ),
    )

    conexao.commit()
    conexao.close()

    return api_key


def buscar_usuario_por_email(
    email: str,
):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM usuarios
        WHERE email = ?
        LIMIT 1
        """,
        (normalizar_email(email),),
    )

    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def buscar_usuario_por_google_id(
    google_id: str,
):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM usuarios
        WHERE google_id = ?
        LIMIT 1
        """,
        (google_id.strip(),),
    )

    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def buscar_usuario_por_api_key(
    api_key: str,
):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM usuarios
        WHERE api_key = ?
        LIMIT 1
        """,
        (api_key,),
    )

    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def vincular_conta_google(
    *,
    email: str,
    google_id: str,
    nome: str | None = None,
    foto_perfil: str | None = None,
) -> bool:
    """
    Vincula uma conta Google a um usuário que já possui
    cadastro com e-mail e senha.

    O usuário continua podendo utilizar a senha existente
    e também passa a poder entrar com o Google.
    """

    criar_tabela_usuarios()

    email_normalizado = normalizar_email(email)
    google_id_normalizado = google_id.strip()

    if not google_id_normalizado:
        return False

    conexao = conectar_banco()
    cursor = conexao.cursor()

    if nome:
        cursor.execute(
            """
            UPDATE usuarios
            SET google_id = ?,
                provedor_login = 'google_e_senha',
                foto_perfil = ?,
                nome = ?,
                email_verificado = 1
            WHERE email = ?
            """,
            (
                google_id_normalizado,
                foto_perfil,
                nome.strip(),
                email_normalizado,
            ),
        )
    else:
        cursor.execute(
            """
            UPDATE usuarios
            SET google_id = ?,
                provedor_login = 'google_e_senha',
                foto_perfil = ?,
                email_verificado = 1
            WHERE email = ?
            """,
            (
                google_id_normalizado,
                foto_perfil,
                email_normalizado,
            ),
        )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def atualizar_dados_google(
    *,
    google_id: str,
    nome: str,
    email: str,
    foto_perfil: str | None,
) -> bool:
    """
    Atualiza nome, e-mail verificado e foto de uma conta
    Google já vinculada.
    """

    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET nome = ?,
            email = ?,
            foto_perfil = ?,
            email_verificado = 1
        WHERE google_id = ?
        """,
        (
            nome.strip(),
            normalizar_email(email),
            foto_perfil,
            google_id.strip(),
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def atualizar_ultimo_login(
    email: str,
) -> bool:
    conexao = None

    try:
        conexao = conectar_banco()

        # Espera no máximo um segundo caso o SQLite
        # esteja sendo utilizado por outro processo.
        conexao.execute(
            "PRAGMA busy_timeout = 1000"
        )

        cursor = conexao.cursor()

        cursor.execute(
            """
            UPDATE usuarios
            SET ultimo_login = ?
            WHERE email = ?
            """,
            (
                agora_texto(),
                normalizar_email(email),
            ),
        )

        conexao.commit()

        return cursor.rowcount > 0

    except sqlite3.OperationalError as erro:
        if conexao is not None:
            conexao.rollback()

        if "locked" in str(erro).lower():
            # O login não deve falhar somente porque não
            # foi possível registrar o horário.
            return False

        raise

    finally:
        if conexao is not None:
            conexao.close()


def alterar_plano(
    email: str,
    plano: str,
    expira_em: str | None = None,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET plano = ?,
            expira_em = ?,
            email_aviso_7_dias = 0,
            email_aviso_1_dia = 0,
            email_plano_expirado = 0
        WHERE email = ?
        """,
        (
            plano,
            expira_em,
            normalizar_email(email),
        ),
    )

    conexao.commit()
    conexao.close()

def resetar_avisos_vencimento(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET email_aviso_7_dias = 0,
            email_aviso_1_dia = 0,
            email_plano_expirado = 0
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def marcar_email_aviso_7_dias(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET email_aviso_7_dias = 1
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def marcar_email_aviso_1_dia(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET email_aviso_1_dia = 1
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def marcar_email_plano_expirado(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET email_plano_expirado = 1
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()

def ativar_usuario(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET status = 'ativo'
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def cancelar_usuario(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET status = 'cancelado'
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def definir_role(
    email: str,
    role: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET role = ?
        WHERE email = ?
        """,
        (
            role,
            normalizar_email(email),
        ),
    )

    conexao.commit()
    conexao.close()


def verificar_email(
    email: str,
) -> None:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET email_verificado = 1
        WHERE email = ?
        """,
        (normalizar_email(email),),
    )

    conexao.commit()
    conexao.close()


def usuario_esta_ativo(
    usuario,
) -> bool:
    if usuario is None:
        return False

    # Os campos antigos permanecem nas mesmas posições.
    status = usuario[6]
    expira_em = usuario[7]

    if status != "ativo":
        return False

    if expira_em is None:
        return True

    agora = datetime.now()

    try:
        data_expiracao = datetime.strptime(
            expira_em,
            "%Y-%m-%d %H:%M:%S",
        )
    except (TypeError, ValueError):
        return False

    return data_expiracao >= agora


def listar_usuarios() -> list[dict]:
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
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
            email_verificado,
            google_id,
            provedor_login,
            foto_perfil
        FROM usuarios
        ORDER BY id DESC
        """
    )

    usuarios = cursor.fetchall()
    conexao.close()

    resultado = []

    for usuario in usuarios:
        resultado.append(
            {
                "id": usuario[0],
                "nome": usuario[1],
                "email": usuario[2],
                "plano": usuario[3],
                "status": usuario[4],
                "expira_em": usuario[5],
                "data_criacao": usuario[6],
                "ultimo_login": usuario[7],
                "role": usuario[8],
                "email_verificado": bool(
                    usuario[9]
                ),
                "google_id": usuario[10],
                "provedor_login": usuario[11],
                "foto_perfil": usuario[12],
            }
        )

    return resultado

def listar_usuarios_para_verificar_vencimento() -> list[dict]:
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT
            id,
            nome,
            email,
            plano,
            status,
            expira_em,
            email_aviso_7_dias,
            email_aviso_1_dia,
            email_plano_expirado
        FROM usuarios
        WHERE plano IN ('mensal', 'anual')
          AND expira_em IS NOT NULL
        ORDER BY expira_em ASC
        """
    )

    usuarios = cursor.fetchall()
    conexao.close()

    return [
        {
            "id": usuario[0],
            "nome": usuario[1],
            "email": usuario[2],
            "plano": usuario[3],
            "status": usuario[4],
            "expira_em": usuario[5],
            "email_aviso_7_dias": bool(usuario[6]),
            "email_aviso_1_dia": bool(usuario[7]),
            "email_plano_expirado": bool(usuario[8]),
        }
        for usuario in usuarios
    ]

def alterar_senha_usuario(
    email: str,
    nova_senha: str,
) -> bool:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    nova_senha_hash = gerar_hash_senha(
        nova_senha
    )

    cursor.execute(
        """
        UPDATE usuarios
        SET senha_hash = ?
        WHERE email = ?
        """,
        (
            nova_senha_hash,
            normalizar_email(email),
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def buscar_usuario_por_id(
    usuario_id: int,
):
    criar_tabela_usuarios()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        SELECT *
        FROM usuarios
        WHERE id = ?
        LIMIT 1
        """,
        (usuario_id,),
    )

    usuario = cursor.fetchone()

    conexao.close()

    return usuario


def atualizar_dados_usuario(
    usuario_id: int,
    nome: str,
    email: str,
    role: str,
    email_verificado: bool,
) -> bool:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET nome = ?,
            email = ?,
            role = ?,
            email_verificado = ?
        WHERE id = ?
        """,
        (
            nome.strip(),
            normalizar_email(email),
            role,
            int(email_verificado),
            usuario_id,
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0


def redefinir_senha_admin(
    usuario_id: int,
    nova_senha: str,
) -> bool:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    nova_senha_hash = gerar_hash_senha(
        nova_senha
    )

    cursor.execute(
        """
        UPDATE usuarios
        SET senha_hash = ?
        WHERE id = ?
        """,
        (
            nova_senha_hash,
            usuario_id,
        ),
    )

    alterados = cursor.rowcount

    conexao.commit()
    conexao.close()

    return alterados > 0