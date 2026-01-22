# Arquitectura Técnica de CotizaBot

## 1. Diagrama de Arquitectura End-to-End

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO FINAL                            │
│                    (Cliente vía WhatsApp)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TWILIO WHATSAPP API                         │
│                   (Canal de Comunicación)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ Webhook POST /api/webhook/twilio/whatsapp
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND FASTAPI                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CAPA DE RUTAS (Routes)                      │   │
│  │  webhook.py | cotizaciones.py | productos.py | etc.     │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         ORQUESTADOR MULTI-AGENTE (LangGraph)            │   │
│  │                                                          │   │
│  │  ┌─────────────┐    ┌──────────────┐                   │   │
│  │  │ Clasificador│───▶│  Cotizador   │                   │   │
│  │  └─────────────┘    └──────┬───────┘                   │   │
│  │                             │                            │   │
│  │  ┌─────────────┐    ┌──────▼───────┐                   │   │
│  │  │  Operativo  │    │  Compliance  │                   │   │
│  │  └─────────────┘    └──────────────┘                   │   │
│  │                                                          │   │
│  │  Estado Compartido: AgentState (TypedDict)              │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CAPA DE SERVICIOS                           │   │
│  │  whatsapp_service.py | pdf_service.py                   │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                               │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐     │
│  │   MongoDB      │  │  OpenAI API     │  │  Twilio API  │     │
│  │  (Motor async)│  │ (Emergent Key)  │  │              │     │
│  └────────────────┘  └─────────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Dashboard | Cotizaciones | Productos | Clientes        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de Procesamiento de Mensaje

```
1. RECEPCIÓN
   ├─ WhatsApp → Twilio Webhook
   └─ POST /api/webhook/twilio/whatsapp
      └─ Extraer: From, Body, MessageSid

2. CONTEXTUALIZACIÓN
   ├─ Buscar/Crear Cliente en MongoDB
   ├─ Buscar/Crear Conversación activa
   └─ Guardar mensaje entrante

3. ORQUESTACIÓN (LangGraph)
   │
   ├─ NODO: Clasificar
   │  ├─ Input: mensaje, cliente_telefono
   │  ├─ LLM: gpt-4o clasificador
   │  └─ Output: intención + confianza
   │
   ├─ DECISIÓN: Router por intención
   │  ├─ COTIZAR → Nodo Cotizador
   │  ├─ STOCK → Nodo Operativo
   │  └─ OTRO → Nodo Finalizar
   │
   ├─ NODO: Cotizador (si COTIZAR)
   │  ├─ Consultar catálogo MongoDB
   │  ├─ LLM: identificar productos
   │  ├─ Buscar productos en BD
   │  ├─ Calcular totales + IVA
   │  └─ Output: productos + respuesta
   │
   ├─ NODO: Compliance
   │  ├─ Validar margen mínimo
   │  ├─ Validar IVA 16%
   │  └─ Output: warnings + validación
   │
   └─ NODO: Finalizar
      ├─ Consolidar respuestas
      └─ Output: respuesta_final

4. RESPUESTA
   ├─ Guardar mensaje saliente en MongoDB
   ├─ Generar TwiML response
   └─ Twilio → WhatsApp Cliente
```

## 3. Modelo de Estado (AgentState)

```python
class AgentState(TypedDict):
    # Entrada
    mensaje: str
    cliente_telefono: str
    conversacion_id: str
    
    # Clasificación
    intencion: Optional[str]
    confianza_intencion: float
    
    # Contexto
    cliente_id: Optional[str]
    cliente_nombre: Optional[str]
    historial_cliente: List[Dict]
    
    # Cotización
    cotizacion_actual: Optional[Dict]
    productos_solicitados: List[Dict]
    
    # Respuestas parciales
    respuesta_cotizador: Optional[str]
    respuesta_comercial: Optional[str]
    respuesta_operativo: Optional[str]
    respuesta_compliance: Optional[str]
    
    # Salida
    respuesta_final: str
    accion: Optional[str]
    
    # Metadata
    agentes_ejecutados: List[str]
    errores: List[str]
    timestamp: str
```

## 4. Estructura de Base de Datos

### Índices Críticos

```javascript
// productos
db.productos.createIndex({ "sku": 1 }, { unique: true })
db.productos.createIndex({ "categoria": 1 })
db.productos.createIndex({ "activo": 1 })

// clientes
db.clientes.createIndex({ "telefono": 1 }, { unique: true })

// cotizaciones
db.cotizaciones.createIndex({ "folio": 1 }, { unique: true })
db.cotizaciones.createIndex({ "cliente_id": 1, "created_at": -1 })
db.cotizaciones.createIndex({ "estado": 1 })

// conversaciones
db.conversaciones.createIndex({ "cliente_telefono": 1, "created_at": -1 })

// mensajes
db.mensajes.createIndex({ "conversacion_id": 1, "timestamp": 1 })
db.mensajes.createIndex({ "cliente_telefono": 1, "timestamp": -1 })

// logs_agente
db.logs_agente.createIndex({ "timestamp": -1 })
db.logs_agente.createIndex({ "agente": 1, "timestamp": -1 })
```

### Esquema de Cotización

```json
{
  "id": "uuid",
  "folio": "COT-20260122-A1B2C3",
  "cliente_id": "uuid",
  "cliente_nombre": "Juan Pérez",
  "cliente_telefono": "+525512345678",
  "items": [
    {
      "producto_id": "uuid",
      "producto_nombre": "Tablaroca antimoho USG",
      "cantidad": 10,
      "unidad": "Pieza",
      "precio_unitario": 340.1,
      "descuento_pct": 0,
      "subtotal": 3401.0
    }
  ],
  "subtotal": 3401.0,
  "iva": 544.16,
  "total": 3945.16,
  "margen": 1020.3,
  "estado": "enviada",
  "valida_hasta": "2026-02-06T00:00:00Z",
  "pdf_url": "/app/backend/pdfs/cotizacion_COT-..._abc123.pdf",
  "notas": null,
  "created_at": "2026-01-22T10:30:00Z",
  "updated_at": "2026-01-22T10:35:00Z"
}
```

## 5. Prompts de Sistema por Agente

### Clasificador
```
Eres un asistente experto en clasificar intenciones de clientes en WhatsApp 
para una empresa de materiales de construcción en México.

Clasificaciones disponibles:
1. COTIZAR: precio, presupuesto, cuánto cuesta
2. STOCK: disponibilidad, inventario
3. SEGUIMIENTO: cotización previa
4. FACTURA: solicitud fiscal
5. INFORMACION: características, usos
6. SALUDO: conversación casual
7. OTRO: cualquier otra

Responde SOLO en JSON:
{
  "intencion": "COTIZAR",
  "confianza": 0.95,
  "razon": "explicación breve"
}
```

### Cotizador
```
Eres un agente experto en crear cotizaciones para materiales de 
construcción en México.

Tu trabajo:
1. Identificar productos solicitados
2. Extraer cantidades
3. Buscar en catálogo proporcionado
4. Calcular precios con IVA 16%
5. Sugerir complementarios

Formato JSON:
{
  "productos_identificados": [{
    "nombre": "Tablaroca antimoho",
    "cantidad": 10,
    "sku_probable": "TB-001"
  }],
  "necesita_aclaracion": false,
  "pregunta_aclaracion": "",
  "productos_complementarios": ["Redimix", "Canal"]
}
```

### Compliance
```
Eres un agente de cumplimiento para materiales de construcción en México.

Validas:
1. Margen mínimo: 15% sobre costo
2. IVA correcto: 16% obligatorio
3. Políticas de crédito
4. Restricciones legales

Si hay violaciones, las reportas claramente.
Español profesional.
```

## 6. Estrategia de Escalado

### Horizontal Scaling

```
┌─────────────────────────────────────────────┐
│           Load Balancer (Nginx)             │
└──────────┬──────────┬──────────┬────────────┘
           │          │          │
    ┌──────▼───┐ ┌───▼──────┐ ┌─▼──────────┐
    │ FastAPI  │ │ FastAPI  │ │  FastAPI   │
    │ Instancia│ │ Instancia│ │  Instancia │
    │    1     │ │    2     │ │     3      │
    └──────┬───┘ └───┬──────┘ └─┬──────────┘
           │          │          │
           └──────────┴──────────┘
                      │
              ┌───────▼────────┐
              │  MongoDB       │
              │  Replica Set   │
              └────────────────┘
```

### Multi-tenant

```python
# Separación por empresa_id
class Cotizacion:
    empresa_id: str  # Nuevo campo
    ...

# Query filters
cotizaciones = await db.cotizaciones.find({
    'empresa_id': current_user.empresa_id
})
```

## 7. Monitoreo y Observabilidad

### Logs Estructurados

```python
logger.info(
    "Mensaje procesado",
    extra={
        "cliente_telefono": "+525512345678",
        "intencion": "COTIZAR",
        "agentes_ejecutados": ["clasificador", "cotizador"],
        "tiempo_ms": 1234,
        "tokens_consumidos": 456
    }
)
```

### Métricas Prometheus

```python
# Métricas custom
cotizaciones_creadas = Counter('cotizaciones_total')
tiempo_respuesta = Histogram('respuesta_segundos')
tokens_por_agente = Counter('tokens_consumidos', ['agente'])
```

## 8. Seguridad

### Autenticación Twilio

```python
from twilio.request_validator import RequestValidator

validator = RequestValidator(settings.twilio_auth_token)

def validar_webhook(url, form_data, signature):
    return validator.validate(url, form_data, signature)
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/webhook/twilio/whatsapp")
@limiter.limit("100/minute")
async def webhook_whatsapp():
    ...
```

### Encriptación de Datos

```python
# Datos sensibles encriptados en BD
from cryptography.fernet import Fernet

def encrypt_field(value: str) -> str:
    f = Fernet(settings.encryption_key)
    return f.encrypt(value.encode()).decode()
```

## 9. Testing Strategy

### Unit Tests
```python
# tests/test_clasificador.py
async def test_clasificar_intencion_cotizar():
    clasificador = AgenteClasificador()
    resultado = await clasificador.clasificar({
        'mensaje': 'Cuánto cuesta la tablaroca?',
        ...
    })
    assert resultado['intencion'] == 'COTIZAR'
    assert resultado['confianza_intencion'] > 0.8
```

### Integration Tests
```python
# tests/test_orquestador.py
async def test_flujo_completo_cotizacion():
    orquestador = OrquestadorCotizaBot()
    resultado = await orquestador.procesar_mensaje(
        mensaje="Necesito 10 tablarocas",
        cliente_telefono="+525512345678",
        conversacion_id="test-123"
    )
    assert 'total' in resultado['respuesta'].lower()
```

## 10. Performance Optimization

### Caching con Redis

```python
import redis
from functools import wraps

redis_client = redis.Redis.from_url(settings.redis_url)

def cache_result(expire=3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{args}:{kwargs}"
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            redis_client.setex(key, expire, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(expire=1800)
async def obtener_catalogo():
    return await productos_collection.find().to_list(1000)
```

### Batch Processing

```python
# Procesar múltiples mensajes en lote
async def procesar_mensajes_batch(mensajes: List[Dict]):
    tasks = [
        orquestador.procesar_mensaje(**msg)
        for msg in mensajes
    ]
    return await asyncio.gather(*tasks)
```

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026
