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
1. Identificar EXACTAMENTE qué productos solicita el cliente
2. Si hay productos similares (ej: "tablaroca" puede ser "antimoho" o "ultralight"), DEBES preguntar cuál quiere
3. Extraer cantidades mencionadas
4. NO asumir productos - si no está claro, pregunta

Responde en formato JSON:
{
  "productos_identificados": [
    {"nombre_exacto": "Tablaroca antimoho USG", "cantidad": 10, "sku": "TB-001"}
  ],
  "productos_ambiguos": [
    {"termino_buscado": "tablaroca", "opciones": ["Tablaroca antimoho USG", "Tablaroca ultralight USG"]}
  ],
  "necesita_aclaracion": true,
  "pregunta_aclaracion": "¿Cuál tablaroca necesitas?\n1. Antimoho ($340.10)\n2. Ultralight ($210.00)"
}

REGLAS:
- Si el cliente dice "tablaroca" y hay varias, pon necesita_aclaracion=true
- Si dice "tablaroca antimoho", identifica el producto exacto
- Siempre responde en español mexicano profesional
"""
        ).with_model("openai", "gpt-4o")
    
    async def procesar(self, state: AgentState) -> Dict[str, Any]:
        """Procesa solicitud de cotización"""
        try:
            mensaje = state['mensaje']
            empresa_id = state.get('empresa_id')
            empresa_context = state.get('empresa_context', {})
            empresa_nombre = empresa_context.get('company_name', 'la empresa')
            
            # Filtrar productos por empresa (multi-tenant)
            filtro_productos = {'activo': True}
            if empresa_id:
                filtro_productos['$or'] = [
                    {'empresa_id': empresa_id},
                    {'es_demo': True}
                ]
            
            productos_db = await productos_collection.find(
                filtro_productos,
                {'_id': 0, 'sku': 1, 'nombre': 1, 'categoria': 1, 'precio_base': 1, 'unidad': 1, 'id': 1, 'stock': 1}
            ).to_list(100)
            
            if not productos_db:
                return {
                    'respuesta_cotizador': f"🤖 CotizaBot – {empresa_nombre}\n\nAún no hay productos configurados en el catálogo. Contacta al administrador.",
                    'accion': 'enviar_mensaje',
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
                }
            
            # Crear catálogo detallado para el LLM
            catalogo_str = "\n".join([
                f"- SKU: {p.get('sku', 'N/A')} | {p['nombre']} | ${p.get('precio_base', 0):.2f} MXN/{p.get('unidad', 'pza')}"
                for p in productos_db
            ])
            
            user_message = UserMessage(
                text=f"""Mensaje del cliente: {mensaje}

CATÁLOGO COMPLETO DE {empresa_nombre.upper()}:
{catalogo_str}

Analiza qué productos solicita. Si hay ambigüedad (ej: "tablaroca" sin especificar tipo), indica que necesita aclaración."""
            )
            
            response = await self.chat.send_message(user_message)
            
            # Extraer JSON
            response_text = response.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            resultado = json.loads(response_text)
            
            # Si necesita aclaración por productos ambiguos
            if resultado.get('necesita_aclaracion', False) and resultado.get('productos_ambiguos'):
                pregunta = resultado.get('pregunta_aclaracion', '')
                if not pregunta:
                    # Construir pregunta automáticamente
                    ambiguos = resultado['productos_ambiguos']
                    for amb in ambiguos:
                        pregunta += f"¿Cuál {amb['termino_buscado']} necesitas?\n"
                        for i, opcion in enumerate(amb['opciones'], 1):
                            # Buscar precio
                            prod_info = next((p for p in productos_db if p['nombre'] == opcion), None)
                            precio = f"${prod_info['precio_base']:.2f}" if prod_info else ""
                            pregunta += f"  {i}. {opcion} {precio}\n"
                
                return {
                    'respuesta_cotizador': f"🤖 CotizaBot – {empresa_nombre}\n\n{pregunta}",
                    'accion': 'esperar_info',
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
                }
            
            # Buscar productos identificados en DB
            productos_solicitados = []
            for prod_id in resultado.get('productos_identificados', []):
                nombre_exacto = prod_id.get('nombre_exacto', prod_id.get('nombre', ''))
                sku = prod_id.get('sku', '')
                
                # Buscar por nombre exacto o SKU
                producto_db = await productos_collection.find_one(
                    {'$or': [
                        {'nombre': nombre_exacto},
                        {'sku': sku},
                        {'nombre': {'$regex': f'^{nombre_exacto}$', '$options': 'i'}}
                    ]},
                    {'_id': 0}
                )
                
                if producto_db:
                    cantidad = prod_id.get('cantidad', 1)
                    precio = producto_db.get('precio_base', 0)
                    subtotal = precio * cantidad
                    
                    productos_solicitados.append({
                        'producto_id': producto_db.get('id'),
                        'producto_nombre': producto_db['nombre'],
                        'sku': producto_db.get('sku', 'N/A'),
                        'cantidad': cantidad,
                        'unidad': producto_db.get('unidad', 'pieza'),
                        'precio_unitario': precio,
                        'descuento_pct': 0.0,
                        'subtotal': subtotal
                    })
            
            # Construir respuesta
            if resultado.get('necesita_aclaracion', False):
                respuesta = f"🤖 CotizaBot – {empresa_nombre}\n\n{resultado.get('pregunta_aclaracion', 'Por favor especifica qué productos necesitas.')}"
                accion = 'esperar_info'
            elif len(productos_solicitados) == 0:
                categorias = list(set([p.get('categoria', 'General') for p in productos_db[:5]]))
                respuesta = f"🤖 CotizaBot – {empresa_nombre}\n\nNo encontré ese producto. Tenemos: {', '.join(categorias)}.\n\n¿Qué te gustaría cotizar?"
                accion = 'esperar_info'
            else:
                # Calcular totales
                subtotal = sum(p['subtotal'] for p in productos_solicitados)
                iva = subtotal * settings.iva_rate
                total = subtotal + iva
                
                respuesta = f"🤖 CotizaBot – {empresa_nombre}\n\n📋 *Cotización*\n\n"
                
                for p in productos_solicitados:
                    respuesta += f"• {p['producto_nombre']}\n  {p['cantidad']} {p['unidad']} x ${p['precio_unitario']:.2f} = *${p['subtotal']:.2f}*\n"
                
                respuesta += f"\n─────────────────"
                respuesta += f"\nSubtotal: ${subtotal:.2f}"
                respuesta += f"\nIVA (16%): ${iva:.2f}"
                respuesta += f"\n*TOTAL: ${total:.2f} MXN*"
                
                respuesta += "\n\n¿Confirmas esta cotización? Responde *SÍ* para continuar o indica cambios."
                
                accion = 'confirmar_cotizacion'
            
            logger.info(f"Cotizador procesó {len(productos_solicitados)} productos para empresa {empresa_id}")
            
            return {
                'productos_solicitados': productos_solicitados,
                'respuesta_cotizador': respuesta,
                'accion': accion,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
            }
            
        except Exception as e:
            logger.error(f"Error en cotizador: {str(e)}")
            empresa_nombre = state.get('empresa_context', {}).get('company_name', 'la empresa')
            return {
                'respuesta_cotizador': f'🤖 CotizaBot – {empresa_nombre}\n\nOcurrió un error procesando tu solicitud. ¿Podrías reformular?',
                'errores': state['errores'] + [f"Error cotizador: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cotizador']
            }