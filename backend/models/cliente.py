from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone

class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    telefono: str
    nombre: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None
    rfc: Optional[str] = None
    direccion: Optional[str] = None
    total_cotizaciones: int = 0
    total_ventas: int = 0
    monto_total: float = 0.0
    historial_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClienteCreate(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None