"""
CotizaBot - Servicio de WhatsApp (Meta Cloud API)
==================================================

Integración directa con la API de WhatsApp Business de Meta/Facebook.
Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
"""

import httpx
import logging
from typing import Optional, Dict, Any, List
from config import settings

logger = logging.getLogger(__name__)


class MetaWhatsAppService:
    """Servicio para interactuar con la API de WhatsApp de Meta"""
    
    def __init__(self):
        self.api_version = "v18.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.access_token = settings.meta_access_token
        self.phone_number_id = settings.meta_phone_number_id
    
    def _get_headers(self) -> dict:
        """Headers para las peticiones a la API de Meta"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def send_text_message(
        self,
        to: str,
        message: str,
        preview_url: bool = False
    ) -> Dict[str, Any]:
        """
        Envía un mensaje de texto simple.
        
        Args:
            to: Número de teléfono del destinatario (con código de país, sin +)
            message: Texto del mensaje
            preview_url: Si debe mostrar preview de URLs
            
        Returns:
            Respuesta de la API de Meta
        """
        # Limpiar número (remover +, espacios, guiones)
        to_clean = to.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_clean,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json()
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Mensaje enviado a {to_clean[:6]}...")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"❌ Error enviando mensaje: {result}")
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"❌ Error en send_text_message: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_template_message(
        self,
        to: str,
        template_name: str,
        language_code: str = "es_MX",
        components: Optional[List[dict]] = None
    ) -> Dict[str, Any]:
        """
        Envía un mensaje usando una plantilla aprobada.
        
        Args:
            to: Número de teléfono del destinatario
            template_name: Nombre de la plantilla aprobada
            language_code: Código de idioma
            components: Componentes dinámicos de la plantilla
        """
        to_clean = to.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_clean,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code}
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json()
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Template enviado a {to_clean[:6]}...")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"❌ Error enviando template: {result}")
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"❌ Error en send_template_message: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_interactive_buttons(
        self,
        to: str,
        body_text: str,
        buttons: List[Dict[str, str]],
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envía un mensaje con botones interactivos.
        
        Args:
            to: Número de teléfono
            body_text: Texto principal del mensaje
            buttons: Lista de botones [{"id": "btn_1", "title": "Opción 1"}, ...]
            header_text: Texto del header (opcional)
            footer_text: Texto del footer (opcional)
        """
        to_clean = to.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        # Construir botones (máximo 3)
        button_list = []
        for btn in buttons[:3]:
            button_list.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", f"btn_{len(button_list)}"),
                    "title": btn.get("title", "Opción")[:20]  # Máximo 20 caracteres
                }
            })
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_clean,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body_text},
                "action": {"buttons": button_list}
            }
        }
        
        if header_text:
            payload["interactive"]["header"] = {"type": "text", "text": header_text}
        
        if footer_text:
            payload["interactive"]["footer"] = {"text": footer_text}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json()
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Botones enviados a {to_clean[:6]}...")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"❌ Error enviando botones: {result}")
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"❌ Error en send_interactive_buttons: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_list_message(
        self,
        to: str,
        body_text: str,
        button_text: str,
        sections: List[Dict[str, Any]],
        header_text: Optional[str] = None,
        footer_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Envía un mensaje con lista de opciones.
        
        Args:
            to: Número de teléfono
            body_text: Texto principal
            button_text: Texto del botón que abre la lista
            sections: Secciones con opciones [{title: "", rows: [{id, title, description}]}]
        """
        to_clean = to.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_clean,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": body_text},
                "action": {
                    "button": button_text[:20],
                    "sections": sections
                }
            }
        }
        
        if header_text:
            payload["interactive"]["header"] = {"type": "text", "text": header_text}
        
        if footer_text:
            payload["interactive"]["footer"] = {"text": footer_text}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                
                result = response.json()
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Lista enviada a {to_clean[:6]}...")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"❌ Error enviando lista: {result}")
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"❌ Error en send_list_message: {e}")
            return {"success": False, "error": str(e)}
    
    async def mark_as_read(self, message_id: str) -> Dict[str, Any]:
        """Marca un mensaje como leído"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=payload
                )
                return {"success": response.status_code == 200}
        except Exception as e:
            logger.error(f"Error marcando como leído: {e}")
            return {"success": False}
    
    @staticmethod
    def parse_webhook_message(data: dict) -> Optional[Dict[str, Any]]:
        """
        Parsea el payload del webhook de Meta.
        
        Returns:
            Dict con: from, message_id, timestamp, type, text/interactive/etc
            o None si no es un mensaje válido
        """
        try:
            entry = data.get("entry", [])
            if not entry:
                return None
            
            changes = entry[0].get("changes", [])
            if not changes:
                return None
            
            value = changes[0].get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                return None
            
            msg = messages[0]
            
            result = {
                "from": msg.get("from"),
                "message_id": msg.get("id"),
                "timestamp": msg.get("timestamp"),
                "type": msg.get("type"),
                "metadata": value.get("metadata", {})
            }
            
            # Extraer contenido según el tipo
            msg_type = msg.get("type")
            
            if msg_type == "text":
                result["text"] = msg.get("text", {}).get("body", "")
            elif msg_type == "interactive":
                interactive = msg.get("interactive", {})
                interactive_type = interactive.get("type")
                
                if interactive_type == "button_reply":
                    result["button_reply"] = interactive.get("button_reply", {})
                    result["text"] = result["button_reply"].get("title", "")
                elif interactive_type == "list_reply":
                    result["list_reply"] = interactive.get("list_reply", {})
                    result["text"] = result["list_reply"].get("title", "")
            elif msg_type == "image":
                result["image"] = msg.get("image", {})
            elif msg_type == "document":
                result["document"] = msg.get("document", {})
            elif msg_type == "audio":
                result["audio"] = msg.get("audio", {})
            elif msg_type == "location":
                result["location"] = msg.get("location", {})
            
            # Obtener info del contacto
            contacts = value.get("contacts", [])
            if contacts:
                result["contact_name"] = contacts[0].get("profile", {}).get("name")
            
            return result
            
        except Exception as e:
            logger.error(f"Error parseando webhook: {e}")
            return None


# Instancia global
meta_whatsapp = MetaWhatsAppService()
