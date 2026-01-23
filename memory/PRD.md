# CotizaBot - Product Requirements Document

## Descripción General
CotizaBot es un sistema de IA multi-agente para automatizar cotizaciones y ventas a través de WhatsApp para empresas de materiales de construcción en México. Es una solución SaaS B2B diseñada para PYMEs mexicanas.

**Branding**: CotizaBot by CotizaExpress.com
**Contacto**: +52 81 3078 3171 | contacto@arobegroup.com

---

## Stack Tecnológico
- **Backend**: FastAPI (Python)
- **Frontend**: React.js con Tailwind CSS y Shadcn/UI
- **Base de Datos**: MongoDB
- **AI/LLM**: Sistema multi-agente con LangGraph + OpenAI (Emergent LLM Key)
- **Mensajería**: Twilio WhatsApp API
- **Autenticación**: JWT (JSON Web Tokens)

---

## Planes y Precios

### Plan Gratis ($0)
- 5 cotizaciones incluidas
- Dashboard básico
- Carga de productos desde Excel
- Sin WhatsApp integrado
- Sin soporte prioritario

### Plan Completo ($1,000 MXN/mes + IVA)
- Cotizaciones ilimitadas
- WhatsApp Business API integrado
- Número de WhatsApp propio
- Soporte técnico prioritario
- Capacitación incluida
- Actualizaciones automáticas

---

## Funcionalidades Implementadas

### ✅ Sistema Multi-Tenant y Autenticación (Completado 2026-01-23)
- Registro de usuarios y empresas con plan "gratis" por defecto
- Login con JWT
- Endpoint `/api/auth/me` para obtener datos del usuario autenticado
- Aislamiento de datos por empresa (empresa_id en todas las entidades)
- Límite de 5 cotizaciones para plan gratis

### ✅ Landing Page con Branding y SEO (Completado 2026-01-23)
- Logo de CotizaExpress.com clickeable
- Branding "CotizaBot by CotizaExpress.com"
- Información de contacto en footer
- Contenido SEO para PYMEs mexicanas
- Secciones para ferreterías, materiales de construcción, distribuidoras

### ✅ Página de Precios (Completado 2026-01-23)
- Plan Gratis con 5 cotizaciones
- Plan Completo con cotizaciones ilimitadas
- Tabla comparativa de características
- FAQ

### ✅ Sistema Multi-Agente (Implementado)
- Agente Clasificador: Interpreta intención del mensaje
- Agente Cotizador: Genera cotizaciones
- Agente Comercial: (Parcial)
- Agente Compliance: (Parcial)
- Orquestador con LangGraph

### ✅ Webhook de Twilio/WhatsApp (Funcional)
- Recepción de mensajes por WhatsApp
- Procesamiento con agentes de IA
- Respuestas automáticas

### ✅ Dashboard de Administración
- Métricas de cotizaciones
- Listado de productos
- Gestión de clientes
- Conversaciones
- Carga masiva de productos (Excel)

### ✅ Sistema de Facturación CFDI (Completado 2026-01-23)
- Formulario de datos fiscales completo (RFC, Razón Social, Régimen Fiscal, Uso CFDI, CP, Domicilio)
- Catálogos del SAT cargados (19 regímenes fiscales, 24 usos CFDI)
- Endpoint para guardar datos fiscales de empresa
- Endpoint para solicitar factura con integración Facturama
- Historial de solicitudes de factura
- Integración con Facturama API para generación automática de CFDI
- Fallback a solicitud manual si Facturama falla

### ✅ Envío de Cotizaciones por Email (Completado 2026-01-23)
- Servicio de email con Resend API
- Plantilla HTML profesional para cotizaciones
- PDF adjunto automáticamente al email
- Información de empresa personalizada en emails
- Fallback a dominio de prueba (onboarding@resend.dev) si dominio personalizado no está verificado

### ✅ Portal del Cliente (Completado 2026-01-24)
- Vista pública de cotizaciones mediante enlaces únicos (token-based)
- Endpoint `/api/portal/cotizacion/{token}` - Ver cotización sin login
- Endpoint `/api/portal/cotizacion/{token}/pdf` - Descargar PDF público
- Endpoint `/api/portal/generar-enlace` - Generar enlace para compartir cotización
- Página frontend responsive con datos de la cotización
- Botón para descargar PDF
- Información de contacto de la empresa emisora

### ✅ Integración de Pagos Stripe (Actualizado 2026-01-23)
- Suscripciones mensuales ($1,160 MXN/mes con IVA incluido)
- Endpoint `/api/pagos/crear-suscripcion` - Crea checkout de Stripe
- Endpoint `/api/pagos/checkout-status/{session_id}` - Verifica estado del pago
- Endpoint `/api/pagos/mi-suscripcion` - Info de suscripción actual
- Webhook `/api/webhook/stripe` - Procesa eventos de Stripe
- Página de pago exitoso con polling de estado
- Seguridad: montos hardcodeados en backend (no manipulables)

### ✅ Personalización de Empresa y PDFs (Completado 2026-01-23)
- Endpoint `/api/empresa/logo` - Subir/eliminar logo de empresa
- Endpoint `/api/empresa/perfil` - Ver/actualizar perfil de empresa
- Servicio PDF actualizado para incluir logo personalizado
- Página de perfil en frontend con subida de logo
- Formatos soportados: PNG, JPG, WEBP, SVG (máx 5MB)

### ✅ Flujo de Compra de Número Twilio (Completado 2026-01-23)
- Endpoint `/api/twilio/ciudades` - Lista ciudades mexicanas
- Endpoint `/api/twilio/buscar-numeros` - Busca números disponibles
- Endpoint `/api/twilio/comprar-numero` - Compra y asocia número
- Endpoint `/api/twilio/mi-numero` - Estado del número
- Página de configuración en frontend

### ✅ Configuración de WhatsApp Business (Completado 2026-01-24)
- **Flujo 100% automatizado**: Cliente selecciona ciudad → Sistema compra y configura en segundos
- Endpoint `/api/twilio/solicitar-numero` - Busca, compra y configura automáticamente
- Endpoint `/api/twilio/mi-solicitud` - Estado de la configuración
- Sin intervención manual requerida
- Costo: ~$1.15 USD/mes por número (de cuenta Twilio del SaaS)
- Sin costo adicional para el cliente (incluido en Plan Completo)

---

## Funcionalidades Pendientes (Backlog)

### P1 - Media Prioridad
- [ ] Verificar dominio cotizaexpress.com en Resend para emails personalizados
- [ ] Activar credenciales de Facturama en sandbox/producción
- [ ] Probar flujo completo de compra de número con cuenta Twilio de pago

### P2 - Baja Prioridad
- [ ] Agente de aprendizaje (análisis de cotizaciones ganadas/perdidas)
- [ ] Precios dinámicos basados en volumen
- [ ] Sistema de recomendaciones de productos complementarios

---

## Arquitectura de Archivos

```
/app
├── backend/
│   ├── agents/           # Agentes de IA (clasificador, cotizador, etc.)
│   ├── models/           # Modelos Pydantic (empresa, usuario, cotización, etc.)
│   ├── routes/           # Endpoints FastAPI
│   │   ├── auth.py       # Autenticación (registro, login, me)
│   │   ├── cotizaciones.py # CRUD cotizaciones con límites
│   │   ├── empresa.py    # Perfil, datos fiscales, facturación
│   │   ├── portal_cliente.py # Portal público de cotizaciones
│   │   ├── twilio_numbers.py # Compra y config de números Twilio
│   │   └── webhook.py    # Webhook de WhatsApp
│   ├── services/         # Servicios externos
│   │   ├── email_service.py  # Envío de emails con Resend
│   │   ├── facturama_service.py # Integración CFDI
│   │   ├── pdf_service.py    # Generación de PDFs
│   │   └── whatsapp_service.py # Mensajes WhatsApp
│   ├── utils/auth.py     # Utilidades JWT
│   ├── config.py         # Configuración
│   ├── database.py       # Conexión MongoDB
│   └── server.py         # Aplicación FastAPI
├── frontend/
│   ├── src/
│   │   ├── components/ui/ # Componentes Shadcn
│   │   ├── contexts/AuthContext.js
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── Precios.js
│   │   │   ├── Login.js
│   │   │   ├── Registro.js
│   │   │   ├── Dashboard.js
│   │   │   ├── ConfiguracionWhatsApp.js
│   │   │   ├── PerfilEmpresa.js
│   │   │   ├── PortalCliente.js  # Portal público (sin auth)
│   │   │   └── ...
│   │   └── App.js
│   └── public/logo-cotizaexpress.png
└── test_reports/         # Reportes de pruebas
```

---

## APIs Principales

### Autenticación
- `POST /api/auth/registro` - Registro de usuario y empresa
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Datos del usuario autenticado

### Cotizaciones
- `GET /api/cotizaciones` - Lista cotizaciones (filtro por empresa)
- `POST /api/cotizaciones` - Crear cotización (valida límite de plan)
- `GET /api/cotizaciones/estadisticas` - Límites del plan

### Empresa y Personalización
- `POST /api/empresa/logo` - Subir logo de empresa
- `GET /api/empresa/logo/{filename}` - Obtener logo
- `DELETE /api/empresa/logo` - Eliminar logo
- `GET /api/empresa/perfil` - Obtener perfil de empresa
- `PUT /api/empresa/perfil` - Actualizar perfil

### Pagos (Stripe)
- `GET /api/pagos/planes` - Lista planes disponibles (público)
- `POST /api/pagos/crear-checkout` - Crea sesión de Stripe (auth)
- `GET /api/pagos/checkout-status/{session_id}` - Estado del pago (auth)
- `GET /api/pagos/mi-suscripcion` - Info de suscripción (auth)
- `POST /api/webhook/stripe` - Webhook de eventos Stripe

### Twilio/WhatsApp
- `GET /api/twilio/ciudades` - Lista ciudades para búsqueda
- `POST /api/twilio/buscar-numeros` - Buscar números disponibles
- `POST /api/twilio/comprar-numero` - Comprar número
- `GET /api/twilio/mi-numero` - Estado del número de la empresa
- `POST /api/twilio/configurar-whatsapp` - Configurar webhooks automáticamente
- `GET /api/twilio/estado-configuracion` - Estado del flujo de configuración

### Portal del Cliente (Público)
- `GET /api/portal/cotizacion/{token}` - Ver cotización pública
- `GET /api/portal/cotizacion/{token}/pdf` - Descargar PDF público
- `GET /api/portal/cliente/{token}` - Ver todas las cotizaciones de un cliente
- `POST /api/portal/generar-enlace` - Generar enlace para cotización
- `POST /api/portal/generar-enlace-cliente` - Generar enlace para cliente

### Webhook
- `POST /api/webhook/twilio/whatsapp` - Recibe mensajes de WhatsApp

---

## Credenciales de Prueba
- Email: test@cotizabot.com
- Password: Test123456
- Empresa: Test Empresa
- Plan: gratis

---

## Problemas Conocidos

### BLOQUEADO: Dominio cotizaexpress.com
- Error SSL 525 de Cloudflare
- Requiere configuración de CNAME en modo "DNS Only"
- Depende de acción del usuario en Cloudflare

### PENDIENTE VERIFICACIÓN
- Dominio cotizaexpress.com no verificado en Resend (usa fallback a onboarding@resend.dev)
- Credenciales de Facturama (DistribucionesArobe/Beltran92) pueden requerir activación en sandbox

### PARCIALMENTE IMPLEMENTADO
- pdf_service.py - Genera PDF pero almacenamiento es local
- facturama_service.py - Código listo, requiere credenciales activas
- whatsapp_service.py - Integración Twilio presente, requiere cuenta de pago para webhooks

---

## Próximos Pasos Recomendados
1. Implementar integración de pagos para activar Plan Completo
2. Automatizar configuración de WhatsApp Business para números comprados
3. Probar flujo completo de WhatsApp con el webhook
4. Resolver problema de dominio personalizado con usuario
