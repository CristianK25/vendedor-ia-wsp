from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: EmailStr
    rol: str
    is_active: bool
    es_trabajador: bool
    telefono: Optional[str] = None
    rol_trabajador: Optional[str] = None
    recibe_notificaciones: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    rol: str
    es_trabajador: bool = False
    telefono: Optional[str] = None
    rol_trabajador: Optional[str] = None
    recibe_notificaciones: bool = True

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    es_trabajador: Optional[bool] = None
    telefono: Optional[str] = None
    rol_trabajador: Optional[str] = None
    recibe_notificaciones: Optional[bool] = None
    is_active: Optional[bool] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
