# CotizaBot - Sistema Multi-Agente para Automatización de Cotizaciones

## Descripción General

CotizaBot es un sistema de inteligencia artificial multi-agente diseñado para automatizar cotizaciones y ventas por WhatsApp para empresas de materiales de construcción/ferretería en México. El sistema utiliza arquitectura emergent AI con LangGraph para orquestar agentes especializados.

## Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- FastAPI (Python 3.11)
- MongoDB (Base de datos)
- Motor (Driver async MongoDB)
- LangGraph (Orquestación multi-agente)
- OpenAI GPT-4o (vía Emergent LLM Key)
- Twilio WhatsApp API
- ReportLab (Generación PDF)
- Redis + Celery (Cola de eventos - opcional)

**Frontend:**
- React 19
- React Router v7
- Axios
- Tailwind CSS
- Shadcn/UI Components
- Sonner (Notificaciones)

### Agentes Especializados

#### 1. Agente Clasificador
Clasifica la intención del mensaje del cliente:
- COTIZAR: Solicitud de cotización
- STOCK: Consulta de disponibilidad
- SEGUIMIENTO: Seguimiento de cotización previa
- FACTURA: Solicitud de factura
- INFORMACION: Preguntas generales
- SALUDO: Conversación casual
- OTRO: Otras intenciones

#### 2. Agente Cotizador
Constructor de cotizaciones:
- Identifica productos solicitados
- Extrae cantidades
- Busca en catálogo
- Calcula precios con IVA (16%)
- Sugiere productos complementarios

#### 3. Agente Compliance
Validación de políticas de negocio:
- Verifica margen mínimo (15% default)
- Valida IVA correcto (16% México)
- Aplica políticas de crédito
- Verifica restricciones legales

#### 4. Agente Operativo
Manejo de consultas operativas:
- Consulta disponibilidad de productos
- Informa tiempos de entrega
- Sugiere alternativas sin stock
- Coordina logística

#### 5. Agente Aprendizaje (Fase 2)
Mejora continua del sistema:
- Analiza cotizaciones ganadas/perdidas
- Identifica patrones de descuentos
- Sugiere precios óptimos
- Mejora prompts basado en resultados

### Orquestador (LangGraph)

Grafo de estados que coordina los agentes:

```
INICIO → Clasificador → [Decisión por Intención]
                        ↓
                 ┌──────┼──────┐
                 ↓      ↓      ↓
            Cotizador  Stock  Otro
                 ↓             ↓
            Compliance    Finalizar
                 ↓             ↓
            Finalizar    Respuesta
```

## Modelo de Datos

### Colecciones MongoDB

**productos**
- id, sku, nombre, categoria
- precio_base, unidad, margen_minimo
- stock, activo, descripcion

**clientes**
- id, telefono, nombre, empresa
- email, rfc, direccion
- total_cotizaciones, total_ventas, monto_total

**cotizaciones**
- id, folio, cliente_id
- items (array de productos)
- subtotal, iva, total, margen
- estado, valida_hasta, pdf_url

**conversaciones**
- id, cliente_telefono, cliente_nombre
- estado, intencion_actual, metadata

**mensajes**
- id, conversacion_id, cliente_telefono
- direccion (entrante/saliente)
- contenido, tipo, media_url
- agente_procesador, timestamp

**logs_agente**
- id, agente, accion
- input_json, output_json
- tokens, costo, duracion

## API REST Endpoints

### Webhook
- `POST /api/webhook/twilio/whatsapp` - Recibir mensajes WhatsApp

### Cotizaciones
- `GET /api/cotizaciones` - Listar cotizaciones
- `GET /api/cotizaciones/{id}` - Obtener cotización
- `POST /api/cotizaciones` - Crear cotización
- `POST /api/cotizaciones/enviar` - Enviar por WhatsApp

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/categorias` - Listar categorías
- `GET /api/productos/{id}` - Obtener producto
- `POST /api/productos` - Crear producto

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/{id}` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/{id}/cotizaciones` - Cotizaciones del cliente

### Dashboard
- `GET /api/dashboard/metricas` - Métricas principales
- `GET /api/dashboard/cotizaciones-recientes` - Últimas cotizaciones
- `GET /api/dashboard/logs-agentes` - Logs de ejecución

### Conversaciones
- `GET /api/conversaciones` - Listar conversaciones
- `GET /api/conversaciones/{id}/mensajes` - Mensajes de conversación

## Configuración

### Variables de Entorno (backend/.env)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*

# OpenAI via Emergent LLM Key
EMERGENT_LLM_KEY=sk-emergent-1F0Ce24F73679C715D

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0
```

## Instalación y Despliegue

### Backend

```bash
cd /app/backend
pip install -r requirements.txt

# Reiniciar backend
sudo supervisorctl restart backend
```

### Frontend

```bash
cd /app/frontend
yarn install

# El frontend se inicia automáticamente con supervisor
```

## Flujo de Uso

### 1. Cliente envía mensaje por WhatsApp
Ejemplo: "Quiero cotizar 10 tablarocas antimoho y 5 canales"

### 2. Sistema procesa mensaje
- Webhook recibe mensaje de Twilio
- Crea/actualiza cliente y conversación
- Orquestador clasifica intención: COTIZAR
- Ejecuta Agente Cotizador
- Ejecuta Agente Compliance
- Genera respuesta consolidada

### 3. Respuesta automática
```
Cotización para Cliente:

• Tablaroca antimoho USG: 10 Pieza x $340.10 = $3,401.00 MXN
• Canal 4.10 x 3.05 Cal 26 Metal: 5 Pieza x $43.00 = $215.00 MXN

Subtotal: $3,616.00 MXN
IVA (16%): $578.56 MXN
Total: $4,194.56 MXN

💡 También te recomiendo: Redimix, Basecoat

⚠️ IVA aplicado: 16% ($578.56 MXN)
📍 Cotización válida por 15 días.
```

### 4. Generación de PDF
Si el usuario confirma, se genera PDF profesional con:
- Folio de cotización
- Datos del cliente
- Tabla de productos
- Totales con IVA
- Validez y notas

### 5. Dashboard Admin
- Ver métricas en tiempo real
- Gestionar cotizaciones
- Administrar catálogo de productos
- Revisar conversaciones
- Ver logs de agentes

## Características Avanzadas

### Memoria del Sistema

**Memoria Corta (Conversación)**
- Contexto de la conversación actual
- Últimos mensajes intercambiados

**Memoria Larga (Cliente)**
- Historial de cotizaciones
- Preferencias de productos
- Patrones de compra

**Memoria de Negocio**
- Catálogo de productos
- Políticas de precios
- Reglas de descuento

**Memoria de Desempeño**
- Cotizaciones ganadas/perdidas
- Razones de pérdida
- Métricas de conversión

### Guardrails y Validaciones

1. **Validación de Precios**: No permite precios bajo margen mínimo
2. **IVA Obligatorio**: Siempre aplica 16% IVA en México
3. **Productos Existentes**: Solo cotiza productos del catálogo
4. **Formato de Respuesta**: Estructura consistente en español

### Estrategia RAG (Fase 2)

- Indexar catálogo completo con embeddings
- Preguntas frecuentes vectorizadas
- Búsqueda semántica de productos
- Evita alucinaciones con validación contra BD

## Métricas y Evaluación

### KPIs Principales

1. **Tiempo de Respuesta**: < 3 segundos promedio
2. **Tasa de Conversión**: % cotizaciones ganadas
3. **Margen Promedio**: % sobre costo
4. **Accuracy de Clasificación**: % intenciones correctas
5. **Satisfacción del Cliente**: Medido por seguimientos

### Monitoreo

- Logs detallados por agente
- Tracking de tokens consumidos
- Auditoría de decisiones de IA
- Alertas por errores críticos

## Roadmap de Desarrollo

### Fase 1 (MVP - Completada) ✅
- ✅ Recepción mensajes WhatsApp
- ✅ Orquestador + Clasificador + Cotizador + Compliance
- ✅ CRUD productos y catálogo
- ✅ Generación PDF básica
- ✅ Dashboard mínimo
- ✅ Single-tenant

### Fase 2 (60-90 días)
- [ ] Agente Comercial (upsell, objeciones)
- [ ] Agente Operativo completo
- [ ] Agente Aprendizaje
- [ ] Multi-tenant
- [ ] RAG con embeddings
- [ ] Análisis de conversiones
- [ ] Webhooks de status de entrega

### Fase 3 (6 meses)
- [ ] Pricing dinámico basado en demanda
- [ ] Recomendador inteligente
- [ ] Predicción de compra
- [ ] Automatización completa de seguimientos
- [ ] Integración con ERP
- [ ] API pública para terceros

## Riesgos y Mitigaciones

### Riesgos Técnicos

1. **Costos LLM elevados**
   - Mitigación: Cache de respuestas comunes, prompts optimizados

2. **Latencia de respuesta**
   - Mitigación: Procesamiento asíncrono, respuestas inmediatas

3. **Fallas de Twilio**
   - Mitigación: Cola de reintentos, logging completo

4. **Alucinaciones del LLM**
   - Mitigación: Validación contra BD, guardrails estrictos

### Riesgos de Negocio

1. **Privacidad de datos**
   - Mitigación: Encriptación, cumplimiento LFPDPPP México

2. **Errores de precio**
   - Mitigación: Revisión humana antes de confirmar

3. **Dependencia de proveedor**
   - Mitigación: Diseño modular, fácil cambio de LLM

## Equipo Mínimo

### 1 Desarrollador (MVP)
- Backend + Frontend + Integración
- Tiempo: 4-6 semanas

### 2 Desarrolladores (Producción)
- Dev 1: Backend + IA
- Dev 2: Frontend + UX
- Tiempo: 6-8 semanas

### Equipo Completo (Escala)
- 1 Tech Lead
- 2 Desarrolladores Full-stack
- 1 ML Engineer (optimización)
- 1 DevOps
- 1 Product Manager

## Soporte y Mantenimiento

### Contacto
- Sistema desarrollado por Emergent AI
- Documentación: /app/README.md
- Issues: Crear en repositorio

### Actualizaciones
- Actualización de modelos LLM: Trimestral
- Actualización de catálogo: En tiempo real
- Mejoras de agentes: Mensual

---

**Versión**: 1.0.0  
**Fecha**: Enero 2026  
**Estado**: MVP Completado ✅