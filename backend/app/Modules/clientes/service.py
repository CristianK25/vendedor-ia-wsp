import re
from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.clientes.repository import ClienteRepository
from app.Modules.clientes.model import Cliente
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate
from typing import Optional

def sanitizar_telefono(telefono: str) -> str:
    """
    Normaliza el número de teléfono al formato estándar internacional de WhatsApp.
    Para Argentina: 549 + 10 dígitos (ej: 5492614720339).
    """
    if not telefono:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El teléfono no puede estar vacío")
    
    # Dejar solo dígitos
    limpio = re.sub(r"\D", "", str(telefono).strip())
    
    if not limpio:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El número de teléfono es inválido")

    # Si empieza con 549 y tiene 13 dígitos, está perfecto
    if limpio.startswith("549") and len(limpio) == 13:
        return limpio
    
    # Si empieza con 54 (sin 9) y tiene 12 dígitos (ej: 542614720339) -> 5492614720339
    if limpio.startswith("54") and len(limpio) == 12:
        return f"549{limpio[2:]}"
        
    # Si empieza con 0 (ej: 0261...)
    if limpio.startswith("0"):
        limpio = limpio[1:]
        
    # Si tras quitar el 0 quedan 10 dígitos (ej: 2614720339), anteponemos 549
    if len(limpio) == 10:
        return f"549{limpio}"
        
    # Si tiene 12 dígitos y contiene '15' tras código de área de 2, 3 o 4 dígitos (ej: 261154720339)
    for area_len in [2, 3, 4]:
        if len(limpio) == 12 and limpio[area_len:area_len+2] == "15":
            sin_15 = limpio[:area_len] + limpio[area_len+2:]
            if len(sin_15) == 10:
                return f"549{sin_15}"

    # Si ya tiene entre 10 y 15 dígitos
    if 10 <= len(limpio) <= 15:
        if len(limpio) == 10:
            return f"549{limpio}"
        return limpio
        
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, 
        detail="El formato del teléfono no es válido. Debe tener entre 10 y 15 dígitos."
    )

class ClienteService:
    def __init__(self, session: Session):
        self.repository = ClienteRepository(session)

    def get_all_clientes(self, skip: int = 0, limit: int = 50, search: str = "", sort_by: str = "", sort_dir: str = "asc", etiqueta_id: Optional[int] = None):
        return self.repository.get_all(skip, limit, search, sort_by, sort_dir, etiqueta_id)

    def get_cliente(self, telefono: str):
        tel_normalizado = sanitizar_telefono(telefono)
        cliente = self.repository.get_by_telefono(tel_normalizado)
        if not cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        return cliente

    def create_cliente(self, cliente_data: ClienteCreate):
        tel_normalizado = sanitizar_telefono(cliente_data.telefono)
        if self.repository.get_by_telefono(tel_normalizado):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un cliente registrado con el número {tel_normalizado}")
        
        datos = cliente_data.model_dump()
        datos["telefono"] = tel_normalizado
        cliente = Cliente(**datos)
        return self.repository.create(cliente)

    def update_cliente(self, telefono: str, cliente_data: ClienteUpdate):
        cliente = self.get_cliente(telefono)
        update_data = cliente_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cliente, key, value)
        return self.repository.update(cliente)

