from fastapi import APIRouter, HTTPException
from typing import List
from database import conversaciones_collection, mensajes_collection
from models.mensaje import Mensaje
from datetime import datetime
import logging

router = APIRouter(prefix="/conversaciones", tags=["conversaciones"])
logger = logging.getLogger(__name__)

@router.get("")
async def listar_conversaciones(limit: int = 50):
    """Lista conversaciones recientes"""
    try:
        conversaciones = await conversaciones_collection.find(
            {},
            {'_id': 0}
        ).sort('updated_at', -1).limit(limit).to_list(limit)
        
        return conversaciones
        
    except Exception as e:
        logger.error(f"Error listando conversaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversacion_id}/mensajes", response_model=List[Mensaje])
async def obtener_mensajes_conversacion(conversacion_id: str, limit: int = 100):
    """Obtiene mensajes de una conversación"""
    try:
        mensajes = await mensajes_collection.find(
            {'conversacion_id': conversacion_id},
            {'_id': 0}
        ).sort('timestamp', 1).limit(limit).to_list(limit)
        
        for msg in mensajes:
            if isinstance(msg.get('timestamp'), str):
                msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
        
        return mensajes
        
    except Exception as e:
        logger.error(f"Error obteniendo mensajes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))