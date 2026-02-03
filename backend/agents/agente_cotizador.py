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
            system_message="""Eres un vendedor experto de materiales de construcción en México.
Tu objetivo es AVANZAR LA VENTA, no bloquear por falta de datos.

PRINCIPIOS:
1. Interpreta la INTENCIÓN, no la forma exacta del mensaje
2. NUNCA digas "no entendí" - siempre propón algo
3. Si falta cantidad, PROPÓN un estimado razonable
4. Piensa como vendedor humano, no como formulario

SINÓNIMOS QUE DEBES ENTENDER:
- tablaroca = tabla roca, tablarok, panel de yeso, sheetrock
- plafón = cielo falso, cielo raso
- cemento = sement, cemento gris
- varilla = variya, fierro, acero

MANEJO DE CANTIDADES:
- Si NO dan cantidad: propón rangos típicos
  Ejemplo: "Para un cuarto promedio se usan 10-15 piezas"
- Si dicen "no sé": usa valor medio y ofrece ajustar
- NUNCA esperes datos perfectos para cotizar

FORMATO DE RESPUESTA JSON:
{
  "productos_identificados": [
    {"nombre_exacto": "Cemento gris Cemex 50kg", "cantidad": 5, "sku": "CE-001"}
  ],
  "productos_ambiguos": [],
  "necesita_aclaracion": false,
  "pregunta_aclaracion": "",
  "cantidad_estimada": true,
  "nota_vendedor": "Estimé 5 sacos para un cuarto estándar"
}

REGLAS:
- Si el producto es claro pero falta cantidad → estima y pon cantidad_estimada=true
- Si hay varios productos similares → pregunta con opciones y precios
- Siempre en español mexicano, cercano y profesional
- Frases cortas, máximo 4 líneas
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

CATÁLOGO DE {empresa_nombre.upper()}:
{catalogo_str}

INSTRUCCIONES:
1. Identifica qué producto(s) quiere el cliente
2. Si NO menciona cantidad, ESTIMA una cantidad razonable basada en uso típico
3. Si hay varios productos similares, pregunta cuál prefiere CON PRECIOS
4. Interpreta sinónimos y errores de escritura

Responde en JSON."""
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
            if resultado.get('necesita_aclaracion', False) and resultado.get('productos_ambiguos'):
                # Solo preguntar si hay ambigüedad real en productos
                pregunta = resultado.get('pregunta_aclaracion', '')
                respuesta = f"{pregunta}"
                accion = 'esperar_info'
            elif len(productos_solicitados) == 0:
                # No encontró productos - dar opciones en vez de bloquear
                categorias = list(set([p.get('categoria', 'General') for p in productos_db[:5]]))
                respuesta = f"No ubico ese producto exacto 🤔\nManejamos: {', '.join(categorias)}.\n\n¿Me puedes dar más detalles?"
                accion = 'esperar_info'
            else:
                # Calcular totales
                subtotal = sum(p['subtotal'] for p in productos_solicitados)
                iva = subtotal * settings.iva_rate
                total = subtotal + iva
                
                # Verificar si la cantidad fue estimada
                cantidad_estimada = resultado.get('cantidad_estimada', False)
                nota_vendedor = resultado.get('nota_vendedor', '')
                
                # Guardar cotización en BD para recuperarla cuando confirme
                import uuid
                from datetime import datetime, timezone
                from database import cotizaciones_collection
                
                folio = f"COT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
                cotizacion_doc = {
                    'id': str(uuid.uuid4()),
                    'folio': folio,
                    'empresa_id': empresa_id,
                    'cliente_telefono': state['cliente_telefono'],
                    'conversacion_id': state['conversacion_id'],
                    'productos': productos_solicitados,
                    'subtotal': subtotal,
                    'iva': iva,
                    'total': total,
                    'cantidad_estimada': cantidad_estimada,
                    'estado': 'pendiente',
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                
                await cotizaciones_collection.insert_one(cotizacion_doc)
                logger.info(f"Cotización guardada: {folio} - Total: ${total:.2f}")
                
                # Construir respuesta más corta y vendedora
                respuesta = f"📋 *Cotización #{folio}*\n\n"
                
                for p in productos_solicitados:
                    respuesta += f"• {p['producto_nombre']}\n  {p['cantidad']} {p['unidad']} × ${p['precio_unitario']:.2f} = ${p['subtotal']:.2f}\n"
                
                respuesta += f"\n*Total: ${total:.2f} MXN* (IVA incluido)"
                
                # Si fue cantidad estimada, mencionarlo
                if cantidad_estimada and nota_vendedor:
                    respuesta += f"\n\n💡 _{nota_vendedor}_"
                
                respuesta += "\n\n¿Lo confirmas? Responde *SÍ* o ajustamos cantidad."
                
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