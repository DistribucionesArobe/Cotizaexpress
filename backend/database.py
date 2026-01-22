from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

# Collections
productos_collection = db.get_collection('productos')
clientes_collection = db.get_collection('clientes')
cotizaciones_collection = db.get_collection('cotizaciones')
conversaciones_collection = db.get_collection('conversaciones')
mensajes_collection = db.get_collection('mensajes')
logs_agente_collection = db.get_collection('logs_agente')
metricas_collection = db.get_collection('metricas')

async def init_indexes():
    """Inicializa índices de base de datos para rendimiento óptimo"""
    logger.info("Inicializando índices de MongoDB...")
    
    # Índices para productos
    await productos_collection.create_index([('sku', 1)], unique=True)
    await productos_collection.create_index([('categoria', 1)])
    await productos_collection.create_index([('activo', 1)])
    
    # Índices para clientes
    await clientes_collection.create_index([('telefono', 1)], unique=True)
    
    # Índices para cotizaciones
    await cotizaciones_collection.create_index([('folio', 1)], unique=True)
    await cotizaciones_collection.create_index([('cliente_id', 1), ('created_at', -1)])
    await cotizaciones_collection.create_index([('estado', 1)])
    
    # Índices para conversaciones
    await conversaciones_collection.create_index([('cliente_telefono', 1), ('created_at', -1)])
    
    # Índices para mensajes
    await mensajes_collection.create_index([('conversacion_id', 1), ('timestamp', 1)])
    await mensajes_collection.create_index([('cliente_telefono', 1), ('timestamp', -1)])
    
    # Índices para logs de agente
    await logs_agente_collection.create_index([('timestamp', -1)])
    await logs_agente_collection.create_index([('agente', 1), ('timestamp', -1)])
    
    logger.info("Índices creados exitosamente")

async def seed_catalogo():
    """Carga el catálogo inicial de productos"""
    logger.info("Verificando catálogo de productos...")
    
    count = await productos_collection.count_documents({})
    if count > 0:
        logger.info(f"Catálogo ya existe con {count} productos")
        return
    
    # Catálogo de mario.xlsx
    catalogo = [
        {'sku': 'TB-001', 'nombre': 'Tablaroca antimoho USG', 'categoria': 'Tablaroca', 'precio_base': 340.1, 'unidad': 'Pieza'},
        {'sku': 'TB-002', 'nombre': 'Durock USG', 'categoria': 'Tablaroca', 'precio_base': 790, 'unidad': 'Pieza'},
        {'sku': 'TB-003', 'nombre': 'Canal 4.10 x 3.05 Cal 22 Metal', 'categoria': 'Tablaroca', 'precio_base': 70, 'unidad': 'Pieza'},
        {'sku': 'TB-004', 'nombre': 'Canal 4.10 x 3.05 Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 43, 'unidad': 'Pieza'},
        {'sku': 'TB-005', 'nombre': 'Poste 4.10 x 3.05 Cal 20 Metal', 'categoria': 'Tablaroca', 'precio_base': 101, 'unidad': 'Pieza'},
        {'sku': 'TB-006', 'nombre': 'Canal 6.35 x 3.05 Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 50, 'unidad': 'Pieza'},
        {'sku': 'TB-007', 'nombre': 'Poste 6.35 x 3.05 Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 60, 'unidad': 'Pieza'},
        {'sku': 'TB-008', 'nombre': 'Poste 6.35 x 3.05 Cal 20 Metal', 'categoria': 'Tablaroca', 'precio_base': 126, 'unidad': 'Pieza'},
        {'sku': 'TB-009', 'nombre': 'Canal 9.20 x 3.05 Cal 22 Metal', 'categoria': 'Tablaroca', 'precio_base': 118, 'unidad': 'Pieza'},
        {'sku': 'TB-010', 'nombre': 'Poste 9.20 x 3.05 Cal 20 Metal', 'categoria': 'Tablaroca', 'precio_base': 160, 'unidad': 'Pieza'},
        {'sku': 'TB-011', 'nombre': 'Canal 9.20 x 3.05 Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 73, 'unidad': 'Pieza'},
        {'sku': 'TB-012', 'nombre': 'Poste 9.20 x 3.05 Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 83, 'unidad': 'Pieza'},
        {'sku': 'TB-013', 'nombre': 'Tablaroca ultralight USG', 'categoria': 'Tablaroca', 'precio_base': 210, 'unidad': 'Pieza'},
        {'sku': 'TB-014', 'nombre': 'Redimix 21.8 kg USG', 'categoria': 'Tablaroca', 'precio_base': 365, 'unidad': 'Pieza'},
        {'sku': 'AI-001', 'nombre': 'Insulglass 9.29 m2', 'categoria': 'Aislantes', 'precio_base': 703.5, 'unidad': 'Pieza'},
        {'sku': 'TB-015', 'nombre': 'Basecoat USG', 'categoria': 'Tablaroca', 'precio_base': 540, 'unidad': 'Pieza'},
        {'sku': 'TB-016', 'nombre': 'Canal listón Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 43, 'unidad': 'Pieza'},
        {'sku': 'TB-017', 'nombre': 'Ángulo de amarre Cal 26 Metal', 'categoria': 'Tablaroca', 'precio_base': 27, 'unidad': 'Pieza'},
        {'sku': 'TB-018', 'nombre': 'Caneleta de carga Cal 24 Metal', 'categoria': 'Tablaroca', 'precio_base': 34, 'unidad': 'Pieza'},
        {'sku': 'FE-001', 'nombre': 'Broca SDS Boesch 1/4" x 4', 'categoria': 'Ferreteria', 'precio_base': 32, 'unidad': 'Pieza'},
        {'sku': 'FE-002', 'nombre': 'Broca SDS Boesch 1/4" x 6', 'categoria': 'Ferreteria', 'precio_base': 35, 'unidad': 'Pieza'},
        {'sku': 'FE-003', 'nombre': 'Escalera cuprum 08 roja', 'categoria': 'Ferreteria', 'precio_base': 3160, 'unidad': 'Pieza'},
        {'sku': 'FE-004', 'nombre': 'Pija 6 x 1 x caja', 'categoria': 'Ferreteria', 'precio_base': 2505, 'unidad': 'Caja'},
    ]
    
    import uuid
    from datetime import datetime, timezone
    
    productos_insertados = []
    for producto in catalogo:
        doc = {
            'id': str(uuid.uuid4()),
            **producto,
            'margen_minimo': 0.15,
            'stock': 100.0,
            'activo': True,
            'descripcion': None,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        productos_insertados.append(doc)
    
    await productos_collection.insert_many(productos_insertados)
    logger.info(f"Catálogo inicializado con {len(productos_insertados)} productos")

async def shutdown_db_client():
    """Cierra la conexión a MongoDB"""
    client.close()