from typing import TypedDict, List, Optional, Dict, Any
from datetime import datetime

class AgentState(TypedDict):
    """Estado compartido entre todos los agentes del sistema"""
    # Mensaje del usuario
    mensaje: str
    cliente_telefono: str
    conversacion_id: str
    
    # Clasificación de intención
    intencion: Optional[str]  # cotizar, stock, seguimiento, factura, confirmar, metodo_pago, otro
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
    respuesta_cobros: Optional[str]  # Nueva: respuesta del agente de cobros
    
    # Contexto de cobros/pagos
    metodos_disponibles: Optional[List[str]]  # métodos de pago disponibles
    link_pago: Optional[str]  # link de Mercado Pago generado
    folio: Optional[str]  # folio de la cotización/pago
    
    # Decisión final
    respuesta_final: str
    accion: Optional[str]  # enviar_cotizacion, enviar_mensaje, esperar_info, esperando_metodo_pago, link_pago_enviado
    
    # Metadatos
    agentes_ejecutados: List[str]
    errores: List[str]
    timestamp: str