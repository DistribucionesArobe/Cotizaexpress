"""
Rutas de WhatsApp Multi-Tenant para CotizaBot
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_user
from database import db
from services.whatsapp_multitenant import (
    assign_to_shared_number,
    migrate_to_dedicated,
    route_outgoing_message,
    SHARED_NUMBER_CONFIG,
    WhatsAppNumberType,
    WhatsAppNumberStatus
)
from datetime import datetime, timezone
import logging
import os
import uuid

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
whatsapp_numbers_collection = db.get_collection('whatsapp_numbers')


class ActivarWhatsAppRequest(BaseModel):
    """Request para activar WhatsApp"""
    pass  # No requiere parámetros, usa número compartido


class MigrarDedicadoRequest(BaseModel):
    """Request para migrar a número dedicado"""
    ciudad: Optional[str] = None  # Opcional, para buscar número en esa ciudad


# ============================================
# ENDPOINTS
# ============================================

@router.get("/config")
async def get_whatsapp_config(current_user: dict = Depends(get_current_user)):
    """Obtiene la configuración de WhatsApp de la empresa"""
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one(
        {'id': empresa_id},
        {'_id': 0, 'whatsapp_config': 1, 'twilio_whatsapp_number': 1, 'nombre': 1, 'plan': 1}
    )
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    wa_config = empresa.get('whatsapp_config', {})
    plan = empresa.get('plan', 'gratis')
    
    # Obtener info del número asignado
    numero_info = None
    if wa_config.get('whatsapp_number_id'):
        numero = await whatsapp_numbers_collection.find_one(
            {'id': wa_config['whatsapp_number_id']},
            {'_id': 0}
        )
        if numero:
            numero_info = {
                'phone_number': numero.get('phone_number'),
                'type': numero.get('type'),
                'status': numero.get('status'),
                'is_sandbox': numero.get('is_sandbox', False),
                'sandbox_code': SHARED_NUMBER_CONFIG.get('sandbox_code') if numero.get('is_sandbox') else None
            }
    
    return {
        'configured': bool(wa_config.get('whatsapp_number_id')),
        'mode': wa_config.get('mode', 'none'),  # none | shared | dedicated
        'phone_number': empresa.get('twilio_whatsapp_number'),
        'numero_info': numero_info,
        'plan': plan,
        'can_upgrade_to_dedicated': plan == 'completo',
        'migration_status': wa_config.get('migration_status'),
        'empresa_nombre': empresa.get('nombre')
    }


@router.post("/activar")
async def activar_whatsapp(
    request: ActivarWhatsAppRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Activa WhatsApp para la empresa usando el número compartido (MVP/Demo).
    No requiere Plan Completo - disponible para todos para demo.
    """
    empresa_id = current_user.get('empresa_id')
    
    # Verificar si ya tiene WhatsApp configurado
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    wa_config = empresa.get('whatsapp_config', {})
    if wa_config.get('mode') == 'dedicated':
        return {
            'success': True,
            'already_configured': True,
            'mode': 'dedicated',
            'phone_number': empresa.get('twilio_whatsapp_number'),
            'mensaje': 'Ya tienes un número dedicado configurado.'
        }
    
    # Asignar al número compartido
    result = await assign_to_shared_number(db, empresa_id)
    
    if not result.get('success'):
        raise HTTPException(
            status_code=400,
            detail=result.get('mensaje', 'Error al activar WhatsApp')
        )
    
    return {
        'success': True,
        'mode': 'shared',
        'phone_number': result['phone_number'],
        'is_sandbox': result.get('is_sandbox', True),
        'sandbox_code': result.get('sandbox_code'),
        'mensaje': '¡WhatsApp activado!' if not result.get('is_sandbox') else 
                   f"WhatsApp activado en modo demo. Tus clientes deben enviar '{result.get('sandbox_code')}' primero.",
        'instrucciones': [
            f"Tu número de WhatsApp: {result['phone_number']}",
            f"Modo: {'Sandbox (Demo)' if result.get('is_sandbox') else 'Producción'}",
        ] + ([f"Los clientes deben enviar '{result.get('sandbox_code')}' para conectarse"] if result.get('is_sandbox') else []),
        'assigned_count': result.get('assigned_count'),
        'max_count': result.get('max_count')
    }


@router.post("/migrar-dedicado")
async def migrar_a_dedicado(
    request: MigrarDedicadoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Migra la empresa a un número dedicado (requiere Plan Completo).
    
    Proceso:
    1. Verifica plan
    2. Compra número Twilio
    3. Migra configuración y historial
    4. Retorna instrucciones para registro en WhatsApp Business API
    """
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException
    
    empresa_id = current_user.get('empresa_id')
    plan = current_user.get('plan', 'gratis')
    
    # Verificar plan
    if plan != 'completo':
        raise HTTPException(
            status_code=403,
            detail="Necesitas el Plan Completo para tener un número dedicado."
        )
    
    # Verificar si ya tiene número dedicado
    empresa = await empresas_collection.find_one({'id': empresa_id})
    wa_config = empresa.get('whatsapp_config', {})
    
    if wa_config.get('mode') == 'dedicated':
        return {
            'success': True,
            'already_dedicated': True,
            'phone_number': empresa.get('twilio_whatsapp_number'),
            'mensaje': 'Ya tienes un número dedicado.'
        }
    
    # Comprar número Twilio (USA para evitar bundle)
    try:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        client = Client(account_sid, auth_token)
        
        # Buscar número disponible
        codigos_usa = ['713', '832', '281', '346', '210', '512', '956', '915']
        numero_encontrado = None
        
        for area_code in codigos_usa:
            try:
                numeros = client.available_phone_numbers('US').local.list(
                    area_code=area_code,
                    limit=1
                )
                if numeros:
                    numero_encontrado = numeros[0]
                    break
            except Exception:
                continue
        
        if not numero_encontrado:
            raise HTTPException(
                status_code=404,
                detail="No hay números disponibles. Intenta más tarde."
            )
        
        # Comprar número
        webhook_base = os.environ.get('REACT_APP_BACKEND_URL', 'https://cotizaexpress.com')
        webhook_url = f"{webhook_base}/api/webhook/whatsapp"
        
        incoming_number = client.incoming_phone_numbers.create(
            phone_number=numero_encontrado.phone_number,
            friendly_name=f"CotizaBot Dedicado - {empresa.get('nombre', 'Empresa')}",
            sms_url=webhook_url,
            sms_method='POST'
        )
        
        # Migrar
        result = await migrate_to_dedicated(
            db,
            empresa_id,
            numero_encontrado.phone_number,
            incoming_number.sid
        )
        
        # Actualizar empresa
        await empresas_collection.update_one(
            {'id': empresa_id},
            {'$set': {'twilio_whatsapp_number': numero_encontrado.phone_number}}
        )
        
        return {
            'success': True,
            'phone_number': numero_encontrado.phone_number,
            'twilio_sid': incoming_number.sid,
            'mode': 'dedicated',
            'status': 'pending_wa_registration',
            'mensaje': f'¡Número {numero_encontrado.phone_number} comprado! Ahora necesitas registrarlo en WhatsApp Business API.',
            'next_steps': result.get('next_steps', []),
            'importante': 'El número está activo para SMS. Para WhatsApp, debes completar el registro con Meta (1-7 días).'
        }
        
    except TwilioRestException as e:
        logger.error(f"Error Twilio: {e}")
        raise HTTPException(status_code=400, detail=f"Error de Twilio: {str(e)}")
    except Exception as e:
        logger.error(f"Error migrando a dedicado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estado")
async def get_estado_whatsapp(current_user: dict = Depends(get_current_user)):
    """Obtiene el estado detallado de WhatsApp"""
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    wa_config = empresa.get('whatsapp_config', {})
    plan = empresa.get('plan', 'gratis')
    
    # Obtener routing info
    try:
        routing = await route_outgoing_message(db, empresa_id)
    except Exception as e:
        routing = {'error': str(e)}
    
    # Contar opt-ins
    whatsapp_optins_collection = db.get_collection('whatsapp_optins')
    optins_count = await whatsapp_optins_collection.count_documents({
        'empresa_id': empresa_id,
        'opted_in': True
    })
    
    return {
        'empresa_id': empresa_id,
        'plan': plan,
        'whatsapp_config': wa_config,
        'routing': routing,
        'optins_count': optins_count,
        'phone_number': empresa.get('twilio_whatsapp_number'),
        'status': 'active' if wa_config.get('whatsapp_number_id') else 'not_configured'
    }


@router.get("/instrucciones-sandbox")
async def get_instrucciones_sandbox(current_user: dict = Depends(get_current_user)):
    """Obtiene las instrucciones para usar el sandbox de Twilio"""
    return {
        'titulo': 'Cómo probar WhatsApp (Modo Demo)',
        'numero': SHARED_NUMBER_CONFIG['phone_number'],
        'codigo': SHARED_NUMBER_CONFIG['sandbox_code'],
        'pasos': [
            f"1. Abre WhatsApp en tu teléfono",
            f"2. Agrega el número {SHARED_NUMBER_CONFIG['phone_number']} a tus contactos",
            f"3. Envía el mensaje: {SHARED_NUMBER_CONFIG['sandbox_code']}",
            f"4. Recibirás una confirmación",
            f"5. ¡Listo! Ya puedes enviar mensajes de prueba"
        ],
        'notas': [
            "Este es un número de prueba compartido",
            "Las sesiones expiran después de 72 horas sin actividad",
            "Para producción, actualiza al Plan Completo y obtén tu número dedicado"
        ]
    }
