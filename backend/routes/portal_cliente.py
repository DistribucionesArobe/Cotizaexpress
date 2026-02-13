"""
Rutas para el Portal del Cliente
Permite a los clientes finales ver sus cotizaciones mediante enlaces únicos
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from database import db
from datetime import datetime, timezone
import uuid
import logging
import hashlib
import os

router = APIRouter(prefix="/portal", tags=["portal-cliente"])
logger = logging.getLogger(__name__)

cotizaciones_collection = db.get_collection('cotizaciones')if db is not None else None
clientes_collection = db.get_collection('clientes')if db is not None else None
empresas_collection = db.get_collection('empresas')if db is not None else None
portal_tokens_collection = db.get_collection('portal_tokens')if db is not None else None


def generar_token_portal(cotizacion_id: str, cliente_id: str) -> str:
    """Genera un token único para acceder a una cotización"""
    data = f"{cotizacion_id}:{cliente_id}:{datetime.now(timezone.utc).isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]


@router.get("/cotizacion/{token}")
async def ver_cotizacion_publica(token: str):
    """
    Obtiene una cotización mediante token público.
    No requiere autenticación - acceso mediante enlace único.
    """
    try:
        # Buscar token válido
        token_doc = await portal_tokens_collection.find_one(
            {'token': token, 'tipo': 'cotizacion'},
            {'_id': 0}
        )
        
        if not token_doc:
            raise HTTPException(status_code=404, detail="Enlace no válido o expirado")
        
        # Verificar si ha expirado (30 días)
        created_at = datetime.fromisoformat(token_doc['created_at'])
        if (datetime.now(timezone.utc) - created_at).days > 30:
            raise HTTPException(status_code=410, detail="Este enlace ha expirado")
        
        cotizacion_id = token_doc.get('cotizacion_id')
        
        # Obtener cotización
        cotizacion = await cotizaciones_collection.find_one(
            {'id': cotizacion_id},
            {'_id': 0}
        )
        
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        # Obtener datos de la empresa emisora
        empresa = await empresas_collection.find_one(
            {'id': cotizacion.get('empresa_id')},
            {'_id': 0, 'nombre': 1, 'logo_url': 1, 'telefono': 1, 'email': 1}
        )
        
        # Registrar visualización
        await portal_tokens_collection.update_one(
            {'token': token},
            {
                '$inc': {'visualizaciones': 1},
                '$set': {'ultima_visualizacion': datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Preparar respuesta (sin datos sensibles)
        return {
            "cotizacion": {
                "folio": cotizacion.get('folio'),
                "cliente_nombre": cotizacion.get('cliente_nombre'),
                "items": cotizacion.get('items'),
                "subtotal": cotizacion.get('subtotal'),
                "iva": cotizacion.get('iva'),
                "total": cotizacion.get('total'),
                "estado": cotizacion.get('estado'),
                "valida_hasta": cotizacion.get('valida_hasta'),
                "notas": cotizacion.get('notas'),
                "created_at": cotizacion.get('created_at')
            },
            "empresa": empresa,
            "token_valido": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo cotización pública: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al cargar la cotización")


@router.get("/cotizacion/{token}/pdf")
async def descargar_pdf_publico(token: str):
    """Descarga el PDF de una cotización mediante token público"""
    try:
        # Verificar token
        token_doc = await portal_tokens_collection.find_one(
            {'token': token, 'tipo': 'cotizacion'},
            {'_id': 0}
        )
        
        if not token_doc:
            raise HTTPException(status_code=404, detail="Enlace no válido")
        
        cotizacion_id = token_doc.get('cotizacion_id')
        
        # Obtener cotización
        cotizacion = await cotizaciones_collection.find_one(
            {'id': cotizacion_id},
            {'_id': 0, 'pdf_url': 1, 'folio': 1}
        )
        
        if not cotizacion or not cotizacion.get('pdf_url'):
            raise HTTPException(status_code=404, detail="PDF no disponible")
        
        pdf_path = cotizacion['pdf_url']
        
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="Archivo PDF no encontrado")
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"Cotizacion_{cotizacion['folio']}.pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error descargando PDF público: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al descargar PDF")


@router.get("/cliente/{token_cliente}")
async def ver_cotizaciones_cliente(token_cliente: str):
    """
    Obtiene todas las cotizaciones de un cliente mediante token único.
    Permite al cliente ver su historial de cotizaciones.
    """
    try:
        # Buscar token de cliente
        token_doc = await portal_tokens_collection.find_one(
            {'token': token_cliente, 'tipo': 'cliente'},
            {'_id': 0}
        )
        
        if not token_doc:
            raise HTTPException(status_code=404, detail="Enlace no válido")
        
        cliente_id = token_doc.get('cliente_id')
        empresa_id = token_doc.get('empresa_id')
        
        # Obtener cliente
        cliente = await clientes_collection.find_one(
            {'id': cliente_id},
            {'_id': 0, 'nombre': 1, 'telefono': 1, 'email': 1}
        )
        
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Obtener cotizaciones del cliente
        cotizaciones = await cotizaciones_collection.find(
            {'cliente_id': cliente_id, 'empresa_id': empresa_id},
            {'_id': 0}
        ).sort('created_at', -1).to_list(50)
        
        # Simplificar cotizaciones
        cotizaciones_resumen = []
        for cot in cotizaciones:
            cotizaciones_resumen.append({
                "folio": cot.get('folio'),
                "total": cot.get('total'),
                "estado": cot.get('estado'),
                "items_count": len(cot.get('items', [])),
                "created_at": cot.get('created_at'),
                "valida_hasta": cot.get('valida_hasta')
            })
        
        # Obtener empresa
        empresa = await empresas_collection.find_one(
            {'id': empresa_id},
            {'_id': 0, 'nombre': 1, 'logo_url': 1, 'telefono': 1, 'email': 1}
        )
        
        return {
            "cliente": cliente,
            "empresa": empresa,
            "cotizaciones": cotizaciones_resumen,
            "total_cotizaciones": len(cotizaciones_resumen)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo cotizaciones de cliente: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al cargar cotizaciones")


# Endpoint interno para generar tokens de portal
@router.post("/generar-enlace")
async def generar_enlace_cotizacion(
    cotizacion_id: str,
    empresa_id: str
):
    """
    Genera un enlace público para compartir una cotización.
    Este endpoint es llamado internamente al enviar cotizaciones.
    """
    try:
        # Verificar que la cotización existe
        cotizacion = await cotizaciones_collection.find_one(
            {'id': cotizacion_id, 'empresa_id': empresa_id},
            {'_id': 0, 'cliente_id': 1}
        )
        
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        # Verificar si ya existe un token
        existing = await portal_tokens_collection.find_one(
            {'cotizacion_id': cotizacion_id, 'tipo': 'cotizacion'},
            {'_id': 0}
        )
        
        if existing:
            return {
                "token": existing['token'],
                "enlace": f"/portal/cotizacion/{existing['token']}",
                "existente": True
            }
        
        # Generar nuevo token
        token = generar_token_portal(cotizacion_id, cotizacion.get('cliente_id', ''))
        
        token_doc = {
            "id": str(uuid.uuid4()),
            "token": token,
            "tipo": "cotizacion",
            "cotizacion_id": cotizacion_id,
            "cliente_id": cotizacion.get('cliente_id'),
            "empresa_id": empresa_id,
            "visualizaciones": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await portal_tokens_collection.insert_one(token_doc)
        
        logger.info(f"Enlace de portal generado para cotización {cotizacion_id}")
        
        return {
            "token": token,
            "enlace": f"/portal/cotizacion/{token}",
            "existente": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando enlace: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generar-enlace-cliente")
async def generar_enlace_cliente(
    cliente_id: str,
    empresa_id: str
):
    """
    Genera un enlace para que un cliente vea todas sus cotizaciones.
    """
    try:
        # Verificar que el cliente existe
        cliente = await clientes_collection.find_one(
            {'id': cliente_id},
            {'_id': 0}
        )
        
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Verificar si ya existe un token
        existing = await portal_tokens_collection.find_one(
            {'cliente_id': cliente_id, 'empresa_id': empresa_id, 'tipo': 'cliente'},
            {'_id': 0}
        )
        
        if existing:
            return {
                "token": existing['token'],
                "enlace": f"/portal/cliente/{existing['token']}",
                "existente": True
            }
        
        # Generar nuevo token
        token = generar_token_portal(cliente_id, empresa_id)
        
        token_doc = {
            "id": str(uuid.uuid4()),
            "token": token,
            "tipo": "cliente",
            "cliente_id": cliente_id,
            "empresa_id": empresa_id,
            "visualizaciones": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await portal_tokens_collection.insert_one(token_doc)
        
        logger.info(f"Enlace de portal generado para cliente {cliente_id}")
        
        return {
            "token": token,
            "enlace": f"/portal/cliente/{token}",
            "existente": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando enlace de cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
