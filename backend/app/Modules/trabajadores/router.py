from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.trabajadores.service import TrabajadorService
from app.Modules.trabajadores.schema import TrabajadorCreate, TrabajadorUpdate, TrabajadorResponse

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])

@router.get("/", response_model=List[TrabajadorResponse])
def get_trabajadores(session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.get_all_trabajadores()

@router.post("/", response_model=TrabajadorResponse)
def create_trabajador(trabajador: TrabajadorCreate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.create_trabajador(trabajador)

@router.get("/{trabajador_id}", response_model=TrabajadorResponse)
def get_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.get_trabajador(trabajador_id)

@router.put("/{trabajador_id}", response_model=TrabajadorResponse)
def update_trabajador(trabajador_id: int, trabajador: TrabajadorUpdate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.update_trabajador(trabajador_id, trabajador)

@router.delete("/{trabajador_id}")
def delete_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.delete_trabajador(trabajador_id)
