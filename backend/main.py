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
from app.Core.Security.deps import require_admin

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
                email="admin@vendedor.com",
                password_hash=get_password_hash("admin123"),
                rol=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            session.commit()
            print("Default admin user seeded successfully!")
            
        bot_user = session.exec(select(Usuario).where(Usuario.email == "bot@vendedor.com")).first()
        if not bot_user:
            print("Seeding default bot user...")
            bot_user = Usuario(
                nombre="Bot",
                apellido="n8n",
                email="bot@vendedor.com",
                password_hash=get_password_hash("bot1234"),
                rol=UserRole.BOT,
                is_active=True
            )
            session.add(bot_user)
            session.commit()
            print("Default bot user seeded successfully!")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
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
            # Excluimos login público y endpoints de n8n (tienen seguridad interna)
            if not request.url.path.endswith("/auth/login") and not request.url.path.startswith("/api/n8n"):
                csrf_header = request.headers.get("x-vendedoria-crm-vehiculos")
                if csrf_header != "true":
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Petición rechazada por validación de seguridad (CSRF)."}
                    )
    return await call_next(request)

# Servir imágenes subidas
os.makedirs("fotos", exist_ok=True)
app.mount("/fotos", StaticFiles(directory="fotos"), name="fotos")

@app.get("/")
def read_root():
    return {"message": "API Vendedor IA is running"}

from app.Modules.vehiculos.router import router as vehiculos_router
from app.Modules.clientes.router import router as clientes_router
from app.Modules.trabajadores.router import router as trabajadores_router
from app.Modules.ventas.router import router as ventas_router
from app.Modules.citas.router import router as citas_router
from app.Modules.promociones.router import router as promociones_router
from app.Modules.n8n.router import router as n8n_router

app.include_router(auth_router, prefix="/api")
app.include_router(vehiculos_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(clientes_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(trabajadores_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(ventas_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(citas_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(promociones_router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(n8n_router, prefix="/api")
