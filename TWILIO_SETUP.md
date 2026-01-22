# Guía de Configuración de Twilio WhatsApp

## 1. Obtener Credenciales de Twilio

### Paso 1: Crear Cuenta en Twilio

1. Ve a [https://www.twilio.com](https://www.twilio.com)
2. Regístrate para una cuenta (puedes usar la prueba gratuita)
3. Verifica tu correo electrónico y número de teléfono

### Paso 2: Obtener Account SID y Auth Token

1. Inicia sesión en [Twilio Console](https://console.twilio.com)
2. En el dashboard principal, encontrarás:
   - **Account SID**: Comienza con `AC...`
   - **Auth Token**: Token de autenticación (haz clic en "Show" para verlo)
3. Copia ambos valores

### Paso 3: Configurar WhatsApp Sandbox (Pruebas)

Para desarrollo y pruebas, Twilio ofrece un sandbox de WhatsApp:

1. En Twilio Console, ve a: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Encontrarás un número de WhatsApp: `+1 415 523 8886` (número compartido del sandbox)
3. Para unirte al sandbox, envía un mensaje desde tu WhatsApp personal a ese número con el código que te proporcionen
   - Ejemplo: `join <tu-codigo-sandbox>`
   - El código es único para tu cuenta (ej: `join stone-lamp`)
4. Una vez que envíes el mensaje, recibirás confirmación de que te uniste al sandbox

### Paso 4: Configurar Webhook en Twilio

Para que Twilio envíe los mensajes entrantes a tu aplicación:

1. En la página del Sandbox de WhatsApp, busca la sección **"Sandbox Configuration"**
2. En el campo **"WHEN A MESSAGE COMES IN"**, ingresa tu URL de webhook:
   ```
   https://tu-dominio.com/api/webhook/twilio/whatsapp
   ```
   
   **Para desarrollo local con ngrok:**
   ```bash
   # Instalar ngrok
   npm install -g ngrok
   
   # Exponer puerto 8001 (backend FastAPI)
   ngrok http 8001
   
   # Usar la URL HTTPS que ngrok te proporciona
   https://abc123.ngrok.io/api/webhook/twilio/whatsapp
   ```

3. Método HTTP: **POST**
4. Guarda los cambios

## 2. Configurar Variables de Entorno

Actualiza el archivo `/app/backend/.env` con tus credenciales:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"

# OpenAI via Emergent LLM Key
EMERGENT_LLM_KEY=sk-emergent-1F0Ce24F73679C715D

# Twilio WhatsApp - REEMPLAZA CON TUS VALORES
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+14155238886

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0
```

## 3. Reiniciar Backend

```bash
sudo supervisorctl restart backend
```

## 4. Probar la Integración

### Verificar que el backend está corriendo

```bash
curl http://localhost:8001/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "service": "CotizaBot",
  "version": "1.0.0"
}
```

### Enviar Mensaje de Prueba

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje al número del sandbox: `+1 415 523 8886`
3. Ejemplo de mensaje:
   ```
   Hola, quiero cotizar 5 tablarocas antimoho
   ```

### Verificar Logs del Backend

```bash
tail -f /var/log/supervisor/backend.out.log
```

Deberías ver logs como:
```
INFO: Mensaje recibido de +525512345678: Hola, quiero cotizar 5 tablarocas antimoho
INFO: Ejecutando nodo: clasificar
INFO: Intención clasificada: COTIZAR (confianza: 0.95)
INFO: Ejecutando nodo: cotizar
INFO: Cotizador procesó 1 productos
```

## 5. Pasar a Producción con WhatsApp Business API

Para producción, necesitas un número de WhatsApp Business propio:

### Requisitos

1. **Número de Teléfono Dedicado**
   - Debe ser un número que no esté registrado en WhatsApp personal
   - Puede ser móvil o fijo con capacidad SMS

2. **Cuenta de Twilio Verificada**
   - Actualiza a cuenta de pago
   - Verifica tu identidad empresarial

3. **Facebook Business Manager**
   - Crea una cuenta en [business.facebook.com](https://business.facebook.com)
   - Verifica tu negocio

### Proceso de Solicitud

1. **Solicitar WhatsApp Business API**
   - En Twilio Console: **Messaging** → **WhatsApp** → **Request Access**
   - Completa el formulario con:
     - Nombre de la empresa
     - Descripción del caso de uso
     - Número de teléfono a vincular
     - Sitio web de la empresa

2. **Esperar Aprobación**
   - Facebook revisará tu solicitud (5-20 días hábiles)
   - Recibirás notificación por email

3. **Configurar Número Aprobado**
   - Una vez aprobado, vincula tu número en Twilio
   - Actualiza la variable `TWILIO_WHATSAPP_NUMBER` en `.env`
   - El formato será: `whatsapp:+52XXXXXXXXXX` (para México)

### Plantillas de Mensajes (Templates)

En producción, los mensajes iniciados por el negocio requieren plantillas aprobadas:

```python
# Ejemplo de envío con plantilla
message = client.messages.create(
    from_='whatsapp:+525512345678',
    to='whatsapp:+525587654321',
    content_sid='HX...',  # Template SID
    content_variables=json.dumps({
        "1": "Cliente",
        "2": "COT-123",
        "3": "$4,194.56 MXN"
    })
)
```

## 6. Verificación de Firma de Webhook

Para seguridad, siempre valida la firma de Twilio:

```python
from twilio.request_validator import RequestValidator

def validar_firma_twilio(url: str, form_data: dict, signature: str) -> bool:
    validator = RequestValidator(settings.twilio_auth_token)
    return validator.validate(url, form_data, signature)
```

El código ya está implementado en `/app/backend/services/whatsapp_service.py`

## 7. Costos de Twilio WhatsApp

### Sandbox (Desarrollo)
- **Gratis** para pruebas
- Limitado a números que se unan al sandbox

### Producción
- **Sesión de 24 horas**: $0.005 USD por sesión
- **Mensajes entrantes**: Gratis
- **Mensajes salientes**:
  - Con plantilla: $0.0042 USD (México)
  - De respuesta (dentro de 24h): Gratis

**Ejemplo de cálculo mensual:**
- 1000 conversaciones/mes
- Promedio 3 mensajes por conversación
- Costo aproximado: **$5 USD/mes**

## 8. Monitoreo en Producción

### Dashboard de Twilio

Monitorea en tiempo real:
- Mensajes enviados/recibidos
- Errores de entrega
- Estadísticas de uso

Accede en: [https://console.twilio.com/monitor/logs/whatsapp](https://console.twilio.com/monitor/logs/whatsapp)

### Alertas

Configura alertas en Twilio Console:
- Errores de webhook
- Fallos de entrega
- Límites de uso

## 9. Solución de Problemas Comunes

### Problema: "Webhook validation failed"

**Solución:**
- Verifica que la URL del webhook sea accesible públicamente
- Confirma que el `Auth Token` en `.env` es correcto
- Revisa logs: `tail -f /var/log/supervisor/backend.err.log`

### Problema: "Message not delivered"

**Solución:**
- Verifica que el número del destinatario tenga WhatsApp activo
- En sandbox, confirma que el número se unió con `join <codigo>`
- Revisa el formato del número: `whatsapp:+525512345678`

### Problema: "No response from bot"

**Solución:**
- Verifica que el backend esté corriendo: `curl http://localhost:8001/api/health`
- Revisa logs del orquestador en MongoDB: `db.logs_agente.find().sort({timestamp: -1}).limit(10)`
- Confirma que `EMERGENT_LLM_KEY` es válido

## 10. Testing sin WhatsApp Real

Para pruebas automatizadas sin usar WhatsApp:

```python
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_webhook_cotizacion():
    response = client.post(
        "/api/webhook/twilio/whatsapp",
        data={
            "MessageSid": "SMtest123",
            "From": "whatsapp:+525512345678",
            "To": "whatsapp:+14155238886",
            "Body": "Quiero 10 tablarocas"
        },
        headers={
            "X-Twilio-Signature": "mock_signature"
        }
    )
    
    assert response.status_code == 200
    assert "cotización" in response.text.lower()
```

## 11. Recursos Adicionales

### Documentación Oficial
- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp/api)
- [WhatsApp Business API Pricing](https://www.twilio.com/whatsapp/pricing)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

### Soporte
- Twilio Support: [support.twilio.com](https://support.twilio.com)
- WhatsApp Business Policy: [developers.facebook.com/docs/whatsapp/overview](https://developers.facebook.com/docs/whatsapp/overview)

---

**Nota Importante**: El sandbox de Twilio es solo para desarrollo. Para usar en producción con clientes reales, debes solicitar acceso a WhatsApp Business API y tener un número dedicado aprobado por Facebook.
