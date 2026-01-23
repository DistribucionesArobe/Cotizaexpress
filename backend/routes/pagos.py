from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_user
from database import db
from datetime import datetime, timezone
import stripe
import os
import logging

router = APIRouter(prefix="/pagos", tags=["pagos"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
payment_transactions_collection = db.get_collection('payment_transactions')
subscriptions_collection = db.get_collection('subscriptions')

# Configurar Stripe
stripe.api_key = os.environ.get('STRIPE_API_KEY', '')

# Planes fijos definidos en backend (NUNCA aceptar monto desde frontend)
PLANES = {
    "completo": {
        "nombre": "Plan Completo CotizaBot",
        "precio_base": 1000.0,  # MXN
        "iva_rate": 0.16,
        "precio_total": 1160.0,  # MXN con IVA
        "precio_centavos": 116000,  # Stripe usa centavos
        "descripcion": "Cotizaciones ilimitadas + WhatsApp Business",
        "interval": "month"
    }
}

class CrearSuscripcionRequest(BaseModel):
    plan_id: str
    origin_url: str

class CancelarSuscripcionRequest(BaseModel):
    subscription_id: Optional[str] = None

async def get_or_create_stripe_product():
    """Obtiene o crea el producto de CotizaBot en Stripe"""
    try:
        # Buscar producto existente
        products = stripe.Product.list(limit=10)
        for product in products.data:
            if product.metadata.get('cotizabot_plan') == 'completo':
                return product.id
        
        # Crear producto si no existe
        product = stripe.Product.create(
            name="Plan Completo CotizaBot",
            description="Cotizaciones ilimitadas + WhatsApp Business para tu negocio",
            metadata={"cotizabot_plan": "completo"}
        )
        logger.info(f"Producto Stripe creado: {product.id}")
        return product.id
    except Exception as e:
        logger.error(f"Error con producto Stripe: {str(e)}")
        raise

async def get_or_create_stripe_price(product_id: str):
    """Obtiene o crea el precio recurrente en Stripe"""
    try:
        # Buscar precio existente
        prices = stripe.Price.list(product=product_id, limit=10)
        for price in prices.data:
            if price.recurring and price.recurring.interval == 'month' and price.currency == 'mxn':
                if price.unit_amount == PLANES["completo"]["precio_centavos"]:
                    return price.id
        
        # Crear precio si no existe
        price = stripe.Price.create(
            product=product_id,
            unit_amount=PLANES["completo"]["precio_centavos"],
            currency="mxn",
            recurring={"interval": "month"},
            metadata={"cotizabot_plan": "completo"}
        )
        logger.info(f"Precio Stripe creado: {price.id}")
        return price.id
    except Exception as e:
        logger.error(f"Error con precio Stripe: {str(e)}")
        raise

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
                "descripcion": plan["descripcion"],
                "interval": plan["interval"],
                "tipo": "suscripcion_mensual"
            }
            for plan_id, plan in PLANES.items()
        ]
    }

@router.post("/crear-suscripcion")
async def crear_suscripcion(
    request_data: CrearSuscripcionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Crea una sesión de checkout para suscripción mensual"""
    try:
        empresa_id = current_user.get('empresa_id')
        user_id = current_user.get('sub')
        email = current_user.get('email')
        
        # Verificar que el plan existe
        if request_data.plan_id not in PLANES:
            raise HTTPException(status_code=400, detail="Plan no válido")
        
        plan = PLANES[request_data.plan_id]
        
        # Verificar que la empresa no tenga ya el plan completo activo
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if empresa and empresa.get('plan') == 'completo' and empresa.get('subscription_status') == 'active':
            raise HTTPException(
                status_code=400,
                detail="Ya tienes una suscripción activa al Plan Completo"
            )
        
        # Obtener o crear producto y precio en Stripe
        product_id = await get_or_create_stripe_product()
        price_id = await get_or_create_stripe_price(product_id)
        
        # Construir URLs dinámicamente
        origin_url = request_data.origin_url.rstrip('/')
        success_url = f"{origin_url}/pago-exitoso?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/precios"
        
        # Crear sesión de checkout para suscripción
        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=email,
            metadata={
                "plan_id": request_data.plan_id,
                "empresa_id": empresa_id,
                "user_id": user_id,
                "email": email,
                "tipo": "suscripcion_mensual"
            },
            subscription_data={
                "metadata": {
                    "empresa_id": empresa_id,
                    "plan_id": request_data.plan_id
                }
            }
        )
        
        # Crear registro de transacción
        transaction = {
            "session_id": checkout_session.id,
            "empresa_id": empresa_id,
            "user_id": user_id,
            "email": email,
            "plan_id": request_data.plan_id,
            "amount": plan["precio_total"],
            "currency": "MXN",
            "payment_status": "pending",
            "status": "initiated",
            "tipo": "suscripcion_mensual",
            "metadata": {
                "plan_nombre": plan["nombre"],
                "precio_base": plan["precio_base"],
                "iva": plan["precio_base"] * plan["iva_rate"]
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await payment_transactions_collection.insert_one(transaction)
        
        logger.info(f"Checkout de suscripción creado: {checkout_session.id} para empresa {empresa_id}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error de Stripe: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error de Stripe: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando suscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando sesión de pago: {str(e)}")

# Mantener endpoint anterior para compatibilidad
@router.post("/crear-checkout")
async def crear_checkout_session(
    request_data: CrearSuscripcionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Alias para crear-suscripcion (compatibilidad)"""
    return await crear_suscripcion(request_data, request, current_user)

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
                "tipo": transaction.get('tipo', 'pago_unico'),
                "mensaje": "¡Pago exitoso! Tu suscripción mensual está activa."
            }
        
        # Consultar estado actual en Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        
        # Actualizar según estado
        new_status = "pending"
        plan_activado = False
        mensaje = "Procesando pago..."
        
        if checkout_session.payment_status == "paid":
            # Verificar que no se haya procesado ya
            existing = await payment_transactions_collection.find_one({
                'session_id': session_id,
                'payment_status': 'paid'
            })
            
            if not existing:
                # Obtener subscription_id si es suscripción
                subscription_id = checkout_session.subscription
                
                # Activar plan completo
                update_data = {
                    'plan': 'completo',
                    'cotizaciones_limite': None,
                    'fecha_pago': datetime.now(timezone.utc).isoformat(),
                    'stripe_session_id': session_id,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
                
                if subscription_id:
                    update_data['stripe_subscription_id'] = subscription_id
                    update_data['subscription_status'] = 'active'
                
                await empresas_collection.update_one(
                    {'id': empresa_id},
                    {'$set': update_data}
                )
                
                # Actualizar transacción
                await payment_transactions_collection.update_one(
                    {'session_id': session_id},
                    {
                        '$set': {
                            'payment_status': 'paid',
                            'status': 'complete',
                            'subscription_id': subscription_id,
                            'paid_at': datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Guardar info de suscripción
                if subscription_id:
                    subscription = stripe.Subscription.retrieve(subscription_id)
                    await subscriptions_collection.update_one(
                        {'empresa_id': empresa_id},
                        {
                            '$set': {
                                'empresa_id': empresa_id,
                                'subscription_id': subscription_id,
                                'status': subscription.status,
                                'current_period_start': datetime.fromtimestamp(subscription.current_period_start, timezone.utc).isoformat(),
                                'current_period_end': datetime.fromtimestamp(subscription.current_period_end, timezone.utc).isoformat(),
                                'cancel_at_period_end': subscription.cancel_at_period_end,
                                'updated_at': datetime.now(timezone.utc).isoformat()
                            }
                        },
                        upsert=True
                    )
                
                logger.info(f"Suscripción activada para empresa {empresa_id}")
            
            new_status = "complete"
            plan_activado = True
            mensaje = "¡Pago exitoso! Tu suscripción mensual está activa."
            
        elif checkout_session.status == "expired":
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
            "payment_status": checkout_session.payment_status,
            "plan_activado": plan_activado,
            "tipo": transaction.get('tipo', 'suscripcion_mensual'),
            "mensaje": mensaje
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error de Stripe: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancelar-suscripcion")
async def cancelar_suscripcion(
    request_data: CancelarSuscripcionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Cancela la suscripción al final del período actual"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        subscription_id = request_data.subscription_id or empresa.get('stripe_subscription_id')
        
        if not subscription_id:
            raise HTTPException(
                status_code=400,
                detail="No tienes una suscripción activa para cancelar"
            )
        
        # Cancelar al final del período (no inmediatamente)
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
        
        # Actualizar BD
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'subscription_status': 'canceling',
                    'cancel_at_period_end': True,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        await subscriptions_collection.update_one(
            {'empresa_id': empresa_id},
            {
                '$set': {
                    'status': 'canceling',
                    'cancel_at_period_end': True,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        period_end = datetime.fromtimestamp(subscription.current_period_end, timezone.utc)
        
        logger.info(f"Suscripción {subscription_id} marcada para cancelar al final del período")
        
        return {
            "success": True,
            "mensaje": f"Tu suscripción se cancelará el {period_end.strftime('%d/%m/%Y')}. Seguirás teniendo acceso hasta esa fecha.",
            "cancel_at": period_end.isoformat()
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error de Stripe: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelando suscripción: {str(e)}")
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
        subscription_id = empresa.get('stripe_subscription_id')
        
        result = {
            "plan": plan,
            "plan_nombre": "Plan Completo" if plan == 'completo' else "Plan Gratis",
            "cotizaciones_usadas": empresa.get('cotizaciones_usadas', 0),
            "cotizaciones_limite": empresa.get('cotizaciones_limite', 5) if plan == 'gratis' else None,
            "fecha_pago": empresa.get('fecha_pago'),
            "activo": empresa.get('activo', True),
            "subscription_status": empresa.get('subscription_status'),
            "cancel_at_period_end": empresa.get('cancel_at_period_end', False)
        }
        
        # Obtener info detallada de suscripción si existe
        if subscription_id:
            subscription_info = await subscriptions_collection.find_one(
                {'empresa_id': empresa_id},
                {'_id': 0}
            )
            if subscription_info:
                result['subscription'] = {
                    'id': subscription_id,
                    'current_period_end': subscription_info.get('current_period_end'),
                    'cancel_at_period_end': subscription_info.get('cancel_at_period_end', False)
                }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo suscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
