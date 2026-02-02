"""
CotizaBot - Servicio de Cobros
==============================

Soporta:
- Mercado Pago (link de pago)
- SPEI (datos bancarios)
"""

import httpx
import logging
import os
from typing import Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Configuración Mercado Pago
MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
MERCADOPAGO_PUBLIC_KEY = os.environ.get('MERCADOPAGO_PUBLIC_KEY', '')


class CobroService:
    """Servicio para generar links de pago y datos bancarios"""
    
    def __init__(self):
        self.mp_access_token = MERCADOPAGO_ACCESS_TOKEN
        self.mp_base_url = "https://api.mercadopago.com"
    
    async def generar_link_mercadopago_empresa(
        self,
        mp_token: str,
        titulo: str,
        monto: float,
        referencia: str,
        email_comprador: Optional[str] = None,
        descripcion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Genera un link de pago usando el token de Mercado Pago de la EMPRESA.
        Cada empresa tiene su propio Access Token.
        """
        if not mp_token:
            return {
                "success": False,
                "error": "Token de Mercado Pago no proporcionado."
            }
        
        payload = {
            "items": [{
                "title": titulo,
                "quantity": 1,
                "unit_price": float(monto),
                "currency_id": "MXN"
            }],
            "external_reference": referencia,
            "auto_return": "approved",
            "expires": True
        }
        
        if email_comprador:
            payload["payer"] = {"email": email_comprador}
        
        if descripcion:
            payload["items"][0]["description"] = descripcion
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.mp_base_url}/checkout/preferences",
                    headers={
                        "Authorization": f"Bearer {mp_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "link": data.get("init_point"),
                        "sandbox_link": data.get("sandbox_init_point"),
                        "preference_id": data.get("id"),
                        "referencia": referencia
                    }
                else:
                    logger.error(f"Error Mercado Pago: {response.text}")
                    return {
                        "success": False,
                        "error": response.text
                    }
                    
        except Exception as e:
            logger.error(f"Error generando link MP empresa: {e}")
            return {"success": False, "error": str(e)}
    
    
    async def generar_link_mercadopago(
        self,
        titulo: str,
        monto: float,
        referencia: str,
        email_comprador: Optional[str] = None,
        descripcion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Genera un link de pago de Mercado Pago.
        
        Args:
            titulo: Título del producto/servicio
            monto: Monto en MXN
            referencia: ID interno de referencia (folio cotización)
            email_comprador: Email del comprador (opcional)
            descripcion: Descripción adicional
            
        Returns:
            Dict con link de pago y datos
        """
        if not self.mp_access_token:
            return {
                "success": False,
                "error": "Mercado Pago no configurado. Configura MERCADOPAGO_ACCESS_TOKEN."
            }
        
        payload = {
            "items": [{
                "title": titulo,
                "quantity": 1,
                "unit_price": float(monto),
                "currency_id": "MXN"
            }],
            "external_reference": referencia,
            "auto_return": "approved",
            "notification_url": os.environ.get('WEBHOOK_URL_MP', ''),
            "expires": True,
            "expiration_date_to": (datetime.now(timezone.utc).replace(hour=23, minute=59)).isoformat()
        }
        
        if email_comprador:
            payload["payer"] = {"email": email_comprador}
        
        if descripcion:
            payload["items"][0]["description"] = descripcion
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.mp_base_url}/checkout/preferences",
                    headers={
                        "Authorization": f"Bearer {self.mp_access_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "link": data.get("init_point"),  # Link de pago
                        "sandbox_link": data.get("sandbox_init_point"),  # Para pruebas
                        "preference_id": data.get("id"),
                        "referencia": referencia
                    }
                else:
                    logger.error(f"Error Mercado Pago: {response.text}")
                    return {
                        "success": False,
                        "error": response.text
                    }
                    
        except Exception as e:
            logger.error(f"Error generando link MP: {e}")
            return {"success": False, "error": str(e)}
    
    def generar_datos_spei(
        self,
        empresa_config: Dict[str, Any],
        monto: float,
        referencia: str
    ) -> Dict[str, Any]:
        """
        Genera los datos bancarios para pago por SPEI.
        
        Args:
            empresa_config: Configuración de la empresa con datos bancarios
            monto: Monto a pagar
            referencia: Referencia/concepto del pago
            
        Returns:
            Dict con datos bancarios formateados
        """
        datos_bancarios = empresa_config.get('datos_bancarios', {})
        
        if not datos_bancarios.get('clabe'):
            return {
                "success": False,
                "error": "Datos bancarios no configurados"
            }
        
        return {
            "success": True,
            "banco": datos_bancarios.get('banco', 'N/A'),
            "beneficiario": datos_bancarios.get('beneficiario', empresa_config.get('nombre', '')),
            "clabe": datos_bancarios.get('clabe'),
            "referencia": referencia,
            "monto": monto,
            "concepto": f"Pago cotización {referencia}",
            "mensaje_formateado": self._formatear_mensaje_spei(
                datos_bancarios,
                empresa_config.get('nombre', ''),
                monto,
                referencia
            )
        }
    
    def _formatear_mensaje_spei(
        self,
        datos_bancarios: Dict,
        empresa_nombre: str,
        monto: float,
        referencia: str
    ) -> str:
        """Formatea mensaje de datos bancarios para WhatsApp"""
        return f"""💳 *Datos para transferencia SPEI*

🏦 Banco: {datos_bancarios.get('banco', 'N/A')}
👤 Beneficiario: {datos_bancarios.get('beneficiario', empresa_nombre)}
🔢 CLABE: {datos_bancarios.get('clabe')}
💰 Monto: ${monto:,.2f} MXN
📝 Concepto: Pago {referencia}

⚠️ Importante: Usa exactamente la referencia indicada para identificar tu pago.

Una vez realizada la transferencia, envíanos tu comprobante."""


# Instancia global
cobro_service = CobroService()
