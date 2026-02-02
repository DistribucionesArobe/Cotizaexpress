from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from utils.auth import get_current_user
from database import db
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutSessionRequest
)
from datetime import datetime, timezone
import stripe
import os
import logging
import uuid

router = APIRouter(prefix="/pagos", tags=["pagos"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
payment_transactions_collection = db.get_collection('payment_transactions')
subscriptions_collection = db.get_collection('subscriptions')
promo_codes_collection = db.get_collection('promo_codes')
promo_usage_collection = db.get_collection('promo_usage')

# Planes fijos definidos en backend (NUNCA aceptar monto desde frontend)
PLANES = {
    "completo": {
        "nombre": "Plan Completo CotizaBot",
        "precio_base": 1000.0,  # MXN
        "iva_rate": 0.16,
        "precio_total": 1160.0,  # MXN con IVA
        "descripcion": "Cotizaciones ilimitadas + WhatsApp Business",
        "interval": "month",
        "features": [
            "Cotizaciones ilimitadas",
            "WhatsApp Business",
            "Catálogo de productos",
            "Dashboard de métricas"
        ]
    },
    "pro": {
        "nombre": "Plan Pro CotizaBot",
        "precio_base": 2000.0,  # MXN
        "iva_rate": 0.16,
        "precio_total": 2320.0,  # MXN con IVA ($2,000 + 16% IVA)
        "descripcion": "Todo Completo + Cobros automáticos (Mercado Pago + SPEI)",
        "interval": "month",
        "features": [
            "Todo del Plan Completo",
            "Link de pago Mercado Pago",
            "Datos bancarios SPEI automáticos",
            "Cobros desde WhatsApp",
            "Notificaciones de pago"
        ]
    }
}

class CrearSuscripcionRequest(BaseModel):
    plan_id: str
    origin_url: str
    promo_code: Optional[str] = None

class CancelarSuscripcionRequest(BaseModel):
    subscription_id: Optional[str] = None

class ValidarPromoCodeRequest(BaseModel):
    code: str

class CrearPromoCodeRequest(BaseModel):
    code: str
    descuento_porcentaje: Optional[int] = None  # 10 = 10%
    descuento_fijo: Optional[float] = None  # Monto fijo en MXN
    max_usos: Optional[int] = 1  # Usos totales permitidos
    un_uso_por_cliente: bool = True
    fecha_expiracion: Optional[str] = None
    descripcion: Optional[str] = None

def get_stripe_checkout(request: Request) -> StripeCheckout:
    """Obtiene cliente Stripe con configuración"""
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


# ==================== CÓDIGOS PROMOCIONALES ====================

@router.post("/promo/crear")
async def crear_promo_code(
    request_data: CrearPromoCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Crea un nuevo código promocional (solo admin)"""
    try:
        # Verificar que el código no exista
        existe = await promo_codes_collection.find_one({'code': request_data.code.upper()})
        if existe:
            raise HTTPException(status_code=400, detail="El código ya existe")
        
        # Validar descuento
        if not request_data.descuento_porcentaje and not request_data.descuento_fijo:
            raise HTTPException(status_code=400, detail="Debe especificar descuento_porcentaje o descuento_fijo")
        
        # Crear código en BD
        promo_doc = {
            "id": str(uuid.uuid4()),
            "code": request_data.code.upper(),
            "descuento_porcentaje": request_data.descuento_porcentaje,
            "descuento_fijo": request_data.descuento_fijo,
            "max_usos": request_data.max_usos,
            "usos_actuales": 0,
            "un_uso_por_cliente": request_data.un_uso_por_cliente,
            "fecha_expiracion": request_data.fecha_expiracion,
            "descripcion": request_data.descripcion,
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get('empresa_id')
        }
        
        # Crear cupón en Stripe
        stripe.api_key = os.environ.get('STRIPE_API_KEY')
        
        coupon_params = {
            "id": f"PROMO_{request_data.code.upper()}",
            "currency": "mxn",
            "duration": "once",  # Aplicar una sola vez
            "name": f"Promoción {request_data.code.upper()}"
        }
        
        if request_data.descuento_porcentaje:
            coupon_params["percent_off"] = request_data.descuento_porcentaje
        elif request_data.descuento_fijo:
            coupon_params["amount_off"] = int(request_data.descuento_fijo * 100)  # Stripe usa centavos
        
        if request_data.max_usos:
            coupon_params["max_redemptions"] = request_data.max_usos
        
        try:
            stripe_coupon = stripe.Coupon.create(**coupon_params)
            promo_doc["stripe_coupon_id"] = stripe_coupon.id
            
            # Crear promotion code en Stripe
            stripe_promo = stripe.PromotionCode.create(
                coupon=stripe_coupon.id,
                code=request_data.code.upper(),
                max_redemptions=request_data.max_usos if request_data.max_usos else None
            )
            promo_doc["stripe_promo_id"] = stripe_promo.id
            
        except stripe.error.StripeError as e:
            logger.warning(f"Error creando cupón en Stripe: {e}")
            # Continuar sin cupón de Stripe (aplicar descuento manualmente)
        
        await promo_codes_collection.insert_one(promo_doc)
        
        logger.info(f"Código promocional creado: {request_data.code.upper()}")
        
        return {
            "success": True,
            "code": request_data.code.upper(),
            "descuento": f"{request_data.descuento_porcentaje}%" if request_data.descuento_porcentaje else f"${request_data.descuento_fijo} MXN",
            "max_usos": request_data.max_usos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando código promo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/promo/validar")
async def validar_promo_code(
    request_data: ValidarPromoCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Valida un código promocional antes de aplicarlo"""
    try:
        empresa_id = current_user.get('empresa_id')
        code = request_data.code.upper().strip()
        
        # Buscar código
        promo = await promo_codes_collection.find_one(
            {'code': code, 'activo': True},
            {'_id': 0}
        )
        
        if not promo:
            return {"valid": False, "error": "Código no válido o expirado"}
        
        # Verificar expiración
        if promo.get('fecha_expiracion'):
            expira = datetime.fromisoformat(promo['fecha_expiracion'])
            if datetime.now(timezone.utc) > expira:
                return {"valid": False, "error": "Código expirado"}
        
        # Verificar usos máximos
        if promo.get('max_usos') and promo.get('usos_actuales', 0) >= promo['max_usos']:
            return {"valid": False, "error": "Código agotado"}
        
        # Verificar uso único por cliente
        if promo.get('un_uso_por_cliente'):
            uso_previo = await promo_usage_collection.find_one({
                'promo_id': promo['id'],
                'empresa_id': empresa_id
            })
            if uso_previo:
                return {"valid": False, "error": "Ya has usado este código"}
        
        # Calcular descuento
        plan = PLANES.get('completo')
        precio_original = plan['precio_total']
        
        if promo.get('descuento_porcentaje'):
            descuento = precio_original * (promo['descuento_porcentaje'] / 100)
        else:
            descuento = promo.get('descuento_fijo', 0)
        
        precio_final = max(0, precio_original - descuento)
        
        return {
            "valid": True,
            "code": code,
            "descuento_texto": f"{promo['descuento_porcentaje']}%" if promo.get('descuento_porcentaje') else f"${promo['descuento_fijo']} MXN",
            "precio_original": precio_original,
            "descuento": round(descuento, 2),
            "precio_final": round(precio_final, 2),
            "descripcion": promo.get('descripcion', 'Descuento aplicado')
        }
        
    except Exception as e:
        logger.error(f"Error validando código: {str(e)}")
        return {"valid": False, "error": "Error validando código"}


@router.get("/promo/listar")
async def listar_promo_codes(current_user: dict = Depends(get_current_user)):
    """Lista todos los códigos promocionales (solo admin)"""
    try:
        # Verificar que sea admin
        if current_user.get('rol') != 'admin':
            raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
        
        promos = await promo_codes_collection.find(
            {},
            {'_id': 0}
        ).sort('created_at', -1).to_list(100)
        
        # Agregar info de uso para cada código
        for promo in promos:
            usos = await promo_usage_collection.count_documents({
                'promo_id': promo['id'],
                'status': 'used'
            })
            promo['usos_completados'] = usos
        
        return {"promo_codes": promos}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listando códigos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/promo/{promo_id}/toggle")
async def toggle_promo_code(
    promo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activa o desactiva un código promocional"""
    try:
        # Verificar que sea admin
        if current_user.get('rol') != 'admin':
            raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
        
        # Buscar código
        promo = await promo_codes_collection.find_one({'id': promo_id})
        if not promo:
            raise HTTPException(status_code=404, detail="Código no encontrado")
        
        # Toggle estado
        nuevo_estado = not promo.get('activo', True)
        
        await promo_codes_collection.update_one(
            {'id': promo_id},
            {'$set': {'activo': nuevo_estado, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Código {promo['code']} {'activado' if nuevo_estado else 'desactivado'}")
        
        return {
            "success": True,
            "code": promo['code'],
            "activo": nuevo_estado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando código: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/promo/{promo_id}")
async def eliminar_promo_code(
    promo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Elimina un código promocional"""
    try:
        # Verificar que sea admin
        if current_user.get('rol') != 'admin':
            raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
        
        # Buscar código
        promo = await promo_codes_collection.find_one({'id': promo_id})
        if not promo:
            raise HTTPException(status_code=404, detail="Código no encontrado")
        
        # Eliminar de Stripe si existe
        if promo.get('stripe_promo_id'):
            try:
                stripe.api_key = os.environ.get('STRIPE_API_KEY')
                stripe.PromotionCode.modify(promo['stripe_promo_id'], active=False)
            except:
                pass
        
        # Eliminar de BD
        await promo_codes_collection.delete_one({'id': promo_id})
        
        logger.info(f"Código {promo['code']} eliminado")
        
        return {"success": True, "message": f"Código {promo['code']} eliminado"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando código: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/promo/{promo_id}/usos")
async def obtener_usos_promo(
    promo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene el historial de usos de un código"""
    try:
        # Verificar que sea admin
        if current_user.get('rol') != 'admin':
            raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
        
        usos = await promo_usage_collection.find(
            {'promo_id': promo_id},
            {'_id': 0}
        ).sort('created_at', -1).to_list(100)
        
        return {"usos": usos}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo usos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PLANES Y CHECKOUT ====================

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
                "tipo": "mensual"
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
    """Crea una sesión de checkout para pago mensual con soporte para códigos promo"""
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
                detail="Ya tienes el Plan Completo activo"
            )
        
        # Procesar código promocional si existe
        promo_data = None
        stripe_promo_code = None
        precio_final = plan["precio_total"]
        
        if request_data.promo_code:
            code = request_data.promo_code.upper().strip()
            
            # Buscar código
            promo = await promo_codes_collection.find_one(
                {'code': code, 'activo': True},
                {'_id': 0}
            )
            
            if promo:
                # Validar uso
                es_valido = True
                
                # Verificar expiración
                if promo.get('fecha_expiracion'):
                    expira = datetime.fromisoformat(promo['fecha_expiracion'])
                    if datetime.now(timezone.utc) > expira:
                        es_valido = False
                
                # Verificar usos máximos
                if promo.get('max_usos') and promo.get('usos_actuales', 0) >= promo['max_usos']:
                    es_valido = False
                
                # Verificar uso único por cliente
                if promo.get('un_uso_por_cliente'):
                    uso_previo = await promo_usage_collection.find_one({
                        'promo_id': promo['id'],
                        'empresa_id': empresa_id
                    })
                    if uso_previo:
                        es_valido = False
                
                if es_valido:
                    promo_data = promo
                    stripe_promo_code = promo.get('stripe_promo_id')
                    
                    # Calcular descuento
                    if promo.get('descuento_porcentaje'):
                        descuento = precio_final * (promo['descuento_porcentaje'] / 100)
                    else:
                        descuento = promo.get('descuento_fijo', 0)
                    
                    precio_final = max(0, precio_final - descuento)
        
        # Construir URLs dinámicamente
        origin_url = request_data.origin_url.rstrip('/')
        success_url = f"{origin_url}/pago-exitoso?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/precios"
        
        # Crear checkout - si hay código promo de Stripe, crear sesión directamente con Stripe
        stripe.api_key = os.environ.get('STRIPE_API_KEY')
        
        checkout_params = {
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "customer_email": email,
            "line_items": [{
                "price_data": {
                    "currency": "mxn",
                    "unit_amount": int(plan["precio_total"] * 100),  # Stripe usa centavos
                    "product_data": {
                        "name": plan["nombre"],
                        "description": plan["descripcion"]
                    }
                },
                "quantity": 1
            }],
            "metadata": {
                "plan_id": request_data.plan_id,
                "empresa_id": empresa_id,
                "user_id": user_id,
                "email": email,
                "tipo": "suscripcion_mensual",
                "promo_code": request_data.promo_code or ""
            },
            "allow_promotion_codes": True  # Permitir códigos en el checkout de Stripe
        }
        
        # Si tenemos un código promo de Stripe específico, pre-aplicarlo
        if stripe_promo_code:
            checkout_params["discounts"] = [{"promotion_code": stripe_promo_code}]
            checkout_params["allow_promotion_codes"] = False  # Ya aplicamos uno
        
        session = stripe.checkout.Session.create(**checkout_params)
        
        # Crear registro de transacción
        transaction = {
            "session_id": session.id,
            "empresa_id": empresa_id,
            "user_id": user_id,
            "email": email,
            "plan_id": request_data.plan_id,
            "amount": plan["precio_total"],
            "amount_with_discount": precio_final,
            "currency": "MXN",
            "payment_status": "pending",
            "status": "initiated",
            "tipo": "suscripcion_mensual",
            "promo_code": request_data.promo_code if promo_data else None,
            "promo_id": promo_data['id'] if promo_data else None,
            "metadata": {
                "plan_nombre": plan["nombre"],
                "precio_base": plan["precio_base"],
                "iva": plan["precio_base"] * plan["iva_rate"]
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await payment_transactions_collection.insert_one(transaction)
        
        # Si se usó código promo, registrar uso
        if promo_data:
            uso = {
                "id": str(uuid.uuid4()),
                "promo_id": promo_data['id'],
                "promo_code": promo_data['code'],
                "empresa_id": empresa_id,
                "session_id": session.id,
                "status": "pending",  # Se actualizará a 'used' cuando se complete el pago
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await promo_usage_collection.insert_one(uso)
            
            # Incrementar contador de usos
            await promo_codes_collection.update_one(
                {'id': promo_data['id']},
                {'$inc': {'usos_actuales': 1}}
            )
        
        logger.info(f"Checkout creado para empresa {empresa_id} - Session: {session.id}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "amount": plan["precio_total"],
            "amount_with_discount": precio_final if promo_data else None,
            "promo_applied": promo_data['code'] if promo_data else None,
            "currency": "MXN"
        }
        
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
                "tipo": transaction.get('tipo', 'suscripcion_mensual'),
                "mensaje": "¡Pago exitoso! Tu Plan Completo está activo."
            }
        
        # Consultar estado actual en Stripe
        stripe_checkout = get_stripe_checkout(request)
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Actualizar según estado
        new_status = "pending"
        plan_activado = False
        mensaje = "Procesando pago..."
        
        if checkout_status.payment_status == "paid":
            # Verificar que no se haya procesado ya
            existing = await payment_transactions_collection.find_one({
                'session_id': session_id,
                'payment_status': 'paid'
            })
            
            if not existing:
                # Activar plan completo
                update_data = {
                    'plan': 'completo',
                    'cotizaciones_limite': None,
                    'fecha_pago': datetime.now(timezone.utc).isoformat(),
                    'stripe_session_id': session_id,
                    'subscription_status': 'active',
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
                
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
            "tipo": transaction.get('tipo', 'suscripcion_mensual'),
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
            "subscription_status": empresa.get('subscription_status'),
            "ultima_transaccion": {
                "amount": ultima_transaccion.get('amount'),
                "paid_at": ultima_transaccion.get('paid_at'),
                "tipo": ultima_transaccion.get('tipo')
            } if ultima_transaccion else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo suscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
