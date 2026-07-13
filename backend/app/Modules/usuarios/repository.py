from typing import Optional
from sqlmodel import Session, select
from app.Modules.usuarios.model import Usuario, RefreshToken

class UsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> Optional[Usuario]:
        statement = select(Usuario).where(Usuario.email == email)
        return self.session.exec(statement).first()

    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        return self.session.get(Usuario, user_id)

    def create_usuario(self, usuario: Usuario) -> Usuario:
        self.session.add(usuario)
        self.session.commit()
        self.session.refresh(usuario)
        return usuario

    def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        statement = select(RefreshToken).where(RefreshToken.token == token)
        return self.session.exec(statement).first()

    def create_refresh_token(self, refresh_token: RefreshToken) -> RefreshToken:
        self.session.add(refresh_token)
        self.session.commit()
        self.session.refresh(refresh_token)
        return refresh_token

    def update_refresh_token(self, refresh_token: RefreshToken) -> RefreshToken:
        self.session.add(refresh_token)
        self.session.commit()
        return refresh_token

    def create_password_reset_token(self, token_model: 'PasswordResetToken') -> 'PasswordResetToken':
        self.session.add(token_model)
        self.session.commit()
        return token_model

    def get_password_reset_token(self, token_hash: str) -> Optional['PasswordResetToken']:
        from app.Modules.usuarios.model import PasswordResetToken
        statement = select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        return self.session.exec(statement).first()

    def update_password_reset_token(self, token_model: 'PasswordResetToken') -> 'PasswordResetToken':
        self.session.add(token_model)
        self.session.commit()
        return token_model

    def update_usuario(self, usuario: Usuario) -> Usuario:
        self.session.add(usuario)
        self.session.commit()
        return usuario
