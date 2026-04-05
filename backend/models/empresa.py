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

class DatosBancarios(BaseModel):
    """Datos bancarios para pagos SPEI"""
    banco: Optional[str] = None
    beneficiario: Optional[str] = None
    clabe: Optional[str] = None
    cuenta: Optional[str] = None

class ConfigCobros(BaseModel):
    """Configuración de métodos de cobro"""
    mercadopago_enabled: bool = False
    mercadopago_access_token: Optional[str] = None
    spei_enabled: bool = False
    datos_bancarios: Optional[DatosBancarios] = None

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
    # Planes: completo ($1,160/mes), pro ($2,000/mes con cobros)
    plan: str = 'pendiente'
    cotizaciones_usadas: int = 0
    cotizaciones_limite: int = 0
    subscription_status: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    # Configuración de cobros (Plan Pro)
    config_cobros: Optional[ConfigCobros] = None
    datos_bancarios: Optional[DatosBancarios] = None
    # WhatsApp (360dialog)
    codigo_whatsapp: Optional[str] = None
    whatsapp_link: Optional[str] = None
    whatsapp_qr_url: Optional[str] = None
    whatsapp_welcome_message: Optional[str] = None
    ai_prompt: Optional[str] = None
    ai_tone: Optional[str] = 'profesional'
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