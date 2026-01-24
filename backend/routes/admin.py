from fastapi import APIRouter, HTTPException, Depends
from utils.auth import get_current_user
from database import db
from twilio.rest import Client
from datetime import datetime, timezone
import os
import logging

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
usuarios_collection = db.get_collection('usuarios')
cotizaciones_collection = db.get_collection('cotizaciones')
promo_codes_collection = db.get_collection('promo_codes')
subscriptions_collection = db.get_collection('subscriptions')

def verify_admin(current_user: dict):
    """Verifica que el usuario sea admin"""
    if current_user.get('rol') != 'admin':
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
    return True


@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Obtiene estadísticas generales para el dashboard de admin"""
    verify_admin(current_user)
    
    try:
        # Contar empresas
        total_empresas = await empresas_collection.count_documents({})
        
        # Contar suscripciones activas
        suscripciones_activas = await empresas_collection.count_documents({
            'plan': 'completo'
        })
        
        # Contar cotizaciones totales
        cotizaciones_totales = await cotizaciones_collection.count_documents({})
        
        # Contar códigos promocionales
        promos_total = await promo_codes_collection.count_documents({})
        promos_activos = await promo_codes_collection.count_documents({'activo': True})
        
        # Contar números de WhatsApp comprados
        numeros_comprados = await empresas_collection.count_documents({
            'twilio_whatsapp_number': {'$exists': True, '$ne': None}
        })
        
        # Obtener saldo de Twilio
        twilio_balance = None
        twilio_connected = False
        
        try:
            account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            
            if account_sid and auth_token:
                client = Client(account_sid, auth_token)
                balance = client.api.v2010.accounts(account_sid).balance.fetch()
                twilio_balance = float(balance.balance)
                twilio_connected = True
        except Exception as e:
            logger.warning(f"Error obteniendo saldo de Twilio: {e}")
        
        return {
            "total_empresas": total_empresas,
            "suscripciones_activas": suscripciones_activas,
            "cotizaciones_totales": cotizaciones_totales,
            "promos_total": promos_total,
            "promos_activos": promos_activos,
            "numeros_comprados": numeros_comprados,
            "twilio_balance": twilio_balance,
            "twilio_connected": twilio_connected
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo stats de admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/twilio")
async def get_twilio_dashboard(current_user: dict = Depends(get_current_user)):
    """Obtiene información detallada de Twilio para el dashboard"""
    verify_admin(current_user)
    
    try:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        
        if not account_sid or not auth_token:
            return {
                "connected": False,
                "error": "Credenciales de Twilio no configuradas",
                "balance": 0,
                "numeros_activos": 0,
                "numeros": [],
                "mensajes_mes": 0
            }
        
        client = Client(account_sid, auth_token)
        
        # Obtener saldo
        balance_data = client.api.v2010.accounts(account_sid).balance.fetch()
        balance = float(balance_data.balance)
        
        # Obtener números
        incoming_numbers = client.incoming_phone_numbers.list(limit=50)
        
        # Buscar a qué empresa pertenece cada número
        numeros = []
        for num in incoming_numbers:
            empresa_info = await empresas_collection.find_one(
                {'twilio_whatsapp_number': num.phone_number},
                {'nombre': 1, '_id': 0}
            )
            
            numeros.append({
                "sid": num.sid,
                "phone_number": num.phone_number,
                "friendly_name": num.friendly_name,
                "date_created": num.date_created.isoformat() if num.date_created else None,
                "status": "in-use" if empresa_info else "available",
                "empresa_nombre": empresa_info.get('nombre') if empresa_info else None
            })
        
        # Contar mensajes del mes actual (aproximado)
        # Nota: Twilio cobra por consultas de uso detallado, así que solo contamos si es necesario
        mensajes_mes = 0
        
        return {
            "connected": True,
            "balance": balance,
            "numeros_activos": len(numeros),
            "numeros": numeros,
            "mensajes_mes": mensajes_mes,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo datos de Twilio: {e}")
        return {
            "connected": False,
            "error": str(e),
            "balance": 0,
            "numeros_activos": 0,
            "numeros": [],
            "mensajes_mes": 0
        }
