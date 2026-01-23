"""
Servicio para integración con Facturama API
Generación de facturas CFDI 4.0 para México
"""

import os
import base64
import httpx
import logging
from typing import Dict, Optional, List
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configuración de Facturama
FACTURAMA_API_URL = os.environ.get('FACTURAMA_API_URL', 'https://apisandbox.facturama.mx')
FACTURAMA_USERNAME = os.environ.get('FACTURAMA_USERNAME', '')
FACTURAMA_PASSWORD = os.environ.get('FACTURAMA_PASSWORD', '')


class FacturamaService:
    """Servicio para generar facturas CFDI con Facturama"""
    
    def __init__(self):
        self.api_url = FACTURAMA_API_URL
        self.username = FACTURAMA_USERNAME
        self.password = FACTURAMA_PASSWORD
        self._auth_header = self._encode_credentials()
    
    def _encode_credentials(self) -> str:
        """Codifica credenciales en base64 para autenticación Basic"""
        credentials = f"{self.username}:{self.password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """Realiza petición autenticada a la API de Facturama"""
        headers = {
            "Authorization": self._auth_header,
            "Content-Type": "application/json"
        }
        
        url = f"{self.api_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                if method == "POST":
                    response = await client.post(url, json=data, headers=headers, params=params)
                elif method == "GET":
                    response = await client.get(url, headers=headers, params=params)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers, params=params)
                else:
                    raise ValueError(f"Método no soportado: {method}")
                
                # Log para debugging
                logger.info(f"Facturama {method} {endpoint}: Status {response.status_code}")
                
                if response.status_code >= 400:
                    error_detail = response.text
                    logger.error(f"Error Facturama: {error_detail}")
                    return {
                        "success": False,
                        "error": error_detail,
                        "status_code": response.status_code
                    }
                
                return {
                    "success": True,
                    "data": response.json() if response.text else {}
                }
                
            except httpx.TimeoutException:
                logger.error("Timeout en petición a Facturama")
                return {"success": False, "error": "Timeout en conexión con Facturama"}
            except Exception as e:
                logger.error(f"Error en petición Facturama: {str(e)}")
                return {"success": False, "error": str(e)}
    
    async def verificar_conexion(self) -> Dict:
        """Verifica que las credenciales y conexión funcionen"""
        result = await self._make_request("GET", "/api/Catalogs/ProductOrServices?keyword=servicio")
        return result
    
    async def crear_cliente(self, datos_fiscales: Dict) -> Dict:
        """
        Crea un cliente en Facturama
        
        Args:
            datos_fiscales: Diccionario con RFC, razon_social, etc.
        """
        cliente_payload = {
            "Id": None,
            "Rfc": datos_fiscales.get('rfc', '').upper(),
            "Name": datos_fiscales.get('razon_social', ''),
            "FiscalRegime": datos_fiscales.get('regimen_fiscal', '601'),
            "CfdiUse": datos_fiscales.get('uso_cfdi', 'G03'),
            "TaxZipCode": datos_fiscales.get('codigo_postal', ''),
            "Email": datos_fiscales.get('email_factura', ''),
            "Address": {
                "Street": datos_fiscales.get('domicilio_fiscal', ''),
                "ZipCode": datos_fiscales.get('codigo_postal', '')
            }
        }
        
        result = await self._make_request("POST", "/api/Client", cliente_payload)
        return result
    
    async def buscar_cliente_por_rfc(self, rfc: str) -> Dict:
        """Busca un cliente existente por RFC"""
        result = await self._make_request("GET", f"/api/Client?rfc={rfc}")
        return result
    
    async def crear_factura_cfdi(
        self,
        emisor: Dict,
        receptor: Dict,
        conceptos: List[Dict],
        forma_pago: str = "03",  # Transferencia electrónica
        metodo_pago: str = "PUE",  # Pago en una sola exhibición
        moneda: str = "MXN",
        tipo_comprobante: str = "I"  # Ingreso
    ) -> Dict:
        """
        Crea una factura CFDI 4.0
        
        Args:
            emisor: Datos del emisor (empresa que factura)
            receptor: Datos del receptor (cliente)
            conceptos: Lista de productos/servicios a facturar
            forma_pago: Código SAT de forma de pago
            metodo_pago: PUE (una exhibición) o PPD (parcialidades)
            moneda: Código de moneda (MXN, USD, etc.)
            tipo_comprobante: I (Ingreso), E (Egreso), T (Traslado)
        """
        
        # Construir items de la factura
        items = []
        for concepto in conceptos:
            item = {
                "ProductCode": concepto.get('clave_producto', '81112100'),  # Servicios de software
                "UnitCode": concepto.get('clave_unidad', 'E48'),  # Unidad de servicio
                "Unit": concepto.get('unidad', 'Servicio'),
                "Description": concepto.get('descripcion', ''),
                "IdentificationNumber": concepto.get('numero_identificacion', ''),
                "Quantity": concepto.get('cantidad', 1),
                "UnitPrice": concepto.get('precio_unitario', 0),
                "Subtotal": concepto.get('subtotal', 0),
                "TaxObject": "02",  # Sí objeto de impuesto
                "Taxes": [
                    {
                        "Total": round(concepto.get('subtotal', 0) * 0.16, 2),
                        "Name": "IVA",
                        "Base": concepto.get('subtotal', 0),
                        "Rate": 0.16,
                        "IsRetention": False
                    }
                ],
                "Total": round(concepto.get('subtotal', 0) * 1.16, 2)
            }
            items.append(item)
        
        # Calcular totales
        subtotal = sum(c.get('subtotal', 0) for c in conceptos)
        iva = round(subtotal * 0.16, 2)
        total = round(subtotal + iva, 2)
        
        # Payload de la factura
        factura_payload = {
            "Receiver": {
                "Rfc": receptor.get('rfc', '').upper(),
                "Name": receptor.get('razon_social', ''),
                "CfdiUse": receptor.get('uso_cfdi', 'G03'),
                "FiscalRegime": receptor.get('regimen_fiscal', '601'),
                "TaxZipCode": receptor.get('codigo_postal', '')
            },
            "CfdiType": tipo_comprobante,
            "PaymentForm": forma_pago,
            "PaymentMethod": metodo_pago,
            "Currency": moneda,
            "Folio": None,  # Facturama asigna automáticamente
            "Serie": None,
            "Items": items
        }
        
        logger.info(f"Creando factura CFDI para RFC: {receptor.get('rfc')}")
        
        # Crear factura usando API Lite (timbrado inmediato)
        result = await self._make_request("POST", "/api-lite/3/cfdis", factura_payload)
        
        if result.get('success'):
            factura_data = result.get('data', {})
            logger.info(f"Factura CFDI creada exitosamente: {factura_data.get('Id')}")
            
            return {
                "success": True,
                "factura_id": factura_data.get('Id'),
                "uuid": factura_data.get('Complement', {}).get('TaxStamp', {}).get('Uuid'),
                "folio": factura_data.get('Folio'),
                "serie": factura_data.get('Serie'),
                "fecha_timbrado": factura_data.get('Complement', {}).get('TaxStamp', {}).get('Date'),
                "total": total,
                "subtotal": subtotal,
                "iva": iva,
                "data": factura_data
            }
        
        return result
    
    async def obtener_pdf_factura(self, factura_id: str) -> Dict:
        """Obtiene el PDF de una factura"""
        result = await self._make_request("GET", f"/api-lite/cfdis/{factura_id}?format=pdf")
        return result
    
    async def obtener_xml_factura(self, factura_id: str) -> Dict:
        """Obtiene el XML de una factura"""
        result = await self._make_request("GET", f"/api-lite/cfdis/{factura_id}?format=xml")
        return result
    
    async def descargar_factura(self, factura_id: str, formato: str = "pdf") -> Dict:
        """
        Descarga factura en formato especificado
        
        Args:
            factura_id: ID de la factura en Facturama
            formato: 'pdf' o 'xml'
        """
        endpoint = f"/cfdi/{formato}/issuedLite/{factura_id}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                headers = {"Authorization": self._auth_header}
                response = await client.get(f"{self.api_url}{endpoint}", headers=headers)
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "content": response.content,
                        "content_type": response.headers.get('content-type')
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Error descargando {formato}: {response.status_code}"
                    }
                    
            except Exception as e:
                return {"success": False, "error": str(e)}
    
    async def cancelar_factura(
        self, 
        factura_id: str, 
        motivo: str = "02",  # Error en datos
        uuid_sustitucion: Optional[str] = None
    ) -> Dict:
        """
        Cancela una factura CFDI
        
        Args:
            factura_id: ID de la factura
            motivo: Código de motivo de cancelación SAT
                01 - Comprobante emitido con errores con relación
                02 - Comprobante emitido con errores sin relación
                03 - No se llevó a cabo la operación
                04 - Operación nominativa relacionada
            uuid_sustitucion: UUID de la factura que sustituye (para motivo 01)
        """
        params = {
            "motive": motivo,
            "type": "issuedLite"
        }
        
        if uuid_sustitucion and motivo == "01":
            params["uuidReplacement"] = uuid_sustitucion
        
        result = await self._make_request("DELETE", f"/api/cfdi/{factura_id}", params=params)
        return result
    
    async def obtener_catalogos_sat(self, catalogo: str, keyword: str = "") -> Dict:
        """
        Obtiene catálogos del SAT
        
        Args:
            catalogo: Nombre del catálogo (ProductOrServices, Units, PaymentForms, etc.)
            keyword: Palabra clave para filtrar
        """
        endpoint = f"/api/Catalogs/{catalogo}"
        if keyword:
            endpoint += f"?keyword={keyword}"
        
        result = await self._make_request("GET", endpoint)
        return result


# Instancia global del servicio
facturama_service = FacturamaService()
