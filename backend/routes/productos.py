from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import productos_collection
from models.producto import Producto, ProductoCreate
import uuid
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/productos", tags=["productos"])
logger = logging.getLogger(__name__)

@router.get("", response_model=List[Producto])
async def listar_productos(categoria: Optional[str] = None, activo: bool = True):
    """Lista productos del catálogo"""
    try:
        filtro = {'activo': activo}
        if categoria:
            filtro['categoria'] = categoria
        
        productos = await productos_collection.find(
            filtro,
            {'_id': 0}
        ).sort('categoria', 1).to_list(200)
        
        for prod in productos:
            if isinstance(prod.get('created_at'), str):
                prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        
        return productos
        
    except Exception as e:
        logger.error(f"Error listando productos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categorias")
async def listar_categorias():
    """Lista todas las categorías únicas"""
    try:
        categorias = await productos_collection.distinct('categoria')
        return {'categorias': categorias}
        
    except Exception as e:
        logger.error(f"Error listando categorías: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{producto_id}", response_model=Producto)
async def obtener_producto(producto_id: str):
    """Obtiene un producto por ID"""
    try:
        producto = await productos_collection.find_one(
            {'id': producto_id},
            {'_id': 0}
        )
        
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        if isinstance(producto.get('created_at'), str):
            producto['created_at'] = datetime.fromisoformat(producto['created_at'])
        
        return producto
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Producto)
async def crear_producto(producto_data: ProductoCreate):
    """Crea un nuevo producto"""
    try:
        # Generar SKU si no se proporciona
        if not producto_data.sku:
            categoria_prefix = producto_data.categoria[:2].upper()
            count = await productos_collection.count_documents({'categoria': producto_data.categoria})
            sku = f"{categoria_prefix}-{count + 1:03d}"
        else:
            sku = producto_data.sku
        
        # Verificar SKU único
        existe = await productos_collection.find_one({'sku': sku})
        if existe:
            raise HTTPException(status_code=400, detail="SKU ya existe")
        
        # Crear producto
        producto = Producto(
            id=str(uuid.uuid4()),
            sku=sku,
            **producto_data.model_dump(exclude={'sku'})
        )
        
        # Guardar en BD
        doc = producto.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await productos_collection.insert_one(doc)
        
        logger.info(f"Producto creado: {sku}")
        
        return producto
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{producto_id}")
async def actualizar_producto(producto_id: str, update_data: dict):
    """Actualiza un producto"""
    try:
        resultado = await productos_collection.update_one(
            {'id': producto_id},
            {'$set': update_data}
        )
        
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        return {'success': True, 'message': 'Producto actualizado'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))