"""
CotizaBot - Servicio de WhatsApp via 360dialog
===============================================

Implementación de WhatsApp Business API usando 360dialog.
Base URL: https://waba-v2.360dialog.io
"""

import httpx
import logging
import os
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Configuración de 360dialog
DIALOG360_BASE_URL = os.environ.get('DIALOG360_BASE_URL', 'https://waba-v2.360dialog.io')
DIALOG360_API_KEY = os.environ.get('DIALOG360_API_KEY', '')
WHATSAPP_NUMBER = os.environ.get('COTIZABOT_WHATSAPP_NUMBER', '+5218344291628')


class Dialog360Service:
    """
    Servicio para enviar y recibir mensajes de WhatsApp via 360dialog.
    """
    
    def __init__(self):
        self.base_url = DIALOG360_BASE_URL
        self.api_key = DIALOG360_API_KEY
        self.headers = {
            'D360-API-KEY': self.api_key,
            'Content-Type': 'application/json'
        }
    
    async def enviar_mensaje_texto(
        self, 
        destinatario: str, 
        mensaje: str
    ) -> Dict[str, Any]:
        """
        Envía un mensaje de texto a un número de WhatsApp.
        
        Args:
            destinatario: Número de teléfono del destinatario (formato: 528341234567)
            mensaje: Texto del mensaje a enviar
            
        Returns:
            Respuesta de la API de 360dialog
        """
        # Limpiar número (quitar + y espacios, mantener solo dígitos)
        numero_limpio = ''.join(filter(str.isdigit, destinatario))
        
        # Para México: si empieza con 521, quitar el 1 (ej: 5218344291628 -> 528344291628)
        if numero_limpio.startswith('521') and len(numero_limpio) == 13:
            numero_limpio = '52' + numero_limpio[3:]
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": numero_limpio,
            "type": "text",
            "text": {"body": mensaje}
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=self.headers,
                    json=payload
                )
                
                logger.info(f"360dialog response: {response.status_code} - {response.text[:200]}")
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Mensaje enviado a {numero_limpio}")
                    return {"success": True, "data": response.json()}
                else:
                    logger.error(f"❌ Error enviando mensaje: {response.status_code} - {response.text}")
                    return {"success": False, "error": response.text, "status_code": response.status_code}
                    
        except Exception as e:
            logger.error(f"❌ Error de conexión con 360dialog: {str(e)}")
            return {"success": False, "error": str(e)}
    
    
    async def enviar_mensaje_con_botones(
        self,
        destinatario: str,
        mensaje: str,
        botones: list
    ) -> Dict[str, Any]:
        """
        Envía un mensaje con botones interactivos.
        
        Args:
            destinatario: Número de teléfono
            mensaje: Texto del mensaje
            botones: Lista de botones [{"id": "btn1", "title": "Opción 1"}, ...]
        """
        numero_limpio = destinatario.replace('+', '').replace(' ', '').replace('-', '')
        
        # Máximo 3 botones según API de WhatsApp
        botones_payload = []
        for i, btn in enumerate(botones[:3]):
            botones_payload.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", f"btn_{i}"),
                    "title": btn.get("title", f"Opción {i+1}")[:20]  # Máx 20 chars
                }
            })
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": numero_limpio,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {
                    "text": mensaje
                },
                "action": {
                    "buttons": botones_payload
                }
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    return {"success": True, "data": response.json()}
                else:
                    logger.error(f"Error enviando botones: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            logger.error(f"Error de conexión: {str(e)}")
            return {"success": False, "error": str(e)}
    
    
    async def enviar_documento(
        self,
        destinatario: str,
        documento_url: str,
        nombre_archivo: str,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envía un documento (PDF, Excel, etc.) por WhatsApp.
        """
        numero_limpio = destinatario.replace('+', '').replace(' ', '').replace('-', '')
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": numero_limpio,
            "type": "document",
            "document": {
                "link": documento_url,
                "filename": nombre_archivo
            }
        }
        
        if caption:
            payload["document"]["caption"] = caption
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    
    async def marcar_como_leido(self, message_id: str) -> bool:
        """
        Marca un mensaje como leído (doble check azul).
        """
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=self.headers,
                    json=payload
                )
                return response.status_code in [200, 201]
        except:
            return False
    
    
    def parse_webhook_message(self, payload: dict) -> Optional[Dict[str, Any]]:
        """
        Parsea el payload del webhook de 360dialog y extrae los datos relevantes.
        
        Returns:
            Dict con: from_number, message_text, message_id, message_type, timestamp
            o None si no es un mensaje válido
        """
        try:
            # Estructura del webhook de 360dialog/Cloud API
            entry = payload.get('entry', [])
            if not entry:
                # Formato alternativo directo
                messages = payload.get('messages', [])
                if messages:
                    msg = messages[0]
                    return {
                        'from_number': msg.get('from'),
                        'message_text': msg.get('text', {}).get('body', ''),
                        'message_id': msg.get('id'),
                        'message_type': msg.get('type', 'text'),
                        'timestamp': msg.get('timestamp')
                    }
                return None
            
            # Formato Cloud API estándar
            changes = entry[0].get('changes', [])
            if not changes:
                return None
            
            value = changes[0].get('value', {})
            messages = value.get('messages', [])
            
            if not messages:
                return None
            
            msg = messages[0]
            
            # Extraer texto según el tipo de mensaje
            message_type = msg.get('type', 'text')
            message_text = ''
            
            if message_type == 'text':
                message_text = msg.get('text', {}).get('body', '')
            elif message_type == 'interactive':
                # Respuesta de botón o lista
                interactive = msg.get('interactive', {})
                if interactive.get('type') == 'button_reply':
                    message_text = interactive.get('button_reply', {}).get('title', '')
                elif interactive.get('type') == 'list_reply':
                    message_text = interactive.get('list_reply', {}).get('title', '')
            elif message_type == 'button':
                message_text = msg.get('button', {}).get('text', '')
            
            return {
                'from_number': msg.get('from'),
                'message_text': message_text,
                'message_id': msg.get('id'),
                'message_type': message_type,
                'timestamp': msg.get('timestamp'),
                'contacts': value.get('contacts', [])
            }
            
        except Exception as e:
            logger.error(f"Error parseando webhook: {str(e)}")
            return None


# Instancia global del servicio
dialog360_service = Dialog360Service()
