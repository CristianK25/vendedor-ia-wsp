from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.clientes.service import ClienteService
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=List[ClienteResponse])
def get_clientes(session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.get_all_clientes()

@router.post("/", response_model=ClienteResponse)
def create_cliente(cliente: ClienteCreate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.create_cliente(cliente)

@router.get("/{telefono}", response_model=ClienteResponse)
def get_cliente(telefono: str, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.get_cliente(telefono)

@router.put("/{telefono}", response_model=ClienteResponse)
def update_cliente(telefono: str, cliente: ClienteUpdate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.update_cliente(telefono, cliente)
