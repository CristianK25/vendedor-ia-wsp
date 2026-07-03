from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.promociones.service import PromocionService
from app.Modules.promociones.schema import PromocionCreate, PromocionUpdate, PromocionResponse

router = APIRouter(prefix="/promociones", tags=["Promociones"])

@router.get("/", response_model=List[PromocionResponse])
def get_promociones(session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.get_all_promociones()
    
@router.get("/activas", response_model=List[PromocionResponse])
def get_promociones_activas(session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.get_promociones_activas()

@router.post("/", response_model=PromocionResponse)
def create_promocion(promocion: PromocionCreate, session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.create_promocion(promocion)

@router.get("/{promocion_id}", response_model=PromocionResponse)
def get_promocion(promocion_id: int, session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.get_promocion(promocion_id)

@router.put("/{promocion_id}", response_model=PromocionResponse)
def update_promocion(promocion_id: int, promocion: PromocionUpdate, session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.update_promocion(promocion_id, promocion)

@router.delete("/{promocion_id}")
def delete_promocion(promocion_id: int, session: Session = Depends(get_session)):
    service = PromocionService(session)
    return service.delete_promocion(promocion_id)
