from typing import Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
from agents.state import AgentState
from config import settings
import logging
import json

logger = logging.getLogger(__name__)

class AgenteClasificador:
    """Agente que clasifica la intención del mensaje del usuario"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=settings.emergent_llm_key,
            session_id="clasificador",
            system_message="""Eres un asistente experto en clasificar intenciones de clientes en WhatsApp para una empresa de materiales de construcción en México.

Tu tarea es analizar el mensaje del cliente y clasificarlo en UNA de estas intenciones:

1. COTIZAR: El cliente quiere una cotización de productos (precio, presupuesto, cuánto cuesta)
2. STOCK: Pregunta sobre disponibilidad o inventario
3. SEGUIMIENTO: Da seguimiento a una cotización previa
4. FACTURA: Solicita factura o información fiscal
5. INFORMACION: Pregunta general sobre productos, características, usos
6. SALUDO: Saludo inicial o conversación casual
7. OTRO: Cualquier otra intención

Responde SOLO en formato JSON:
{
  "intencion": "COTIZAR",
  "confianza": 0.95,
  "razon": "El cliente menciona 'cuánto cuesta' y lista productos específicos"
}
"""
        ).with_model("openai", "gpt-4o")
    
    async def clasificar(self, state: AgentState) -> Dict[str, Any]:
        """Clasifica la intención del mensaje"""
        try:
            mensaje = state['mensaje']
            
            user_message = UserMessage(
                text=f"Mensaje del cliente: {mensaje}"
            )
            
            response = await self.chat.send_message(user_message)
            
            # Extraer JSON de la respuesta
            response_text = response.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            resultado = json.loads(response_text)
            
            logger.info(f"Intención clasificada: {resultado['intencion']} (confianza: {resultado['confianza']})")
            
            return {
                'intencion': resultado['intencion'],
                'confianza_intencion': resultado['confianza'],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['clasificador']
            }
            
        except Exception as e:
            logger.error(f"Error en clasificador: {str(e)}")
            return {
                'intencion': 'OTRO',
                'confianza_intencion': 0.5,
                'errores': state['errores'] + [f"Error clasificador: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['clasificador']
            }