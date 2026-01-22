from fastapi import APIRouter, Request, HTTPException, Form
from fastapi.responses import Response
from agents.orquestador import OrquestadorCotizaBot
from services.whatsapp_service import whatsapp_service
from database import conversaciones_collection, mensajes_collection, clientes_collection
from models.mensaje import DireccionMensaje, TipoMensaje
import logging
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/webhook", tags=["webhook"])
logger = logging.getLogger(__name__)

# Instancia global del orquestador
orquestador = OrquestadorCotizaBot()

@router.post("/twilio/whatsapp")
async def webhook_whatsapp_entrante(request: Request):
    """Webhook para mensajes entrantes de WhatsApp vía Twilio"""
    try:
        # Obtener datos del formulario de Twilio
        form_data = await request.form()
        
        from_number = form_data.get('From', '').replace('whatsapp:', '')
        to_number = form_data.get('To', '')
        body = form_data.get('Body', '')
        message_sid = form_data.get('MessageSid', '')
        num_media = int(form_data.get('NumMedia', 0))
        
        logger.info(f"Mensaje recibido de {from_number}: {body}")
        
        # Buscar o crear cliente
        cliente = await clientes_collection.find_one({'telefono': from_number})
        
        if not cliente:
            cliente_id = str(uuid.uuid4())
            cliente = {
                'id': cliente_id,
                'telefono': from_number,
                'nombre': None,
                'total_cotizaciones': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await clientes_collection.insert_one(cliente)
        else:
            cliente_id = cliente['id']
        
        # Buscar o crear conversación activa
        conversacion = await conversaciones_collection.find_one({
            'cliente_telefono': from_number,
            'estado': 'activa'
        })
        
        if not conversacion:
            conversacion_id = str(uuid.uuid4())
            conversacion = {
                'id': conversacion_id,
                'cliente_telefono': from_number,
                'cliente_nombre': cliente.get('nombre'),
                'estado': 'activa',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await conversaciones_collection.insert_one(conversacion)
        else:
            conversacion_id = conversacion['id']
        
        # Guardar mensaje entrante
        mensaje_entrante = {
            'id': str(uuid.uuid4()),
            'conversacion_id': conversacion_id,
            'cliente_telefono': from_number,
            'direccion': DireccionMensaje.ENTRANTE.value,
            'contenido': body,
            'tipo': TipoMensaje.TEXTO.value,
            'twilio_sid': message_sid,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await mensajes_collection.insert_one(mensaje_entrante)
        
        # Obtener historial reciente de la conversación (últimos 5 mensajes)
        historial_mensajes = await mensajes_collection.find(
            {'conversacion_id': conversacion_id},
            {'_id': 0, 'direccion': 1, 'contenido': 1, 'timestamp': 1}
        ).sort('timestamp', -1).limit(5).to_list(5)
        
        # Procesar con orquestador
        resultado = await orquestador.procesar_mensaje(
            mensaje=body,
            cliente_telefono=from_number,
            conversacion_id=conversacion_id,
            cliente_nombre=cliente.get('nombre', 'Cliente'),
            historial=historial_mensajes
        )
        
        respuesta_texto = resultado['respuesta']
        
        # Limpiar caracteres problemáticos para encoding
        respuesta_texto = respuesta_texto.encode('utf-8', errors='ignore').decode('utf-8')
        
        # Guardar mensaje saliente
        mensaje_saliente = {
            'id': str(uuid.uuid4()),
            'conversacion_id': conversacion_id,
            'cliente_telefono': from_number,
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
        logger.error(f"Error en webhook WhatsApp: {str(e)}")
        # Devolver respuesta vacía para evitar reintentos de Twilio
        respuesta_error = whatsapp_service.generar_respuesta_twiml(
            "Disculpa, ocurrió un error procesando tu mensaje. Inténtalo de nuevo."
        )
        return Response(content=respuesta_error, media_type="application/xml")