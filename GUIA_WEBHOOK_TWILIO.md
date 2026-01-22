# 🚀 Guía Paso a Paso: Configurar Webhook de Twilio

## ✅ Estado Actual del Sistema

Tu sistema CotizaBot está **100% configurado y listo**:
- ✅ Backend funcionando en puerto 8001
- ✅ Credenciales de Twilio configuradas
- ✅ Catálogo de 23 productos cargado
- ✅ Agentes IA configurados con Emergent LLM Key
- ✅ Dashboard operativo

**Solo falta**: Conectar Twilio con tu backend mediante el webhook.

---

## 📋 OPCIÓN A: Usar ngrok (Desarrollo Local - RECOMENDADO)

### Paso 1: Configurar ngrok

1. **Crear cuenta gratuita en ngrok**:
   - Ve a: https://dashboard.ngrok.com/signup
   - Regístrate con tu email

2. **Obtener tu authtoken**:
   - Una vez dentro, ve a: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia tu authtoken (se ve como: `2abc...xyz`)

3. **Configurar ngrok en el servidor**:
   ```bash
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

4. **Iniciar túnel ngrok**:
   ```bash
   ngrok http 8001
   ```

5. **Copiar la URL pública**:
   Verás algo como:
   ```
   Forwarding   https://abc123.ngrok.io -> http://localhost:8001
   ```
   
   **Tu URL de webhook será**:
   ```
   https://abc123.ngrok.io/api/webhook/twilio/whatsapp
   ```

### Paso 2: Configurar Webhook en Twilio Console

1. **Ir a Twilio Console**:
   - Abre: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

2. **Encontrar tu código del sandbox**:
   - En la página verás: "To connect, send 'join [palabra]' to +1 415 523 8886"
   - Ejemplo: "join stone-lamp" o "join happy-tiger"
   - **Anota tu código** (lo necesitarás en el paso 4)

3. **Configurar el Webhook**:
   - Baja hasta la sección **"Sandbox Configuration"**
   - En el campo **"WHEN A MESSAGE COMES IN"**, pega:
     ```
     https://abc123.ngrok.io/api/webhook/twilio/whatsapp
     ```
     (Reemplaza `abc123.ngrok.io` con tu URL de ngrok)
   
   - Asegúrate que el método HTTP sea: **POST**
   - Click en **"Save"**

4. **Unirte al Sandbox desde WhatsApp**:
   - Abre WhatsApp en tu teléfono
   - Envía un mensaje a: **+1 415 523 8886**
   - Texto exacto: `join tu-codigo` (ej: `join stone-lamp`)
   - Recibirás confirmación: "You are all set! The sandbox is active for this number..."

### Paso 3: Probar el Sistema

Envía este mensaje de prueba:
```
Hola, necesito cotizar 10 tablarocas antimoho
```

**Respuesta esperada** (en 3-5 segundos):
```
Cotización para Cliente:

• Tablaroca antimoho USG: 10 Pieza x $340.10 = $3,401.00 MXN

Subtotal: $3,401.00 MXN
IVA (16%): $544.16 MXN
Total: $3,945.16 MXN

💡 También te recomiendo: Redimix, Basecoat

⚠️ IVA aplicado: 16% ($544.16 MXN)
📍 Cotización válida por 15 días.
```

---

## 📋 OPCIÓN B: Usar Dominio Público (Producción)

Si tu aplicación ya está en un servidor con dominio público:

### URL del Webhook:
```
https://tu-dominio.com/api/webhook/twilio/whatsapp
```

### Pasos en Twilio Console:
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. En "WHEN A MESSAGE COMES IN": `https://tu-dominio.com/api/webhook/twilio/whatsapp`
3. Método: **POST**
4. Guarda cambios
5. Únete al sandbox enviando `join codigo` al +1 415 523 8886

---

## 🔍 Verificación del Webhook

### Verificar que el endpoint está accesible:

**Con ngrok:**
```bash
curl https://abc123.ngrok.io/api/health
```

**Con dominio público:**
```bash
curl https://tu-dominio.com/api/health
```

**Respuesta esperada:**
```json
{"status":"healthy","service":"CotizaBot","version":"1.0.0"}
```

---

## 📊 Monitoreo en Tiempo Real

### Ver logs del backend mientras pruebas:

```bash
# Terminal 1: Logs de éxito
tail -f /var/log/supervisor/backend.out.log

# Terminal 2: Logs de errores
tail -f /var/log/supervisor/backend.err.log
```

### Logs esperados cuando funciona correctamente:

```
INFO: Mensaje recibido de +525512345678: Hola, necesito cotizar...
INFO: Ejecutando nodo: clasificar
INFO: Intención clasificada: COTIZAR (confianza: 0.95)
INFO: Ejecutando nodo: cotizar
INFO: Cotizador procesó 1 productos
INFO: Ejecutando nodo: compliance
INFO: Ejecutando nodo: finalizar
INFO: Orquestador completó. Agentes ejecutados: ['clasificador', 'cotizador', 'compliance']
```

---

## 🎯 Ejemplos de Mensajes para Probar

Una vez configurado, prueba estos mensajes:

### 1. Cotización Simple
```
Cuánto cuesta la tablaroca antimoho?
```

### 2. Cotización con Múltiples Productos
```
Necesito 15 tablarocas ultralight y 10 canales cal 26
```

### 3. Consulta de Stock
```
Tienen disponible Durock USG?
```

### 4. Cotización con SKU
```
Quiero cotizar TB-002 y FE-001
```

### 5. Pregunta General
```
Para qué sirve el Redimix?
```

---

## ⚠️ Troubleshooting

### Problema: No recibo respuesta del bot

**Verifica:**

1. **Ngrok está corriendo**:
   ```bash
   curl http://localhost:4040/api/tunnels
   ```

2. **Backend está corriendo**:
   ```bash
   curl http://localhost:8001/api/health
   ```

3. **Webhook está configurado en Twilio**:
   - Ve a Twilio Console
   - Verifica que la URL sea correcta
   - Método debe ser POST

4. **Te uniste al sandbox**:
   - Envía `join codigo` nuevamente

### Problema: Bot responde con error

**Revisa logs**:
```bash
tail -n 100 /var/log/supervisor/backend.err.log
```

**Verifica credenciales**:
```bash
grep TWILIO /app/backend/.env
grep EMERGENT /app/backend/.env
```

### Problema: Ngrok se desconecta

Ngrok gratis se desconecta cada 2 horas. Para mantenerlo activo:

```bash
# Reiniciar ngrok
pkill ngrok
ngrok http 8001
```

O considera una cuenta ngrok de pago para túneles permanentes.

---

## 📱 Dashboard Web

Mientras pruebas, puedes monitorear en tiempo real:

**Abrir dashboard**: http://localhost:3000

Podrás ver:
- Conversaciones en tiempo real
- Cotizaciones generadas
- Métricas del sistema
- Logs de agentes

---

## 🚀 Comandos Rápidos de Referencia

```bash
# Iniciar ngrok
ngrok http 8001

# Ver URL de ngrok
curl -s http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'

# Verificar backend
curl http://localhost:8001/api/health

# Ver logs en vivo
tail -f /var/log/supervisor/backend.out.log

# Reiniciar backend
sudo supervisorctl restart backend

# Ver productos disponibles
curl http://localhost:8001/api/productos | jq '.[].nombre'

# Ver dashboard
open http://localhost:3000  # o visita en navegador
```

---

## 📞 Próximos Pasos Después de la Configuración

Una vez que el webhook funcione:

1. **Probar todos los flujos**:
   - Cotizaciones simples y complejas
   - Consultas de stock
   - Preguntas generales

2. **Revisar dashboard**:
   - Ver cotizaciones generadas
   - Revisar conversaciones
   - Analizar métricas

3. **Ajustar catálogo**:
   - Agregar más productos
   - Actualizar precios
   - Configurar stock real

4. **Personalizar respuestas**:
   - Modificar prompts en `/app/backend/agents/`
   - Ajustar tono de respuestas
   - Añadir productos complementarios específicos

---

## 🎉 ¿Todo Funcionando?

Si recibes cotizaciones correctamente por WhatsApp:

✅ **¡Felicidades! CotizaBot está operativo**

Próximos pasos opcionales:
- Pasar a producción con número propio de WhatsApp Business
- Implementar multi-tenant para múltiples empresas
- Añadir más agentes (Comercial, Aprendizaje)
- Integrar con tu ERP/sistema de facturación

---

**Necesitas ayuda?** Revisa:
- `/app/README.md` - Documentación completa
- `/app/ARQUITECTURA.md` - Detalles técnicos
- `/app/TWILIO_SETUP.md` - Guía detallada de Twilio
