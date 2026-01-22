from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from config import settings
import logging

logger = logging.getLogger(__name__)

class WhatsAppService:
    """Servicio para enviar y recibir mensajes de WhatsApp vía Twilio"""
    
    def __init__(self):
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.client = Client(
                settings.twilio_account_sid,
                settings.twilio_auth_token
            )
            self.sender_number = settings.twilio_whatsapp_number
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")
    
    async def enviar_mensaje(self, to_number: str, body: str, media_url: str = None) -> dict:
        """Envía un mensaje de WhatsApp"""
        if not self.client:
            logger.warning("Twilio not configured, mensaje no enviado")
            return {'success': False, 'error': 'Twilio no configurado'}
        
        try:
            to_formatted = f"whatsapp:{to_number}"
            from_formatted = f"whatsapp:{self.sender_number}"
            
            message_params = {
                'body': body,
                'from_': from_formatted,
                'to': to_formatted
            }
            
            if media_url:
                message_params['media_url'] = [media_url]
            
            message = self.client.messages.create(**message_params)
            
            logger.info(f"Mensaje enviado: {message.sid} a {to_number}")
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status
            }
            
        except Exception as e:
            logger.error(f"Error enviando mensaje WhatsApp: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def generar_respuesta_twiml(self, mensaje: str) -> str:
        """Genera respuesta en formato TwiML para webhooks"""
        response = MessagingResponse()
        response.message(mensaje)
        return str(response)

whatsapp_service = WhatsAppService()