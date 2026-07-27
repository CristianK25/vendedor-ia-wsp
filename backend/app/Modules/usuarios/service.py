import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlmodel import Session
import requests

from app.Core.Security.jwt import get_password_hash, verify_password, create_access_token
from app.Core.config import settings
from app.Modules.usuarios.model import Usuario, RefreshToken, UserRole, PasswordResetToken
from app.Modules.usuarios.repository import UsuarioRepository
from app.Modules.usuarios.schema import LoginRequest, RegisterRequest

class UsuarioService:
    def __init__(self, session: Session):
        self.repository = UsuarioRepository(session)

    def register(self, data: RegisterRequest) -> Usuario:
        # Verificar si el email ya existe
        existing = self.repository.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )

        hashed_pass = get_password_hash(data.password)
        new_user = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password_hash=hashed_pass,
            rol=UserRole.ADMIN  # Forzar admin por requerimiento
        )
        return self.repository.create_usuario(new_user)

    def login(self, data: LoginRequest):
        user = self.repository.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        # Generar Access Token
        access_token = create_access_token(
            data={"sub": user.email, "rol": user.rol.value}
        )

        # Generar Refresh Token
        refresh_token_str = secrets.token_hex(32)
        expire_at = datetime.now(timezone.utc) + timedelta(days=7)

        # Guardar en base de datos
        new_refresh = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            expires_at=expire_at
        )
        self.repository.create_refresh_token(new_refresh)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "user_email": user.email,
            "rol": user.rol.value
        }

    def logout(self, refresh_token_str: str):
        rt = self.repository.get_refresh_token(refresh_token_str)
        if rt:
            rt.is_revoked = True
            self.repository.update_refresh_token(rt)
        return {"message": "Sesión cerrada correctamente"}

    def refresh_session(self, old_token_str: str):
        rt = self.repository.get_refresh_token(old_token_str)
        if not rt or rt.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de refresco inválido o revocado"
            )

        # Normalizar tzinfo para comparación
        expires_at_utc = rt.expires_at
        if expires_at_utc.tzinfo is None:
            expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)

        if expires_at_utc < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de refresco expirado"
            )

        user = self.repository.get_by_id(rt.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo o inexistente"
            )

        # Rotación de Token: revocar el anterior
        rt.is_revoked = True
        self.repository.update_refresh_token(rt)

        # Generar nuevo par de tokens
        new_access = create_access_token(
            data={"sub": user.email, "rol": user.rol.value}
        )
        new_refresh_str = secrets.token_hex(32)
        new_expire_at = datetime.now(timezone.utc) + timedelta(days=7)

        new_rt = RefreshToken(
            token=new_refresh_str,
            user_id=user.id,
            expires_at=new_expire_at
        )
        self.repository.create_refresh_token(new_rt)

        return {
            "access_token": new_access,
            "refresh_token": new_refresh_str,
            "user_email": user.email,
            "rol": user.rol.value
        }

    def forgot_password(self, email: str):
        user = self.repository.get_by_email(email)
        if not user or not user.is_active:
            # Por seguridad, no revelamos si el correo existe o no
            return {"message": "Si el correo existe, se ha enviado un enlace de recuperación."}

        # Generar token de recuperación
        reset_token = secrets.token_urlsafe(32)
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        token_model = PasswordResetToken(
            token_hash=reset_token,
            user_id=user.id,
            expires_at=expire_at
        )
        self.repository.create_password_reset_token(token_model)

        # Enviar a n8n
        webhook_url = f"{settings.N8N_WEBHOOK_BASE_URL}/enviar-mail"
        frontend_url = "http://localhost:5173/reset-password"
        reset_link = f"{frontend_url}?token={reset_token}"
        
        payload = {
            "email": user.email,
            "reset_link": reset_link,
            "nombre": user.nombre
        }

        try:
            response = requests.post(webhook_url, json=payload, timeout=5)
            response.raise_for_status()
        except Exception as e:
            # Rollback: invalidamos el token si falló el envío
            print(f"Error al enviar correo por n8n: {e}")
            token_model.is_used = True
            self.repository.update_password_reset_token(token_model)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No se pudo enviar el correo de recuperación en este momento. Intente más tarde."
            )

        return {"message": "Si el correo existe, se ha enviado un enlace de recuperación."}

    def reset_password(self, token: str, new_password: str):
        token_model = self.repository.get_password_reset_token(token)
        
        if not token_model or token_model.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de recuperación es inválido o ya fue utilizado."
            )

        # Normalizar tzinfo para comparación
        expires_at_utc = token_model.expires_at
        if expires_at_utc.tzinfo is None:
            expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)

        if expires_at_utc < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de recuperación ha expirado."
            )

        user = self.repository.get_by_id(token_model.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inválido."
            )

        # Actualizar contraseña
        user.password_hash = get_password_hash(new_password)
        self.repository.update_usuario(user)

        # Invalidar el token
        token_model.is_used = True
        self.repository.update_password_reset_token(token_model)

        return {"message": "Contraseña actualizada exitosamente."}
