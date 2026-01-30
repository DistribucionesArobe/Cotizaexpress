# CotizaBot - Product Requirements Document

## Descripción del Producto
CotizaBot es un SaaS B2B que automatiza cotizaciones y ventas a través de WhatsApp para empresas de materiales de construcción en México y LATAM.

## Arquitectura Técnica
- **Backend**: FastAPI (Python)
- **Frontend**: React.js con Shadcn UI
- **Database**: MongoDB
- **Auth**: JWT con roles (admin, user)
- **WhatsApp**: Twilio (número único centralizado)
- **Pagos**: Stripe (suscripciones)
- **Facturación**: Facturama (CFDI México)
- **LLM**: OpenAI GPT-4o vía Emergent LLM Key

---

## Arquitectura de WhatsApp Multi-Tenant (IMPLEMENTADO - Enero 2026)

### Concepto
UN solo número de WhatsApp verificado de CotizaBot para TODAS las empresas (300+ clientes).
Ningún cliente necesita verificar Meta ni comprar número.

### Flujo de Enrutamiento
```
Usuario envía mensaje → Webhook CotizaBot
                            ↓
                    WhatsApp Router
                            ↓
            1. ¿Tiene código en mensaje? → Identificar empresa
            2. ¿Tiene historial? → Usar empresa anterior
            3. ¿Es número del menú? → Asignar selección
            4. → Mostrar menú de empresas
                            ↓
                    Empresa identificada
                            ↓
            Procesar con catálogo de ESA empresa
                            ↓
            Responder: "🤖 CotizaBot – [Empresa]"
```

### Assets por Empresa
Cada empresa recibe automáticamente:
- **Código único**: Ej. `FERRETER`, `ACEROMX`
- **Link WhatsApp**: `wa.me/14155238886?text=CODIGO`
- **QR Code**: URL generada automáticamente
- **Instrucciones**: Texto para compartir con clientes

### Endpoints
- `GET /api/whatsapp/configuracion` - Obtener config de la empresa
- `POST /api/whatsapp/activar` - Activar WhatsApp (genera código, link, QR)
- `POST /api/whatsapp/regenerar-codigo` - Cambiar código
- `PUT /api/whatsapp/configuracion` - Actualizar mensaje de bienvenida

### Archivos Clave
- `/app/backend/services/whatsapp_router.py` - Router multi-tenant
- `/app/backend/routes/whatsapp_config.py` - Endpoints de configuración
- `/app/backend/routes/webhook.py` - Webhook actualizado con routing
- `/app/frontend/src/pages/ConfiguracionWhatsApp.js` - UI de configuración

---

## Funcionalidades Implementadas

### Core
- [x] Autenticación JWT con roles
- [x] Registro de empresas (multi-tenant)
- [x] CRUD de productos (manual + Excel)
- [x] Generación de cotizaciones por WhatsApp
- [x] Dashboard de administración

### WhatsApp
- [x] Número único centralizado (+14155238886)
- [x] Router multi-tenant con identificación automática
- [x] Código único por empresa
- [x] Link directo y QR Code
- [x] Personalización de mensaje de bienvenida

### Pagos y Facturación
- [x] Integración Stripe (suscripciones)
- [x] Planes: Gratis (5 cotizaciones) y Completo ($1,160 MXN/mes)
- [x] Códigos promocionales
- [x] Facturación CFDI con Facturama

### Administración
- [x] Dashboard de estadísticas generales
- [x] Dashboard de Twilio (saldo, números)
- [x] Gestión de códigos promocionales
- [x] Panel de empresas activas

---

## Pendientes

### P0 - Crítico
- [ ] Verificar descarga de template Excel

### P1 - Importante
- [ ] Blog para SEO
- [ ] Configuración de dominio cotizaexpress.com

### P2 - Mejoras
- [ ] Agente de aprendizaje (análisis de cotizaciones)
- [ ] Precios dinámicos
- [ ] Dashboard para clientes finales
- [ ] Sistema de recomendaciones

---

## Credenciales de Prueba
- **Admin**: `test@cotizabot.com` / `test123`
- **Stripe Test**: `4242 4242 4242 4242`

---

## Changelog

### 2026-01-30
- Implementada arquitectura multi-tenant de WhatsApp con número único
- Router inteligente con 4 métodos de identificación
- UI nueva para configuración de WhatsApp con código, link y QR
- Generación automática de assets para cada empresa

### 2026-01-24
- Corrección de descarga de template Excel
- Menú de hamburguesa para navegación móvil
- Dashboard de administrador y Twilio
- Gestión avanzada de productos (crear, editar stock, eliminar)
