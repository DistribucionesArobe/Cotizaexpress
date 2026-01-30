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
    
    # Eliminar índice antiguo de SKU si existe (era único global, ahora es por empresa)
    try:
        await productos_collection.drop_index('sku_1')
        logger.info("Índice sku_1 antiguo eliminado")
    except Exception:
        pass  # El índice puede no existir
    
    # Índices para productos - SKU único POR EMPRESA (índice compuesto)
    await productos_collection.create_index(
        [('empresa_id', 1), ('sku', 1)], 
        unique=True,
        name='empresa_sku_unique'
    )
    await productos_collection.create_index([('empresa_id', 1)])
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
    
    # Índices para WhatsApp Router (Multi-tenant)
    wa_conversations = db.get_collection('wa_conversations')
    await wa_conversations.create_index([('user_phone', 1)], unique=True)
    await wa_conversations.create_index([('company_id', 1)])
    await wa_conversations.create_index([('last_message_at', -1)])
    
    wa_routing_logs = db.get_collection('wa_routing_logs')
    await wa_routing_logs.create_index([('user_phone', 1), ('timestamp', -1)])
    await wa_routing_logs.create_index([('company_id', 1), ('timestamp', -1)])
    
    # Índice para código de WhatsApp único por empresa
    empresas_collection = db.get_collection('empresas')
    await empresas_collection.create_index(
        [('codigo_whatsapp', 1)], 
        unique=True, 
        sparse=True,
        name='codigo_whatsapp_unique'
    )
    
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
    
    # Catálogo de materiales de construcción para demo
    catalogo_demo = [
        # Acero y Varilla
        {'sku': 'AC-001', 'nombre': 'Varilla corrugada 3/8" x 12m', 'categoria': 'Acero', 'precio_base': 125.00, 'unidad': 'Pieza'},
        {'sku': 'AC-002', 'nombre': 'Varilla corrugada 1/2" x 12m', 'categoria': 'Acero', 'precio_base': 195.00, 'unidad': 'Pieza'},
        {'sku': 'AC-003', 'nombre': 'Varilla corrugada 5/8" x 12m', 'categoria': 'Acero', 'precio_base': 310.00, 'unidad': 'Pieza'},
        {'sku': 'AC-004', 'nombre': 'Alambre recocido 20kg', 'categoria': 'Acero', 'precio_base': 680.00, 'unidad': 'Rollo'},
        {'sku': 'AC-005', 'nombre': 'Malla electrosoldada 6x6 10/10', 'categoria': 'Acero', 'precio_base': 850.00, 'unidad': 'Pieza'},
        
        # Cemento y Mortero
        {'sku': 'CE-001', 'nombre': 'Cemento gris Cemex 50kg', 'categoria': 'Cemento', 'precio_base': 198.00, 'unidad': 'Saco'},
        {'sku': 'CE-002', 'nombre': 'Cemento blanco 20kg', 'categoria': 'Cemento', 'precio_base': 285.00, 'unidad': 'Saco'},
        {'sku': 'CE-003', 'nombre': 'Mortero Premezclado 50kg', 'categoria': 'Cemento', 'precio_base': 165.00, 'unidad': 'Saco'},
        {'sku': 'CE-004', 'nombre': 'Pegablock 50kg', 'categoria': 'Cemento', 'precio_base': 145.00, 'unidad': 'Saco'},
        
        # Block y Tabique
        {'sku': 'BL-001', 'nombre': 'Block hueco 15x20x40', 'categoria': 'Block', 'precio_base': 12.50, 'unidad': 'Pieza'},
        {'sku': 'BL-002', 'nombre': 'Block macizo 15x20x40', 'categoria': 'Block', 'precio_base': 15.00, 'unidad': 'Pieza'},
        {'sku': 'BL-003', 'nombre': 'Tabique rojo 6x12x24', 'categoria': 'Block', 'precio_base': 4.50, 'unidad': 'Pieza'},
        {'sku': 'BL-004', 'nombre': 'Tabicón 10x14x28', 'categoria': 'Block', 'precio_base': 8.00, 'unidad': 'Pieza'},
        
        # Agregados
        {'sku': 'AG-001', 'nombre': 'Arena m3', 'categoria': 'Agregados', 'precio_base': 450.00, 'unidad': 'm3'},
        {'sku': 'AG-002', 'nombre': 'Grava m3', 'categoria': 'Agregados', 'precio_base': 480.00, 'unidad': 'm3'},
        {'sku': 'AG-003', 'nombre': 'Granzón m3', 'categoria': 'Agregados', 'precio_base': 420.00, 'unidad': 'm3'},
        
        # Ferretería
        {'sku': 'FE-001', 'nombre': 'Tornillo para madera 2"', 'categoria': 'Ferretería', 'precio_base': 85.00, 'unidad': 'Caja 100pz'},
        {'sku': 'FE-002', 'nombre': 'Tornillo tablaroca 1 5/8"', 'categoria': 'Ferretería', 'precio_base': 65.00, 'unidad': 'Caja 100pz'},
        {'sku': 'FE-003', 'nombre': 'Clavo 3"', 'categoria': 'Ferretería', 'precio_base': 45.00, 'unidad': 'kg'},
        {'sku': 'FE-004', 'nombre': 'Ancla expansiva 3/8"', 'categoria': 'Ferretería', 'precio_base': 8.50, 'unidad': 'Pieza'},
        {'sku': 'FE-005', 'nombre': 'Taquete plástico 1/4"', 'categoria': 'Ferretería', 'precio_base': 35.00, 'unidad': 'Bolsa 100pz'},
        
        # Tubería
        {'sku': 'TU-001', 'nombre': 'Tubo PVC hidráulico 2" x 6m', 'categoria': 'Tubería', 'precio_base': 185.00, 'unidad': 'Pieza'},
        {'sku': 'TU-002', 'nombre': 'Tubo PVC sanitario 4" x 6m', 'categoria': 'Tubería', 'precio_base': 320.00, 'unidad': 'Pieza'},
        {'sku': 'TU-003', 'nombre': 'Codo PVC 90° 2"', 'categoria': 'Tubería', 'precio_base': 18.00, 'unidad': 'Pieza'},
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
    logger.info(f"Catálogo demo inicializado con {len(productos_insertados)} productos de construcción")

async def shutdown_db_client():
    """Cierra la conexión a MongoDB"""
    client.close()