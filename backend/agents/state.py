from typing import TypedDict, List, Optional, Dict, Any
from datetime import datetime

class AgentState(TypedDict):
    """Estado compartido entre todos los agentes del sistema"""
    # Mensaje del usuario
    mensaje: str
    cliente_telefono: str
    conversacion_id: str
    
    # Clasificación de intención
    intencion: Optional[str]  # cotizar, stock, seguimiento, factura, otro
    confianza_intencion: float
    
    # Contexto del cliente
    cliente_id: Optional[str]
    cliente_nombre: Optional[str]
    historial_cliente: List[Dict[str, Any]]
    
    # Contexto multi-tenant (empresa)
    empresa_id: Optional[str]
    empresa_context: Optional[Dict[str, Any]]
    
    # Contexto de cotización
    cotizacion_actual: Optional[Dict[str, Any]]
    productos_solicitados: List[Dict[str, Any]]
    
    # Respuestas de agentes
    respuesta_cotizador: Optional[str]
    respuesta_comercial: Optional[str]
    respuesta_operativo: Optional[str]
    respuesta_compliance: Optional[str]
    
    # Decisión final
    respuesta_final: str
    accion: Optional[str]  # enviar_cotizacion, enviar_mensaje, esperar_info
    
    # Metadatos
    agentes_ejecutados: List[str]
    errores: List[str]
    timestamp: str