"""
CotizaBot - Agente de Cobros
============================

Maneja el flujo de pago después de que el cliente confirma una cotización:
1. Verifica si la empresa tiene Plan Pro
2. Ofrece métodos de pago disponibles (Mercado Pago / SPEI)
3. Genera link de pago o datos bancarios
4. Registra el intento de pago
"""

from typing import Dict, Any, Optional
from agents.state import AgentState
from services.cobro_service import cobro_service
from database import db, cotizaciones_collection
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)


class AgenteCobros:
    """Agente especializado en gestionar el proceso de cobro"""
    
    def __init__(self):
        pass
    
    async def ofrecer_metodos_pago(self, state: AgentState) -> Dict[str, Any]:
        """
        Ofrece los métodos de pago disponibles al cliente.
        Se ejecuta cuando el cliente CONFIRMA una cotización.
        """
        try:
            empresa_context = state.get('empresa_context', {})
            empresa_nombre = empresa_context.get('company_name', 'la empresa')
            
            # Verificar si tiene Plan Pro
            if not empresa_context.get('tiene_plan_pro'):
                # Sin Plan Pro: solo confirmar cotización y dar instrucciones genéricas
                return {
                    'respuesta_cobros': (
                        f"🤖 CotizaBot – {empresa_nombre}\n\n"
                        f"✅ ¡Cotización confirmada!\n\n"
                        f"Para continuar con tu pedido, contacta directamente a {empresa_nombre}.\n"
                        f"Te responderemos a la brevedad."
                    ),
                    'accion': 'cotizacion_confirmada',
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
                }
            
            # Tiene Plan Pro: verificar métodos de cobro disponibles
            metodos_cobro = empresa_context.get('metodos_cobro', [])
            
            if not metodos_cobro:
                # Plan Pro pero sin métodos configurados
                return {
                    'respuesta_cobros': (
                        f"🤖 CotizaBot – {empresa_nombre}\n\n"
                        f"✅ ¡Cotización confirmada!\n\n"
                        f"Nos pondremos en contacto contigo para coordinar el pago."
                    ),
                    'accion': 'cotizacion_confirmada',
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
                }
            
            # Construir menú de métodos de pago
            opciones = []
            mensaje_opciones = ""
            
            if 'mercadopago' in metodos_cobro:
                opciones.append('mercadopago')
                mensaje_opciones += "*1* - 💳 Mercado Pago (Tarjeta/OXXO)\n"
            
            if 'spei' in metodos_cobro:
                opciones.append('spei')
                num = len(opciones)
                mensaje_opciones += f"*{num}* - 🏦 Transferencia bancaria (SPEI)\n"
            
            # Guardar opciones en el estado para procesar después
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"✅ ¡Excelente! Tu cotización está confirmada.\n\n"
                    f"💰 *¿Cómo deseas pagar?*\n\n"
                    f"{mensaje_opciones}\n"
                    f"Responde con el número de tu preferencia."
                ),
                'accion': 'esperando_metodo_pago',
                'metodos_disponibles': opciones,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
            
        except Exception as e:
            logger.error(f"Error en agente cobros (ofrecer): {str(e)}")
            return {
                'respuesta_cobros': 'Hubo un error procesando tu solicitud. Por favor intenta de nuevo.',
                'errores': state['errores'] + [f"Error cobros: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
    
    
    async def procesar_metodo_pago(self, state: AgentState) -> Dict[str, Any]:
        """
        Procesa la selección del método de pago y genera link/datos.
        Se ejecuta cuando el cliente selecciona un método (1, 2, "mercado pago", etc.)
        """
        try:
            mensaje = state['mensaje'].strip().lower()
            empresa_context = state.get('empresa_context', {})
            empresa_nombre = empresa_context.get('company_name', 'la empresa')
            empresa_id = state.get('empresa_id')
            cliente_telefono = state.get('cliente_telefono')
            
            # Determinar método seleccionado
            metodo_seleccionado = None
            metodos_cobro = empresa_context.get('metodos_cobro', [])
            
            if mensaje in ['1', 'mercado pago', 'mercadopago', 'tarjeta', 'oxxo']:
                if 'mercadopago' in metodos_cobro:
                    metodo_seleccionado = 'mercadopago'
            elif mensaje in ['2', 'transferencia', 'spei', 'banco', 'bancaria']:
                if 'spei' in metodos_cobro:
                    metodo_seleccionado = 'spei'
            
            # Si solo hay un método, y el mensaje es "1"
            if mensaje == '1' and len(metodos_cobro) == 1:
                metodo_seleccionado = metodos_cobro[0]
            elif mensaje == '2' and len(metodos_cobro) >= 2:
                metodo_seleccionado = metodos_cobro[1]
            
            if not metodo_seleccionado:
                return {
                    'respuesta_cobros': (
                        f"🤖 CotizaBot – {empresa_nombre}\n\n"
                        f"No entendí tu selección. Por favor responde:\n"
                        f"*1* - Mercado Pago\n"
                        f"*2* - Transferencia SPEI"
                    ),
                    'accion': 'esperando_metodo_pago',
                    'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
                }
            
            # Obtener la última cotización del cliente
            productos = state.get('productos_solicitados', [])
            
            # Calcular total (o obtener de cotización guardada)
            if productos:
                subtotal = sum(p.get('subtotal', 0) for p in productos)
                iva = subtotal * 0.16
                total = subtotal + iva
            else:
                # Buscar última cotización en BD
                ultima_cotizacion = await cotizaciones_collection.find_one(
                    {'cliente_telefono': cliente_telefono, 'empresa_id': empresa_id},
                    sort=[('created_at', -1)]
                )
                if ultima_cotizacion:
                    total = ultima_cotizacion.get('total', 0)
                else:
                    total = 0
            
            # Generar referencia única
            folio = f"COT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
            
            # Procesar según método
            if metodo_seleccionado == 'mercadopago':
                return await self._generar_pago_mercadopago(
                    state, empresa_context, total, folio, empresa_nombre
                )
            else:  # spei
                return await self._generar_pago_spei(
                    state, empresa_context, total, folio, empresa_nombre
                )
                
        except Exception as e:
            logger.error(f"Error en agente cobros (procesar): {str(e)}")
            return {
                'respuesta_cobros': 'Hubo un error generando los datos de pago. Por favor intenta de nuevo.',
                'errores': state['errores'] + [f"Error cobros: {str(e)}"],
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
    
    
    async def _generar_pago_mercadopago(
        self, 
        state: AgentState, 
        empresa_context: dict, 
        total: float,
        folio: str,
        empresa_nombre: str
    ) -> Dict[str, Any]:
        """Genera link de pago de Mercado Pago"""
        
        config_cobros = empresa_context.get('config_cobros', {})
        mp_token = config_cobros.get('mercadopago_access_token')
        
        if not mp_token:
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"⚠️ Mercado Pago no está configurado en este momento.\n"
                    f"Por favor selecciona transferencia SPEI o contacta a {empresa_nombre}."
                ),
                'accion': 'error_metodo_pago',
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
        
        # Usar el servicio de cobros con el token de la empresa
        resultado = await cobro_service.generar_link_mercadopago_empresa(
            mp_token=mp_token,
            titulo=f"Cotización {folio} - {empresa_nombre}",
            monto=total,
            referencia=folio,
            descripcion=f"Pago de cotización de materiales"
        )
        
        if resultado.get('success'):
            link_pago = resultado.get('link')
            
            # Guardar intento de pago
            await self._registrar_intento_pago(
                state, folio, 'mercadopago', total, link_pago
            )
            
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"💳 *Link de pago generado*\n\n"
                    f"📋 Folio: {folio}\n"
                    f"💰 Total: ${total:,.2f} MXN\n\n"
                    f"🔗 Paga aquí:\n{link_pago}\n\n"
                    f"Puedes pagar con:\n"
                    f"• Tarjeta de crédito/débito\n"
                    f"• OXXO\n"
                    f"• Transferencia\n\n"
                    f"Una vez confirmado tu pago, te notificaremos. ¡Gracias!"
                ),
                'accion': 'link_pago_enviado',
                'link_pago': link_pago,
                'folio': folio,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
        else:
            logger.error(f"Error generando link MP: {resultado.get('error')}")
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"⚠️ Hubo un problema generando el link de pago.\n"
                    f"Por favor intenta con transferencia SPEI o contacta a {empresa_nombre}."
                ),
                'accion': 'error_metodo_pago',
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
    
    
    async def _generar_pago_spei(
        self,
        state: AgentState,
        empresa_context: dict,
        total: float,
        folio: str,
        empresa_nombre: str
    ) -> Dict[str, Any]:
        """Genera datos de pago por transferencia SPEI"""
        
        datos_bancarios = empresa_context.get('datos_bancarios', {})
        
        if not datos_bancarios.get('clabe'):
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"⚠️ Los datos bancarios no están configurados.\n"
                    f"Por favor contacta directamente a {empresa_nombre}."
                ),
                'accion': 'error_metodo_pago',
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
        
        # Usar el servicio de cobros
        resultado = cobro_service.generar_datos_spei(
            empresa_config={'datos_bancarios': datos_bancarios, 'nombre': empresa_nombre},
            monto=total,
            referencia=folio
        )
        
        if resultado.get('success'):
            mensaje_spei = resultado.get('mensaje_formateado')
            
            # Guardar intento de pago
            await self._registrar_intento_pago(
                state, folio, 'spei', total, None
            )
            
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"📋 Folio: {folio}\n\n"
                    f"{mensaje_spei}"
                ),
                'accion': 'datos_spei_enviados',
                'folio': folio,
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
        else:
            return {
                'respuesta_cobros': (
                    f"🤖 CotizaBot – {empresa_nombre}\n\n"
                    f"⚠️ No se pudieron obtener los datos bancarios.\n"
                    f"Por favor contacta a {empresa_nombre}."
                ),
                'accion': 'error_metodo_pago',
                'agentes_ejecutados': state['agentes_ejecutados'] + ['cobros']
            }
    
    
    async def _registrar_intento_pago(
        self,
        state: AgentState,
        folio: str,
        metodo: str,
        monto: float,
        link_pago: Optional[str]
    ):
        """Registra el intento de pago en la base de datos"""
        try:
            pagos_collection = db.get_collection('pagos_pendientes')
            
            await pagos_collection.insert_one({
                'id': str(uuid.uuid4()),
                'folio': folio,
                'empresa_id': state.get('empresa_id'),
                'cliente_telefono': state.get('cliente_telefono'),
                'conversacion_id': state.get('conversacion_id'),
                'metodo': metodo,
                'monto': monto,
                'link_pago': link_pago,
                'estado': 'pendiente',
                'productos': state.get('productos_solicitados', []),
                'created_at': datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Intento de pago registrado: {folio} - {metodo} - ${monto}")
            
        except Exception as e:
            logger.error(f"Error registrando intento de pago: {e}")


# Instancia global
agente_cobros = AgenteCobros()
