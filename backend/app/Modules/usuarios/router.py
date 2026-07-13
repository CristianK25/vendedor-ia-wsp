from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session
from pydantic import BaseModel

from app.Core.database import get_session
from app.Core.Security.deps import get_current_active_user
from app.Modules.usuarios.model import Usuario
from app.Modules.usuarios.schema import LoginRequest, TokenResponse, UserProfile, ForgotPasswordRequest, ResetPasswordRequest
from app.Modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=TokenResponse)
def login(response: Response, data: LoginRequest, session: Session = Depends(get_session)):
    service = UsuarioService(session)
    token_data = service.login(data)
    
    # Establecer la cookie HttpOnly para el token de acceso
    # secure=True es recomendado, pero en desarrollo sobre HTTP plano puede requerir secure=False.
    # Usaremos secure=True por defecto para alinearnos al análisis de seguridad.
    response.set_cookie(
        key="access_token",
        value=token_data["access_token"],
        httponly=True,
        samesite="lax",
        secure=True
    )
    
    return TokenResponse(
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"]
    )

@router.post("/logout")
def logout(response: Response, data: RefreshRequest, session: Session = Depends(get_session)):
    service = UsuarioService(session)
    result = service.logout(data.refresh_token)
    response.delete_cookie("access_token")
    return result

@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, data: RefreshRequest, session: Session = Depends(get_session)):
    service = UsuarioService(session)
    token_data = service.refresh_session(data.refresh_token)
    
    response.set_cookie(
        key="access_token",
        value=token_data["access_token"],
        httponly=True,
        samesite="lax",
        secure=True
    )
    
    return TokenResponse(
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"]
    )

@router.get("/me", response_model=UserProfile)
def me(current_user: Usuario = Depends(get_current_active_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    service = UsuarioService(session)
    return service.forgot_password(data.email)

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, session: Session = Depends(get_session)):
    service = UsuarioService(session)
    return service.reset_password(data.token, data.new_password)
