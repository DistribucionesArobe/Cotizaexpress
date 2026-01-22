from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import cotizaciones_collection, clientes_collection
from models.cotizacion import Cotizacion, CotizacionCreate, EstadoCotizacion, ItemCotizacion
from services.pdf_service import pdf_service
from services.whatsapp_service import whatsapp_service
from config import settings
import uuid
from datetime import datetime, timedelta, timezone
import logging
import os

router = APIRouter(prefix="/cotizaciones", tags=["cotizaciones"])
logger = logging.getLogger(__name__)

class EnviarCotizacionRequest(BaseModel):
    cotizacion_id: str

@router.get("", response_model=List[Cotizacion])
async def listar_cotizaciones(estado: Optional[str] = None, limit: int = 50):
    """Lista todas las cotizaciones"""
    try:
        filtro = {}
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

@router.get("/{cotizacion_id}", response_model=Cotizacion)
async def obtener_cotizacion(cotizacion_id: str):
    """Obtiene una cotización por ID"""
    try:
        cotizacion = await cotizaciones_collection.find_one(
            {'id': cotizacion_id},
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
async def crear_cotizacion(cotizacion_data: CotizacionCreate):
    """Crea una nueva cotización"""
    try:
        # Buscar o crear cliente
        cliente = await clientes_collection.find_one(
            {'telefono': cotizacion_data.cliente_telefono}
        )
        
        if not cliente:
            cliente_id = str(uuid.uuid4())
            cliente = {
                'id': cliente_id,
                'telefono': cotizacion_data.cliente_telefono,
                'nombre': cotizacion_data.cliente_nombre,
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
        
        logger.info(f"Cotización creada: {folio}")
        
        return cotizacion
        
    except Exception as e:
        logger.error(f"Error creando cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enviar")
async def enviar_cotizacion(request: EnviarCotizacionRequest):
    """Genera PDF y envía cotización por WhatsApp"""
    try:
        # Obtener cotización
        cotizacion = await cotizaciones_collection.find_one(
            {'id': request.cotizacion_id},
            {'_id': 0}
        )
        
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        # Convertir fechas
        if isinstance(cotizacion.get('valida_hasta'), str):
            cotizacion['valida_hasta'] = datetime.fromisoformat(cotizacion['valida_hasta'])
        
        # Generar PDF
        pdf_path = await pdf_service.generar_cotizacion_pdf(cotizacion)
        
        # En producción, subir a S3/CloudFront y obtener URL pública
        # Por ahora, usamos path local
        pdf_url = f"file://{pdf_path}"
        
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
        
    except Exception as e:
        logger.error(f"Error enviando cotización: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))