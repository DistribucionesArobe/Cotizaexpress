from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from utils.auth import get_current_user
from database import db
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from datetime import datetime, timezone
import os
import logging

router = APIRouter(prefix="/twilio", tags=["twilio"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')

# Ciudades mexicanas con sus códigos de área para búsqueda de números
CIUDADES_MEXICO = {
    "ciudad_mexico": {"nombre": "Ciudad de México", "area_codes": ["55", "56"]},
    "monterrey": {"nombre": "Monterrey", "area_codes": ["81"]},
    "guadalajara": {"nombre": "Guadalajara", "area_codes": ["33"]},
    "puebla": {"nombre": "Puebla", "area_codes": ["222"]},
    "tijuana": {"nombre": "Tijuana", "area_codes": ["664"]},
    "leon": {"nombre": "León", "area_codes": ["477"]},
    "queretaro": {"nombre": "Querétaro", "area_codes": ["442"]},
    "merida": {"nombre": "Mérida", "area_codes": ["999"]},
    "cancun": {"nombre": "Cancún", "area_codes": ["998"]},
    "toluca": {"nombre": "Toluca", "area_codes": ["722"]},
}

class BuscarNumerosRequest(BaseModel):
    ciudad: str  # key de CIUDADES_MEXICO

class ComprarNumeroRequest(BaseModel):
    phone_number: str

class NumeroDisponible(BaseModel):
    phone_number: str
    friendly_name: str
    locality: Optional[str] = None
    region: Optional[str] = None
    capabilities: dict

def get_twilio_client():
    """Obtiene cliente Twilio con credenciales de la empresa o globales"""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    
    if not account_sid or not auth_token:
        raise HTTPException(
            status_code=500,
            detail="Credenciales de Twilio no configuradas"
        )
    
    return Client(account_sid, auth_token)

@router.get("/ciudades")
async def listar_ciudades(current_user: dict = Depends(get_current_user)):
    """Lista las ciudades disponibles para buscar números"""
    return {
        "ciudades": [
            {"key": key, "nombre": data["nombre"]}
            for key, data in CIUDADES_MEXICO.items()
        ]
    }

@router.post("/buscar-numeros", response_model=List[NumeroDisponible])
async def buscar_numeros_disponibles(
    request: BuscarNumerosRequest,
    current_user: dict = Depends(get_current_user)
):
    """Busca números de teléfono disponibles en una ciudad de México"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Verificar que la empresa tenga plan completo
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        if empresa.get('plan') != 'completo':
            raise HTTPException(
                status_code=403,
                detail="Necesitas el Plan Completo para obtener un número de WhatsApp"
            )
        
        # Validar ciudad
        if request.ciudad not in CIUDADES_MEXICO:
            raise HTTPException(
                status_code=400,
                detail=f"Ciudad no válida. Opciones: {list(CIUDADES_MEXICO.keys())}"
            )
        
        ciudad_data = CIUDADES_MEXICO[request.ciudad]
        client = get_twilio_client()
        
        numeros_encontrados = []
        
        # Buscar números con cada código de área de la ciudad
        for area_code in ciudad_data["area_codes"]:
            try:
                # Buscar números locales de México con ese patrón
                available_numbers = client.available_phone_numbers('MX').local.list(
                    contains=f"+52{area_code}",
                    voice_enabled=True,
                    sms_enabled=True,
                    limit=5  # Limitar resultados por código de área
                )
                
                for number in available_numbers:
                    numeros_encontrados.append(NumeroDisponible(
                        phone_number=number.phone_number,
                        friendly_name=number.friendly_name,
                        locality=number.locality or ciudad_data["nombre"],
                        region=number.region or "México",
                        capabilities={
                            "voice": number.capabilities.get('voice', False),
                            "sms": number.capabilities.get('sms', False),
                            "mms": number.capabilities.get('mms', False)
                        }
                    ))
            except TwilioRestException as e:
                logger.warning(f"Error buscando números con área {area_code}: {str(e)}")
                continue
        
        if not numeros_encontrados:
            # Si no hay números locales, buscar números móviles/nacionales
            try:
                available_numbers = client.available_phone_numbers('MX').mobile.list(
                    limit=10
                )
                
                for number in available_numbers:
                    numeros_encontrados.append(NumeroDisponible(
                        phone_number=number.phone_number,
                        friendly_name=number.friendly_name,
                        locality=ciudad_data["nombre"],
                        region="México",
                        capabilities={
                            "voice": number.capabilities.get('voice', False),
                            "sms": number.capabilities.get('sms', False),
                            "mms": number.capabilities.get('mms', False)
                        }
                    ))
            except TwilioRestException as e:
                logger.warning(f"Error buscando números móviles: {str(e)}")
        
        logger.info(f"Encontrados {len(numeros_encontrados)} números para {ciudad_data['nombre']}")
        
        return numeros_encontrados
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error buscando números: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error buscando números: {str(e)}")

@router.post("/comprar-numero")
async def comprar_numero(
    request: ComprarNumeroRequest,
    current_user: dict = Depends(get_current_user)
):
    """Compra un número de teléfono y lo asocia a la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Verificar que la empresa tenga plan completo
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        if empresa.get('plan') != 'completo':
            raise HTTPException(
                status_code=403,
                detail="Necesitas el Plan Completo para comprar un número de WhatsApp"
            )
        
        # Verificar que no tenga ya un número
        if empresa.get('twilio_whatsapp_number'):
            raise HTTPException(
                status_code=400,
                detail="Ya tienes un número de WhatsApp asignado"
            )
        
        client = get_twilio_client()
        
        # Comprar el número
        try:
            incoming_phone_number = client.incoming_phone_numbers.create(
                phone_number=request.phone_number
            )
            
            logger.info(f"Número comprado: {incoming_phone_number.phone_number} SID: {incoming_phone_number.sid}")
            
        except TwilioRestException as e:
            if "unavailable" in str(e).lower():
                raise HTTPException(
                    status_code=400,
                    detail="Este número ya no está disponible. Por favor selecciona otro."
                )
            raise HTTPException(
                status_code=400,
                detail=f"Error al comprar número: {str(e)}"
            )
        
        # Actualizar la empresa con el nuevo número
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'twilio_whatsapp_number': incoming_phone_number.phone_number,
                    'twilio_phone_sid': incoming_phone_number.sid,
                    'whatsapp_configured': False,  # Pendiente de configurar en WhatsApp
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Número {incoming_phone_number.phone_number} asignado a empresa {empresa_id}")
        
        return {
            "success": True,
            "mensaje": f"¡Número {incoming_phone_number.friendly_name} adquirido exitosamente!",
            "phone_number": incoming_phone_number.phone_number,
            "friendly_name": incoming_phone_number.friendly_name,
            "sid": incoming_phone_number.sid,
            "nota": "El equipo de CotizaBot configurará tu número para WhatsApp Business en las próximas 24-48 horas."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comprando número: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error comprando número: {str(e)}")

@router.get("/mi-numero")
async def obtener_mi_numero(current_user: dict = Depends(get_current_user)):
    """Obtiene información del número de WhatsApp de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        if not empresa.get('twilio_whatsapp_number'):
            return {
                "has_number": False,
                "plan": empresa.get('plan', 'gratis'),
                "mensaje": "No tienes un número de WhatsApp asignado. " + (
                    "Actualiza a Plan Completo para obtener uno." 
                    if empresa.get('plan') != 'completo' 
                    else "Ve a Configuración para comprar tu número."
                )
            }
        
        return {
            "has_number": True,
            "phone_number": empresa.get('twilio_whatsapp_number'),
            "whatsapp_configured": empresa.get('whatsapp_configured', False),
            "plan": empresa.get('plan')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo número: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
