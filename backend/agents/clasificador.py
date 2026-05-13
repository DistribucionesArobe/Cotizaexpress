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
            system_message="""Eres un clasificador SIMPLE para CotizaBot. Tu trabajo es MUY sencillo.

Solo necesitas distinguir 3 casos:

1. CONFIRMAR: El usuario acepta/confirma una cotización previa
   - "sí", "si", "acepto", "confirmo", "va", "dale", "ok", "está bien", "sale"
   - SOLO cuando el historial muestra una cotización reciente pendiente de confirmar

2. METODO_PAGO: El usuario selecciona un método de pago
   - "1", "2", "mercado pago", "transferencia", "spei", "efectivo"
   - SOLO cuando el historial muestra que el bot preguntó por método de pago

3. OTRO: TODO lo demás va aquí. Esto incluye:
   - Saludos, preguntas, cotizaciones, disponibilidad, correcciones, especificaciones, quejas, etc.
   - El LLM principal se encarga de manejar todo esto inteligentemente

REGLA CLAVE: En caso de duda → OTRO. Solo usa CONFIRMAR o METODO_PAGO cuando estés MUY seguro por el contexto del historial.

Responde SOLO en JSON:
{"intencion": "OTRO", "confianza": 0.95, "razon": "Mensaje general, va al LLM principal"}
"""
        ).with_model("openai", "gpt-4o")
    
    async def clasificar(self, state: AgentState) -> Dict[str, Any]:
        """Clasifica la intención del mensaje"""
        try:
            mensaje = state['mensaje']
            historial = state.get('historial_cliente', [])
            
            # Construir contexto con historial reciente
            contexto = f"Mensaje actual del cliente: {mensaje}\n\n"
            
            # Si hay historial reciente, agregarlo para contexto
            if historial and len(historial) > 0:
                contexto += "Historial reciente de la conversación:\n"
                for msg in historial[-3:]:  # Últimos 3 mensajes
                    direccion = msg.get('direccion', '')
                    contenido = msg.get('contenido', '')
                    contexto += f"- {direccion}: {contenido}\n"
                contexto += "\nSi el mensaje actual parece ser una respuesta o continuación de una cotización en curso, clasifícalo como COTIZAR."
            
            user_message = UserMessage(
                text=contexto
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