from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from database import cotizaciones_collection, clientes_collection, db
from models.cotizacion import Cotizacion, CotizacionCreate, EstadoCotizacion, ItemCotizacion
from services.pdf_service import pdf_service
from services.whatsapp_service import whatsapp_service
from services.email_service import email_service
from utils.auth import get_current_user
from config import settings
import uuid
from datetime import datetime, timedelta, timezone
import logging
import os

router = APIRouter(prefix="/cotizaciones", tags=["cotizaciones"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')

class EnviarCotizacionRequest(BaseModel):
    cotizacion_id: str
    enviar_email: bool = True
    email_destinatario: Optional[EmailStr] = None  # Si no se proporciona, usa email del cliente

async def verificar_limite_cotizaciones(empresa_id: str):
    """Verifica si la empresa puede crear más cotizaciones según su plan"""
    empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    plan = empresa.get('plan', 'gratis')
    
    # Plan completo: sin límite
    if plan == 'completo':
        return True
    
    # Plan gratis: verificar límite
    cotizaciones_usadas = empresa.get('cotizaciones_usadas', 0)
    cotizaciones_limite = empresa.get('cotizaciones_limite', 5)
    
    if cotizaciones_usadas >= cotizaciones_limite:
        raise HTTPException(
            status_code=403,
            detail=f"Has alcanzado el límite de {cotizaciones_limite} cotizaciones del plan gratuito. Actualiza a Plan Completo para cotizaciones ilimitadas."
        )
    
    return True

async def incrementar_cotizaciones(empresa_id: str):
    """Incrementa el contador de cotizaciones de la empresa"""
    await empresas_collection.update_one(
        {'id': empresa_id},
        {'$inc': {'cotizaciones_usadas': 1}}
    )

@router.get("", response_model=List[Cotizacion])
async def listar_cotizaciones(
    estado: Optional[str] = None, 
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lista todas las cotizaciones de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        filtro = {'empresa_id': empresa_id} if empresa_id else {}
        
        if estado:
            filtro['estado'] = estado
        
        cotizaciones = await cotizaciones_collection.find(
            filtro,
            {'_id': 0}
        ).sort('created_at', -1).limit(limit).to_list(limit)
        
        # Convertir strings ISO a datetime
        for cot in cotizaciones:
            if isinstance(cot.get('created_at'), str):
                cot['created_at'] = datetime.fromisoformat(cot['created_at'])
            if isinstance(cot.get('updated_at'), str):
                cot['updated_at'] = datetime.fromisoformat(cot['updated_at'])
            if isinstance(cot.get('valida_hasta'), str):
                cot['valida_hasta'] = datetime.fromisoformat(cot['valida_hasta'])
        
        return cotizaciones
        
    except Exception as e:
        logger.error(f"Error listando cotizaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/estadisticas")
async def obtener_estadisticas_cotizaciones(current_user: dict = Depends(get_current_user)):
    """Obtiene estadísticas de cotizaciones para el dashboard"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Obtener info de la empresa
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        
        plan = empresa.get('plan', 'gratis') if empresa else 'gratis'
        cotizaciones_usadas = empresa.get('cotizaciones_usadas', 0) if empresa else 0
        cotizaciones_limite = empresa.get('cotizaciones_limite', 5) if empresa else 5
        
        return {
            'plan': plan,
            'cotizaciones_usadas': cotizaciones_usadas,
            'cotizaciones_limite': cotizaciones_limite if plan == 'gratis' else None,
            'cotizaciones_restantes': (cotizaciones_limite - cotizaciones_usadas) if plan == 'gratis' else None
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{cotizacion_id}", response_model=Cotizacion)
async def obtener_cotizacion(cotizacion_id: str, current_user: dict = Depends(get_current_user)):
    """Obtiene una cotización por ID"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        cotizacion = await cotizaciones_collection.find_one(
            {'id': cotizacion_id, 'empresa_id': empresa_id},
            {'_id': 0}
        )
        
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        # Convertir strings a datetime
        if isinstance(cotizacion.get('created_at'), str):
            cotizacion['created_at'] = datetime.fromisoformat(cotizacion['created_at'])
        if isinstance(cotizacion.get('updated_at'), str):
            cotizacion['updated_at'] = datetime.fromisoformat(cotizacion['updated_at'])
        if isinstance(cotizacion.get('valida_hasta'), str):
            cotizacion['valida_hasta'] = datetime.fromisoformat(cotizacion['valida_hasta'])
        
        return cotizacion
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Cotizacion)
async def crear_cotizacion(cotizacion_data: CotizacionCreate, current_user: dict = Depends(get_current_user)):
    """Crea una nueva cotización"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Verificar límite de cotizaciones
        await verificar_limite_cotizaciones(empresa_id)
        
        # Buscar o crear cliente
        cliente = await clientes_collection.find_one(
            {'telefono': cotizacion_data.cliente_telefono, 'empresa_id': empresa_id}
        )
        
        if not cliente:
            cliente_id = str(uuid.uuid4())
            cliente = {
                'id': cliente_id,
                'telefono': cotizacion_data.cliente_telefono,
                'nombre': cotizacion_data.cliente_nombre,
                'empresa_id': empresa_id,
                'total_cotizaciones': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await clientes_collection.insert_one(cliente)
        else:
            cliente_id = cliente['id']
        
        # Calcular totales
        items = [item.model_dump() for item in cotizacion_data.items]
        subtotal = sum(item['subtotal'] for item in items)
        iva = subtotal * settings.iva_rate
        total = subtotal + iva
        margen = subtotal * 0.30  # Asumir 30% de margen
        
        # Generar folio
        folio = f"COT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Crear cotización
        cotizacion = Cotizacion(
            id=str(uuid.uuid4()),
            folio=folio,
            cliente_id=cliente_id,
            cliente_nombre=cotizacion_data.cliente_nombre,
            cliente_telefono=cotizacion_data.cliente_telefono,
            empresa_id=empresa_id,
            items=items,
            subtotal=subtotal,
            iva=iva,
            total=total,
            margen=margen,
            estado=EstadoCotizacion.BORRADOR,
            valida_hasta=datetime.now(timezone.utc) + timedelta(days=15),
            notas=cotizacion_data.notas
        )
        
        # Guardar en BD
        doc = cotizacion.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        doc['valida_hasta'] = doc['valida_hasta'].isoformat()
        
        await cotizaciones_collection.insert_one(doc)
        
        # Actualizar contador del cliente
        await clientes_collection.update_one(
            {'id': cliente_id},
            {'$inc': {'total_cotizaciones': 1}}
        )
        
        # Incrementar contador de cotizaciones de la empresa
        await incrementar_cotizaciones(empresa_id)
        
        logger.info(f"Cotización creada: {folio} para empresa {empresa_id}")
        
        return cotizacion
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enviar")
async def enviar_cotizacion(request: EnviarCotizacionRequest, current_user: dict = Depends(get_current_user)):
    """Genera PDF y envía cotización por WhatsApp y/o Email"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Obtener cotización
        cotizacion = await cotizaciones_collection.find_one(
            {'id': request.cotizacion_id, 'empresa_id': empresa_id},
            {'_id': 0}
        )
        
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        # Obtener empresa para el logo
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        
        # Convertir fechas
        if isinstance(cotizacion.get('valida_hasta'), str):
            cotizacion['valida_hasta'] = datetime.fromisoformat(cotizacion['valida_hasta'])
        
        # Generar PDF con logo de empresa
        pdf_path = await pdf_service.generar_cotizacion_pdf(cotizacion, empresa_id)
        
        resultados = {
            'pdf_generado': True,
            'pdf_path': pdf_path
        }
        
        # Enviar por Email si se solicita
        if request.enviar_email:
            # Determinar email destinatario
            email_destino = request.email_destinatario
            
            if not email_destino:
                # Buscar email del cliente
                cliente = await clientes_collection.find_one(
                    {'id': cotizacion.get('cliente_id')},
                    {'_id': 0}
                )
                email_destino = cliente.get('email') if cliente else None
            
            if email_destino:
                # Formatear fecha para el email
                cotizacion_email = dict(cotizacion)
                if isinstance(cotizacion_email.get('valida_hasta'), datetime):
                    cotizacion_email['valida_hasta'] = cotizacion_email['valida_hasta'].strftime('%d/%m/%Y')
                
                email_result = await email_service.enviar_cotizacion(
                    cotizacion=cotizacion_email,
                    pdf_path=pdf_path,
                    destinatario_email=email_destino,
                    empresa=empresa
                )
                resultados['email'] = email_result
            else:
                resultados['email'] = {
                    'success': False,
                    'error': 'No se encontró email del cliente'
                }
        
        # Enviar por WhatsApp (mantener funcionalidad existente)
        mensaje = f"Hola {cotizacion['cliente_nombre']}, aquí está tu cotización {cotizacion['folio']} por un total de ${cotizacion['total']:.2f} MXN."
        
        resultado_whatsapp = await whatsapp_service.enviar_mensaje(
            to_number=cotizacion['cliente_telefono'],
            body=mensaje,
            media_url=None  # PDF requiere URL pública
        )
        resultados['whatsapp'] = resultado_whatsapp
        
        # Actualizar estado de la cotización
        await cotizaciones_collection.update_one(
            {'id': request.cotizacion_id},
            {
                '$set': {
                    'estado': EstadoCotizacion.ENVIADA.value,
                    'pdf_url': pdf_path,
                    'enviado_email': request.enviar_email and resultados.get('email', {}).get('success', False),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            'success': True,
            'mensaje': 'Cotización enviada',
            **resultados
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
        # Enviar por WhatsApp
        mensaje = f"Hola {cotizacion['cliente_nombre']}, aquí está tu cotización {cotizacion['folio']} por un total de ${cotizacion['total']:.2f} MXN. Válida hasta {cotizacion['valida_hasta'].strftime('%d/%m/%Y')}."
        
        resultado_envio = await whatsapp_service.enviar_mensaje(
            to_number=cotizacion['cliente_telefono'],
            body=mensaje,
            media_url=None  # PDF requiere URL pública
        )
        
        # Actualizar estado
        await cotizaciones_collection.update_one(
            {'id': request.cotizacion_id},
            {
                '$set': {
                    'estado': EstadoCotizacion.ENVIADA.value,
                    'pdf_url': pdf_path,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            'success': True,
            'mensaje': 'Cotización enviada',
            'pdf_path': pdf_path,
            'whatsapp_result': resultado_envio
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
