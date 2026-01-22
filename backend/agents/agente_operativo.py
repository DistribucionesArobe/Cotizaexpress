from typing import Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
from agents.state import AgentState
from config import settings
from database import productos_collection
import logging

logger = logging.getLogger(__name__)

class AgenteOperativo:
    """Agente que maneja consultas de stock, tiempos de entrega y logística"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=settings.emergent_llm_key,
            session_id="operativo",
            system_message="""Eres un agente operativo para una empresa de materiales de construcción.

Tu trabajo es:
1. Consultar disponibilidad de productos
2. Informar tiempos de entrega
3. Sugerir alternativas si no hay stock
4. Coordinar logística

Siempre respondes de forma clara y profesional en español.
"""
        ).with_model("openai", "gpt-4o")
    
    async def procesar(self, state: AgentState) -> Dict[str, Any]:
        """Procesa consultas operativas"""
        try:
            mensaje = state['mensaje']
            intencion = state.get('intencion', '')
            
            if intencion != 'STOCK':
                # No es una consulta de stock
                return {
                    'respuesta_operativo': None,
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['operativo']
                }
            
            # Obtener productos con stock
            productos_db = await productos_collection.find(
                {'activo': True},
                {'_id': 0, 'nombre': 1, 'stock': 1, 'categoria': 1}
            ).to_list(100)
            
            user_message = UserMessage(
                text=f"""El cliente pregunta: {mensaje}

Inventario actual (productos con stock > 0):
{
    chr(10).join([f"- {p['nombre']}: {p['stock']} unidades disponibles" for p in productos_db if p.get('stock', 0) > 0])
}

Genera una respuesta útil sobre disponibilidad."""
            )
            
            response = await self.chat.send_message(user_message)
            
            logger.info("Agente operativo procesó consulta de stock")
            
            return {
                'respuesta_operativo': response,
                'respuesta_final': response,
                'accion': 'enviar_mensaje',
                'agentes_ejecutados': state['agentes_ejecutados'] + ['operativo']
            }
            
        except Exception as e:
            logger.error(f"Error en operativo: {str(e)}")
            return {
                'respuesta_operativo': 'Ocurrió un error consultando el inventario.',
                'errores': state['errores'] + [f"Error operativo: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['operativo']
            }