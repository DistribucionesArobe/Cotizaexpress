from fastapi import APIRouter, Request, HTTPException
from database import db
from emergentintegrations.payments.stripe.checkout import StripeCheckout
from datetime import datetime, timezone
import os
import logging

router = APIRouter(prefix="/webhook", tags=["webhooks"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
payment_transactions_collection = db.get_collection('payment_transactions')

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Maneja webhooks de Stripe para actualizaciones de pago"""
    try:
        api_key = os.environ.get('STRIPE_API_KEY')
        if not api_key:
            logger.error("STRIPE_API_KEY no configurado")
            raise HTTPException(status_code=500, detail="Stripe no configurado")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Obtener body y signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # Procesar webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook recibido: {webhook_response.event_type}, session: {webhook_response.session_id}")
        
        # Procesar según tipo de evento
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata or {}
            
            # Verificar que no esté ya procesado
            existing = await payment_transactions_collection.find_one({
                'session_id': session_id,
                'payment_status': 'paid'
            })
            
            if existing:
                logger.info(f"Webhook: Sesión {session_id} ya procesada")
                return {"status": "already_processed"}
            
            empresa_id = metadata.get('empresa_id')
            
            if empresa_id and metadata.get('tipo') == 'upgrade_plan':
                # Activar plan completo
                await empresas_collection.update_one(
                    {'id': empresa_id},
                    {
                        '$set': {
                            'plan': 'completo',
                            'cotizaciones_limite': None,
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
                
                logger.info(f"Webhook: Plan Completo activado para empresa {empresa_id}")
        
        elif webhook_response.event_type == "checkout.session.expired":
            session_id = webhook_response.session_id
            
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
            
            logger.info(f"Webhook: Sesión {session_id} expirada")
        
        return {"status": "processed", "event_type": webhook_response.event_type}
        
    except Exception as e:
        logger.error(f"Error procesando webhook Stripe: {str(e)}")
        # Retornar 200 para evitar reintentos de Stripe
        return {"status": "error", "detail": str(e)}
