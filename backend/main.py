from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.Core.database import engine

app = FastAPI(title="Vendedor IA API", description="API para el sistema de Vendedor IA y CRM de vehículos")

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(vehiculos_router, prefix="/api")
app.include_router(clientes_router, prefix="/api")
app.include_router(trabajadores_router, prefix="/api")
app.include_router(ventas_router, prefix="/api")
app.include_router(citas_router, prefix="/api")
app.include_router(promociones_router, prefix="/api")
