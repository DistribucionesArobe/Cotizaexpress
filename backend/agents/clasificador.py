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
            system_message="""Eres un clasificador de intenciones para CotizaBot, un asistente de ventas por WhatsApp.

Tu trabajo es interpretar LA INTENCIÓN del usuario, no la forma exacta de su mensaje.
Los usuarios escriben mal, usan sinónimos, abrevian y no dan datos completos. ESO ES NORMAL.

REGLA DE ORO: Asume intención de COTIZAR cuando el usuario mencione:
- "precio", "cuánto cuesta", "info", "material", "necesito", "barato"
- Nombres de productos (aunque estén mal escritos)
- Usos o problemas ("para una pared", "se me rompió", "necesito arreglar")

INTENCIONES POSIBLES:
1. COTIZAR: Quiere precio, producto, material, cotización, presupuesto
2. CONFIRMAR: Dice "sí", "si", "acepto", "confirmo", "va", "dale", "ok", "está bien"
3. METODO_PAGO: Selecciona pago "1", "2", "mercado pago", "transferencia", "spei"
4. STOCK: Pregunta si hay disponible, si tienen, cuántos quedan
5. SEGUIMIENTO: Da seguimiento a cotización previa, pregunta por pedido
6. FACTURA: Pide factura, RFC, datos fiscales
7. SALUDO: Solo saluda sin pedir nada específico
8. OTRO: Cualquier otra cosa

IMPORTANTE:
- Si el historial muestra una cotización reciente y el usuario dice "sí/ok/va" → CONFIRMAR
- Si el historial pregunta método de pago y responde "1" o "2" → METODO_PAGO
- Errores de escritura como "tablarok", "sement", "variya" → COTIZAR
- "cuánto sale", "a cómo", "precio de" → COTIZAR

Responde SOLO en JSON:
{"intencion": "COTIZAR", "confianza": 0.95, "razon": "Menciona producto y pregunta precio"}
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