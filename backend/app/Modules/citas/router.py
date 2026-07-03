from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.citas.service import CitaService
from app.Modules.citas.schema import CitaCreate, CitaUpdate, CitaResponse

router = APIRouter(prefix="/citas", tags=["Citas"])

@router.get("/", response_model=List[CitaResponse])
def get_citas(session: Session = Depends(get_session)):
    service = CitaService(session)
    return service.get_all_citas()

@router.post("/", response_model=CitaResponse)
def create_cita(cita: CitaCreate, session: Session = Depends(get_session)):
    service = CitaService(session)
    return service.create_cita(cita)

@router.get("/{cita_id}", response_model=CitaResponse)
def get_cita(cita_id: int, session: Session = Depends(get_session)):
    service = CitaService(session)
    return service.get_cita(cita_id)

@router.put("/{cita_id}", response_model=CitaResponse)
def update_cita(cita_id: int, cita: CitaUpdate, session: Session = Depends(get_session)):
    service = CitaService(session)
    return service.update_cita(cita_id, cita)

@router.delete("/{cita_id}")
def delete_cita(cita_id: int, session: Session = Depends(get_session)):
    service = CitaService(session)
    return service.delete_cita(cita_id)
