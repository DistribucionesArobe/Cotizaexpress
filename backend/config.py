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
    
    # Twilio WhatsApp
    twilio_account_sid: str = os.environ.get('TWILIO_ACCOUNT_SID', '')
    twilio_auth_token: str = os.environ.get('TWILIO_AUTH_TOKEN', '')
    twilio_whatsapp_number: str = os.environ.get('TWILIO_WHATSAPP_NUMBER', '')
    
    # OpenAI (via Emergent LLM Key)
    emergent_llm_key: str = os.environ.get('EMERGENT_LLM_KEY', '')
    
    # Redis/Celery
    redis_url: str = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # CORS
    cors_origins: str = os.environ.get('CORS_ORIGINS', '*')
    
    # Business config
    iva_rate: float = 0.16  # 16% IVA México
    margen_minimo_default: float = 0.15  # 15% margen mínimo
    
    class Config:
        env_file = '.env'
        case_sensitive = False

settings = Settings()