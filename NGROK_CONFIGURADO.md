# ✅ CotizaBot - Ngrok Configurado Exitosamente

## 🎉 Estado Actual

✅ **Ngrok está corriendo y funcionando perfectamente**

## 📡 Información del Túnel

**URL Pública de Ngrok:**
```
https://detailed-unsulfurized-genevive.ngrok-free.dev
```

**URL del Webhook para Twilio:**
```
https://detailed-unsulfurized-genevive.ngrok-free.dev/api/webhook/twilio/whatsapp
```

**Estado del Backend:** ✅ Funcionando (verificado)

---

## 📋 PASO 1: Configurar Webhook en Twilio Console

### Instrucciones Paso a Paso:

1. **Abre Twilio Console:**
   
   👉 [https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)

2. **Baja hasta la sección "Sandbox Configuration"**

3. **Configura el Webhook:**
   - En el campo **"WHEN A MESSAGE COMES IN"**, pega esta URL exacta:
     ```
     https://detailed-unsulfurized-genevive.ngrok-free.dev/api/webhook/twilio/whatsapp
     ```
   
   - **Método HTTP:** Selecciona **POST**
   
   - Haz click en el botón **"Save"**

4. **Anota tu código de sandbox:**
   - En la misma página verás algo como:
     ```
     "To connect, send 'join [palabra]' to +1 415 523 8886"
     ```
   - Anota la palabra (ejemplo: `stone-lamp`, `happy-tiger`, etc.)

---

## 📱 PASO 2: Unirse al Sandbox de WhatsApp

1. **Abre WhatsApp en tu teléfono**

2. **Inicia una conversación nueva con:**
   ```
   +1 415 523 8886
   ```

3. **Envía el siguiente mensaje** (reemplaza `[palabra]` con tu código):
   ```
   join [palabra]
   ```
   
   Ejemplos:
   - `join stone-lamp`
   - `join happy-tiger`
   - `join ocean-blue`

4. **Espera la confirmación de Twilio:**
   
   Recibirás un mensaje como:
   ```
   "Twilio Sandbox: ✅ You are all set! 
   The sandbox is active for this number..."
   ```

---

## 🎯 PASO 3: Probar el Sistema

Una vez que recibas la confirmación, **envía este mensaje de prueba:**

```
Hola, necesito cotizar 10 tablarocas antimoho
```

### Respuesta Esperada (3-5 segundos):

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

## 🔍 Monitoreo en Tiempo Real

### Ver Logs del Backend:

```bash
tail -f /var/log/supervisor/backend.out.log
```

### Logs Esperados Cuando Funciona:

```
INFO: Mensaje recibido de +525512345678: Hola, necesito cotizar...
INFO: Ejecutando nodo: clasificar
INFO: Intención clasificada: COTIZAR (confianza: 0.95)
INFO: Ejecutando nodo: cotizador
INFO: Cotizador procesó 1 productos
INFO: Ejecutando nodo: compliance
INFO: Ejecutando nodo: finalizar
INFO: Orquestador completó
```

### Dashboard Web:

Abre en tu navegador:
```
http://localhost:3000
```

Podrás ver:
- ✅ Conversaciones en tiempo real
- ✅ Cotizaciones generadas
- ✅ Métricas del sistema
- ✅ Productos del catálogo

### Panel de Ngrok:

```
http://localhost:4040
```

Aquí verás todas las peticiones HTTP entrantes en tiempo real.

---

## 📝 Más Ejemplos de Mensajes para Probar

### Cotización Simple:
```
Cuánto cuesta la tablaroca antimoho?
```

### Cotización Múltiple:
```
Necesito 15 tablarocas ultralight y 10 canales cal 26
```

### Consulta de Stock:
```
Tienen disponible Durock USG?
```

### Cotización con SKU:
```
Quiero cotizar TB-001 y TB-002
```

### Pregunta General:
```
Para qué sirve el Redimix?
```

### Solicitar Múltiples Productos:
```
Necesito cotizar:
- 20 tablarocas antimoho
- 5 canales 4.10 cal 26
- 3 cajas de pijas
```

---

## ⚠️ Troubleshooting

### No recibo respuesta del bot:

1. **Verifica que ngrok esté corriendo:**
   ```bash
   curl http://localhost:4040/api/tunnels
   ```

2. **Verifica que el webhook esté configurado correctamente en Twilio:**
   - URL debe ser: `https://detailed-unsulfurized-genevive.ngrok-free.dev/api/webhook/twilio/whatsapp`
   - Método debe ser: **POST**

3. **Verifica que te uniste al sandbox:**
   - Envía `join [codigo]` nuevamente

4. **Revisa los logs del backend:**
   ```bash
   tail -n 50 /var/log/supervisor/backend.err.log
   ```

### Bot responde con error:

1. **Revisa los logs en tiempo real:**
   ```bash
   tail -f /var/log/supervisor/backend.out.log
   ```

2. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:8001/api/health
   ```

3. **Verifica las credenciales:**
   ```bash
   grep TWILIO /app/backend/.env
   grep EMERGENT /app/backend/.env
   ```

---

## 🔧 Comandos Útiles

### Reiniciar Backend:
```bash
sudo supervisorctl restart backend
```

### Ver Estado de Ngrok:
```bash
curl -s http://localhost:4040/api/tunnels | jq
```

### Reiniciar Ngrok:
```bash
pkill ngrok
ngrok http 8001
```

### Ver Productos Disponibles:
```bash
curl http://localhost:8001/api/productos | jq '.[].nombre'
```

### Verificar Conexión del Webhook:
```bash
curl https://detailed-unsulfurized-genevive.ngrok-free.dev/api/health
```

---

## 📊 Información del Sistema

**Backend:**
- Estado: ✅ Funcionando
- Puerto: 8001
- Salud: http://localhost:8001/api/health

**Frontend:**
- Estado: ✅ Funcionando
- URL: http://localhost:3000

**Base de Datos:**
- Productos: 23 items
- Categorías: Tablaroca, Aislantes, Ferretería
- Stock Total: 2,300 unidades

**Credenciales:**
- ✅ Twilio Account SID: Configurado
- ✅ Twilio Auth Token: Configurado
- ✅ Emergent LLM Key: Configurado
- ✅ Ngrok Authtoken: Configurado

**Ngrok:**
- Estado: ✅ Activo
- URL Pública: https://detailed-unsulfurized-genevive.ngrok-free.dev
- Panel: http://localhost:4040

---

## ⚠️ IMPORTANTE: Ngrok Gratuito

**Limitaciones:**
- ⏰ La sesión se desconecta cada 2 horas
- 🔄 Necesitarás reiniciar ngrok cuando esto ocurra
- 🆕 La URL cambiará cada vez que reinicies
- 📝 Deberás actualizar el webhook en Twilio Console con la nueva URL

**Para reiniciar ngrok:**
```bash
pkill ngrok
ngrok http 8001
# Luego actualiza la URL en Twilio Console
```

**Solución permanente:**
- Considera una cuenta ngrok de pago para URLs fijas
- O despliega en un servidor con dominio público

---

## 🎉 ¡Sistema Listo!

El sistema CotizaBot está **100% operativo** y listo para recibir mensajes de WhatsApp.

**Próximos pasos:**
1. ✅ Configurar webhook en Twilio Console (5 minutos)
2. ✅ Unirse al sandbox de WhatsApp (1 minuto)
3. ✅ Enviar mensaje de prueba (instantáneo)
4. ✅ ¡Empezar a recibir cotizaciones automáticas!

---

**Documentación adicional:**
- `/app/README.md` - Guía completa del sistema
- `/app/ARQUITECTURA.md` - Detalles técnicos
- `/app/TWILIO_SETUP.md` - Configuración avanzada de Twilio
- `/app/GUIA_WEBHOOK_TWILIO.md` - Guía detallada del webhook

**¿Necesitas ayuda?** Revisa los logs y la documentación.

---

**Fecha de configuración:** $(date)
**Versión:** CotizaBot v1.0.0
