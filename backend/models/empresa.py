from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class DatosFiscales(BaseModel):
    """Datos fiscales para facturación CFDI"""
    rfc: Optional[str] = None
    razon_social: Optional[str] = None
    regimen_fiscal: Optional[str] = None  # Ej: "601 - General de Ley PM"
    uso_cfdi: Optional[str] = None  # Ej: "G03 - Gastos en general"
    codigo_postal: Optional[str] = None
    domicilio_fiscal: Optional[str] = None
    email_factura: Optional[str] = None

class Empresa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    nombre: str
    rfc: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    # Datos fiscales para CFDI
    datos_fiscales: Optional[DatosFiscales] = None
    # Plan y suscripción
    plan: str = 'gratis'  # gratis, completo, cancelado
    cotizaciones_usadas: int = 0
    cotizaciones_limite: int = 5
    subscription_status: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    # Twilio/WhatsApp
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    # Logo
    logo_path: Optional[str] = None
    logo_url: Optional[str] = None
    # Estado
    activo: bool = True
    fecha_pago: Optional[datetime] = None
    monto_mensual: float = 1000.0  # MXN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmpresaCreate(BaseModel):
    nombre: str
    rfc: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None