from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.etiquetas.service import EtiquetaService
from app.Modules.etiquetas.schema import EtiquetaCreate, EtiquetaUpdate, EtiquetaResponse

router = APIRouter(prefix="/etiquetas", tags=["Etiquetas"])

@router.get("/", response_model=List[EtiquetaResponse])
def get_etiquetas(session: Session = Depends(get_session)):
    service = EtiquetaService(session)
    return service.get_all_etiquetas()

@router.post("/", response_model=EtiquetaResponse)
def create_etiqueta(etiqueta: EtiquetaCreate, session: Session = Depends(get_session)):
    service = EtiquetaService(session)
    # The response needs cantidad_clientes which is 0 for newly created tags
    created = service.create_etiqueta(etiqueta)
    response_data = created.model_dump()
    response_data["cantidad_clientes"] = 0
    return response_data

@router.put("/{etiqueta_id}", response_model=EtiquetaResponse)
def update_etiqueta(etiqueta_id: int, etiqueta: EtiquetaUpdate, session: Session = Depends(get_session)):
    service = EtiquetaService(session)
    updated = service.update_etiqueta(etiqueta_id, etiqueta)
    
    # We need to return cantidad_clientes, we can fetch it again or just return 0 if frontend refetches
    # Fetching the count properly by doing a full get_all loop and finding this tag is one way
    all_tags = service.get_all_etiquetas()
    for tag in all_tags:
        if tag["id"] == updated.id:
            return tag
            
    response_data = updated.model_dump()
    response_data["cantidad_clientes"] = 0
    return response_data

@router.delete("/{etiqueta_id}")
def delete_etiqueta(etiqueta_id: int, session: Session = Depends(get_session)):
    service = EtiquetaService(session)
    return service.delete_etiqueta(etiqueta_id)
