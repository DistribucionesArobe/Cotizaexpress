from fastapi import APIRouter, HTTPException
from database import (
    cotizaciones_collection, 
    clientes_collection, 
    productos_collection,
    logs_agente_collection
)
from datetime import datetime, timedelta, timezone
import logging

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)

@router.get("/metricas")
async def obtener_metricas():
    """Obtiene métricas principales del dashboard"""
    try:
        # Total cotizaciones
        total_cotizaciones = await cotizaciones_collection.count_documents({})
        
        # Cotizaciones por estado
        pipeline_estados = [
            {'$group': {'_id': '$estado', 'count': {'$sum': 1}}}
        ]
        estados = await cotizaciones_collection.aggregate(pipeline_estados).to_list(10)
        cotizaciones_por_estado = {item['_id']: item['count'] for item in estados}
        
        # Total clientes
        total_clientes = await clientes_collection.count_documents({})
        
        # Total productos
        total_productos = await productos_collection.count_documents({'activo': True})
        
        # Cotizaciones últimos 30 días
        hace_30_dias = datetime.now(timezone.utc) - timedelta(days=30)
        cotizaciones_mes = await cotizaciones_collection.count_documents({
            'created_at': {'$gte': hace_30_dias.isoformat()}
        })
        
        # Valor total cotizado
        pipeline_valor = [
            {'$group': {'_id': None, 'total': {'$sum': '$total'}}}
        ]
        valor_result = await cotizaciones_collection.aggregate(pipeline_valor).to_list(1)
        valor_total = valor_result[0]['total'] if valor_result else 0
        
        # Tasa de conversión
        cotizaciones_ganadas = cotizaciones_por_estado.get('ganada', 0)
        tasa_conversion = (cotizaciones_ganadas / total_cotizaciones * 100) if total_cotizaciones > 0 else 0
        
        # Agentes más usados
        hace_7_dias = datetime.now(timezone.utc) - timedelta(days=7)
        pipeline_agentes = [
            {'$match': {'timestamp': {'$gte': hace_7_dias.isoformat()}}},
            {'$group': {'_id': '$agente', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        agentes_usados = await logs_agente_collection.aggregate(pipeline_agentes).to_list(5)
        
        return {
            'total_cotizaciones': total_cotizaciones,
            'total_clientes': total_clientes,
            'total_productos': total_productos,
            'cotizaciones_mes': cotizaciones_mes,
            'valor_total_cotizado': valor_total,
            'tasa_conversion': round(tasa_conversion, 2),
            'cotizaciones_por_estado': cotizaciones_por_estado,
            'agentes_mas_usados': agentes_usados
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cotizaciones-recientes")
async def obtener_cotizaciones_recientes(limit: int = 10):
    """Obtiene cotizaciones más recientes"""
    try:
        cotizaciones = await cotizaciones_collection.find(
            {},
            {'_id': 0, 'folio': 1, 'cliente_nombre': 1, 'total': 1, 'estado': 1, 'created_at': 1}
        ).sort('created_at', -1).limit(limit).to_list(limit)
        
        return cotizaciones
        
    except Exception as e:
        logger.error(f"Error obteniendo cotizaciones recientes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs-agentes")
async def obtener_logs_agentes(limit: int = 50):
    """Obtiene logs de ejecución de agentes"""
    try:
        logs = await logs_agente_collection.find(
            {},
            {'_id': 0}
        ).sort('timestamp', -1).limit(limit).to_list(limit)
        
        return logs
        
    except Exception as e:
        logger.error(f"Error obteniendo logs de agentes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))