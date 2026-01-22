from fastapi import APIRouter, HTTPException
from typing import List
from database import clientes_collection, cotizaciones_collection
from models.cliente import Cliente, ClienteCreate
import uuid
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/clientes", tags=["clientes"])
logger = logging.getLogger(__name__)

@router.get("", response_model=List[Cliente])
async def listar_clientes(limit: int = 100):
    """Lista todos los clientes"""
    try:
        clientes = await clientes_collection.find(
            {},
            {'_id': 0}
        ).sort('created_at', -1).limit(limit).to_list(limit)
        
        for cliente in clientes:
            if isinstance(cliente.get('created_at'), str):
                cliente['created_at'] = datetime.fromisoformat(cliente['created_at'])
        
        return clientes
        
    except Exception as e:
        logger.error(f"Error listando clientes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{cliente_id}", response_model=Cliente)
async def obtener_cliente(cliente_id: str):
    """Obtiene un cliente por ID"""
    try:
        cliente = await clientes_collection.find_one(
            {'id': cliente_id},
            {'_id': 0}
        )
        
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        if isinstance(cliente.get('created_at'), str):
            cliente['created_at'] = datetime.fromisoformat(cliente['created_at'])
        
        return cliente
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Cliente)
async def crear_cliente(cliente_data: ClienteCreate):
    """Crea un nuevo cliente"""
    try:
        # Verificar si ya existe
        existe = await clientes_collection.find_one({'telefono': cliente_data.telefono})
        if existe:
            raise HTTPException(status_code=400, detail="Cliente ya existe con ese teléfono")
        
        # Crear cliente
        cliente = Cliente(
            id=str(uuid.uuid4()),
            **cliente_data.model_dump()
        )
        
        # Guardar en BD
        doc = cliente.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await clientes_collection.insert_one(doc)
        
        logger.info(f"Cliente creado: {cliente.telefono}")
        
        return cliente
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{cliente_id}/cotizaciones")
async def obtener_cotizaciones_cliente(cliente_id: str):
    """Obtiene cotizaciones de un cliente"""
    try:
        cotizaciones = await cotizaciones_collection.find(
            {'cliente_id': cliente_id},
            {'_id': 0}
        ).sort('created_at', -1).to_list(100)
        
        return cotizaciones
        
    except Exception as e:
        logger.error(f"Error obteniendo cotizaciones de cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))