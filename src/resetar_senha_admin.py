from usuarios.usuarios_db import alterar_senha_usuario

EMAIL = "teste@padroesb3.com"
NOVA_SENHA = "Admin123456"

if alterar_senha_usuario(
    email=EMAIL,
    nova_senha=NOVA_SENHA,
):
    print("Senha alterada com sucesso!")
else:
    print("Não foi possível alterar a senha.")