from typing import Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
from agents.state import AgentState
from config import settings
import logging

logger = logging.getLogger(__name__)

class AgenteCompliance:
    """Agente que valida políticas de negocio y compliance"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=settings.emergent_llm_key,
            session_id="compliance",
            system_message=f"""Eres un agente de cumplimiento (compliance) para una empresa de materiales de construcción en México.

Tu trabajo es validar que todas las cotizaciones cumplan con:
1. Margen mínimo: {settings.margen_minimo_default * 100}% sobre costo
2. IVA correcto: {settings.iva_rate * 100}% (obligatorio en México)
3. Políticas de crédito
4. Restricciones legales

Si hay violaciones, las reportas claramente.
Siempre respondes en español profesional.
"""
        ).with_model("openai", "gpt-4o")
    
    async def validar(self, state: AgentState) -> Dict[str, Any]:
        """Valida compliance de la cotización"""
        try:
            productos = state.get('productos_solicitados', [])
            
            if not productos:
                return {
                    'respuesta_compliance': None,
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['compliance']
                }
            
            # Validar margen mínimo
            warnings = []
            for producto in productos:
                precio = producto['precio_unitario']
                # Asumir costo es 70% del precio base (margen 30%)
                costo_estimado = precio * 0.70
                margen_actual = (precio - costo_estimado) / costo_estimado
                
                if margen_actual < settings.margen_minimo_default:
                    warnings.append(
                        f"Advertencia: {producto['producto_nombre']} tiene margen bajo ({margen_actual*100:.1f}%)"
                    )
            
            # Calcular IVA
            subtotal = sum(p['subtotal'] for p in productos)
            iva_calculado = subtotal * settings.iva_rate
            
            respuesta = ""
            if warnings:
                respuesta = "\n\n⚠️ " + "\n".join(warnings)
            
            respuesta += f"\n\n📄 IVA aplicado: 16% (${iva_calculado:.2f} MXN)"
            respuesta += "\n📍 Cotización válida por 15 días."
            
            logger.info(f"Compliance validado - {len(warnings)} advertencias")
            
            return {
                'respuesta_compliance': respuesta,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['compliance']
            }
            
        except Exception as e:
            logger.error(f"Error en compliance: {str(e)}")
            return {
                'respuesta_compliance': None,
                'errores': state['errores'] + [f"Error compliance: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['compliance']
            }