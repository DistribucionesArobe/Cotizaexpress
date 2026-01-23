from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class EstadoCotizacion(str, Enum):
    BORRADOR = 'borrador'
    ENVIADA = 'enviada'
    GANADA = 'ganada'
    PERDIDA = 'perdida'
    EXPIRADA = 'expirada'

class ItemCotizacion(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: float
    unidad: str
    precio_unitario: float
    descuento_pct: float = 0.0
    subtotal: float

class Cotizacion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    folio: str
    cliente_id: str
    cliente_nombre: str
    cliente_telefono: str
    empresa_id: Optional[str] = None
    items: List[ItemCotizacion]
    subtotal: float
    iva: float
    total: float
    margen: float
    estado: EstadoCotizacion = EstadoCotizacion.BORRADOR
    valida_hasta: datetime
    notas: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CotizacionCreate(BaseModel):
    cliente_telefono: str
    cliente_nombre: str
    items: List[ItemCotizacion]
    notas: Optional[str] = None