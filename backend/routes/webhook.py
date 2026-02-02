"""
CotizaBot - Webhook de WhatsApp (360dialog)
===========================================

Recibe mensajes de WhatsApp via 360dialog y los procesa con el bot.
"""

from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from agents.orquestador import OrquestadorCotizaBot
from services.dialog360_service import dialog360_service
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

# Número de WhatsApp de CotizaBot
COTIZABOT_WHATSAPP_NUMBER = os.environ.get('COTIZABOT_WHATSAPP_NUMBER', '+5218344291628')

# Token de verificación para el webhook
WHATSAPP_VERIFY_TOKEN = os.environ.get('WHATSAPP_VERIFY_TOKEN', 'cotizabot_verify_2026')


@router.get("/whatsapp")
async def verificar_webhook(request: Request):
    """
    Verificación del webhook de WhatsApp (Cloud API / 360dialog).
    Responde el challenge como texto plano.
    """
    params = request.query_params
    
    mode = params.get('hub.mode')
    token = params.get('hub.verify_token')
    challenge = params.get('hub.challenge')
    
    logger.info(f"Verificación webhook: mode={mode}, token={token}, challenge={challenge}")
    
    if mode == 'subscribe' and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("✅ Webhook verificado correctamente")
        # Devolver SOLO el challenge como texto plano
        return Response(content=challenge, media_type="text/plain", status_code=200)
    
    logger.warning(f"⚠️ Verificación fallida: token recibido={token}, esperado={WHATSAPP_VERIFY_TOKEN}")
    return Response(content="Forbidden", media_type="text/plain", status_code=403)


@router.post("/whatsapp")
async def webhook_whatsapp_entrante(request: Request):
    """
    Webhook principal para mensajes entrantes de WhatsApp via 360dialog.
    
    Flujo:
    1. Recibe payload de 360dialog
    2. Parsea el mensaje
    3. Identifica la empresa (router multi-tenant)
    4. Procesa con el orquestador
    5. Responde via 360dialog API
    """
    # Responder 200 inmediatamente para evitar reintentos de 360dialog
    try:
        # Obtener payload JSON
        payload = await request.json()
        logger.info(f"📥 Webhook recibido: {str(payload)[:200]}...")
        
        # Parsear mensaje
        mensaje_data = dialog360_service.parse_webhook_message(payload)
        
        if not mensaje_data:
            # Puede ser una notificación de estado (delivered, read), no un mensaje
            logger.debug("Webhook sin mensaje de texto (posible notificación de estado)")
            return JSONResponse(content={"status": "ok"})
        
        from_number = mensaje_data['from_number']
        message_text = mensaje_data['message_text']
        message_id = mensaje_data['message_id']
        
        if not from_number or not message_text:
            logger.debug(f"Mensaje incompleto: from={from_number}, text={message_text}")
            return JSONResponse(content={"status": "ok"})
        
        # ============================================
        # DEDUPLICACIÓN: Evitar procesar el mismo mensaje múltiples veces
        # ============================================
        if message_id:
            # Verificar si ya procesamos este mensaje
            mensaje_existente = await mensajes_collection.find_one({'wa_message_id': message_id})
            if mensaje_existente:
                logger.info(f"⚠️ Mensaje duplicado ignorado: {message_id}")
                return JSONResponse(content={"status": "ok"})
        
        # Formatear número (agregar + si no lo tiene)
        if not from_number.startswith('+'):
            from_number = f"+{from_number}"
        
        logger.info(f"📱 Mensaje de {from_number}: {message_text[:50]}...")
        
        # Marcar como leído
        if message_id:
            await dialog360_service.marcar_como_leido(message_id)
        
        # ============================================
        # PASO 1: ENRUTAMIENTO MULTI-TENANT
        # ============================================
        routing_result = await whatsapp_router.route_incoming_message(
            user_phone=from_number,
            message_text=message_text,
            whatsapp_number=COTIZABOT_WHATSAPP_NUMBER
        )
        
        # Si no se identificó empresa, enviar menú/mensaje de selección
        if not routing_result.success or routing_result.requires_selection:
            respuesta_texto = routing_result.message_to_send or (
                "🤖 CotizaBot\n\n"
                "No pude identificar con qué empresa deseas hablar.\n"
                "Por favor, usa el link proporcionado por tu proveedor."
            )
            await dialog360_service.enviar_mensaje_texto(from_number, respuesta_texto)
            return JSONResponse(content={"status": "ok"})
        
        # Empresa identificada
        empresa_id = routing_result.company_id
        empresa_nombre = routing_result.company_name
        
        logger.info(f"✅ Empresa identificada: {empresa_nombre} (método: {routing_result.routing_method})")
        
        # Si es mensaje inicial con código, enviar bienvenida
        if routing_result.routing_method == "code_link" and routing_result.message_to_send:
            await dialog360_service.enviar_mensaje_texto(from_number, routing_result.message_to_send)
            return JSONResponse(content={"status": "ok"})
        
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
                'empresa_id': empresa_id,
                'total_cotizaciones': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await clientes_collection.insert_one(cliente)
        else:
            cliente_id = cliente['id']
        
        # Buscar o crear conversación activa
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
            'contenido': message_text,
            'tipo': TipoMensaje.TEXTO.value,
            'wa_message_id': message_id,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await mensajes_collection.insert_one(mensaje_entrante)
        
        # ============================================
        # PASO 4: OBTENER CONTEXTO DE EMPRESA
        # ============================================
        empresa_context = await whatsapp_router.get_company_context(empresa_id)
        
        # Obtener historial reciente
        historial_mensajes = await mensajes_collection.find(
            {'conversacion_id': conversacion_id},
            {'_id': 0, 'direccion': 1, 'contenido': 1, 'timestamp': 1}
        ).sort('timestamp', -1).limit(5).to_list(5)
        
        # ============================================
        # PASO 5: PROCESAR CON ORQUESTADOR
        # ============================================
        resultado = await orquestador.procesar_mensaje(
            mensaje=message_text,
            cliente_telefono=from_number,
            conversacion_id=conversacion_id,
            cliente_nombre=cliente.get('nombre', 'Cliente'),
            historial=historial_mensajes,
            empresa_id=empresa_id,
            empresa_context=empresa_context
        )
        
        respuesta_texto = resultado['respuesta']
        
        # Agregar prefijo de marca si no lo tiene
        if not respuesta_texto.startswith("🤖"):
            respuesta_texto = f"🤖 CotizaBot – {empresa_nombre}\n\n{respuesta_texto}"
        
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
        
        # Enviar respuesta via 360dialog
        envio_result = await dialog360_service.enviar_mensaje_texto(from_number, respuesta_texto)
        
        if not envio_result.get('success'):
            logger.error(f"❌ Error enviando respuesta: {envio_result.get('error')}")
        
        return JSONResponse(content={"status": "ok"})
        
    except Exception as e:
        logger.error(f"❌ Error en webhook WhatsApp: {str(e)}", exc_info=True)
        # Siempre responder 200 para evitar reintentos
        return JSONResponse(content={"status": "error", "message": str(e)})


@router.post("/whatsapp/test")
async def test_enviar_mensaje(request: Request):
    """
    Endpoint de prueba para enviar un mensaje manualmente.
    Solo para desarrollo/testing.
    """
    try:
        data = await request.json()
        destinatario = data.get('to')
        mensaje = data.get('message', 'Hola, este es un mensaje de prueba de CotizaBot 🤖')
        
        if not destinatario:
            raise HTTPException(status_code=400, detail="Falta el campo 'to'")
        
        result = await dialog360_service.enviar_mensaje_texto(destinatario, mensaje)
        
        return {
            "success": result.get('success'),
            "destinatario": destinatario,
            "mensaje": mensaje,
            "response": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
