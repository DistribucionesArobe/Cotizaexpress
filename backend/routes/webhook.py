"""
CotizaBot - Webhook de WhatsApp (Meta Cloud API)
================================================

Recibe y procesa mensajes de WhatsApp usando la API de Meta/Facebook.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse
from config import settings
from services.meta_whatsapp_service import meta_whatsapp, MetaWhatsAppService
from services.whatsapp_router import whatsapp_router
from agents.orquestador import OrquestadorCotizaBot
from database import db
import logging
import hashlib
import hmac

router = APIRouter(prefix="/webhook", tags=["webhook"])
logger = logging.getLogger(__name__)

# Orquestador de agentes (instancia única)
orquestador = OrquestadorCotizaBot()

# Colección para deduplicación de mensajes
wa_processed = db.get_collection('wa_processed_messages')


def verify_webhook_signature(request_body: bytes, signature: str) -> bool:
    """Verifica la firma del webhook de Meta"""
    if not settings.meta_app_secret:
        return True  # Skip verification if no secret configured
    
    expected_signature = hmac.new(
        settings.meta_app_secret.encode('utf-8'),
        request_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)


@router.get("/whatsapp")
async def verificar_webhook(request: Request):
    """
    Verificación del webhook para Meta (GET).
    Meta envía una solicitud GET para verificar el endpoint.
    """
    params = request.query_params
    
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    logger.info(f"📥 Verificación webhook - mode: {mode}, token: {token}")
    
    if mode == "subscribe" and token == settings.webhook_verify_token:
        logger.info("✅ Webhook verificado correctamente")
        return PlainTextResponse(content=challenge)
    
    logger.warning(f"❌ Verificación fallida - token esperado: {settings.webhook_verify_token}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def recibir_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Recibe mensajes entrantes de WhatsApp (Meta Cloud API).
    """
    try:
        # Verificar firma (opcional pero recomendado)
        signature = request.headers.get("X-Hub-Signature-256", "")
        body = await request.body()
        
        if settings.meta_app_secret and signature:
            if not verify_webhook_signature(body, signature):
                logger.warning("❌ Firma de webhook inválida")
                raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parsear payload
        data = await request.json()
        logger.info(f"📥 Webhook recibido: {data.get('object', 'unknown')}")
        
        # Verificar que es un mensaje de WhatsApp
        if data.get("object") != "whatsapp_business_account":
            return {"status": "ok", "message": "Not a WhatsApp message"}
        
        # Parsear mensaje
        parsed = MetaWhatsAppService.parse_webhook_message(data)
        
        if not parsed:
            logger.info("📭 Webhook sin mensaje (status update o notificación)")
            return {"status": "ok"}
        
        # Extraer datos del mensaje
        user_phone = parsed.get("from")
        message_id = parsed.get("message_id")
        message_text = parsed.get("text", "")
        message_type = parsed.get("type")
        contact_name = parsed.get("contact_name", "")
        
        logger.info(f"📱 Mensaje de {user_phone[:6]}...: {message_text[:50]}...")
        
        # Deduplicación: verificar si ya procesamos este mensaje
        existing = await wa_processed.find_one({"message_id": message_id})
        if existing:
            logger.info(f"⏭️ Mensaje ya procesado: {message_id}")
            return {"status": "ok", "message": "Already processed"}
        
        # Registrar mensaje como procesado
        await wa_processed.insert_one({
            "message_id": message_id,
            "timestamp": parsed.get("timestamp"),
            "processed": True
        })
        
        # Procesar en background para responder rápido a Meta
        background_tasks.add_task(
            procesar_mensaje_whatsapp,
            user_phone=user_phone,
            message_text=message_text,
            message_id=message_id,
            contact_name=contact_name
        )
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"❌ Error en webhook: {str(e)}")
        return {"status": "error", "detail": str(e)}


async def procesar_mensaje_whatsapp(
    user_phone: str,
    message_text: str,
    message_id: str,
    contact_name: str = ""
):
    """
    Procesa un mensaje de WhatsApp en background.
    """
    try:
        # Marcar como leído
        await meta_whatsapp.mark_as_read(message_id)
        
        # 1. Router: identificar empresa
        routing_result = await whatsapp_router.route_incoming_message(
            user_phone=user_phone,
            message_text=message_text,
            whatsapp_number=settings.cotizabot_whatsapp_number
        )
        
        # Si no se identificó empresa, enviar mensaje de selección
        if not routing_result.success:
            if routing_result.message_to_send:
                await meta_whatsapp.send_text_message(
                    to=user_phone,
                    message=routing_result.message_to_send
                )
            return
        
        # 2. Obtener contexto de la empresa
        empresa_id = routing_result.company_id
        empresa_context = await whatsapp_router.get_company_context(empresa_id)
        empresa_nombre = routing_result.company_name or "CotizaBot"
        
        # Enviar mensaje de bienvenida si es nuevo routing
        if routing_result.message_to_send and routing_result.routing_method:
            await meta_whatsapp.send_text_message(
                to=user_phone,
                message=routing_result.message_to_send
            )
            return
        
        # 3. Preparar estado inicial para el orquestador
        from datetime import datetime, timezone
        estado_inicial = {
            'mensaje': message_text,
            'cliente_telefono': user_phone,
            'conversacion_id': f"{user_phone}_{empresa_id}",
            'empresa_id': empresa_id,
            'empresa_context': empresa_context,
            'intencion': None,
            'confianza_intencion': 0.0,
            'cliente_id': None,
            'cliente_nombre': contact_name,
            'historial_cliente': [],
            'cotizacion_actual': None,
            'productos_solicitados': [],
            'respuesta_cotizador': None,
            'respuesta_comercial': None,
            'respuesta_operativo': None,
            'respuesta_compliance': None,
            'respuesta_cobros': None,
            'metodos_disponibles': None,
            'link_pago': None,
            'folio': None,
            'respuesta_final': '',
            'accion': None,
            'agentes_ejecutados': [],
            'errores': [],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # 4. Ejecutar orquestador
        logger.info(f"🤖 Ejecutando orquestador para {empresa_nombre}")
        resultado = await orquestador.ejecutar(estado_inicial)
        
        # 5. Enviar respuesta
        respuesta = resultado.get('respuesta_final', '')
        
        if respuesta:
            # Agregar header de empresa si no está
            if not respuesta.startswith("🤖") and not respuesta.startswith("🔄"):
                respuesta = f"🤖 CotizaBot – {empresa_nombre}\n\n{respuesta}"
            
            await meta_whatsapp.send_text_message(
                to=user_phone,
                message=respuesta
            )
            logger.info(f"✅ Respuesta enviada a {user_phone[:6]}...")
        else:
            # Respuesta genérica si no hay respuesta del orquestador
            await meta_whatsapp.send_text_message(
                to=user_phone,
                message=f"🤖 CotizaBot – {empresa_nombre}\n\n¿En qué puedo ayudarte?"
            )
        
        # 6. Guardar conversación
        await guardar_conversacion(
            user_phone=user_phone,
            empresa_id=empresa_id,
            mensaje_usuario=message_text,
            respuesta_bot=respuesta,
            resultado=resultado
        )
        
    except Exception as e:
        logger.error(f"❌ Error procesando mensaje: {str(e)}")
        # Intentar enviar mensaje de error
        try:
            await meta_whatsapp.send_text_message(
                to=user_phone,
                message="🤖 CotizaBot\n\nHubo un error procesando tu mensaje. Por favor intenta de nuevo."
            )
        except:
            pass


async def guardar_conversacion(
    user_phone: str,
    empresa_id: str,
    mensaje_usuario: str,
    respuesta_bot: str,
    resultado: dict
):
    """Guarda el registro de la conversación"""
    try:
        from datetime import datetime, timezone
        
        conversaciones = db.get_collection('conversaciones')
        
        await conversaciones.update_one(
            {
                'user_phone': user_phone,
                'company_id': empresa_id
            },
            {
                '$set': {
                    'last_message': mensaje_usuario,
                    'last_response': respuesta_bot,
                    'last_intent': resultado.get('intencion'),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                },
                '$push': {
                    'messages': {
                        '$each': [
                            {'role': 'user', 'content': mensaje_usuario, 'timestamp': datetime.now(timezone.utc).isoformat()},
                            {'role': 'assistant', 'content': respuesta_bot, 'timestamp': datetime.now(timezone.utc).isoformat()}
                        ],
                        '$slice': -50  # Mantener últimos 50 mensajes
                    }
                },
                '$setOnInsert': {
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    except Exception as e:
        logger.error(f"Error guardando conversación: {e}")
