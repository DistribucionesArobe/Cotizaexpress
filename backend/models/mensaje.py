from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum

class DireccionMensaje(str, Enum):
    ENTRANTE = 'entrante'
    SALIENTE = 'saliente'

class TipoMensaje(str, Enum):
    TEXTO = 'texto'
    MEDIA = 'media'
    PLANTILLA = 'plantilla'

class Mensaje(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    conversacion_id: str
    cliente_telefono: str
    direccion: DireccionMensaje
    contenido: str
    tipo: TipoMensaje = TipoMensaje.TEXTO
    media_url: Optional[str] = None
    wa_message_id: Optional[str] = None  # ID de mensaje de WhatsApp (360dialog)
    agente_procesador: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversacion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    estado: str = 'activa'
    intencion_actual: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))