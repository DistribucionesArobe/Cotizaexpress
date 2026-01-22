# ✅ CotizaBot - Credenciales Configuradas

## Estado Actual

✅ **Twilio Account SID**: Configurado  
✅ **Twilio Auth Token**: Configurado  
✅ **WhatsApp Number**: +14155238886 (Sandbox)  
✅ **Emergent LLM Key**: Configurado  
✅ **Backend**: Funcionando correctamente

## Próximos Pasos para Activar WhatsApp

### 1. Configurar Webhook en Twilio Console

**URL del Webhook que necesitas configurar en Twilio:**

Si tu aplicación está en producción con dominio público:
```
https://tu-dominio.com/api/webhook/twilio/whatsapp
```

Si estás en desarrollo local, usa ngrok:

```bash
# Instalar ngrok (si no lo tienes)
npm install -g ngrok

# Exponer el backend (puerto 8001)
ngrok http 8001

# Usar la URL HTTPS que ngrok te proporciona
# Ejemplo: https://abc123.ngrok.io/api/webhook/twilio/whatsapp
```

### 2. Configurar en Twilio Console

1. Ve a: [https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)

2. En la sección **"Sandbox Configuration"**, configura:
   - **WHEN A MESSAGE COMES IN**: `https://tu-url/api/webhook/twilio/whatsapp`
   - **METHOD**: POST
   - Guarda los cambios

### 3. Unirte al Sandbox de WhatsApp

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje al número: **+1 415 523 8886**
3. Texto del mensaje (copia el código exacto de tu Twilio Console):
   ```
   join [tu-codigo-sandbox]
   ```
   Ejemplo: `join stone-lamp` o `join happy-tiger`
   
4. Recibirás confirmación de Twilio cuando te unas exitosamente

### 4. Probar el Sistema

Una vez configurado, envía este mensaje de prueba:

```
Hola, necesito cotizar 10 tablarocas antimoho y 5 canales
```

**Respuesta esperada del bot:**
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

### 5. Monitorear Logs

Mientras pruebas, monitorea los logs del backend:

```bash
# Ver logs en tiempo real
tail -f /var/log/supervisor/backend.out.log

# Buscar errores
tail -f /var/log/supervisor/backend.err.log
```

**Logs esperados:**
```
INFO: Mensaje recibido de +525512345678: Hola, necesito cotizar...
INFO: Ejecutando nodo: clasificar
INFO: Intención clasificada: COTIZAR (confianza: 0.95)
INFO: Ejecutando nodo: cotizar
INFO: Cotizador procesó 2 productos
INFO: Ejecutando nodo: compliance
INFO: Ejecutando nodo: finalizar
INFO: Orquestador completó. Agentes ejecutados: ['clasificador', 'cotizador', 'compliance']
```

## Verificación del Sistema

### Verificar Backend
```bash
curl http://localhost:8001/api/health
```

### Verificar Productos en Catálogo
```bash
curl http://localhost:8001/api/productos | jq '.[:3]'
```

### Verificar Dashboard Web
Abre en tu navegador: http://localhost:3000

## Ejemplos de Mensajes para Probar

### Cotización Simple
```
Cuánto cuesta la tablaroca antimoho?
```

### Cotización con Cantidades
```
Necesito 15 tablarocas ultralight y 10 canales cal 26
```

### Consulta de Stock
```
Tienen disponible Durock USG?
```

### Pregunta General
```
Para qué sirve el Basecoat?
```

## Troubleshooting

### Si no recibes respuesta del bot:

1. **Verifica el webhook en Twilio Console**
   - Debe estar configurado y guardado
   - Método debe ser POST

2. **Verifica que el backend esté corriendo**
   ```bash
   sudo supervisorctl status backend
   ```

3. **Verifica logs del backend**
   ```bash
   tail -n 50 /var/log/supervisor/backend.err.log
   ```

4. **Si usas ngrok, verifica que esté corriendo**
   ```bash
   # Debe mostrar la URL activa
   curl http://127.0.0.1:4040/api/tunnels
   ```

### Si el bot responde pero con errores:

1. **Verifica la Emergent LLM Key**
   ```bash
   grep EMERGENT_LLM_KEY /app/backend/.env
   ```

2. **Verifica logs de MongoDB**
   ```bash
   mongo --eval "db.adminCommand('ping')"
   ```

3. **Revisa logs de agentes en el dashboard**
   - Ve a: http://localhost:3000
   - Navega a "Conversaciones"
   - Revisa los mensajes intercambiados

## Recursos

- **Documentación Completa**: /app/README.md
- **Arquitectura Técnica**: /app/ARQUITECTURA.md
- **Guía de Twilio**: /app/TWILIO_SETUP.md
- **Twilio Console**: https://console.twilio.com
- **Dashboard Local**: http://localhost:3000

## Soporte

Si encuentras problemas:

1. Verifica todos los logs mencionados arriba
2. Confirma que todas las configuraciones están correctas
3. Revisa la documentación en los archivos README

---

**¡El sistema está 100% listo para recibir mensajes de WhatsApp!** 🚀

Solo necesitas configurar el webhook en Twilio Console y unirte al sandbox.
