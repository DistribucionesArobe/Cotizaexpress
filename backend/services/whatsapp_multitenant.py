"""
Servicio de WhatsApp Multi-Tenant para CotizaBot

Arquitectura:
- Número compartido de CotizaExpress para MVP/demo (máx 10 clientes)
- Números dedicados por cliente para Plan Pro (modelo ISV Twilio)
- Migración automática shared → dedicated
- Webhooks inteligentes con routing por número
"""

from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import logging
import os

logger = logging.getLogger(__name__)

# ============================================
# MODELOS DE DATOS
# ============================================

class WhatsAppNumberType:
    SHARED = "shared"      # Número compartido de CotizaExpress (demo/MVP)
    DEDICATED = "dedicated"  # Número dedicado por cliente (Pro)

class WhatsAppNumberStatus:
    PENDING = "pending"           # Número comprado, pendiente registro WA
    REGISTERING = "registering"   # En proceso de registro con Meta
    ACTIVE = "active"             # Activo y funcionando
    SUSPENDED = "suspended"       # Suspendido temporalmente
    MIGRATING = "migrating"       # En proceso de migración

class WhatsAppNumber(BaseModel):
    """Modelo de número de WhatsApp"""
    id: str
    phone_number: str              # +1234567890
    friendly_name: str
    type: str                      # shared | dedicated
    status: str                    # pending | registering | active | suspended | migrating
    
    # Configuración Twilio
    twilio_sid: Optional[str] = None
    twilio_number_sid: Optional[str] = None
    
    # Asignación
    empresa_id: Optional[str] = None  # None si es shared y disponible
    assigned_empresas: List[str] = []  # Para shared: lista de empresas asignadas (máx 10)
    max_shared_empresas: int = 10
    
    # WhatsApp Business API
    waba_id: Optional[str] = None           # WhatsApp Business Account ID
    wa_phone_number_id: Optional[str] = None  # WhatsApp Phone Number ID
    wa_verified: bool = False
    wa_display_name: Optional[str] = None
    
    # Templates aprobados
    templates: List[str] = []
    
    # Webhooks
    webhook_url: Optional[str] = None
    
    # Timestamps
    created_at: datetime = None
    updated_at: datetime = None
    activated_at: Optional[datetime] = None


class WhatsAppOptIn(BaseModel):
    """Registro de opt-in de clientes finales"""
    id: str
    cliente_telefono: str          # Teléfono del cliente final
    empresa_id: str                # Empresa de CotizaBot
    whatsapp_number_id: str        # Número de WA usado
    opted_in: bool = True
    opted_in_at: datetime = None
    opted_out_at: Optional[datetime] = None
    consent_method: str = "message"  # message | web | qr
    

class WhatsAppConfig(BaseModel):
    """Configuración de WhatsApp por empresa"""
    empresa_id: str
    mode: str = "shared"           # shared | dedicated
    whatsapp_number_id: Optional[str] = None  # ID del número asignado
    
    # Para modo shared
    shared_number_id: Optional[str] = None
    
    # Para modo dedicated
    dedicated_number_id: Optional[str] = None
    migration_status: Optional[str] = None  # pending | in_progress | completed
    migrated_at: Optional[datetime] = None
    
    # Configuración del bot
    welcome_message: str = "¡Hola! Soy el asistente de {empresa_nombre}. ¿En qué puedo ayudarte?"
    business_hours: dict = {}
    auto_reply_enabled: bool = True
    
    # Stats
    messages_sent: int = 0
    messages_received: int = 0
    conversations_count: int = 0


# ============================================
# CONFIGURACIÓN DEL NÚMERO COMPARTIDO MVP
# ============================================

SHARED_NUMBER_CONFIG = {
    "phone_number": os.environ.get("COTIZAEXPRESS_WHATSAPP_NUMBER", "+14155238886"),  # Número de Twilio Sandbox por ahora
    "friendly_name": "CotizaExpress Demo",
    "max_empresas": 10,
    "is_sandbox": True,  # True = usa sandbox de Twilio, False = número verificado
    "sandbox_code": "join cotton-catch",  # Código para unirse al sandbox
}


# ============================================
# FUNCIONES DE ROUTING
# ============================================

async def get_empresa_from_message(db, from_number: str, to_number: str) -> Optional[dict]:
    """
    Determina a qué empresa pertenece un mensaje entrante.
    
    Lógica de routing:
    1. Si to_number es un número dedicado → buscar empresa por número
    2. Si to_number es el número compartido → buscar por historial de conversación
    3. Si es nuevo cliente → asignar a empresa por defecto o pedir identificación
    """
    empresas_collection = db.get_collection('empresas')
    conversaciones_collection = db.get_collection('conversaciones')
    whatsapp_numbers_collection = db.get_collection('whatsapp_numbers')
    
    # 1. Buscar si el número destino es dedicado
    wa_number = await whatsapp_numbers_collection.find_one({
        'phone_number': to_number,
        'type': WhatsAppNumberType.DEDICATED,
        'status': WhatsAppNumberStatus.ACTIVE
    })
    
    if wa_number and wa_number.get('empresa_id'):
        empresa = await empresas_collection.find_one({'id': wa_number['empresa_id']})
        if empresa:
            return {
                'empresa': empresa,
                'routing_type': 'dedicated',
                'whatsapp_number': wa_number
            }
    
    # 2. Buscar en historial de conversaciones
    conversacion = await conversaciones_collection.find_one({
        'cliente_telefono': from_number
    }, sort=[('created_at', -1)])
    
    if conversacion and conversacion.get('empresa_id'):
        empresa = await empresas_collection.find_one({'id': conversacion['empresa_id']})
        if empresa:
            return {
                'empresa': empresa,
                'routing_type': 'history',
                'whatsapp_number': None
            }
    
    # 3. Si es número compartido y no hay historial, es cliente nuevo
    shared_number = await whatsapp_numbers_collection.find_one({
        'phone_number': to_number,
        'type': WhatsAppNumberType.SHARED
    })
    
    if shared_number:
        # Para MVP: asignar a la primera empresa activa del shared
        if shared_number.get('assigned_empresas'):
            empresa_id = shared_number['assigned_empresas'][0]
            empresa = await empresas_collection.find_one({'id': empresa_id})
            if empresa:
                return {
                    'empresa': empresa,
                    'routing_type': 'shared_default',
                    'whatsapp_number': shared_number,
                    'is_new_client': True
                }
    
    return None


async def route_outgoing_message(db, empresa_id: str) -> dict:
    """
    Determina desde qué número enviar un mensaje saliente.
    
    Returns:
        {
            'phone_number': str,
            'type': 'shared' | 'dedicated',
            'twilio_sid': str,
            'is_sandbox': bool
        }
    """
    empresas_collection = db.get_collection('empresas')
    whatsapp_numbers_collection = db.get_collection('whatsapp_numbers')
    
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise ValueError(f"Empresa {empresa_id} no encontrada")
    
    wa_config = empresa.get('whatsapp_config', {})
    
    # 1. Si tiene número dedicado activo, usar ese
    if wa_config.get('mode') == 'dedicated' and wa_config.get('dedicated_number_id'):
        dedicated = await whatsapp_numbers_collection.find_one({
            'id': wa_config['dedicated_number_id'],
            'status': WhatsAppNumberStatus.ACTIVE
        })
        if dedicated:
            return {
                'phone_number': dedicated['phone_number'],
                'type': 'dedicated',
                'twilio_sid': dedicated.get('twilio_number_sid'),
                'is_sandbox': False
            }
    
    # 2. Usar número compartido
    shared = await whatsapp_numbers_collection.find_one({
        'type': WhatsAppNumberType.SHARED,
        'status': WhatsAppNumberStatus.ACTIVE
    })
    
    if shared:
        return {
            'phone_number': shared['phone_number'],
            'type': 'shared',
            'twilio_sid': shared.get('twilio_number_sid'),
            'is_sandbox': shared.get('is_sandbox', True)
        }
    
    # 3. Fallback: usar sandbox de Twilio
    return {
        'phone_number': SHARED_NUMBER_CONFIG['phone_number'],
        'type': 'shared',
        'twilio_sid': None,
        'is_sandbox': True,
        'sandbox_code': SHARED_NUMBER_CONFIG['sandbox_code']
    }


# ============================================
# FUNCIONES DE MIGRACIÓN
# ============================================

async def migrate_to_dedicated(db, empresa_id: str, new_number: str, twilio_number_sid: str) -> dict:
    """
    Migra una empresa del número compartido a un número dedicado.
    
    Pasos:
    1. Crear registro del nuevo número dedicado
    2. Actualizar configuración de la empresa
    3. Transferir opt-ins existentes
    4. Actualizar historial de conversaciones
    5. Remover de número compartido
    """
    import uuid
    
    empresas_collection = db.get_collection('empresas')
    whatsapp_numbers_collection = db.get_collection('whatsapp_numbers')
    whatsapp_optins_collection = db.get_collection('whatsapp_optins')
    conversaciones_collection = db.get_collection('conversaciones')
    
    # 1. Crear registro del número dedicado
    new_wa_number = {
        'id': str(uuid.uuid4()),
        'phone_number': new_number,
        'friendly_name': f"Número dedicado",
        'type': WhatsAppNumberType.DEDICATED,
        'status': WhatsAppNumberStatus.PENDING,  # Pendiente registro WA
        'twilio_number_sid': twilio_number_sid,
        'empresa_id': empresa_id,
        'assigned_empresas': [empresa_id],
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }
    
    await whatsapp_numbers_collection.insert_one(new_wa_number)
    
    # 2. Actualizar configuración de empresa
    await empresas_collection.update_one(
        {'id': empresa_id},
        {'$set': {
            'whatsapp_config.mode': 'dedicated',
            'whatsapp_config.dedicated_number_id': new_wa_number['id'],
            'whatsapp_config.migration_status': 'in_progress',
            'whatsapp_config.migrated_at': datetime.now(timezone.utc)
        }}
    )
    
    # 3. Obtener número compartido actual
    shared = await whatsapp_numbers_collection.find_one({
        'type': WhatsAppNumberType.SHARED,
        'assigned_empresas': empresa_id
    })
    
    if shared:
        # 4. Transferir opt-ins
        await whatsapp_optins_collection.update_many(
            {'empresa_id': empresa_id, 'whatsapp_number_id': shared['id']},
            {'$set': {'whatsapp_number_id': new_wa_number['id']}}
        )
        
        # 5. Actualizar conversaciones
        await conversaciones_collection.update_many(
            {'empresa_id': empresa_id},
            {'$set': {'whatsapp_number_id': new_wa_number['id']}}
        )
        
        # 6. Remover de número compartido
        await whatsapp_numbers_collection.update_one(
            {'id': shared['id']},
            {'$pull': {'assigned_empresas': empresa_id}}
        )
    
    logger.info(f"Empresa {empresa_id} migrada a número dedicado {new_number}")
    
    return {
        'success': True,
        'new_number_id': new_wa_number['id'],
        'phone_number': new_number,
        'status': 'pending_wa_registration',
        'next_steps': [
            'Registrar número en WhatsApp Business API',
            'Verificar negocio con Meta',
            'Aprobar templates de mensajes'
        ]
    }


async def assign_to_shared_number(db, empresa_id: str) -> dict:
    """
    Asigna una empresa al número compartido (para demo/MVP).
    """
    import uuid
    
    empresas_collection = db.get_collection('empresas')
    whatsapp_numbers_collection = db.get_collection('whatsapp_numbers')
    
    # Buscar número compartido activo
    shared = await whatsapp_numbers_collection.find_one({
        'type': WhatsAppNumberType.SHARED,
        'status': {'$in': [WhatsAppNumberStatus.ACTIVE, WhatsAppNumberStatus.PENDING]}
    })
    
    # Si no existe, crear uno
    if not shared:
        shared = {
            'id': str(uuid.uuid4()),
            'phone_number': SHARED_NUMBER_CONFIG['phone_number'],
            'friendly_name': SHARED_NUMBER_CONFIG['friendly_name'],
            'type': WhatsAppNumberType.SHARED,
            'status': WhatsAppNumberStatus.ACTIVE,
            'is_sandbox': SHARED_NUMBER_CONFIG['is_sandbox'],
            'assigned_empresas': [],
            'max_shared_empresas': SHARED_NUMBER_CONFIG['max_empresas'],
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        await whatsapp_numbers_collection.insert_one(shared)
    
    # Verificar límite
    if len(shared.get('assigned_empresas', [])) >= shared.get('max_shared_empresas', 10):
        return {
            'success': False,
            'error': 'shared_number_full',
            'mensaje': 'El número compartido ha alcanzado el límite de empresas. Contacta a soporte para obtener un número dedicado.'
        }
    
    # Verificar si ya está asignada
    if empresa_id in shared.get('assigned_empresas', []):
        return {
            'success': True,
            'already_assigned': True,
            'phone_number': shared['phone_number'],
            'is_sandbox': shared.get('is_sandbox', True)
        }
    
    # Asignar empresa
    await whatsapp_numbers_collection.update_one(
        {'id': shared['id']},
        {
            '$push': {'assigned_empresas': empresa_id},
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    # Actualizar configuración de empresa
    await empresas_collection.update_one(
        {'id': empresa_id},
        {'$set': {
            'whatsapp_config': {
                'mode': 'shared',
                'shared_number_id': shared['id'],
                'whatsapp_number_id': shared['id'],
                'auto_reply_enabled': True
            },
            'twilio_whatsapp_number': shared['phone_number']
        }}
    )
    
    logger.info(f"Empresa {empresa_id} asignada a número compartido {shared['phone_number']}")
    
    return {
        'success': True,
        'phone_number': shared['phone_number'],
        'type': 'shared',
        'is_sandbox': shared.get('is_sandbox', True),
        'sandbox_code': SHARED_NUMBER_CONFIG.get('sandbox_code') if shared.get('is_sandbox') else None,
        'assigned_count': len(shared.get('assigned_empresas', [])) + 1,
        'max_count': shared.get('max_shared_empresas', 10)
    }


# ============================================
# FUNCIONES DE OPT-IN
# ============================================

async def register_opt_in(db, cliente_telefono: str, empresa_id: str, whatsapp_number_id: str, method: str = "message") -> dict:
    """Registra el opt-in de un cliente final"""
    import uuid
    
    whatsapp_optins_collection = db.get_collection('whatsapp_optins')
    
    # Verificar si ya existe
    existing = await whatsapp_optins_collection.find_one({
        'cliente_telefono': cliente_telefono,
        'empresa_id': empresa_id
    })
    
    if existing:
        if existing.get('opted_in'):
            return {'success': True, 'already_opted_in': True}
        else:
            # Re-opt-in
            await whatsapp_optins_collection.update_one(
                {'id': existing['id']},
                {'$set': {
                    'opted_in': True,
                    'opted_in_at': datetime.now(timezone.utc),
                    'opted_out_at': None
                }}
            )
            return {'success': True, 're_opted_in': True}
    
    # Crear nuevo opt-in
    opt_in = {
        'id': str(uuid.uuid4()),
        'cliente_telefono': cliente_telefono,
        'empresa_id': empresa_id,
        'whatsapp_number_id': whatsapp_number_id,
        'opted_in': True,
        'opted_in_at': datetime.now(timezone.utc),
        'consent_method': method
    }
    
    await whatsapp_optins_collection.insert_one(opt_in)
    
    return {'success': True, 'opt_in_id': opt_in['id']}


async def check_opt_in(db, cliente_telefono: str, empresa_id: str) -> bool:
    """Verifica si un cliente tiene opt-in activo"""
    whatsapp_optins_collection = db.get_collection('whatsapp_optins')
    
    opt_in = await whatsapp_optins_collection.find_one({
        'cliente_telefono': cliente_telefono,
        'empresa_id': empresa_id,
        'opted_in': True
    })
    
    return opt_in is not None
