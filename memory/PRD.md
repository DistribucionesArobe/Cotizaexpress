# CotizaBot - Product Requirements Document

## Descripción del Producto
CotizaBot es un SaaS B2B que automatiza cotizaciones y ventas a través de WhatsApp para empresas de materiales de construcción en México y LATAM.

## Arquitectura Técnica
- **Backend**: FastAPI (Python)
- **Frontend**: React.js con Shadcn UI
- **Database**: MongoDB
- **Auth**: JWT con roles (admin, user)
- **WhatsApp**: 360dialog (número único centralizado) - *Migrado desde Twilio*
- **Pagos SaaS**: Stripe (suscripciones)
- **Pagos In-Chat**: Mercado Pago + SPEI (Plan Pro)
- **Facturación**: Facturama (CFDI México)
- **LLM**: OpenAI GPT-4o vía Emergent LLM Key

---

## Arquitectura de WhatsApp Multi-Tenant (ACTUALIZADO - Feb 2026)

### Concepto
UN solo número de WhatsApp verificado de CotizaBot (+5218344291628) para TODAS las empresas.
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
- **Link WhatsApp**: `wa.me/5218344291628?text=CODIGO`
- **QR Code**: URL generada automáticamente
- **Instrucciones**: Texto para compartir con clientes

---

## Plan Pro - Flujo de Cobros (NUEVO - Feb 2026)

### Concepto
Las empresas con Plan Pro ($2,320 MXN/mes) pueden cobrar directamente a través del bot de WhatsApp.

### Métodos de Pago Soportados
1. **Mercado Pago**: Link de pago (tarjeta, OXXO, transferencia)
2. **SPEI**: Datos bancarios automáticos (CLABE, banco, beneficiario)

### Flujo de Cobro
```
Cliente: "Quiero 5 sacos de cemento"
Bot: Cotización #COT-XXX - Total: $1,148.40 MXN. ¿Confirmas?
Cliente: "Sí"
Bot: ¿Cómo deseas pagar?
     1 - 💳 Mercado Pago
     2 - 🏦 Transferencia SPEI
Cliente: "2"
Bot: 💳 Datos para transferencia SPEI
     Banco: BBVA México
     Beneficiario: Ferretería El Martillo
     CLABE: 012180001234567890
     Monto: $1,148.40 MXN
     Concepto: Pago COT-XXX
```

### Archivos Clave
- `/app/backend/agents/agente_cobros.py` - Agente de cobros
- `/app/backend/services/cobro_service.py` - Servicio de pagos
- `/app/frontend/src/pages/ConfigCobros.js` - UI de configuración
- `/app/frontend/src/pages/Precios.js` - Planes con Plan Pro

---

## Funcionalidades Implementadas

### Core
- [x] Autenticación JWT con roles
- [x] Registro de empresas (multi-tenant)
- [x] CRUD de productos (manual + Excel)
- [x] Generación de cotizaciones por WhatsApp
- [x] Dashboard de administración

### WhatsApp
- [x] Número único centralizado (+5218344291628)
- [x] Router multi-tenant con identificación automática
- [x] Código único por empresa
- [x] Link directo y QR Code
- [x] Personalización de mensaje de bienvenida
- [x] Deduplicación de mensajes (evita respuestas duplicadas)
- [x] Memoria de cliente (recuerda empresa asociada)

### Sistema Multi-Agente
- [x] Clasificador de intenciones (COTIZAR, CONFIRMAR, METODO_PAGO, etc.)
- [x] Agente Cotizador (genera cotizaciones con IA)
- [x] Agente de Cobros (Plan Pro - procesa pagos)
- [x] Agente Compliance (validaciones)
- [x] Orquestador LangGraph

### Pagos SaaS (Stripe)
- [x] Plan Gratis: 5 cotizaciones/mes
- [x] Plan Completo: $1,160 MXN/mes (200 cotizaciones)
- [x] Plan Pro: $2,320 MXN/mes (ilimitado + cobros in-chat)

### Pagos In-Chat (Plan Pro)
- [x] Configuración de datos bancarios SPEI
- [x] Configuración de Mercado Pago
- [x] Generación de datos de pago automáticos
- [x] Registro de pagos pendientes

### Facturación
- [x] Integración Facturama (CFDI México)
- [x] Captura de datos fiscales

---

## Pendientes

### P0 - Crítico
- [ ] Verificar webhook en dominio de producción (Cloudflare cache)

### P1 - Importante  
- [ ] Notificaciones de pago (WhatsApp/Email cuando cliente paga)
- [ ] Dashboard de leads de WhatsApp

### P2 - Mejoras
- [ ] Blog para SEO
- [ ] Agente de aprendizaje (análisis de cotizaciones)
- [ ] Precios dinámicos
- [ ] Dashboard para clientes finales

---

## Credenciales de Prueba
- **Admin**: `test@cotizabot.com` / `test`
- **Usuario Pro**: `ealejandro.robledo@gmail.com`
- **Stripe Test**: `4242 4242 4242 4242`
- **Empresa Pro de prueba**: "Ferretería El Martillo" (código: FERRETER)

---

## Changelog

### 2026-02-03
- **IMPLEMENTADO**: SEO Completo
  - Landing Page optimizada con H1, H2, meta tags, FAQ, casos de uso
  - Nuevas páginas SEO: /demo, /ferreterias, /refaccionarias, /servicios-tecnicos, /privacidad, /terminos
  - sitemap.xml y robots.txt generados
  - Plan Pro destacado en lugar de Plan Gratis en landing
  - CTAs directos a WhatsApp Demo
- **IMPLEMENTADO**: Nuevo prompt del bot como vendedor humano
  - Clasificador mejorado para entender intención (no forma)
  - Cotizador estima cantidades si no se dan
  - Nunca dice "no entendí"
  - Modo DEMO disponible escribiendo "DEMO"
- **MEJORADO**: Comando CAMBIAR simplificado (pide código, no lista empresas)
- **CREADO**: Código promocional ROBLEDO92 (100% descuento)

### 2026-02-02
- **IMPLEMENTADO**: Flujo completo de cobros para Plan Pro
- Nuevo agente de cobros (agente_cobros.py)
- Clasificador actualizado con intenciones CONFIRMAR y METODO_PAGO
- Cotizaciones se guardan en BD con folio único
- Generación de datos SPEI y links de Mercado Pago
- Registro de pagos pendientes para tracking

### 2026-02-01
- Migración completa de Twilio a 360dialog
- Implementación de deduplicación de mensajes
- Mejora de memoria de cliente (router multi-tenant)
- Corrección de verificación de webhook (hub.challenge)

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
