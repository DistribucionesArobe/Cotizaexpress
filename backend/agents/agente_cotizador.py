from typing import Dict, Any, List
from emergentintegrations.llm.chat import LlmChat, UserMessage
from agents.state import AgentState
from config import settings
from database import productos_collection
import logging
import json

logger = logging.getLogger(__name__)

class AgenteCotizador:
    """Agente especializado en construir cotizaciones"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=settings.emergent_llm_key,
            session_id="cotizador",
            system_message="""Eres un agente experto en crear cotizaciones para materiales de construcción en México.

Tu trabajo es:
1. Identificar qué productos solicita el cliente
2. Extraer cantidades mencionadas
3. Buscar productos en el catálogo
4. Calcular precios con IVA (16%)
5. Sugerir productos complementarios cuando sea apropiado

Responde en formato JSON:
{
  "productos_identificados": [
    {"nombre": "Tablaroca antimoho", "cantidad": 10, "sku_probable": "TB-001"}
  ],
  "necesita_aclaracion": false,
  "pregunta_aclaracion": "",
  "productos_complementarios": ["Redimix", "Canal"]
}

Siempre responde en español mexicano profesional.
"""
        ).with_model("openai", "gpt-4o")
    
    async def procesar(self, state: AgentState) -> Dict[str, Any]:
        """Procesa solicitud de cotización"""
        try:
            mensaje = state['mensaje']
            
            # Obtener catálogo de productos
            productos_db = await productos_collection.find(
                {'activo': True},
                {'_id': 0, 'sku': 1, 'nombre': 1, 'categoria': 1, 'precio_base': 1, 'unidad': 1}
            ).to_list(100)
            
            catalogo_str = "\n".join([
                f"- {p['sku']}: {p['nombre']} - ${p['precio_base']:.2f} MXN por {p['unidad']} (Categoría: {p['categoria']})"
                for p in productos_db
            ])
            
            user_message = UserMessage(
                text=f"""Mensaje del cliente: {mensaje}

CATÁLOGO DISPONIBLE:
{catalogo_str}

Analiza qué productos solicita el cliente."""
            )
            
            response = await self.chat.send_message(user_message)
            
            # Extraer JSON
            response_text = response.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            resultado = json.loads(response_text)
            
            # Buscar productos en DB
            productos_solicitados = []
            for prod_id in resultado.get('productos_identificados', []):
                sku = prod_id.get('sku_probable', '')
                producto_db = await productos_collection.find_one({'sku': sku}, {'_id': 0})
                
                if producto_db:
                    cantidad = prod_id.get('cantidad', 1)
                    subtotal = producto_db['precio_base'] * cantidad
                    
                    productos_solicitados.append({
                        'producto_id': producto_db['id'],
                        'producto_nombre': producto_db['nombre'],
                        'sku': producto_db['sku'],
                        'cantidad': cantidad,
                        'unidad': producto_db['unidad'],
                        'precio_unitario': producto_db['precio_base'],
                        'descuento_pct': 0.0,
                        'subtotal': subtotal
                    })
            
            # Construir respuesta
            if resultado.get('necesita_aclaracion', False):
                respuesta = resultado.get('pregunta_aclaracion', 'Por favor especifica qué productos necesitas.')
                accion = 'esperar_info'
            elif len(productos_solicitados) == 0:
                respuesta = f"No encontré los productos mencionados en nuestro catálogo. \u00bfPodrías especificar más? Tenemos: {', '.join([p['categoria'] for p in productos_db[:5]])}"
                accion = 'esperar_info'
            else:
                # Calcular totales
                subtotal = sum(p['subtotal'] for p in productos_solicitados)
                iva = subtotal * settings.iva_rate
                total = subtotal + iva
                
                respuesta = f"""Cotización para {state.get('cliente_nombre', 'Cliente')}:

"""
                for p in productos_solicitados:
                    respuesta += f"\u2022 {p['producto_nombre']}: {p['cantidad']} {p['unidad']} x ${p['precio_unitario']:.2f} = ${p['subtotal']:.2f} MXN\n"
                
                respuesta += f"\nSubtotal: ${subtotal:.2f} MXN"
                respuesta += f"\nIVA (16%): ${iva:.2f} MXN"
                respuesta += f"\n*Total: ${total:.2f} MXN*"
                
                if resultado.get('productos_complementarios'):
                    respuesta += f"\n\n\ud83d\udca1 También te recomiendo: {', '.join(resultado['productos_complementarios'])}"
                
                accion = 'enviar_cotizacion'
            
            logger.info(f"Cotizador procesó {len(productos_solicitados)} productos")
            
            return {
                'productos_solicitados': productos_solicitados,
                'respuesta_cotizador': respuesta,
                'accion': accion,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
            }
            
        except Exception as e:
            logger.error(f"Error en cotizador: {str(e)}")
            return {
                'respuesta_cotizador': 'Ocurrió un error procesando tu solicitud. ¿Podrías reformular?',
                'errores': state['errores'] + [f"Error cotizador: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
            }