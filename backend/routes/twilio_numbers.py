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
# Organizado por regiones para facilitar la búsqueda
CIUDADES_MEXICO = {
    # ZONA METROPOLITANA / CENTRO
    "ciudad_mexico": {"nombre": "Ciudad de México (CDMX)", "area_codes": ["55", "56"], "region": "Centro"},
    "toluca": {"nombre": "Toluca, Estado de México", "area_codes": ["722"], "region": "Centro"},
    "cuernavaca": {"nombre": "Cuernavaca, Morelos", "area_codes": ["777"], "region": "Centro"},
    "pachuca": {"nombre": "Pachuca, Hidalgo", "area_codes": ["771"], "region": "Centro"},
    "puebla": {"nombre": "Puebla, Puebla", "area_codes": ["222"], "region": "Centro"},
    "tlaxcala": {"nombre": "Tlaxcala, Tlaxcala", "area_codes": ["246"], "region": "Centro"},
    "queretaro": {"nombre": "Querétaro, Querétaro", "area_codes": ["442"], "region": "Centro"},
    
    # BAJÍO / OCCIDENTE
    "guadalajara": {"nombre": "Guadalajara, Jalisco", "area_codes": ["33"], "region": "Bajío"},
    "leon": {"nombre": "León, Guanajuato", "area_codes": ["477"], "region": "Bajío"},
    "aguascalientes": {"nombre": "Aguascalientes, Aguascalientes", "area_codes": ["449"], "region": "Bajío"},
    "san_luis_potosi": {"nombre": "San Luis Potosí, SLP", "area_codes": ["444"], "region": "Bajío"},
    "morelia": {"nombre": "Morelia, Michoacán", "area_codes": ["443"], "region": "Bajío"},
    "irapuato": {"nombre": "Irapuato, Guanajuato", "area_codes": ["462"], "region": "Bajío"},
    "celaya": {"nombre": "Celaya, Guanajuato", "area_codes": ["461"], "region": "Bajío"},
    "zacatecas": {"nombre": "Zacatecas, Zacatecas", "area_codes": ["492"], "region": "Bajío"},
    "colima": {"nombre": "Colima, Colima", "area_codes": ["312"], "region": "Bajío"},
    "tepic": {"nombre": "Tepic, Nayarit", "area_codes": ["311"], "region": "Bajío"},
    
    # NORTE / NORESTE
    "monterrey": {"nombre": "Monterrey, Nuevo León", "area_codes": ["81"], "region": "Norte"},
    "saltillo": {"nombre": "Saltillo, Coahuila", "area_codes": ["844"], "region": "Norte"},
    "torreon": {"nombre": "Torreón, Coahuila", "area_codes": ["871"], "region": "Norte"},
    "chihuahua": {"nombre": "Chihuahua, Chihuahua", "area_codes": ["614"], "region": "Norte"},
    "ciudad_juarez": {"nombre": "Ciudad Juárez, Chihuahua", "area_codes": ["656"], "region": "Norte"},
    "durango": {"nombre": "Durango, Durango", "area_codes": ["618"], "region": "Norte"},
    "reynosa": {"nombre": "Reynosa, Tamaulipas", "area_codes": ["899"], "region": "Norte"},
    "tampico": {"nombre": "Tampico, Tamaulipas", "area_codes": ["833"], "region": "Norte"},
    "matamoros": {"nombre": "Matamoros, Tamaulipas", "area_codes": ["868"], "region": "Norte"},
    "nuevo_laredo": {"nombre": "Nuevo Laredo, Tamaulipas", "area_codes": ["867"], "region": "Norte"},
    
    # NOROESTE / PACÍFICO
    "tijuana": {"nombre": "Tijuana, Baja California", "area_codes": ["664"], "region": "Noroeste"},
    "mexicali": {"nombre": "Mexicali, Baja California", "area_codes": ["686"], "region": "Noroeste"},
    "ensenada": {"nombre": "Ensenada, Baja California", "area_codes": ["646"], "region": "Noroeste"},
    "la_paz": {"nombre": "La Paz, Baja California Sur", "area_codes": ["612"], "region": "Noroeste"},
    "los_cabos": {"nombre": "Los Cabos, Baja California Sur", "area_codes": ["624"], "region": "Noroeste"},
    "hermosillo": {"nombre": "Hermosillo, Sonora", "area_codes": ["662"], "region": "Noroeste"},
    "culiacan": {"nombre": "Culiacán, Sinaloa", "area_codes": ["667"], "region": "Noroeste"},
    "mazatlan": {"nombre": "Mazatlán, Sinaloa", "area_codes": ["669"], "region": "Noroeste"},
    "los_mochis": {"nombre": "Los Mochis, Sinaloa", "area_codes": ["668"], "region": "Noroeste"},
    
    # SURESTE / GOLFO
    "merida": {"nombre": "Mérida, Yucatán", "area_codes": ["999"], "region": "Sureste"},
    "cancun": {"nombre": "Cancún, Quintana Roo", "area_codes": ["998"], "region": "Sureste"},
    "playa_del_carmen": {"nombre": "Playa del Carmen, Quintana Roo", "area_codes": ["984"], "region": "Sureste"},
    "chetumal": {"nombre": "Chetumal, Quintana Roo", "area_codes": ["983"], "region": "Sureste"},
    "campeche": {"nombre": "Campeche, Campeche", "area_codes": ["981"], "region": "Sureste"},
    "villahermosa": {"nombre": "Villahermosa, Tabasco", "area_codes": ["993"], "region": "Sureste"},
    "veracruz": {"nombre": "Veracruz, Veracruz", "area_codes": ["229"], "region": "Sureste"},
    "xalapa": {"nombre": "Xalapa, Veracruz", "area_codes": ["228"], "region": "Sureste"},
    "coatzacoalcos": {"nombre": "Coatzacoalcos, Veracruz", "area_codes": ["921"], "region": "Sureste"},
    
    # SUR / PACÍFICO SUR
    "oaxaca": {"nombre": "Oaxaca, Oaxaca", "area_codes": ["951"], "region": "Sur"},
    "tuxtla_gutierrez": {"nombre": "Tuxtla Gutiérrez, Chiapas", "area_codes": ["961"], "region": "Sur"},
    "san_cristobal": {"nombre": "San Cristóbal de las Casas, Chiapas", "area_codes": ["967"], "region": "Sur"},
    "acapulco": {"nombre": "Acapulco, Guerrero", "area_codes": ["744"], "region": "Sur"},
    "chilpancingo": {"nombre": "Chilpancingo, Guerrero", "area_codes": ["747"], "region": "Sur"},
    "puerto_vallarta": {"nombre": "Puerto Vallarta, Jalisco", "area_codes": ["322"], "region": "Sur"},
    "manzanillo": {"nombre": "Manzanillo, Colima", "area_codes": ["314"], "region": "Sur"},
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
    """Lista las ciudades disponibles para solicitar números, organizadas por región"""
    
    # Organizar por región
    ciudades_por_region = {}
    for key, data in CIUDADES_MEXICO.items():
        region = data.get("region", "Otra")
        if region not in ciudades_por_region:
            ciudades_por_region[region] = []
        ciudades_por_region[region].append({
            "key": key,
            "nombre": data["nombre"],
            "area_codes": data["area_codes"]
        })
    
    # Ordenar ciudades dentro de cada región
    for region in ciudades_por_region:
        ciudades_por_region[region].sort(key=lambda x: x["nombre"])
    
    # Lista plana para compatibilidad
    todas_ciudades = [
        {"key": key, "nombre": data["nombre"], "region": data.get("region", "Otra")}
        for key, data in CIUDADES_MEXICO.items()
    ]
    todas_ciudades.sort(key=lambda x: x["nombre"])
    
    return {
        "ciudades": todas_ciudades,
        "por_region": ciudades_por_region,
        "total": len(CIUDADES_MEXICO)
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
            # Intentar con números móviles de México
            try:
                numeros = client.available_phone_numbers('MX').mobile.list(limit=1)
                if numeros:
                    numero_encontrado = numeros[0]
            except Exception:
                pass
        
        # Si no hay números en México, intentar con USA (no requiere bundle)
        usar_usa = False
        if not numero_encontrado:
            logger.info("No hay números MX disponibles, intentando con USA...")
            # Probar varios códigos de área de Texas (cercano a México)
            codigos_usa = ['713', '832', '281', '346', '210', '512', '956', '915']
            for area_code in codigos_usa:
                try:
                    numeros_usa = client.available_phone_numbers('US').local.list(
                        area_code=area_code,
                        limit=1
                    )
                    if numeros_usa:
                        numero_encontrado = numeros_usa[0]
                        usar_usa = True
                        logger.info(f"Usando número de USA ({area_code}): {numero_encontrado.phone_number}")
                        break
                except Exception as e:
                    logger.warning(f"Error buscando números USA {area_code}: {e}")
                    continue
        
        if not numero_encontrado:
            raise HTTPException(
                status_code=404,
                detail=f"No hay números disponibles. Los números mexicanos requieren documentación regulatoria en Twilio. Contacta a soporte."
            )
        
        phone_number = numero_encontrado.phone_number
        logger.info(f"Número encontrado: {phone_number} (USA: {usar_usa})")
        
        # PASO 2: Verificar/crear dirección para cumplir requisitos de Twilio MX
        address_sid = None
        try:
            # Buscar si ya existe una dirección
            addresses = client.addresses.list(limit=1)
            if addresses:
                address_sid = addresses[0].sid
                logger.info(f"Usando dirección existente: {address_sid}")
            else:
                # Crear dirección genérica para CotizaBot (requerido por Twilio para MX)
                new_address = client.addresses.create(
                    customer_name="CotizaBot by CotizaExpress",
                    street="Av. Insurgentes Sur 1602",
                    city="Ciudad de México",
                    region="CDMX",
                    postal_code="03940",
                    iso_country="MX",
                    friendly_name="CotizaBot Business Address"
                )
                address_sid = new_address.sid
                logger.info(f"Dirección creada: {address_sid}")
        except Exception as addr_error:
            logger.warning(f"No se pudo crear/obtener dirección: {addr_error}")
            # Continuar sin dirección si falla (algunos números no la requieren)
        
        # PASO 3: Comprar el número
        try:
            # Obtener URL base del webhook
            webhook_base = os.environ.get('REACT_APP_BACKEND_URL', 'https://cotizaexpress.com')
            webhook_url = f"{webhook_base}/api/webhook/twilio/whatsapp"
            
            purchase_params = {
                'phone_number': phone_number,
                'friendly_name': f"CotizaBot - {empresa.get('nombre', 'Empresa')}",
                'sms_url': webhook_url,
                'sms_method': 'POST'
            }
            
            # Solo agregar dirección para números MX (USA no lo requiere)
            if not usar_usa and address_sid:
                purchase_params['address_sid'] = address_sid
            
            incoming_number = client.incoming_phone_numbers.create(**purchase_params)
            
            logger.info(f"Número comprado: {incoming_number.sid}")
            
        except TwilioRestException as e:
            logger.error(f"Error comprando número: {str(e)}")
            
            # Si falla por bundle/regulación en MX, intentar con USA
            if ("bundle" in str(e).lower() or "regulatory" in str(e).lower()) and not usar_usa:
                logger.info("Número MX requiere bundle, intentando con USA...")
                codigos_usa = ['713', '832', '281', '346', '210', '512', '956', '915']
                numero_usa_comprado = False
                
                for area_code in codigos_usa:
                    try:
                        numeros_usa = client.available_phone_numbers('US').local.list(
                            area_code=area_code,
                            limit=1
                        )
                        if numeros_usa:
                            phone_number = numeros_usa[0].phone_number
                            incoming_number = client.incoming_phone_numbers.create(
                                phone_number=phone_number,
                                friendly_name=f"CotizaBot - {empresa.get('nombre', 'Empresa')}",
                                sms_url=webhook_url,
                                sms_method='POST'
                            )
                            usar_usa = True
                            numero_usa_comprado = True
                            logger.info(f"Número USA comprado como alternativa: {incoming_number.sid}")
                            break
                    except Exception as usa_err:
                        logger.warning(f"Error con código {area_code}: {usa_err}")
                        continue
                
                if not numero_usa_comprado:
                    raise HTTPException(
                        status_code=400,
                        detail="Los números mexicanos requieren documentación regulatoria en Twilio. No hay números USA disponibles como alternativa."
                    )
            elif "address" in str(e).lower():
                raise HTTPException(
                    status_code=400,
                    detail="Para números en México se requiere documentación regulatoria en Twilio. Contacta a soporte."
                )
            elif "insufficient funds" in str(e).lower():
                raise HTTPException(
                    status_code=402,
                    detail="Fondos insuficientes en la cuenta de Twilio. Contacta a soporte."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error al comprar el número: {str(e)}"
                )
        
        # PASO 4: Actualizar empresa con el número
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
            client.incoming_phone_numbers(phone_sid).update(
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
