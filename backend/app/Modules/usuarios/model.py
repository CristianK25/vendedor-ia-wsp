from datetime import datetime, timezone
from enum import Enum
from sqlmodel import SQLModel, Field
from typing import Optional

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    BOT = "BOT"
    STOCK = "STOCK"

class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    rol: UserRole = Field(default=UserRole.ADMIN)
    is_active: bool = Field(default=True)
    
    # Nuevos campos de trabajador integrados
    es_trabajador: bool = Field(default=False)
    telefono: Optional[str] = Field(default=None, max_length=50)
    rol_trabajador: Optional[str] = Field(default=None, max_length=100)
    recibe_notificaciones: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True, max_length=255)
    user_id: int = Field(foreign_key="usuarios.id")
    expires_at: datetime
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    token_hash: str = Field(index=True, unique=True, max_length=255)
    user_id: int = Field(foreign_key="usuarios.id")
    expires_at: datetime
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
