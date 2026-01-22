from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class Usuario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    email: EmailStr
    nombre: str
    empresa_id: str
    empresa_nombre: str
    rol: str = 'admin'  # admin, usuario
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    empresa_nombre: str
    telefono: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    usuario: dict