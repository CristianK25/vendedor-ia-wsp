from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlmodel import Session
from typing import Optional
from app.Core.database import get_session
from app.Core.Security.deps import get_current_active_user
from app.Modules.usuarios.model import Usuario
from app.Modules.gastos.service import GastoService
from app.Modules.gastos.schema import GastoCreate, GastoUpdate, GastoResponse, ResumenGastosVehiculo

router = APIRouter(prefix="/gastos", tags=["Gastos"])

@router.get("/vehiculo/{vehiculo_id}", response_model=ResumenGastosVehiculo)
def get_resumen_gastos(
    vehiculo_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = GastoService(session)
    return service.get_resumen_gastos(vehiculo_id)

@router.post("/vehiculo/{vehiculo_id}", response_model=GastoResponse)
async def crear_gasto(
    vehiculo_id: int,
    gasto: str = Form(...),
    archivo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = GastoService(session)
    gasto_data = GastoCreate.model_validate_json(gasto)
    gasto_db = await service.crear_gasto(
        vehiculo_id=vehiculo_id,
        gasto_data=gasto_data,
        archivo=archivo
    )
    
    return GastoResponse(
        id=gasto_db.id,
        vehiculo_id=gasto_db.vehiculo_id,
        fecha=gasto_db.fecha,
        categoria=gasto_db.categoria,
        monto=gasto_db.monto,
        proveedor=gasto_db.proveedor,
        factura_a=gasto_db.factura_a,
        comprobante_url=gasto_db.comprobante_url,
        fecha_hora_carga=gasto_db.fecha_hora_carga
    )

@router.put("/{gasto_id}", response_model=GastoResponse)
async def editar_gasto(
    gasto_id: int,
    gasto: str = Form(...),
    archivo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = GastoService(session)
    gasto_data = GastoUpdate.model_validate_json(gasto)
    gasto_db = await service.editar_gasto(
        gasto_id=gasto_id,
        gasto_data=gasto_data,
        archivo=archivo
    )
    
    return GastoResponse(
        id=gasto_db.id,
        vehiculo_id=gasto_db.vehiculo_id,
        fecha=gasto_db.fecha,
        categoria=gasto_db.categoria,
        monto=gasto_db.monto,
        proveedor=gasto_db.proveedor,
        factura_a=gasto_db.factura_a,
        comprobante_url=gasto_db.comprobante_url,
        fecha_hora_carga=gasto_db.fecha_hora_carga
    )

@router.delete("/{gasto_id}")
def eliminar_gasto(
    gasto_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = GastoService(session)
    service.eliminar_gasto(gasto_id)
    return {"message": "Gasto eliminado exitosamente"}
