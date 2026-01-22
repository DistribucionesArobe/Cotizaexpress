from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class Empresa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    nombre: str
    rfc: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    plan: str = 'demo'  # demo, pagado, cancelado
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    activo: bool = True
    fecha_pago: Optional[datetime] = None
    monto_mensual: float = 1000.0  # MXN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmpresaCreate(BaseModel):
    nombre: str
    rfc: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None