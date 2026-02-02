import os
from dotenv import load_dotenv
from pathlib import Path
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class Settings(BaseSettings):
    # MongoDB
    mongo_url: str = os.environ['MONGO_URL']
    db_name: str = os.environ['DB_NAME']
    
    # 360dialog WhatsApp
    dialog360_base_url: str = os.environ.get('DIALOG360_BASE_URL', 'https://waba-v2.360dialog.io')
    dialog360_api_key: str = os.environ.get('DIALOG360_API_KEY', '')
    cotizabot_whatsapp_number: str = os.environ.get('COTIZABOT_WHATSAPP_NUMBER', '+5218344291628')
    webhook_verify_token: str = os.environ.get('WEBHOOK_VERIFY_TOKEN', 'cotizabot_verify_2026')
    whatsapp_verify_token: str = os.environ.get('WHATSAPP_VERIFY_TOKEN', 'cotizabot_verify_2026')
    
    # OpenAI (via Emergent LLM Key)
    emergent_llm_key: str = os.environ.get('EMERGENT_LLM_KEY', '')
    
    # Redis/Celery
    redis_url: str = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Stripe
    stripe_api_key: str = os.environ.get('STRIPE_API_KEY', '')
    stripe_publishable_key: str = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    
    # Email (Resend)
    resend_api_key: str = os.environ.get('RESEND_API_KEY', '')
    sender_email: str = os.environ.get('SENDER_EMAIL', 'contacto@cotizaexpress.com')
    
    # Facturama (CFDI)
    facturama_api_url: str = os.environ.get('FACTURAMA_API_URL', 'https://apisandbox.facturama.mx')
    facturama_username: str = os.environ.get('FACTURAMA_USERNAME', '')
    facturama_password: str = os.environ.get('FACTURAMA_PASSWORD', '')
    
    # CORS
    cors_origins: str = os.environ.get('CORS_ORIGINS', '*')
    
    # Business config
    iva_rate: float = 0.16  # 16% IVA México
    margen_minimo_default: float = 0.15  # 15% margen mínimo
    
    class Config:
        env_file = '.env'
        case_sensitive = False

settings = Settings()