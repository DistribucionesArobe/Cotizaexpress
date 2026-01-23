import os
import asyncio
import logging
import resend
import base64
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'contacto@cotizaexpress.com')
# Fallback para pruebas si el dominio no está verificado
FALLBACK_SENDER = 'onboarding@resend.dev'

class EmailService:
    """Servicio para enviar emails con cotizaciones"""
    
    def __init__(self):
        self.sender_email = SENDER_EMAIL
        self.fallback_sender = FALLBACK_SENDER
    
    def _get_sender_email(self, nombre_empresa: str = 'CotizaBot') -> str:
        """Obtiene el email de envío, con fallback si el dominio no está verificado"""
        # Usar el email configurado, pero si falla usar el fallback
        return f"{nombre_empresa} <{self.sender_email}>"
    
    def _generar_html_cotizacion(self, cotizacion: dict, empresa: dict = None) -> str:
        """Genera HTML para email de cotización"""
        empresa_nombre = empresa.get('nombre', 'CotizaBot') if empresa else 'CotizaBot'
        empresa_telefono = empresa.get('telefono', '+52 81 3078 3171') if empresa else '+52 81 3078 3171'
        empresa_email = empresa.get('email', 'contacto@arobegroup.com') if empresa else 'contacto@arobegroup.com'
        
        # Generar filas de productos
        productos_html = ""
        for item in cotizacion.get('items', []):
            productos_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item['producto_nombre']}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item['cantidad']}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item['precio_unitario']:,.2f}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item['subtotal']:,.2f}</td>
            </tr>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">{empresa_nombre}</h1>
                                    <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">Cotización #{cotizacion['folio']}</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                                        Hola <strong>{cotizacion['cliente_nombre']}</strong>,
                                    </p>
                                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 30px 0;">
                                        Gracias por tu interés. Adjuntamos la cotización solicitada con los detalles de los productos.
                                    </p>
                                    
                                    <!-- Resumen -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding: 5px 0;">
                                                            <span style="color: #6b7280; font-size: 14px;">Folio:</span>
                                                            <span style="color: #111827; font-size: 14px; font-weight: bold; float: right;">{cotizacion['folio']}</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 5px 0;">
                                                            <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
                                                            <span style="color: #111827; font-size: 14px; float: right;">${cotizacion['subtotal']:,.2f} MXN</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 5px 0;">
                                                            <span style="color: #6b7280; font-size: 14px;">IVA (16%):</span>
                                                            <span style="color: #111827; font-size: 14px; float: right;">${cotizacion['iva']:,.2f} MXN</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0 0 0; border-top: 2px solid #059669;">
                                                            <span style="color: #059669; font-size: 18px; font-weight: bold;">Total:</span>
                                                            <span style="color: #059669; font-size: 18px; font-weight: bold; float: right;">${cotizacion['total']:,.2f} MXN</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- CTA -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
                                                    📎 El PDF de la cotización está adjunto a este correo.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Validez -->
                                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                                        Esta cotización es válida hasta: <strong>{cotizacion.get('valida_hasta', 'N/A')}</strong>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #1f2937; padding: 25px; text-align: center;">
                                    <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                                        <strong style="color: #ffffff;">{empresa_nombre}</strong>
                                    </p>
                                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                                        📞 {empresa_telefono} | ✉️ {empresa_email}
                                    </p>
                                    <p style="color: #6b7280; font-size: 11px; margin: 15px 0 0 0;">
                                        Cotización generada por CotizaBot • cotizaexpress.com
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        return html
    
    async def enviar_cotizacion(
        self, 
        cotizacion: dict, 
        pdf_path: str,
        destinatario_email: str,
        empresa: dict = None
    ) -> dict:
        """Envía cotización por email con PDF adjunto"""
        try:
            if not resend.api_key:
                logger.warning("RESEND_API_KEY no configurado - email no enviado")
                return {
                    "success": False,
                    "error": "Servicio de email no configurado"
                }
            
            # Leer PDF y convertir a base64
            pdf_file = Path(pdf_path)
            if not pdf_file.exists():
                raise FileNotFoundError(f"PDF no encontrado: {pdf_path}")
            
            with open(pdf_file, 'rb') as f:
                pdf_content = base64.b64encode(f.read()).decode('utf-8')
            
            # Generar HTML
            html_content = self._generar_html_cotizacion(cotizacion, empresa)
            
            # Nombre del archivo adjunto
            pdf_filename = f"Cotizacion_{cotizacion['folio']}.pdf"
            
            # Preparar email
            empresa_nombre = empresa.get('nombre', 'CotizaBot') if empresa else 'CotizaBot'
            
            params = {
                "from": f"{empresa_nombre} <{self.sender_email}>",
                "to": [destinatario_email],
                "subject": f"Cotización {cotizacion['folio']} - {empresa_nombre}",
                "html": html_content,
                "attachments": [
                    {
                        "filename": pdf_filename,
                        "content": pdf_content
                    }
                ]
            }
            
            # Enviar email (async)
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            
            logger.info(f"Email enviado a {destinatario_email} - Cotización {cotizacion['folio']}")
            
            return {
                "success": True,
                "email_id": email_result.get("id"),
                "destinatario": destinatario_email,
                "mensaje": f"Cotización enviada a {destinatario_email}"
            }
            
        except Exception as e:
            logger.error(f"Error enviando email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def enviar_solicitud_factura(
        self,
        empresa: dict,
        datos_fiscales: dict,
        cotizacion_folio: str
    ) -> dict:
        """Envía solicitud de factura al equipo de CotizaBot"""
        try:
            if not resend.api_key:
                logger.warning("RESEND_API_KEY no configurado")
                return {"success": False, "error": "Servicio de email no configurado"}
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #059669;">📄 Solicitud de Factura CFDI</h2>
                
                <h3>Datos del Cliente</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Empresa:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{empresa.get('nombre', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{empresa.get('email', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Teléfono:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{empresa.get('telefono', 'N/A')}</td></tr>
                </table>
                
                <h3>Datos Fiscales</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>RFC:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('rfc', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Razón Social:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('razon_social', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Régimen Fiscal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('regimen_fiscal', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Uso CFDI:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('uso_cfdi', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Código Postal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('codigo_postal', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Domicilio Fiscal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('domicilio_fiscal', 'N/A')}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email para Factura:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{datos_fiscales.get('email_factura', 'N/A')}</td></tr>
                </table>
                
                <h3>Referencia</h3>
                <p><strong>Cotización/Pago:</strong> {cotizacion_folio}</p>
                
                <hr>
                <p style="color: #6b7280; font-size: 12px;">Solicitud enviada desde CotizaBot - cotizaexpress.com</p>
            </body>
            </html>
            """
            
            params = {
                "from": f"CotizaBot <{self.sender_email}>",
                "to": ["contacto@arobegroup.com"],  # Email del equipo
                "subject": f"🧾 Solicitud de Factura - {empresa.get('nombre', 'Cliente')} - {cotizacion_folio}",
                "html": html
            }
            
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            
            logger.info(f"Solicitud de factura enviada para {empresa.get('nombre')}")
            
            return {
                "success": True,
                "email_id": email_result.get("id"),
                "mensaje": "Solicitud de factura enviada. Te contactaremos pronto."
            }
            
        except Exception as e:
            logger.error(f"Error enviando solicitud de factura: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def enviar_factura_generada(
        self,
        empresa: dict,
        datos_fiscales: dict,
        factura_data: dict
    ) -> dict:
        """Envía notificación de factura CFDI generada al cliente"""
        try:
            if not resend.api_key:
                logger.warning("RESEND_API_KEY no configurado")
                return {"success": False, "error": "Servicio de email no configurado"}
            
            # Email del destinatario
            email_destino = datos_fiscales.get('email_factura') or empresa.get('email')
            
            if not email_destino:
                return {"success": False, "error": "No hay email de destino"}
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Factura CFDI Generada</h1>
                                        <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">CotizaBot by CotizaExpress.com</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 30px;">
                                        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                                            Hola <strong>{datos_fiscales.get('razon_social', empresa.get('nombre', 'Cliente'))}</strong>,
                                        </p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 30px 0;">
                                            Tu factura CFDI ha sido generada exitosamente. A continuación encontrarás los detalles:
                                        </p>
                                        
                                        <!-- Datos de la factura -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                                            <tr>
                                                <td style="padding: 20px;">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280;">UUID:</td>
                                                            <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 12px;">{factura_data.get('uuid', 'N/A')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280;">Folio:</td>
                                                            <td style="padding: 8px 0; color: #111827;">{factura_data.get('folio', 'N/A')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280;">Serie:</td>
                                                            <td style="padding: 8px 0; color: #111827;">{factura_data.get('serie', 'N/A')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280;">Fecha Timbrado:</td>
                                                            <td style="padding: 8px 0; color: #111827;">{factura_data.get('fecha_timbrado', 'N/A')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px;">Subtotal:</td>
                                                            <td style="padding: 8px 0; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 12px;">${factura_data.get('subtotal', 0):,.2f} MXN</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #6b7280;">IVA (16%):</td>
                                                            <td style="padding: 8px 0; color: #111827;">${factura_data.get('iva', 0):,.2f} MXN</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; color: #059669; font-weight: bold;">Total:</td>
                                                            <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">${factura_data.get('total', 0):,.2f} MXN</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                                            Puedes descargar tu factura (PDF y XML) desde tu panel de control en CotizaBot.
                                        </p>
                                        
                                        <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0 0;">
                                            Esta factura es un Comprobante Fiscal Digital por Internet (CFDI) válido ante el SAT.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                                        <p style="color: #6b7280; margin: 0; font-size: 12px;">
                                            CotizaBot by CotizaExpress.com<br>
                                            +52 81 3078 3171 | contacto@arobegroup.com
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """
            
            params = {
                "from": f"CotizaBot <{self.sender_email}>",
                "to": [email_destino],
                "subject": f"✅ Factura CFDI Generada - UUID: {factura_data.get('uuid', 'N/A')[:8]}...",
                "html": html
            }
            
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            
            logger.info(f"Notificación de factura enviada a {email_destino}")
            
            return {
                "success": True,
                "email_id": email_result.get("id"),
                "destinatario": email_destino
            }
            
        except Exception as e:
            logger.error(f"Error enviando notificación de factura: {str(e)}")
            return {"success": False, "error": str(e)}

email_service = EmailService()
