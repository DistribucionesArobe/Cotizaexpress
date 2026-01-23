from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict
from utils.auth import get_current_user
from database import db
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)
from datetime import datetime, timezone
import os
import logging

router = APIRouter(prefix="/pagos", tags=["pagos"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
payment_transactions_collection = db.get_collection('payment_transactions')

# Planes fijos definidos en backend (NUNCA aceptar monto desde frontend)
PLANES = {
    "completo": {
        "nombre": "Plan Completo",
        "precio_base": 1000.0,  # MXN
        "iva_rate": 0.16,
        "precio_total": 1160.0,  # MXN con IVA
        "descripcion": "Cotizaciones ilimitadas + WhatsApp Business"
    }
}

class CrearCheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class CheckoutStatusRequest(BaseModel):
    session_id: str

def get_stripe_checkout(request: Request) -> StripeCheckout:
    """Obtiene cliente Stripe con configuración"""
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)

@router.get("/planes")
async def obtener_planes():
    """Obtiene los planes disponibles"""
    return {
        "planes": [
            {
                "id": plan_id,
                "nombre": plan["nombre"],
                "precio_base": plan["precio_base"],
                "iva": plan["precio_base"] * plan["iva_rate"],
                "precio_total": plan["precio_total"],
                "currency": "MXN",
                "descripcion": plan["descripcion"]
            }
            for plan_id, plan in PLANES.items()
        ]
    }

@router.post("/crear-checkout")
async def crear_checkout_session(
    request_data: CrearCheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Crea una sesión de checkout de Stripe para el upgrade de plan"""
    try:
        empresa_id = current_user.get('empresa_id')
        user_id = current_user.get('sub')
        email = current_user.get('email')
        
        # Verificar que el plan existe
        if request_data.plan_id not in PLANES:
            raise HTTPException(status_code=400, detail="Plan no válido")
        
        plan = PLANES[request_data.plan_id]
        
        # Verificar que la empresa no tenga ya el plan completo
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if empresa and empresa.get('plan') == 'completo':
            raise HTTPException(
                status_code=400,
                detail="Ya tienes el Plan Completo activo"
            )
        
        # Construir URLs dinámicamente desde el origin del frontend
        origin_url = request_data.origin_url.rstrip('/')
        success_url = f"{origin_url}/pago-exitoso?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/precios"
        
        # Crear checkout de Stripe
        stripe_checkout = get_stripe_checkout(request)
        
        checkout_request = CheckoutSessionRequest(
            amount=float(plan["precio_total"]),  # Monto como float
            currency="mxn",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "plan_id": request_data.plan_id,
                "empresa_id": empresa_id,
                "user_id": user_id,
                "email": email,
                "tipo": "upgrade_plan"
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Crear registro de transacción ANTES de redirigir
        transaction = {
            "session_id": session.session_id,
            "empresa_id": empresa_id,
            "user_id": user_id,
            "email": email,
            "plan_id": request_data.plan_id,
            "amount": plan["precio_total"],
            "currency": "MXN",
            "payment_status": "pending",
            "status": "initiated",
            "metadata": {
                "plan_nombre": plan["nombre"],
                "precio_base": plan["precio_base"],
                "iva": plan["precio_base"] * plan["iva_rate"]
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await payment_transactions_collection.insert_one(transaction)
        
        logger.info(f"Checkout creado: {session.session_id} para empresa {empresa_id}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando sesión de pago: {str(e)}")

@router.get("/checkout-status/{session_id}")
async def obtener_status_checkout(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene el estado de una sesión de checkout"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Verificar que la transacción pertenece a esta empresa
        transaction = await payment_transactions_collection.find_one(
            {'session_id': session_id, 'empresa_id': empresa_id},
            {'_id': 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        # Si ya está procesada, retornar estado guardado
        if transaction.get('payment_status') == 'paid':
            return {
                "status": "complete",
                "payment_status": "paid",
                "plan_activado": True,
                "mensaje": "¡Pago exitoso! Tu Plan Completo está activo."
            }
        
        # Consultar estado actual en Stripe
        stripe_checkout = get_stripe_checkout(request)
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Actualizar transacción según estado
        new_status = "pending"
        plan_activado = False
        mensaje = "Procesando pago..."
        
        if checkout_status.payment_status == "paid":
            # Verificar que no se haya procesado ya (evitar duplicados)
            existing = await payment_transactions_collection.find_one({
                'session_id': session_id,
                'payment_status': 'paid'
            })
            
            if not existing:
                # Activar plan completo
                await empresas_collection.update_one(
                    {'id': empresa_id},
                    {
                        '$set': {
                            'plan': 'completo',
                            'cotizaciones_limite': None,  # Ilimitadas
                            'fecha_pago': datetime.now(timezone.utc).isoformat(),
                            'stripe_session_id': session_id,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Actualizar transacción
                await payment_transactions_collection.update_one(
                    {'session_id': session_id},
                    {
                        '$set': {
                            'payment_status': 'paid',
                            'status': 'complete',
                            'paid_at': datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                logger.info(f"Plan Completo activado para empresa {empresa_id}")
            
            new_status = "complete"
            plan_activado = True
            mensaje = "¡Pago exitoso! Tu Plan Completo está activo."
            
        elif checkout_status.status == "expired":
            await payment_transactions_collection.update_one(
                {'session_id': session_id},
                {
                    '$set': {
                        'payment_status': 'expired',
                        'status': 'expired',
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            new_status = "expired"
            mensaje = "La sesión de pago expiró. Por favor intenta de nuevo."
        
        return {
            "status": new_status,
            "payment_status": checkout_status.payment_status,
            "plan_activado": plan_activado,
            "mensaje": mensaje
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mi-suscripcion")
async def obtener_mi_suscripcion(current_user: dict = Depends(get_current_user)):
    """Obtiene información de la suscripción actual"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        plan = empresa.get('plan', 'gratis')
        
        # Obtener última transacción exitosa
        ultima_transaccion = await payment_transactions_collection.find_one(
            {'empresa_id': empresa_id, 'payment_status': 'paid'},
            {'_id': 0},
            sort=[('paid_at', -1)]
        )
        
        return {
            "plan": plan,
            "plan_nombre": "Plan Completo" if plan == 'completo' else "Plan Gratis",
            "cotizaciones_usadas": empresa.get('cotizaciones_usadas', 0),
            "cotizaciones_limite": empresa.get('cotizaciones_limite', 5) if plan == 'gratis' else None,
            "fecha_pago": empresa.get('fecha_pago'),
            "activo": empresa.get('activo', True),
            "ultima_transaccion": {
                "amount": ultima_transaccion.get('amount'),
                "paid_at": ultima_transaccion.get('paid_at')
            } if ultima_transaccion else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo suscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
