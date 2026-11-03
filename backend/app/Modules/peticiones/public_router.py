from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlmodel import Session
from datetime import datetime
from zoneinfo import ZoneInfo

from app.Core.database import get_session
from app.Modules.peticiones.model import Peticion

router = APIRouter(prefix="/public/peticiones", tags=["Peticiones Public"])

def get_html_template(title: str, content: str, is_success: bool = True) -> str:
    color = "blue" if is_success else "red"
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4 font-sans text-gray-800">
        <div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-{color}-500">
            {content}
        </div>
    </body>
    </html>
    """

@router.get("/{peticion_id}", response_class=HTMLResponse)
def ver_peticion(peticion_id: int, token: str, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    
    if not peticion or peticion.token_confirmacion != token or not token:
        content = """
        <h1 class="text-2xl font-bold text-red-600 mb-2">Enlace no válido</h1>
        <p class="text-gray-600">Este enlace ha caducado, ya fue utilizado o es incorrecto.</p>
        """
        return HTMLResponse(content=get_html_template("Enlace inválido", content, False))
        
    if peticion.estado != "pendiente_cliente":
        content = """
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Petición ya procesada</h1>
        <p class="text-gray-600">Esta cita ya fue confirmada o cancelada anteriormente.</p>
        """
        return HTMLResponse(content=get_html_template("Petición procesada", content, False))

    mendoza_tz = ZoneInfo("America/Argentina/Mendoza")
    dt_local = peticion.fecha_propuesta.astimezone(mendoza_tz) if peticion.fecha_propuesta.tzinfo else peticion.fecha_propuesta
    fecha_str = dt_local.strftime("%d/%m/%Y a las %H:%M")
    vehiculo = peticion.vehiculo_modelo or "Consulta General"
    
    content = f"""
    <div class="mb-6">
        <svg class="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Propuesta de Cita</h1>
        <p class="text-gray-600">Hola <b>{peticion.cliente_nombre}</b>, el concesionario te propone el siguiente horario para tu visita:</p>
    </div>
    
    <div class="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
        <div class="mb-2"><span class="text-gray-500 text-sm">Día y Hora:</span><br><span class="font-bold text-lg text-blue-700">{fecha_str}hs</span></div>
        <div><span class="text-gray-500 text-sm">Vehículo de interés:</span><br><span class="font-semibold text-gray-700">{vehiculo}</span></div>
    </div>
    
    <div class="flex flex-col gap-3">
        <form method="POST" action="/api/public/peticiones/{peticion_id}/confirmar?token={token}">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors cursor-pointer">
                ✅ Sí, Confirmar Cita
            </button>
        </form>
        <form method="POST" action="/api/public/peticiones/{peticion_id}/rechazar?token={token}">
            <button type="submit" class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer">
                ❌ No, Cancelar
            </button>
        </form>
    </div>
    """
    
    return HTMLResponse(content=get_html_template("Confirmar Cita", content, True))

@router.post("/{peticion_id}/confirmar", response_class=HTMLResponse)
def confirmar_peticion_publica(peticion_id: int, token: str, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    
    if not peticion or peticion.token_confirmacion != token or not token:
        return HTMLResponse(content=get_html_template("Error", "<h1 class='text-xl font-bold text-red-600'>Enlace inválido o expirado.</h1>", False))
        
    if peticion.estado != "pendiente_cliente":
        return HTMLResponse(content=get_html_template("Error", "<h1 class='text-xl font-bold text-red-600'>La petición ya fue procesada.</h1>", False))

    from app.Modules.citas.service import CitaService
    from app.Modules.citas.schema import CitaCreate
    
    service = CitaService(session)
    cita_create = CitaCreate(
        cliente_telefono=peticion.cliente_telefono,
        fecha=peticion.fecha_propuesta,
        estado="confirmada",
        notas=f"Auto: {peticion.vehiculo_modelo or 'Consulta general'} (Confirmada vía web)"
    )
    service.create_cita(cita_create)
    
    peticion.estado = "completada"
    peticion.token_confirmacion = None # Destruimos el token
    session.add(peticion)
    session.commit()
    
    content = """
    <div class="mb-4">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">¡Cita Confirmada!</h1>
        <p class="text-gray-600">Te esperamos en la fecha y hora acordadas. Ya puedes cerrar esta página de forma segura.</p>
    </div>
    """
    return HTMLResponse(content=get_html_template("¡Confirmado!", content, True))

@router.post("/{peticion_id}/rechazar", response_class=HTMLResponse)
def rechazar_peticion_publica(peticion_id: int, token: str, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    
    if not peticion or peticion.token_confirmacion != token or not token:
        return HTMLResponse(content=get_html_template("Error", "<h1 class='text-xl font-bold text-red-600'>Enlace inválido o expirado.</h1>", False))
        
    if peticion.estado != "pendiente_cliente":
        return HTMLResponse(content=get_html_template("Error", "<h1 class='text-xl font-bold text-red-600'>La petición ya fue procesada.</h1>", False))

    peticion.estado = "cancelada"
    peticion.token_confirmacion = None # Destruimos el token
    session.add(peticion)
    session.commit()
    
    content = """
    <div class="mb-4">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Cita Cancelada</h1>
        <p class="text-gray-600">Has rechazado esta propuesta. Si deseas solicitar un nuevo turno en el futuro, no dudes en volver a escribirnos. Puedes cerrar esta ventana.</p>
    </div>
    """
    return HTMLResponse(content=get_html_template("Cancelado", content, True))
