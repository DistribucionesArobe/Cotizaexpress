from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from database import productos_collection
from models.producto import Producto, ProductoCreate
from utils.auth import get_current_user
import uuid
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/productos", tags=["productos"])
logger = logging.getLogger(__name__)

@router.get("", response_model=List[Producto])
async def listar_productos(
    categoria: Optional[str] = None, 
    activo: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Lista productos del catálogo de la empresa del usuario"""
    try:
        empresa_id = current_user.get('empresa_id')
        plan = current_user.get('plan', 'pendiente')
        
        # Filtro para productos de la empresa
        filtro = {'activo': activo, 'empresa_id': empresa_id}
        if categoria:
            filtro['categoria'] = categoria
        
        productos = await productos_collection.find(
            filtro,
            {'_id': 0}
        ).sort('categoria', 1).to_list(500)
        
        # Solo mostrar catálogo demo si:
        # 1. No tiene productos propios
        # 2. NO tiene plan completo (los de plan completo deben cargar sus propios productos)
        # 3. No está filtrando por categoría
        es_demo = False
        if len(productos) == 0 and not categoria and plan != 'completo':
            filtro_demo = {'activo': activo, 'empresa_id': 'demo'}
            productos = await productos_collection.find(
                filtro_demo,
                {'_id': 0}
            ).sort('categoria', 1).to_list(200)
            es_demo = True
        
        for prod in productos:
            if isinstance(prod.get('created_at'), str):
                prod['created_at'] = datetime.fromisoformat(prod['created_at'])
            # Marcar si es producto demo
            prod['es_demo'] = es_demo or prod.get('empresa_id') == 'demo'
        
        return productos
        
        for prod in productos:
            if isinstance(prod.get('created_at'), str):
                prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        
        return productos
        
    except Exception as e:
        logger.error(f"Error listando productos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categorias")
async def listar_categorias(current_user: dict = Depends(get_current_user)):
    """Lista todas las categorías únicas de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Obtener categorías de productos de esta empresa
        pipeline = [
            {'$match': {'empresa_id': empresa_id}},
            {'$group': {'_id': '$categoria'}},
            {'$sort': {'_id': 1}}
        ]
        
        result = await productos_collection.aggregate(pipeline).to_list(50)
        categorias = [r['_id'] for r in result if r['_id']]
        
        # Si no tiene categorías propias, mostrar las del demo
        if len(categorias) == 0:
            pipeline_demo = [
                {'$match': {'empresa_id': 'demo'}},
                {'$group': {'_id': '$categoria'}},
                {'$sort': {'_id': 1}}
            ]
            result = await productos_collection.aggregate(pipeline_demo).to_list(50)
            categorias = [r['_id'] for r in result if r['_id']]
        
        return {'categorias': categorias}
        
    except Exception as e:
        logger.error(f"Error listando categorías: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
async def contar_productos(current_user: dict = Depends(get_current_user)):
    """Cuenta productos de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        count = await productos_collection.count_documents({'empresa_id': empresa_id, 'activo': True})
        return {'count': count, 'empresa_id': empresa_id}
    except Exception as e:
        logger.error(f"Error contando productos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{producto_id}", response_model=Producto)
async def obtener_producto(producto_id: str, current_user: dict = Depends(get_current_user)):
    """Obtiene un producto por ID"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        producto = await productos_collection.find_one(
            {'id': producto_id, 'empresa_id': empresa_id},
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
async def crear_producto(producto_data: ProductoCreate, current_user: dict = Depends(get_current_user)):
    """Crea un nuevo producto para la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Generar SKU si no se proporciona
        if not producto_data.sku:
            categoria_prefix = producto_data.categoria[:2].upper()
            count = await productos_collection.count_documents({
                'categoria': producto_data.categoria,
                'empresa_id': empresa_id
            })
            sku = f"{categoria_prefix}-{count + 1:03d}"
        else:
            sku = producto_data.sku
        
        # Verificar SKU único en esta empresa
        existe = await productos_collection.find_one({'sku': sku, 'empresa_id': empresa_id})
        if existe:
            raise HTTPException(status_code=400, detail="SKU ya existe")
        
        # Crear producto
        producto = Producto(
            id=str(uuid.uuid4()),
            sku=sku,
            **producto_data.model_dump(exclude={'sku'})
        )
        
        # Guardar en BD con empresa_id
        doc = producto.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['empresa_id'] = empresa_id
        
        await productos_collection.insert_one(doc)
        
        logger.info(f"Producto creado: {sku} para empresa {empresa_id}")
        
        return producto
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{producto_id}")
async def actualizar_producto(
    producto_id: str, 
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza un producto de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Solo permitir actualizar ciertos campos
        campos_permitidos = ['precio_base', 'stock', 'activo', 'descripcion', 'margen_minimo']
        update_filtrado = {k: v for k, v in update_data.items() if k in campos_permitidos}
        
        if not update_filtrado:
            raise HTTPException(status_code=400, detail="No hay campos válidos para actualizar")
        
        resultado = await productos_collection.update_one(
            {'id': producto_id, 'empresa_id': empresa_id},
            {'$set': update_filtrado}
        )
        
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        return {'success': True, 'message': 'Producto actualizado', 'campos': list(update_filtrado.keys())}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ActualizarPrecioRequest(BaseModel):
    precio_base: float


@router.patch("/{producto_id}/precio")
async def actualizar_precio(
    producto_id: str,
    request: ActualizarPrecioRequest,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza solo el precio de un producto. Si es demo, crea una copia para la empresa."""
    try:
        empresa_id = current_user.get('empresa_id')
        
        if request.precio_base <= 0:
            raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
        
        # Primero intentar actualizar producto propio de la empresa
        resultado = await productos_collection.update_one(
            {'id': producto_id, 'empresa_id': empresa_id},
            {'$set': {'precio_base': request.precio_base}}
        )
        
        if resultado.matched_count > 0:
            logger.info(f"Precio actualizado para producto propio {producto_id}: ${request.precio_base}")
            return {
                'success': True,
                'producto_id': producto_id,
                'nuevo_precio': request.precio_base
            }
        
        # Si no encontró producto propio, buscar en demo y crear copia
        producto_demo = await productos_collection.find_one(
            {'id': producto_id, 'empresa_id': 'demo'},
            {'_id': 0}
        )
        
        if producto_demo:
            # Crear copia del producto demo para esta empresa con el nuevo precio
            nuevo_producto = producto_demo.copy()
            nuevo_producto['id'] = str(uuid.uuid4())
            nuevo_producto['empresa_id'] = empresa_id
            nuevo_producto['precio_base'] = request.precio_base
            nuevo_producto['created_at'] = datetime.now(timezone.utc).isoformat()
            nuevo_producto['demo_origin_id'] = producto_id  # Referencia al original
            
            # Generar nuevo SKU para la empresa
            categoria_prefix = str(nuevo_producto.get('categoria', 'PR'))[:2].upper()
            count = await productos_collection.count_documents({
                'categoria': nuevo_producto.get('categoria'),
                'empresa_id': empresa_id
            })
            nuevo_producto['sku'] = f"{categoria_prefix}-{count + 1:03d}"
            
            await productos_collection.insert_one(nuevo_producto)
            
            logger.info(f"Producto demo copiado a empresa {empresa_id} con nuevo precio ${request.precio_base}")
            return {
                'success': True,
                'producto_id': nuevo_producto['id'],
                'nuevo_precio': request.precio_base,
                'mensaje': 'Producto personalizado creado'
            }
        
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando precio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ActualizarStockRequest(BaseModel):
    stock: float


@router.patch("/{producto_id}/stock")
async def actualizar_stock(
    producto_id: str,
    request: ActualizarStockRequest,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza el stock de un producto"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        if request.stock < 0:
            raise HTTPException(status_code=400, detail="El stock no puede ser negativo")
        
        resultado = await productos_collection.update_one(
            {'id': producto_id, 'empresa_id': empresa_id},
            {'$set': {'stock': request.stock}}
        )
        
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        logger.info(f"Stock actualizado para producto {producto_id}: {request.stock}")
        
        return {
            'success': True,
            'producto_id': producto_id,
            'nuevo_stock': request.stock
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{producto_id}")
async def eliminar_producto(
    producto_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Elimina un producto del catálogo de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Solo eliminar productos de la empresa del usuario (no demos)
        resultado = await productos_collection.delete_one({
            'id': producto_id,
            'empresa_id': empresa_id
        })
        
        if resultado.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado o no tienes permiso para eliminarlo")
        
        logger.info(f"Producto {producto_id} eliminado por empresa {empresa_id}")
        
        return {
            'success': True,
            'mensaje': 'Producto eliminado correctamente'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando producto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))