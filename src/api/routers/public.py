from fastapi import APIRouter

from api.services import (
    obter_status,
    obter_oportunidade_gratis,
)

router = APIRouter()


@router.get("/")
def home():
    return {"mensagem": "API Padrões B3 funcionando"}


@router.get("/status")
def status():
    return obter_status()


@router.get("/gratis")
def gratis():
    return obter_oportunidade_gratis()