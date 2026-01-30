"""
Rutas de WhatsApp Multi-Tenant para CotizaBot
=============================================

ARQUITECTURA: Un solo número de WhatsApp para TODAS las empresas.
Cada empresa recibe:
- Código único (ej: FERRESOL)
- Link de WhatsApp (wa.me/xxx?text=CODIGO)
- QR Code para imprimir/compartir
- Instrucciones para clientes finales
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_user
from database import db
from services.whatsapp_router import (
    WhatsAppRouter,
    generate_company_whatsapp_assets,
    get_company_whatsapp_info
)
from datetime import datetime, timezone
import logging
import os
import uuid
import re

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
wa_conversations_collection = db.get_collection('wa_conversations')

# Número centralizado de CotizaBot
COTIZABOT_WHATSAPP_NUMBER = os.environ.get('COTIZABOT_WHATSAPP_NUMBER', '+14155238886')


# ============================================
# MODELOS DE REQUEST
# ============================================

class ActivarWhatsAppRequest(BaseModel):
    """Request para activar WhatsApp"""
    codigo_personalizado: Optional[str] = None  # Código personalizado (opcional)


class ActualizarConfigRequest(BaseModel):
    """Request para actualizar configuración de WhatsApp"""
    welcome_message: Optional[str] = None
    ai_prompt: Optional[str] = None
    ai_tone: Optional[str] = None
    horario_atencion: Optional[dict] = None


class RegenerarCodigoRequest(BaseModel):
    """Request para regenerar código"""
    nuevo_codigo: Optional[str] = None


# ============================================
# ENDPOINTS PRINCIPALES
# ============================================

@router.get("/configuracion")
async def get_whatsapp_config(current_user: dict = Depends(get_current_user)):
    """
    Obtiene la configuración completa de WhatsApp de la empresa.
    Incluye: código, link, QR, instrucciones, estadísticas.
    """
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one(
        {'id': empresa_id},
        {'_id': 0}
    )
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar si tiene WhatsApp configurado
    tiene_whatsapp = bool(empresa.get('codigo_whatsapp'))
    
    # Contar conversaciones activas
    conversations_count = await wa_conversations_collection.count_documents({
        'company_id': empresa_id
    })
    
    return {
        'configurado': tiene_whatsapp,
        'numero_cotizabot': COTIZABOT_WHATSAPP_NUMBER,
        'empresa': {
            'id': empresa['id'],
            'nombre': empresa.get('nombre'),
            'plan': empresa.get('plan', 'gratis')
        },
        'whatsapp': {
            'codigo': empresa.get('codigo_whatsapp'),
            'link': empresa.get('whatsapp_link'),
            'qr_url': empresa.get('whatsapp_qr_url'),
            'instrucciones': empresa.get('whatsapp_instrucciones')
        },
        'configuracion': {
            'welcome_message': empresa.get('whatsapp_welcome_message'),
            'ai_prompt': empresa.get('ai_prompt'),
            'ai_tone': empresa.get('ai_tone', 'profesional'),
            'horario_atencion': empresa.get('horario_atencion')
        },
        'estadisticas': {
            'conversaciones': conversations_count
        }
    }


@router.post("/activar")
async def activar_whatsapp(
    request: ActivarWhatsAppRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Activa WhatsApp para la empresa.
    Genera automáticamente:
    - Código único
    - Link de WhatsApp
    - QR Code
    - Instrucciones para clientes
    
    NO requiere Plan Completo - disponible para TODOS.
    """
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar si ya está configurado
    if empresa.get('codigo_whatsapp'):
        return {
            'success': True,
            'already_configured': True,
            'mensaje': 'WhatsApp ya está configurado para tu empresa.',
            'codigo': empresa.get('codigo_whatsapp'),
            'link': empresa.get('whatsapp_link'),
            'qr_url': empresa.get('whatsapp_qr_url')
        }
    
    # Si se proporcionó código personalizado, verificar disponibilidad
    if request.codigo_personalizado:
        codigo_limpio = re.sub(r'[^A-Z0-9]', '', request.codigo_personalizado.upper())[:10]
        
        existente = await empresas_collection.find_one({
            'codigo_whatsapp': codigo_limpio,
            'id': {'$ne': empresa_id}
        })
        
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"El código '{codigo_limpio}' ya está en uso. Elige otro."
            )
        
        # Guardar código personalizado antes de generar assets
        await empresas_collection.update_one(
            {'id': empresa_id},
            {'$set': {'codigo_whatsapp': codigo_limpio}}
        )
    
    # Generar todos los assets
    try:
        assets = await generate_company_whatsapp_assets(
            db, 
            empresa_id, 
            COTIZABOT_WHATSAPP_NUMBER
        )
        
        logger.info(f"WhatsApp activado para empresa {empresa_id}: código={assets['codigo']}")
        
        return {
            'success': True,
            'mensaje': '¡WhatsApp activado correctamente!',
            'codigo': assets['codigo'],
            'link': assets['link'],
            'qr_url': assets['qr_url'],
            'instrucciones': assets['instrucciones'],
            'numero_cotizabot': COTIZABOT_WHATSAPP_NUMBER,
            'siguiente_paso': 'Comparte el link o QR con tus clientes para que empiecen a cotizar.'
        }
        
    except Exception as e:
        logger.error(f"Error activando WhatsApp: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/configuracion")
async def actualizar_configuracion(
    request: ActualizarConfigRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza la configuración de WhatsApp de la empresa.
    Permite personalizar: mensaje de bienvenida, prompt de IA, tono, horarios.
    """
    empresa_id = current_user.get('empresa_id')
    
    updates = {}
    
    if request.welcome_message is not None:
        updates['whatsapp_welcome_message'] = request.welcome_message
    
    if request.ai_prompt is not None:
        updates['ai_prompt'] = request.ai_prompt
    
    if request.ai_tone is not None:
        if request.ai_tone not in ['profesional', 'amigable', 'formal', 'casual']:
            raise HTTPException(status_code=400, detail="Tono no válido")
        updates['ai_tone'] = request.ai_tone
    
    if request.horario_atencion is not None:
        updates['horario_atencion'] = request.horario_atencion
    
    if not updates:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
    
    updates['whatsapp_updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await empresas_collection.update_one(
        {'id': empresa_id},
        {'$set': updates}
    )
    
    return {
        'success': True,
        'mensaje': 'Configuración actualizada',
        'actualizado': list(updates.keys())
    }


@router.post("/regenerar-codigo")
async def regenerar_codigo(
    request: RegenerarCodigoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Regenera el código de WhatsApp.
    Útil si el código actual no es memorable o está comprometido.
    """
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar nuevo código si se proporcionó
    if request.nuevo_codigo:
        codigo_limpio = re.sub(r'[^A-Z0-9]', '', request.nuevo_codigo.upper())[:10]
        
        if len(codigo_limpio) < 3:
            raise HTTPException(status_code=400, detail="El código debe tener al menos 3 caracteres")
        
        existente = await empresas_collection.find_one({
            'codigo_whatsapp': codigo_limpio,
            'id': {'$ne': empresa_id}
        })
        
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"El código '{codigo_limpio}' ya está en uso."
            )
        
        # Guardar nuevo código
        await empresas_collection.update_one(
            {'id': empresa_id},
            {'$set': {'codigo_whatsapp': codigo_limpio}}
        )
    else:
        # Limpiar código para que se genere uno nuevo
        await empresas_collection.update_one(
            {'id': empresa_id},
            {'$unset': {'codigo_whatsapp': ''}}
        )
    
    # Regenerar assets
    assets = await generate_company_whatsapp_assets(
        db,
        empresa_id,
        COTIZABOT_WHATSAPP_NUMBER
    )
    
    return {
        'success': True,
        'mensaje': 'Código regenerado exitosamente',
        'codigo': assets['codigo'],
        'link': assets['link'],
        'qr_url': assets['qr_url'],
        'nota': 'Los links anteriores ya no funcionarán. Actualiza tus materiales de marketing.'
    }


@router.get("/assets")
async def get_whatsapp_assets(current_user: dict = Depends(get_current_user)):
    """
    Obtiene los assets de WhatsApp para compartir:
    - Código
    - Link
    - QR
    - Instrucciones
    - Texto para redes sociales
    """
    empresa_id = current_user.get('empresa_id')
    
    empresa = await empresas_collection.find_one({'id': empresa_id})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    if not empresa.get('codigo_whatsapp'):
        raise HTTPException(
            status_code=400,
            detail="WhatsApp no está activado. Actívalo primero."
        )
    
    nombre = empresa.get('nombre', 'Nuestra empresa')
    codigo = empresa.get('codigo_whatsapp')
    link = empresa.get('whatsapp_link')
    
    return {
        'codigo': codigo,
        'link': link,
        'qr_url': empresa.get('whatsapp_qr_url'),
        'numero': COTIZABOT_WHATSAPP_NUMBER,
        'instrucciones': empresa.get('whatsapp_instrucciones'),
        'textos_marketing': {
            'corto': f"📱 ¡Cotiza por WhatsApp! {link}",
            'medio': f"📱 ¿Necesitas una cotización de {nombre}?\n¡Escríbenos por WhatsApp!\n{link}",
            'largo': (
                f"📱 *Cotiza fácil y rápido por WhatsApp*\n\n"
                f"{nombre} ahora tiene atención automatizada 24/7.\n\n"
                f"👉 Haz clic en el link:\n{link}\n\n"
                f"O agrega nuestro número {COTIZABOT_WHATSAPP_NUMBER} "
                f"y envía el código: *{codigo}*\n\n"
                f"Nuestro asistente te ayudará con:\n"
                f"✅ Cotizaciones de productos\n"
                f"✅ Disponibilidad de inventario\n"
                f"✅ Precios actualizados\n"
                f"✅ Seguimiento de pedidos"
            )
        },
        'embed_html': f'<a href="{link}" target="_blank"><img src="{empresa.get("whatsapp_qr_url")}" alt="Cotiza por WhatsApp" width="200"></a>'
    }


@router.get("/conversaciones")
async def get_conversaciones(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """
    Obtiene las conversaciones de WhatsApp de la empresa.
    """
    empresa_id = current_user.get('empresa_id')
    
    conversaciones = await wa_conversations_collection.find(
        {'company_id': empresa_id},
        {'_id': 0}
    ).sort('last_message_at', -1).skip(skip).limit(limit).to_list(limit)
    
    total = await wa_conversations_collection.count_documents({
        'company_id': empresa_id
    })
    
    return {
        'conversaciones': conversaciones,
        'total': total,
        'limit': limit,
        'skip': skip
    }


@router.get("/estadisticas")
async def get_estadisticas(current_user: dict = Depends(get_current_user)):
    """
    Obtiene estadísticas de uso de WhatsApp.
    """
    empresa_id = current_user.get('empresa_id')
    
    # Total de conversaciones
    total_conversaciones = await wa_conversations_collection.count_documents({
        'company_id': empresa_id
    })
    
    # Conversaciones activas (última semana)
    from datetime import timedelta
    hace_una_semana = datetime.now(timezone.utc) - timedelta(days=7)
    
    conversaciones_activas = await wa_conversations_collection.count_documents({
        'company_id': empresa_id,
        'last_message_at': {'$gte': hace_una_semana}
    })
    
    # Conversaciones por método de routing
    routing_logs = db.get_collection('wa_routing_logs')
    pipeline = [
        {'$match': {'company_id': empresa_id}},
        {'$group': {'_id': '$routing_method', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    routing_stats = await routing_logs.aggregate(pipeline).to_list(10)
    
    return {
        'total_conversaciones': total_conversaciones,
        'conversaciones_activas_semana': conversaciones_activas,
        'por_metodo_routing': {stat['_id']: stat['count'] for stat in routing_stats if stat['_id']},
        'numero_cotizabot': COTIZABOT_WHATSAPP_NUMBER
    }


# ============================================
# ENDPOINTS DE ADMIN (opcional)
# ============================================

@router.get("/admin/empresas-activas")
async def admin_empresas_activas(current_user: dict = Depends(get_current_user)):
    """
    [ADMIN] Lista todas las empresas con WhatsApp activo.
    """
    if current_user.get('rol') != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    empresas = await empresas_collection.find(
        {'codigo_whatsapp': {'$exists': True, '$ne': None}},
        {'_id': 0, 'id': 1, 'nombre': 1, 'codigo_whatsapp': 1, 'plan': 1}
    ).to_list(100)
    
    return {
        'total': len(empresas),
        'empresas': empresas,
        'numero_cotizabot': COTIZABOT_WHATSAPP_NUMBER
    }
