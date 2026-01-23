from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from utils.auth import get_current_user
from database import db
from services.email_service import email_service
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from datetime import datetime, timezone
import os
import uuid
import logging

router = APIRouter(prefix="/twilio", tags=["twilio"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
solicitudes_whatsapp_collection = db.get_collection('solicitudes_whatsapp')

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

class SolicitudNumeroRequest(BaseModel):
    ciudad: str  # key de CIUDADES_MEXICO
    notas: Optional[str] = None

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
    """Lista las ciudades disponibles para solicitar números"""
    return {
        "ciudades": [
            {"key": key, "nombre": data["nombre"]}
            for key, data in CIUDADES_MEXICO.items()
        ]
    }

@router.post("/solicitar-numero")
async def solicitar_numero_whatsapp(
    request: SolicitudNumeroRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Compra y configura automáticamente un número de WhatsApp para la empresa.
    Flujo 100% automatizado: busca, compra y configura en segundos.
    """
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Obtener empresa
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Verificar plan completo
        if empresa.get('plan') != 'completo':
            raise HTTPException(
                status_code=403,
                detail="Necesitas el Plan Completo para obtener un número de WhatsApp"
            )
        
        # Verificar que no tenga ya un número
        if empresa.get('twilio_whatsapp_number'):
            raise HTTPException(
                status_code=400,
                detail="Ya tienes un número de WhatsApp asignado"
            )
        
        # Validar ciudad
        if request.ciudad not in CIUDADES_MEXICO:
            raise HTTPException(
                status_code=400,
                detail=f"Ciudad no válida. Opciones: {list(CIUDADES_MEXICO.keys())}"
            )
        
        ciudad_data = CIUDADES_MEXICO[request.ciudad]
        area_codes = ciudad_data["area_codes"]
        
        # Obtener cliente Twilio
        client = get_twilio_client()
        
        # PASO 1: Buscar número disponible
        logger.info(f"Buscando número en {ciudad_data['nombre']} para empresa {empresa_id}")
        
        numero_encontrado = None
        for area_code in area_codes:
            try:
                numeros = client.available_phone_numbers('MX').local.list(
                    contains=f'+52{area_code}',
                    limit=1
                )
                if numeros:
                    numero_encontrado = numeros[0]
                    break
            except Exception as e:
                logger.warning(f"Error buscando con código {area_code}: {e}")
                continue
        
        if not numero_encontrado:
            # Intentar con números móviles
            try:
                numeros = client.available_phone_numbers('MX').mobile.list(limit=1)
                if numeros:
                    numero_encontrado = numeros[0]
            except Exception:
                pass
        
        if not numero_encontrado:
            raise HTTPException(
                status_code=404,
                detail=f"No hay números disponibles en {ciudad_data['nombre']}. Intenta con otra ciudad."
            )
        
        phone_number = numero_encontrado.phone_number
        logger.info(f"Número encontrado: {phone_number}")
        
        # PASO 2: Comprar el número
        try:
            # Obtener URL base del webhook
            webhook_base = os.environ.get('REACT_APP_BACKEND_URL', 'https://cotizaexpress.com')
            webhook_url = f"{webhook_base}/api/webhook/twilio/whatsapp"
            
            incoming_number = client.incoming_phone_numbers.create(
                phone_number=phone_number,
                friendly_name=f"CotizaBot - {empresa.get('nombre', 'Empresa')}",
                sms_url=webhook_url,
                sms_method='POST'
            )
            
            logger.info(f"Número comprado: {incoming_number.sid}")
            
        except TwilioRestException as e:
            logger.error(f"Error comprando número: {str(e)}")
            if "insufficient funds" in str(e).lower():
                raise HTTPException(
                    status_code=402,
                    detail="Fondos insuficientes en la cuenta de Twilio. Contacta a soporte."
                )
            raise HTTPException(
                status_code=400,
                detail=f"Error al comprar el número: {str(e)}"
            )
        
        # PASO 3: Actualizar empresa con el número
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'twilio_whatsapp_number': phone_number,
                    'twilio_phone_sid': incoming_number.sid,
                    'whatsapp_configured': True,
                    'whatsapp_webhook_url': webhook_url,
                    'whatsapp_ciudad': ciudad_data["nombre"],
                    'whatsapp_activated_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # PASO 4: Registrar la compra
        registro_id = str(uuid.uuid4())
        registro = {
            "id": registro_id,
            "empresa_id": empresa_id,
            "empresa_nombre": empresa.get('nombre'),
            "phone_number": phone_number,
            "phone_sid": incoming_number.sid,
            "ciudad": ciudad_data["nombre"],
            "estado": "completada",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await solicitudes_whatsapp_collection.insert_one(registro)
        
        logger.info(f"WhatsApp configurado exitosamente para empresa {empresa_id}: {phone_number}")
        
        return {
            "success": True,
            "phone_number": phone_number,
            "ciudad": ciudad_data["nombre"],
            "mensaje": f"¡Listo! Tu número de WhatsApp {phone_number} está activo.",
            "whatsapp_configured": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en proceso automático: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mi-solicitud")
async def obtener_mi_solicitud(current_user: dict = Depends(get_current_user)):
    """Obtiene el estado de la solicitud de WhatsApp de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Buscar solicitud más reciente
        solicitud = await solicitudes_whatsapp_collection.find_one(
            {'empresa_id': empresa_id},
            {'_id': 0},
            sort=[('created_at', -1)]
        )
        
        if not solicitud:
            return {
                "tiene_solicitud": False,
                "mensaje": "No tienes solicitudes de WhatsApp"
            }
        
        return {
            "tiene_solicitud": True,
            "solicitud": {
                "id": solicitud.get('id'),
                "ciudad": solicitud.get('ciudad_nombre'),
                "estado": solicitud.get('estado'),
                "numero_asignado": solicitud.get('numero_asignado'),
                "created_at": solicitud.get('created_at'),
                "completada_at": solicitud.get('completada_at')
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo solicitud: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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


@router.post("/configurar-whatsapp")
async def configurar_whatsapp_business(current_user: dict = Depends(get_current_user)):
    """
    Configura el número comprado para WhatsApp Business.
    Establece el webhook de CotizaBot para recibir mensajes.
    """
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        if not empresa.get('twilio_phone_sid'):
            raise HTTPException(
                status_code=400,
                detail="Primero debes comprar un número de teléfono"
            )
        
        if empresa.get('whatsapp_configured'):
            return {
                "success": True,
                "mensaje": "Tu número ya está configurado para WhatsApp Business",
                "phone_number": empresa.get('twilio_whatsapp_number')
            }
        
        client = get_twilio_client()
        phone_sid = empresa.get('twilio_phone_sid')
        
        # Obtener URL base del webhook
        webhook_base = os.environ.get('REACT_APP_BACKEND_URL', 'https://cotizaexpress.com')
        webhook_url = f"{webhook_base}/api/webhook/twilio/whatsapp"
        
        try:
            # Actualizar configuración del número para webhooks
            incoming_number = client.incoming_phone_numbers(phone_sid).update(
                sms_url=webhook_url,
                sms_method='POST',
                voice_url=webhook_url,
                voice_method='POST'
            )
            
            logger.info(f"Webhooks configurados para número {phone_sid}")
            
            # Actualizar estado en la base de datos
            await empresas_collection.update_one(
                {'id': empresa_id},
                {
                    '$set': {
                        'whatsapp_configured': True,
                        'whatsapp_webhook_url': webhook_url,
                        'whatsapp_configured_at': datetime.now(timezone.utc).isoformat(),
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            logger.info(f"WhatsApp configurado exitosamente para empresa {empresa_id}")
            
            return {
                "success": True,
                "mensaje": "¡WhatsApp Business configurado exitosamente!",
                "phone_number": empresa.get('twilio_whatsapp_number'),
                "webhook_url": webhook_url,
                "nota": "Tu número ahora puede recibir mensajes de WhatsApp. Los mensajes serán procesados automáticamente por CotizaBot."
            }
            
        except TwilioRestException as e:
            logger.error(f"Error configurando webhooks de Twilio: {str(e)}")
            
            # Verificar si es un error de permisos (cuenta trial)
            if "upgrade" in str(e).lower() or "trial" in str(e).lower():
                return {
                    "success": False,
                    "error": "Tu cuenta de Twilio necesita ser actualizada a una cuenta de pago para configurar webhooks de WhatsApp.",
                    "accion_requerida": "Actualiza tu cuenta en twilio.com/console para continuar"
                }
            
            raise HTTPException(
                status_code=400,
                detail=f"Error configurando WhatsApp: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configurando WhatsApp: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estado-configuracion")
async def obtener_estado_configuracion(current_user: dict = Depends(get_current_user)):
    """Obtiene el estado completo de la configuración de WhatsApp/Twilio"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Determinar el paso actual del flujo
        estado = {
            "plan": empresa.get('plan', 'gratis'),
            "tiene_plan_completo": empresa.get('plan') == 'completo',
            "tiene_numero": bool(empresa.get('twilio_whatsapp_number')),
            "whatsapp_configurado": empresa.get('whatsapp_configured', False),
            "phone_number": empresa.get('twilio_whatsapp_number'),
            "webhook_url": empresa.get('whatsapp_webhook_url'),
            "configurado_at": empresa.get('whatsapp_configured_at')
        }
        
        # Determinar paso actual
        if not estado['tiene_plan_completo']:
            estado['paso_actual'] = 1
            estado['mensaje'] = "Actualiza a Plan Completo para obtener tu número de WhatsApp"
        elif not estado['tiene_numero']:
            estado['paso_actual'] = 2
            estado['mensaje'] = "Selecciona y compra tu número de WhatsApp"
        elif not estado['whatsapp_configurado']:
            estado['paso_actual'] = 3
            estado['mensaje'] = "Configura tu número para WhatsApp Business"
        else:
            estado['paso_actual'] = 4
            estado['mensaje'] = "¡Todo listo! Tu WhatsApp Business está configurado"
        
        return estado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo estado: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
