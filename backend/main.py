from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from app.Core.database import engine
from app.Modules.usuarios.model import Usuario, RefreshToken, UserRole
from app.Core.Security.jwt import get_password_hash
from app.Modules.usuarios.router import router as auth_router
from app.Core.config import settings
from app.Core.Security.deps import require_admin, require_role
from app.Modules.resenas.model import Resena
from app.Modules.peticiones.model import Peticion

app = FastAPI(title="Vendedor IA API", description="API para el sistema de Vendedor IA y CRM de vehículos")

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        has_users = session.exec(select(Usuario)).first()
        if not has_users:
            print("Seeding default admin user...")
            admin_user = Usuario(
                nombre="Admin",
                apellido="Sistema",
                email=settings.INITIAL_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                rol=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            session.commit()
            print("Default admin user seeded successfully!")
            
        bot_user = session.exec(select(Usuario).where(Usuario.email == settings.INITIAL_BOT_EMAIL)).first()
        if not bot_user:
            print("Seeding default bot user...")
            bot_user = Usuario(
                nombre="Bot",
                apellido="n8n",
                email=settings.INITIAL_BOT_EMAIL,
                password_hash=get_password_hash(settings.INITIAL_BOT_PASSWORD),
                rol=UserRole.BOT,
                is_active=True
            )
            session.add(bot_user)
            session.commit()
            print("Default bot user seeded successfully!")

# Configure CORS for frontend access
cors_origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")] if settings.BACKEND_CORS_ORIGINS else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware CSRF personalizado
@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Protegemos métodos que modifican estado (POST, PUT, DELETE, PATCH)
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        # Solo bajo el prefijo /api
        if request.url.path.startswith("/api"):
            import logging
            logging.warning(f"DEBUG CSRF PATH IS EXACTLY: '{request.url.path}'")
            # Excluimos login público, endpoints de n8n, rutas públicas y reporte de logs
            if (
                not request.url.path.endswith("/auth/login")
                and not request.url.path.startswith("/api/n8n")
                and not "/api/public/" in request.url.path
                and not request.url.path.startswith("/api/logs")
            ):
                csrf_header = request.headers.get("x-vendedoria-crm-vehiculos")
                if csrf_header != "true":
                    logging.warning(f"DEBUG CSRF: Blocked by CSRF!")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Petición rechazada por validación de seguridad (CSRF)."}
                    )
    return await call_next(request)

# Servir imágenes subidas
os.makedirs("fotos", exist_ok=True)
app.mount("/fotos", StaticFiles(directory="fotos"), name="fotos")

os.makedirs("documentos", exist_ok=True)
app.mount("/documentos", StaticFiles(directory="documentos"), name="documentos")

os.makedirs("gastos", exist_ok=True)
app.mount("/gastos", StaticFiles(directory="gastos"), name="gastos")

os.makedirs("logs", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "API Vendedor IA is running"}

from app.Modules.vehiculos.router import router as vehiculos_router
from app.Modules.clientes.router import router as clientes_router
from app.Modules.trabajadores.router import router as trabajadores_router
from app.Modules.ventas.router import router as ventas_router
from app.Modules.citas.router import router as citas_router
from app.Modules.promociones.router import router as promociones_router
from app.Modules.etiquetas.router import router as etiquetas_router
from app.Modules.n8n.router import router as n8n_router
from app.Modules.peticiones.router import router as peticiones_router
from app.Modules.peticiones.public_router import router as peticiones_public_router
from app.Modules.gastos.router import router as gastos_router
from app.Modules.logs.router import router as logs_router

app.include_router(auth_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(vehiculos_router, prefix="/api", dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.STOCK]))])
app.include_router(clientes_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(trabajadores_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(ventas_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(citas_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(promociones_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(etiquetas_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(peticiones_router, prefix="/api")
app.include_router(peticiones_public_router, prefix="/api")
app.include_router(n8n_router, prefix="/api")
app.include_router(gastos_router, prefix="/api", dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.STOCK]))])
