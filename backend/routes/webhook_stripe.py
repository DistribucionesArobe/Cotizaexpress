from fastapi import APIRouter, Request, HTTPException
from database import db
from datetime import datetime, timezone
import stripe
import os
import logging

router = APIRouter(prefix="/webhook", tags=["webhooks"])
logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get('STRIPE_API_KEY', '')

empresas_collection = db.get_collection('empresas')if db is not None else None
payment_transactions_collection = db.get_collection('payment_transactions')if db is not None else None
subscriptions_collection = db.get_collection('subscriptions')if db is not None else None

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Maneja webhooks de Stripe para suscripciones y pagos"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # En producción, verificar firma con webhook secret
        # event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        
        # Por ahora, parsear el evento directamente
        import json
        event = json.loads(body)
        
        event_type = event.get('type', '')
        data = event.get('data', {}).get('object', {})
        
        logger.info(f"Webhook Stripe recibido: {event_type}")
        
        # Manejar diferentes tipos de eventos
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(data)
            
        elif event_type == "customer.subscription.created":
            await handle_subscription_created(data)
            
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(data)
            
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(data)
            
        elif event_type == "invoice.payment_succeeded":
            await handle_invoice_paid(data)
            
        elif event_type == "invoice.payment_failed":
            await handle_invoice_failed(data)
        
        return {"status": "processed", "event_type": event_type}
        
    except Exception as e:
        logger.error(f"Error procesando webhook Stripe: {str(e)}")
        # Retornar 200 para evitar reintentos
        return {"status": "error", "detail": str(e)}

async def handle_checkout_completed(session):
    """Procesa checkout completado"""
    session_id = session.get('id')
    metadata = session.get('metadata', {})
    empresa_id = metadata.get('empresa_id')
    subscription_id = session.get('subscription')
    
    if not empresa_id:
        logger.warning(f"Checkout sin empresa_id: {session_id}")
        return
    
    # Verificar que no esté ya procesado
    existing = await payment_transactions_collection.find_one({
        'session_id': session_id,
        'payment_status': 'paid'
    })
    
    if existing:
        logger.info(f"Sesión {session_id} ya procesada")
        return
    
    # Activar plan
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
    
    logger.info(f"Checkout completado para empresa {empresa_id}")

async def handle_subscription_created(subscription):
    """Procesa nueva suscripción"""
    subscription_id = subscription.get('id')
    metadata = subscription.get('metadata', {})
    empresa_id = metadata.get('empresa_id')
    
    if not empresa_id:
        logger.warning(f"Suscripción sin empresa_id: {subscription_id}")
        return
    
    await subscriptions_collection.update_one(
        {'empresa_id': empresa_id},
        {
            '$set': {
                'empresa_id': empresa_id,
                'subscription_id': subscription_id,
                'status': subscription.get('status'),
                'current_period_start': datetime.fromtimestamp(
                    subscription.get('current_period_start', 0), timezone.utc
                ).isoformat(),
                'current_period_end': datetime.fromtimestamp(
                    subscription.get('current_period_end', 0), timezone.utc
                ).isoformat(),
                'cancel_at_period_end': subscription.get('cancel_at_period_end', False),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    logger.info(f"Suscripción creada: {subscription_id} para empresa {empresa_id}")

async def handle_subscription_updated(subscription):
    """Procesa actualización de suscripción"""
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    # Buscar empresa por subscription_id
    sub_record = await subscriptions_collection.find_one({'subscription_id': subscription_id})
    if not sub_record:
        logger.warning(f"Suscripción no encontrada: {subscription_id}")
        return
    
    empresa_id = sub_record.get('empresa_id')
    
    # Actualizar suscripción
    await subscriptions_collection.update_one(
        {'subscription_id': subscription_id},
        {
            '$set': {
                'status': status,
                'current_period_start': datetime.fromtimestamp(
                    subscription.get('current_period_start', 0), timezone.utc
                ).isoformat(),
                'current_period_end': datetime.fromtimestamp(
                    subscription.get('current_period_end', 0), timezone.utc
                ).isoformat(),
                'cancel_at_period_end': subscription.get('cancel_at_period_end', False),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Actualizar empresa
    await empresas_collection.update_one(
        {'id': empresa_id},
        {
            '$set': {
                'subscription_status': status,
                'cancel_at_period_end': subscription.get('cancel_at_period_end', False),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    logger.info(f"Suscripción actualizada: {subscription_id}, status: {status}")

async def handle_subscription_deleted(subscription):
    """Procesa cancelación de suscripción"""
    subscription_id = subscription.get('id')
    
    # Buscar empresa por subscription_id
    sub_record = await subscriptions_collection.find_one({'subscription_id': subscription_id})
    if not sub_record:
        return
    
    empresa_id = sub_record.get('empresa_id')
    
    # Degradar a plan pendiente (sin acceso)
    await empresas_collection.update_one(
        {'id': empresa_id},
        {
            '$set': {
                'plan': 'pendiente',
                'cotizaciones_limite': 0,
                'cotizaciones_usadas': 0,
                'subscription_status': 'canceled',
                'stripe_subscription_id': None,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )

    # Actualizar registro de suscripción
    await subscriptions_collection.update_one(
        {'subscription_id': subscription_id},
        {
            '$set': {
                'status': 'canceled',
                'canceled_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )

    logger.info(f"Suscripción cancelada: {subscription_id}, empresa degradada a plan pendiente")

async def handle_invoice_paid(invoice):
    """Procesa factura pagada (renovación mensual)"""
    subscription_id = invoice.get('subscription')
    
    if not subscription_id:
        return
    
    # Buscar empresa
    sub_record = await subscriptions_collection.find_one({'subscription_id': subscription_id})
    if not sub_record:
        return
    
    empresa_id = sub_record.get('empresa_id')
    
    # Registrar pago de renovación
    await payment_transactions_collection.insert_one({
        'empresa_id': empresa_id,
        'subscription_id': subscription_id,
        'invoice_id': invoice.get('id'),
        'amount': invoice.get('amount_paid', 0) / 100,  # Convertir de centavos
        'currency': invoice.get('currency', 'mxn').upper(),
        'payment_status': 'paid',
        'status': 'complete',
        'tipo': 'renovacion_mensual',
        'paid_at': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    
    # Actualizar fecha de pago
    await empresas_collection.update_one(
        {'id': empresa_id},
        {
            '$set': {
                'fecha_pago': datetime.now(timezone.utc).isoformat(),
                'subscription_status': 'active',
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    logger.info(f"Renovación procesada para empresa {empresa_id}")

async def handle_invoice_failed(invoice):
    """Procesa factura fallida"""
    subscription_id = invoice.get('subscription')
    
    if not subscription_id:
        return
    
    # Buscar empresa
    sub_record = await subscriptions_collection.find_one({'subscription_id': subscription_id})
    if not sub_record:
        return
    
    empresa_id = sub_record.get('empresa_id')
    
    # Marcar como pago fallido
    await empresas_collection.update_one(
        {'id': empresa_id},
        {
            '$set': {
                'subscription_status': 'past_due',
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    logger.warning(f"Pago fallido para empresa {empresa_id}")
