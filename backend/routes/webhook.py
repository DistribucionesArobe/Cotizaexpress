from fastapi import APIRouter, Request, HTTPException, Form
from fastapi.responses import Response
from agents.orquestador import OrquestadorCotizaBot
from services.whatsapp_service import whatsapp_service
from services.whatsapp_router import WhatsAppRouter
from database import db, conversaciones_collection, mensajes_collection, clientes_collection
from models.mensaje import DireccionMensaje, TipoMensaje
import logging
import uuid
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/webhook", tags=["webhook"])
logger = logging.getLogger(__name__)

# Instancia global del orquestador y router
orquestador = OrquestadorCotizaBot()
whatsapp_router = WhatsAppRouter(db)

# Número de WhatsApp centralizado de CotizaBot
COTIZABOT_WHATSAPP_NUMBER = os.environ.get('COTIZABOT_WHATSAPP_NUMBER', '+14155238886')


@router.post("/twilio/whatsapp")
async def webhook_whatsapp_entrante(request: Request):
    """
    Webhook para mensajes entrantes de WhatsApp vía Twilio.
    
    ARQUITECTURA MULTI-TENANT:
    1. Recibe mensaje del número único de CotizaBot
    2. Identifica a qué empresa corresponde (código, memoria, menú)
    3. Procesa con el orquestador usando contexto de esa empresa
    4. Responde siempre con prefijo "🤖 CotizaBot – [Empresa]"
    """
    try:
        # Obtener datos del formulario de Twilio
        form_data = await request.form()
        
        from_number = form_data.get('From', '').replace('whatsapp:', '')
        to_number = form_data.get('To', '').replace('whatsapp:', '')
        body = form_data.get('Body', '').strip()
        message_sid = form_data.get('MessageSid', '')
        num_media = int(form_data.get('NumMedia', 0))
        
        logger.info(f"📥 Mensaje recibido de {from_number}: {body[:50]}...")
        
        # ============================================
        # PASO 1: ENRUTAMIENTO MULTI-TENANT
        # ============================================
        routing_result = await whatsapp_router.route_incoming_message(
            user_phone=from_number,
            message_text=body,
            whatsapp_number=to_number
        )
        
        # Si no se identificó empresa, enviar menú/mensaje de selección
        if not routing_result.success or routing_result.requires_selection:
            respuesta_texto = routing_result.message_to_send or (
                "🤖 CotizaBot\n\n"
                "No pude identificar con qué empresa deseas hablar.\n"
                "Por favor, usa el link proporcionado por tu proveedor."
            )
            respuesta_twiml = whatsapp_service.generar_respuesta_twiml(respuesta_texto)
            return Response(content=respuesta_twiml, media_type="application/xml")
        
        # Empresa identificada
        empresa_id = routing_result.company_id
        empresa_nombre = routing_result.company_name
        
        logger.info(f"✅ Empresa identificada: {empresa_nombre} (método: {routing_result.routing_method})")
        
        # Si es mensaje inicial con código, enviar bienvenida
        if routing_result.routing_method == "code_link" and routing_result.message_to_send:
            respuesta_twiml = whatsapp_service.generar_respuesta_twiml(routing_result.message_to_send)
            return Response(content=respuesta_twiml, media_type="application/xml")
        
        # ============================================
        # PASO 2: BUSCAR/CREAR CLIENTE Y CONVERSACIÓN
        # ============================================
        cliente = await clientes_collection.find_one({'telefono': from_number})
        
        if not cliente:
            cliente_id = str(uuid.uuid4())
            cliente = {
                'id': cliente_id,
                'telefono': from_number,
                'nombre': None,
                'empresa_id': empresa_id,  # Asociar cliente a empresa
                'total_cotizaciones': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await clientes_collection.insert_one(cliente)
        else:
            cliente_id = cliente['id']
        
        # Buscar o crear conversación activa CON EMPRESA
        conversacion = await conversaciones_collection.find_one({
            'cliente_telefono': from_number,
            'empresa_id': empresa_id,
            'estado': 'activa'
        })
        
        if not conversacion:
            conversacion_id = str(uuid.uuid4())
            conversacion = {
                'id': conversacion_id,
                'cliente_telefono': from_number,
                'cliente_nombre': cliente.get('nombre'),
                'empresa_id': empresa_id,
                'empresa_nombre': empresa_nombre,
                'estado': 'activa',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await conversaciones_collection.insert_one(conversacion)
        else:
            conversacion_id = conversacion['id']
        
        # ============================================
        # PASO 3: GUARDAR MENSAJE ENTRANTE
        # ============================================
        mensaje_entrante = {
            'id': str(uuid.uuid4()),
            'conversacion_id': conversacion_id,
            'cliente_telefono': from_number,
            'empresa_id': empresa_id,
            'direccion': DireccionMensaje.ENTRANTE.value,
            'contenido': body,
            'tipo': TipoMensaje.TEXTO.value,
            'twilio_sid': message_sid,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await mensajes_collection.insert_one(mensaje_entrante)
        
        # ============================================
        # PASO 4: OBTENER CONTEXTO DE EMPRESA
        # ============================================
        empresa_context = await whatsapp_router.get_company_context(empresa_id)
        
        # Obtener historial reciente de la conversación (últimos 5 mensajes)
        historial_mensajes = await mensajes_collection.find(
            {'conversacion_id': conversacion_id},
            {'_id': 0, 'direccion': 1, 'contenido': 1, 'timestamp': 1}
        ).sort('timestamp', -1).limit(5).to_list(5)
        
        # ============================================
        # PASO 5: PROCESAR CON ORQUESTADOR
        # ============================================
        resultado = await orquestador.procesar_mensaje(
            mensaje=body,
            cliente_telefono=from_number,
            conversacion_id=conversacion_id,
            cliente_nombre=cliente.get('nombre', 'Cliente'),
            historial=historial_mensajes,
            empresa_id=empresa_id,           # NUEVO: Contexto de empresa
            empresa_context=empresa_context  # NUEVO: Datos de empresa
        )
        
        respuesta_texto = resultado['respuesta']
        
        # Agregar prefijo de marca si no lo tiene
        if not respuesta_texto.startswith("🤖"):
            respuesta_texto = f"🤖 CotizaBot – {empresa_nombre}\n\n{respuesta_texto}"
        
        # Limpiar caracteres problemáticos para encoding
        respuesta_texto = respuesta_texto.encode('utf-8', errors='ignore').decode('utf-8')
        
        # ============================================
        # PASO 6: GUARDAR Y ENVIAR RESPUESTA
        # ============================================
        mensaje_saliente = {
            'id': str(uuid.uuid4()),
            'conversacion_id': conversacion_id,
            'cliente_telefono': from_number,
            'empresa_id': empresa_id,
            'direccion': DireccionMensaje.SALIENTE.value,
            'contenido': respuesta_texto,
            'tipo': TipoMensaje.TEXTO.value,
            'agente_procesador': ','.join(resultado['agentes_ejecutados']),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await mensajes_collection.insert_one(mensaje_saliente)
        
        # Enviar respuesta vía Twilio
        respuesta_twiml = whatsapp_service.generar_respuesta_twiml(respuesta_texto)
        
        return Response(content=respuesta_twiml, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"❌ Error en webhook WhatsApp: {str(e)}", exc_info=True)
        # Devolver respuesta de error
        respuesta_error = whatsapp_service.generar_respuesta_twiml(
            "🤖 CotizaBot\n\nDisculpa, ocurrió un error procesando tu mensaje. Inténtalo de nuevo."
        )
        return Response(content=respuesta_error, media_type="application/xml")


@router.post("/whatsapp/reset")
async def reset_conversation(request: Request):
    """
    Permite a un usuario reiniciar su conversación para cambiar de empresa.
    Se activa cuando el usuario envía "CAMBIAR" o "RESET".
    """
    try:
        form_data = await request.form()
        from_number = form_data.get('From', '').replace('whatsapp:', '')
        
        await whatsapp_router.reset_conversation(from_number)
        
        respuesta = (
            "🤖 CotizaBot\n\n"
            "Tu conversación ha sido reiniciada.\n"
            "Envía el código de la empresa con la que deseas hablar."
        )
        
        return Response(
            content=whatsapp_service.generar_respuesta_twiml(respuesta),
            media_type="application/xml"
        )
    except Exception as e:
        logger.error(f"Error reiniciando conversación: {e}")
        raise HTTPException(status_code=500, detail=str(e))