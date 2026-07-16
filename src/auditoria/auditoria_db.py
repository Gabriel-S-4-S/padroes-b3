from datetime import datetime

from banco.sqlite import conectar_banco


def criar_tabela_auditoria():
    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            acao TEXT NOT NULL,
            usuario_email TEXT,
            responsavel TEXT,
            detalhes TEXT,
            data_criacao TEXT NOT NULL
        )
    """)

    conexao.commit()
    conexao.close()


def registrar_auditoria(
    tipo: str,
    acao: str,
    usuario_email: str = None,
    responsavel: str = "sistema",
    detalhes: str = None,
):
    criar_tabela_auditoria()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    data_criacao = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO auditoria (
            tipo,
            acao,
            usuario_email,
            responsavel,
            detalhes,
            data_criacao
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        tipo,
        acao,
        usuario_email,
        responsavel,
        detalhes,
        data_criacao,
    ))

    conexao.commit()
    conexao.close()


def listar_auditoria(limite=100):
    criar_tabela_auditoria()

    conexao = conectar_banco()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            tipo,
            acao,
            usuario_email,
            responsavel,
            detalhes,
            data_criacao
        FROM auditoria
        ORDER BY id DESC
        LIMIT ?
    """, (limite,))

    registros = cursor.fetchall()
    conexao.close()

    resultado = []

    for item in registros:
        resultado.append({
            "id": item[0],
            "tipo": item[1],
            "acao": item[2],
            "usuario_email": item[3],
            "responsavel": item[4],
            "detalhes": item[5],
            "data_criacao": item[6],
        })

    return resultado