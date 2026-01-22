from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class Producto(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    sku: str
    nombre: str
    categoria: str
    precio_base: float
    unidad: str = 'Pieza'
    margen_minimo: float = 0.15
    stock: float = 0.0
    activo: bool = True
    descripcion: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductoCreate(BaseModel):
    nombre: str
    categoria: str
    precio_base: float
    unidad: str = 'Pieza'
    margen_minimo: float = 0.15
    sku: Optional[str] = None
    stock: float = 0.0
    descripcion: Optional[str] = None