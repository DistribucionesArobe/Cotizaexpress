from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import os
import logging

from config import settings
from database import client, init_indexes, seed_catalogo
from routes import webhook, cotizaciones, productos, clientes, conversaciones, dashboard, carga_productos, auth, pagos, webhook_stripe, empresa, portal_cliente, whatsapp_config, seo

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida de la aplicación"""
    logger.info("Iniciando CotizaBot...")
    
    # Inicializar base de datos
    await init_indexes()
    await seed_catalogo()
    
    logger.info("CotizaBot iniciado correctamente")
    
    yield
    
    logger.info("Cerrando CotizaBot...")
    if client is not None:
        client.close()
    else:
        logger.info("No hay cliente de MongoDB que cerrar.")

# Crear aplicación FastAPI
app = FastAPI(
    title="CotizaBot API",
    description="Sistema Multi-Agente para Automatización de Cotizaciones vía WhatsApp",
    version="1.0.0",
    lifespan=lifespan
)

# Health check en raíz (requerido por Kubernetes)
@app.get("/health")
async def root_health_check():
    return {"status": "healthy", "service": "CotizaBot", "version": "1.0.0"}

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router principal con prefijo /api
api_router = APIRouter(prefix="/api")

# Health check
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CotizaBot",
        "version": "1.0.0"
    }

# Incluir routers
api_router.include_router(auth.router)
api_router.include_router(webhook.router)
api_router.include_router(webhook_stripe.router)
api_router.include_router(cotizaciones.router)
api_router.include_router(productos.router)
api_router.include_router(clientes.router)
api_router.include_router(conversaciones.router)
api_router.include_router(dashboard.router)
api_router.include_router(carga_productos.router)
api_router.include_router(pagos.router)
api_router.include_router(empresa.router)
api_router.include_router(portal_cliente.router)
api_router.include_router(whatsapp_config.router)

# Registrar router principal
app.include_router(api_router)

# Rutas SEO en root (sin prefijo /api)
app.include_router(seo.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
    
#commit forzado