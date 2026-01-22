from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import pandas as pd
import uuid
from datetime import datetime, timezone
from database import productos_collection
import logging
import io

router = APIRouter(prefix="/carga-productos", tags=["carga_productos"])
logger = logging.getLogger(__name__)

@router.post("/upload-excel")
async def cargar_productos_excel(file: UploadFile = File(...)):
    """Carga productos desde un archivo Excel"""
    try:
        # Validar extensión
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Archivo debe ser Excel (.xlsx o .xls)")
        
        # Leer archivo
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas requeridas
        columnas_requeridas = ['nombre', 'categoria', 'precio_base', 'unidad']
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        
        if columnas_faltantes:
            raise HTTPException(
                status_code=400,
                detail=f"Faltan columnas requeridas: {', '.join(columnas_faltantes)}"
            )
        
        # Procesar productos
        productos_insertados = []
        productos_actualizados = []
        errores = []
        
        for index, row in df.iterrows():
            try:
                # Generar SKU si no existe
                sku = row.get('sku', None)
                if not sku or pd.isna(sku):
                    categoria_prefix = str(row['categoria'])[:2].upper()
                    count = await productos_collection.count_documents({'categoria': row['categoria']})
                    sku = f"{categoria_prefix}-{count + 1:03d}"
                
                # Verificar si el producto ya existe por SKU
                producto_existente = await productos_collection.find_one({'sku': sku})
                
                producto_data = {
                    'sku': sku,
                    'nombre': str(row['nombre']),
                    'categoria': str(row['categoria']),
                    'precio_base': float(row['precio_base']),
                    'unidad': str(row['unidad']),
                    'margen_minimo': float(row.get('margen_minimo', 0.15)),
                    'stock': float(row.get('stock', 100)),
                    'activo': bool(row.get('activo', True)),
                    'descripcion': str(row.get('descripcion', '')) if not pd.isna(row.get('descripcion')) else None
                }
                
                if producto_existente:
                    # Actualizar producto existente
                    await productos_collection.update_one(
                        {'sku': sku},
                        {'$set': producto_data}
                    )
                    productos_actualizados.append(sku)
                else:
                    # Insertar nuevo producto
                    producto_data['id'] = str(uuid.uuid4())
                    producto_data['created_at'] = datetime.now(timezone.utc).isoformat()
                    await productos_collection.insert_one(producto_data)
                    productos_insertados.append(sku)
                    
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")
        
        return {
            'success': True,
            'productos_insertados': len(productos_insertados),
            'productos_actualizados': len(productos_actualizados),
            'errores': errores,
            'detalles': {
                'insertados': productos_insertados,
                'actualizados': productos_actualizados
            }
        }
        
    except Exception as e:
        logger.error(f"Error cargando productos desde Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/template")
async def descargar_template():
    """Genera y descarga template de Excel para carga de productos"""
    try:
        # Crear DataFrame con columnas de ejemplo
        template_data = {
            'sku': ['TB-001', 'FE-001'],
            'nombre': ['Tablaroca antimoho USG', 'Broca SDS 1/4"'],
            'categoria': ['Tablaroca', 'Ferreteria'],
            'precio_base': [340.10, 32.00],
            'unidad': ['Pieza', 'Pieza'],
            'margen_minimo': [0.15, 0.15],
            'stock': [100, 50],
            'activo': [True, True],
            'descripcion': ['Placa antimoho para áreas húmedas', 'Broca para rotomartillo']
        }
        
        df = pd.DataFrame(template_data)
        
        # Guardar en archivo temporal
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Productos')
        
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename=template_productos.xlsx'}
        )
        
    except Exception as e:
        logger.error(f"Error generando template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/todos")
async def eliminar_todos_productos():
    """Elimina todos los productos (usar con precaución)"""
    try:
        result = await productos_collection.delete_many({})
        return {
            'success': True,
            'productos_eliminados': result.deleted_count
        }
    except Exception as e:
        logger.error(f"Error eliminando productos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
