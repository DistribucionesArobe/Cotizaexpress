# Guía: Configurar Dominio cotizaexpress.com

## 📋 Requisitos Previos

Tienes dos opciones para apuntar tu dominio:

### Opción A: Servidor con IP Pública (RECOMENDADO para producción)
- Servidor en AWS, DigitalOcean, Google Cloud, Azure, etc.
- IP pública estática
- Puertos 80 (HTTP) y 443 (HTTPS) abiertos

### Opción B: Servidor Local con Túnel Permanente
- Ngrok con plan de pago (dominio personalizado)
- Cloudflare Tunnel (gratis)
- Serveo o LocalTunnel

---

## 🎯 OPCIÓN A: Servidor con IP Pública (Producción)

### Paso 1: Obtener IP del Servidor

Si tu servidor está en la nube, obtén su IP pública:

```bash
# En tu servidor, ejecuta:
curl ifconfig.me
```

Ejemplo de IP: `45.123.456.78`

### Paso 2: Configurar DNS en Namecheap

1. **Inicia sesión en Namecheap:**
   - Ve a: https://www.namecheap.com/myaccount/login/

2. **Accede a Domain List:**
   - Dashboard → Domain List
   - Click en "Manage" junto a cotizaexpress.com

3. **Ir a Advanced DNS:**
   - Click en la pestaña "Advanced DNS"

4. **Agregar/Editar Registros:**

   **Registro A (para dominio principal):**
   ```
   Type: A Record
   Host: @
   Value: 45.123.456.78 (tu IP pública)
   TTL: Automatic
   ```

   **Registro A (para www):**
   ```
   Type: A Record
   Host: www
   Value: 45.123.456.78 (tu IP pública)
   TTL: Automatic
   ```

   **Registro CNAME (para subdominio api - opcional):**
   ```
   Type: CNAME Record
   Host: api
   Value: cotizaexpress.com
   TTL: Automatic
   ```

5. **Guardar cambios:**
   - Los cambios pueden tardar de 5 minutos a 48 horas en propagarse
   - Generalmente es instantáneo con Namecheap

### Paso 3: Verificar Propagación DNS

```bash
# Verificar registro A
nslookup cotizaexpress.com

# O usando dig
dig cotizaexpress.com

# O online
# Visita: https://dnschecker.org
```

### Paso 4: Configurar Nginx en el Servidor

Instalar Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

Crear configuración para cotizaexpress.com:

```bash
sudo nano /etc/nginx/sites-available/cotizaexpress
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name cotizaexpress.com www.cotizaexpress.com;

    # Frontend React
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/cotizaexpress /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 5: Configurar SSL con Let's Encrypt (HTTPS)

Instalar Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtener certificado SSL:
```bash
sudo certbot --nginx -d cotizaexpress.com -d www.cotizaexpress.com
```

Sigue las instrucciones:
- Ingresa tu email
- Acepta términos
- Elige si quieres recibir emails (opcional)
- Elige opción 2: Redirect HTTP to HTTPS

Verificar renovación automática:
```bash
sudo certbot renew --dry-run
```

### Paso 6: Actualizar Variables de Entorno

En el servidor, actualizar `/app/frontend/.env`:
```bash
REACT_APP_BACKEND_URL=https://cotizaexpress.com
```

Reiniciar servicios:
```bash
sudo supervisorctl restart frontend backend
```

### Paso 7: Actualizar Webhook en Twilio

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Actualizar URL del webhook a:
   ```
   https://cotizaexpress.com/api/webhook/twilio/whatsapp
   ```
3. Guardar cambios

---

## 🔧 OPCIÓN B: Servidor Local con Cloudflare Tunnel (GRATIS)

### Paso 1: Instalar Cloudflare Tunnel

```bash
# Descargar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64

# Mover a bin
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

### Paso 2: Autenticar con Cloudflare

```bash
cloudflared tunnel login
```

Esto abrirá un navegador para autorizar. Selecciona tu dominio cotizaexpress.com.

### Paso 3: Crear Túnel

```bash
cloudflared tunnel create cotizabot
```

Guarda el UUID que te da (ejemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Paso 4: Configurar Túnel

Crear archivo de configuración:
```bash
nano ~/.cloudflared/config.yml
```

Contenido:
```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: /root/.cloudflared/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: cotizaexpress.com
    service: http://localhost:3000
  - hostname: www.cotizaexpress.com
    service: http://localhost:3000
  - hostname: api.cotizaexpress.com
    service: http://localhost:8001
  - service: http_status:404
```

### Paso 5: Configurar DNS en Namecheap

En Advanced DNS de Namecheap, agregar:

```
Type: CNAME Record
Host: @
Value: a1b2c3d4-e5f6-7890-abcd-ef1234567890.cfargotunnel.com
TTL: Automatic

Type: CNAME Record
Host: www
Value: a1b2c3d4-e5f6-7890-abcd-ef1234567890.cfargotunnel.com
TTL: Automatic
```

(Reemplaza `a1b2c3d4-e5f6-7890-abcd-ef1234567890` con tu UUID de túnel)

### Paso 6: Ejecutar Túnel

```bash
# Probar primero
cloudflared tunnel run cotizabot

# Si funciona, instalar como servicio
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Paso 7: Verificar

Visita: https://cotizaexpress.com

---

## 🎯 OPCIÓN C: Ngrok con Dominio Personalizado (Plan de Pago)

### Requisitos:
- Cuenta Ngrok Pro ($10/mes): https://dashboard.ngrok.com/billing/plan

### Paso 1: Configurar Dominio en Ngrok

1. Ve a: https://dashboard.ngrok.com/cloud-edge/domains
2. Click en "New Domain"
3. Ingresa: cotizaexpress.com
4. Copia el valor CNAME que te dan

### Paso 2: Configurar DNS en Namecheap

En Advanced DNS:
```
Type: CNAME Record
Host: @
Value: [valor que te dio ngrok]
TTL: Automatic
```

### Paso 3: Iniciar Ngrok con Dominio Personalizado

```bash
ngrok http 3000 --domain=cotizaexpress.com
```

O crear archivo de configuración `~/.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: TU_AUTH_TOKEN
tunnels:
  frontend:
    proto: http
    addr: 3000
    domain: cotizaexpress.com
  backend:
    proto: http
    addr: 8001
    domain: api.cotizaexpress.com
```

Iniciar:
```bash
ngrok start --all
```

---

## ✅ Verificación Final

### 1. Verificar DNS
```bash
ping cotizaexpress.com
```

### 2. Verificar HTTPS
Visita: https://cotizaexpress.com

### 3. Verificar API
```bash
curl https://cotizaexpress.com/api/health
```

### 4. Verificar Webhook
Envía mensaje de prueba por WhatsApp

---

## 🔍 Troubleshooting

### Problema: "DNS_PROBE_FINISHED_NXDOMAIN"
- Espera 5-10 minutos para propagación DNS
- Verifica configuración en Namecheap
- Usa https://dnschecker.org para verificar

### Problema: "502 Bad Gateway"
- Verifica que backend/frontend estén corriendo
- Revisa configuración de Nginx
- Checa logs: `sudo tail -f /var/log/nginx/error.log`

### Problema: "ERR_SSL_PROTOCOL_ERROR"
- Verifica certificado SSL: `sudo certbot certificates`
- Renueva: `sudo certbot renew`
- Revisa Nginx: `sudo nginx -t`

### Problema: Webhook no funciona
- Verifica URL en Twilio Console
- Debe ser HTTPS en producción
- Verifica logs del backend

---

## 📊 Comparación de Opciones

| Feature | Servidor Cloud | Cloudflare Tunnel | Ngrok Pro |
|---------|---------------|-------------------|-----------|
| Costo | $5-20/mes | Gratis | $10/mes |
| SSL | Manual (Let's Encrypt) | Automático | Automático |
| Performance | Alto | Medio | Medio |
| Confiabilidad | Alto | Alto | Medio |
| Recomendado para | Producción | Desarrollo/Staging | Desarrollo |

---

## 🚀 Recomendación

**Para producción (CotizaBot real):**
- Usa **Opción A: Servidor Cloud con IP Pública**
- DigitalOcean Droplet: $6/mes
- AWS Lightsail: $5/mes
- Google Cloud E2-micro: Gratis (nivel siempre gratuito)

**Para desarrollo/pruebas:**
- Usa **Opción B: Cloudflare Tunnel** (gratis y confiable)

---

## 📞 Siguiente Paso

¿Qué opción prefieres? Te ayudo con la configuración específica:
1. ¿Tienes un servidor en la nube? (cuál servicio)
2. ¿Prefieres usar Cloudflare Tunnel por ahora? (gratis)
3. ¿Quieres contratar Ngrok Pro?

Dime cuál opción y te guío paso a paso con comandos específicos.
