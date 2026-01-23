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

### ✅ Flujo de Compra de Número Twilio (Completado 2026-01-23)
- Endpoint `/api/twilio/ciudades` - Lista ciudades mexicanas
- Endpoint `/api/twilio/buscar-numeros` - Busca números disponibles
- Endpoint `/api/twilio/comprar-numero` - Compra y asocia número
- Endpoint `/api/twilio/mi-numero` - Estado del número
- Página de configuración en frontend

---

## Funcionalidades Pendientes (Backlog)

### P0 - Alta Prioridad
- [ ] Integración de pagos (Stripe/OpenPay) para activar Plan Completo
- [ ] Configuración automática de WhatsApp Business para números comprados

### P1 - Media Prioridad
- [ ] Generación de PDF de cotizaciones
- [ ] Envío de cotizaciones por email
- [ ] Historial de conversaciones mejorado

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
│   │   ├── twilio_numbers.py # Compra de números Twilio
│   │   └── webhook.py    # Webhook de WhatsApp
│   ├── services/         # Servicios externos (PDF, WhatsApp)
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

### Twilio/WhatsApp
- `GET /api/twilio/ciudades` - Lista ciudades para búsqueda
- `POST /api/twilio/buscar-numeros` - Buscar números disponibles
- `POST /api/twilio/comprar-numero` - Comprar número
- `GET /api/twilio/mi-numero` - Estado del número de la empresa

### Webhook
- `POST /api/webhook/twilio/whatsapp` - Recibe mensajes de WhatsApp

---

## Credenciales de Prueba
- Email: test@cotizabot.com
- Password: Test123456
- Empresa: Ferretería El Martillo
- Plan: demo/gratis

---

## Problemas Conocidos

### BLOQUEADO: Dominio cotizaexpress.com
- Error SSL 525 de Cloudflare
- Requiere configuración de CNAME en modo "DNS Only"
- Depende de acción del usuario en Cloudflare

### PARCIALMENTE IMPLEMENTADO
- pdf_service.py - Genera PDF pero almacenamiento es local
- whatsapp_service.py - Integración Twilio presente pero no completamente probada

---

## Próximos Pasos Recomendados
1. Implementar integración de pagos para activar Plan Completo
2. Automatizar configuración de WhatsApp Business para números comprados
3. Probar flujo completo de WhatsApp con el webhook
4. Resolver problema de dominio personalizado con usuario
