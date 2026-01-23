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
    """Carga el catálogo inicial de productos de demo (abarrotes)"""
    logger.info("Verificando catálogo de productos de demo...")
    
    # Ya no cargamos productos demo globales
    # Los productos ahora son por empresa
    # Este seed solo crea un catálogo de ejemplo para la cuenta demo
    
    # Verificar si ya existe catálogo demo
    count = await productos_collection.count_documents({'empresa_id': 'demo'})
    if count > 0:
        logger.info(f"Catálogo demo ya existe con {count} productos")
        return
    
    # Catálogo de abarrotes/canasta básica para demo
    catalogo_demo = [
        # Abarrotes básicos
        {'sku': 'AB-001', 'nombre': 'Arroz Morelos 1kg', 'categoria': 'Abarrotes', 'precio_base': 28.50, 'unidad': 'Bolsa'},
        {'sku': 'AB-002', 'nombre': 'Frijol negro 1kg', 'categoria': 'Abarrotes', 'precio_base': 32.00, 'unidad': 'Bolsa'},
        {'sku': 'AB-003', 'nombre': 'Azúcar estándar 1kg', 'categoria': 'Abarrotes', 'precio_base': 24.50, 'unidad': 'Bolsa'},
        {'sku': 'AB-004', 'nombre': 'Sal de mesa 1kg', 'categoria': 'Abarrotes', 'precio_base': 12.00, 'unidad': 'Bolsa'},
        {'sku': 'AB-005', 'nombre': 'Aceite vegetal 1L', 'categoria': 'Abarrotes', 'precio_base': 38.00, 'unidad': 'Botella'},
        {'sku': 'AB-006', 'nombre': 'Harina de trigo 1kg', 'categoria': 'Abarrotes', 'precio_base': 22.00, 'unidad': 'Bolsa'},
        {'sku': 'AB-007', 'nombre': 'Avena Quaker 800g', 'categoria': 'Abarrotes', 'precio_base': 45.00, 'unidad': 'Caja'},
        {'sku': 'AB-008', 'nombre': 'Leche Lala entera 1L', 'categoria': 'Lácteos', 'precio_base': 26.00, 'unidad': 'Litro'},
        
        # Enlatados
        {'sku': 'EN-001', 'nombre': 'Atún en agua 140g', 'categoria': 'Enlatados', 'precio_base': 22.50, 'unidad': 'Lata'},
        {'sku': 'EN-002', 'nombre': 'Sardinas en tomate 425g', 'categoria': 'Enlatados', 'precio_base': 28.00, 'unidad': 'Lata'},
        {'sku': 'EN-003', 'nombre': 'Chiles jalapeños 220g', 'categoria': 'Enlatados', 'precio_base': 18.00, 'unidad': 'Lata'},
        {'sku': 'EN-004', 'nombre': 'Maíz dulce 340g', 'categoria': 'Enlatados', 'precio_base': 20.00, 'unidad': 'Lata'},
        
        # Bebidas
        {'sku': 'BE-001', 'nombre': 'Coca-Cola 2L', 'categoria': 'Bebidas', 'precio_base': 32.00, 'unidad': 'Botella'},
        {'sku': 'BE-002', 'nombre': 'Agua purificada 1L', 'categoria': 'Bebidas', 'precio_base': 8.00, 'unidad': 'Botella'},
        {'sku': 'BE-003', 'nombre': 'Jugo de naranja 1L', 'categoria': 'Bebidas', 'precio_base': 28.00, 'unidad': 'Botella'},
        
        # Limpieza
        {'sku': 'LI-001', 'nombre': 'Jabón de barra Zote', 'categoria': 'Limpieza', 'precio_base': 15.00, 'unidad': 'Barra'},
        {'sku': 'LI-002', 'nombre': 'Detergente Roma 500g', 'categoria': 'Limpieza', 'precio_base': 22.00, 'unidad': 'Bolsa'},
        {'sku': 'LI-003', 'nombre': 'Cloro 1L', 'categoria': 'Limpieza', 'precio_base': 18.00, 'unidad': 'Botella'},
        {'sku': 'LI-004', 'nombre': 'Papel higiénico 4 rollos', 'categoria': 'Limpieza', 'precio_base': 35.00, 'unidad': 'Paquete'},
        
        # Snacks
        {'sku': 'SN-001', 'nombre': 'Sabritas original 45g', 'categoria': 'Snacks', 'precio_base': 18.00, 'unidad': 'Bolsa'},
        {'sku': 'SN-002', 'nombre': 'Galletas Marías 170g', 'categoria': 'Snacks', 'precio_base': 14.00, 'unidad': 'Paquete'},
        {'sku': 'SN-003', 'nombre': 'Pan Bimbo blanco 680g', 'categoria': 'Snacks', 'precio_base': 52.00, 'unidad': 'Bolsa'},
    ]
    
    import uuid
    from datetime import datetime, timezone
    
    productos_insertados = []
    for producto in catalogo_demo:
        doc = {
            'id': str(uuid.uuid4()),
            **producto,
            'empresa_id': 'demo',  # Productos demo globales
            'margen_minimo': 0.15,
            'stock': 100.0,
            'activo': True,
            'descripcion': None,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        productos_insertados.append(doc)
    
    await productos_collection.insert_many(productos_insertados)
    logger.info(f"Catálogo demo inicializado con {len(productos_insertados)} productos de abarrotes")

async def shutdown_db_client():
    """Cierra la conexión a MongoDB"""
    client.close()