from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers.public import router as public_router
from api.routers.premium import router as premium_router
from api.routers.auth import router as auth_router
from api.routers.assinaturas import router as assinaturas_router
from api.routers.admin.usuarios import router as admin_usuarios_router
from api.routers.admin.resumo import router as admin_resumo_router
from api.routers.admin.auditoria import router as admin_auditoria_router
from api.routers.admin.financeiro import (
    router as admin_financeiro_router,
)
from api.routers.admin.assinaturas import (
    router as admin_assinaturas_router,
)
from api.routers.admin.oportunidades import (
    router as admin_oportunidades_router,
)
from api.routers.admin.estrategias import (
    router as admin_estrategias_router,
)
from api.routers.cliente.oportunidades import (
    router as cliente_oportunidades_router,
)
from api.routers.planos import router as planos_router
from api.routers.assinaturas_cliente import (
    router as assinaturas_cliente_router,
)
from api.routers.pagamentos import (
    router as pagamentos_router,
)
from pagamentos.pagamentos_db import (
    criar_tabela_pagamentos,
)
from api.routers.admin.scheduler import (
    router as admin_scheduler_router,
)
from api.routers.admin.saude import (
    router as admin_saude_router,
)

app = FastAPI(
    title="Padrões B3 API",
    version="1.0.0",
    description="API oficial do sistema Padrões B3",
)


criar_tabela_pagamentos()


# Permite que o painel Next.js se comunique com a API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(public_router)
app.include_router(premium_router)
app.include_router(auth_router)
app.include_router(assinaturas_router)

app.include_router(admin_usuarios_router)
app.include_router(admin_resumo_router)
app.include_router(admin_auditoria_router)
app.include_router(admin_financeiro_router)
app.include_router(admin_assinaturas_router)
app.include_router(admin_oportunidades_router)
app.include_router(admin_estrategias_router)

app.include_router(cliente_oportunidades_router)
app.include_router(planos_router)
app.include_router(assinaturas_cliente_router)
app.include_router(pagamentos_router)
app.include_router(admin_scheduler_router)
app.include_router(admin_saude_router)