from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.Core.database import get_session
from app.Core.Security.jwt import decode_token
from app.Modules.usuarios.model import Usuario, UserRole
from app.Modules.usuarios.repository import UsuarioRepository

class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str | None:
        # Extraer el token de la cookie HttpOnly
        token = request.cookies.get("access_token")
        if not token:
            # Fallback a buscar en el header Authorization
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split("Bearer ")[1]

        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return token

oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="api/auth/login", auto_error=True)

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception

    repository = UsuarioRepository(session)
    user = repository.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )
    return current_user

def require_role(allowed_roles: list[UserRole]):
    async def role_checker(
        current_user: Annotated[Usuario, Depends(get_current_active_user)],
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Se requiere uno de: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker

# Dependencia para requerir rol de administrador
require_admin = require_role([UserRole.ADMIN])

# Dependencia para requerir rol de bot o admin (n8n)
require_bot_or_admin = require_role([UserRole.ADMIN, UserRole.BOT])
