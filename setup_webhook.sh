#!/bin/bash

# Script de Configuración de CotizaBot con Ngrok
# Autor: Emergent AI
# Uso: bash setup_webhook.sh

set -e

echo "🤖 CotizaBot - Configuración de Webhook"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ Ngrok no está instalado${NC}"
    echo ""
    echo "Instalando ngrok..."
    cd /tmp
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz
    tar xzf ngrok-v3-stable-linux-arm64.tgz
    sudo mv ngrok /usr/local/bin/
    echo -e "${GREEN}✅ Ngrok instalado${NC}"
fi

# Verificar configuración de ngrok
if ! ngrok config check &> /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  Ngrok requiere autenticación${NC}"
    echo ""
    echo "Pasos para obtener tu authtoken:"
    echo "1. Ve a: https://dashboard.ngrok.com/signup"
    echo "2. Crea una cuenta gratuita"
    echo "3. Obtén tu authtoken en: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    read -p "Ingresa tu ngrok authtoken: " NGROK_TOKEN
    
    if [ -z "$NGROK_TOKEN" ]; then
        echo -e "${RED}❌ Token no proporcionado${NC}"
        exit 1
    fi
    
    ngrok config add-authtoken "$NGROK_TOKEN"
    echo -e "${GREEN}✅ Ngrok configurado${NC}"
fi

# Verificar que el backend esté corriendo
echo ""
echo "Verificando backend..."
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend funcionando correctamente${NC}"
else
    echo -e "${RED}❌ Backend no está respondiendo${NC}"
    echo "Intentando reiniciar..."
    sudo supervisorctl restart backend
    sleep 3
    
    if curl -s http://localhost:8001/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend reiniciado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error: Backend no responde. Verifica los logs.${NC}"
        exit 1
    fi
fi

# Detener cualquier instancia previa de ngrok
pkill ngrok 2>/dev/null || true
sleep 2

# Iniciar ngrok
echo ""
echo "Iniciando túnel ngrok..."
nohup ngrok http 8001 > /tmp/ngrok.log 2>&1 &
sleep 5

# Obtener URL pública
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'tunnels' in data and len(data['tunnels']) > 0:
        print(data['tunnels'][0]['public_url'])
    else:
        print('')
except:
    print('')
" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ No se pudo obtener la URL de ngrok${NC}"
    echo "Verifica los logs: cat /tmp/ngrok.log"
    exit 1
fi

WEBHOOK_URL="${NGROK_URL}/api/webhook/twilio/whatsapp"

echo -e "${GREEN}✅ Túnel ngrok iniciado correctamente${NC}"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    INFORMACIÓN DEL WEBHOOK                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}URL Pública de Ngrok:${NC}"
echo "  $NGROK_URL"
echo ""
echo -e "${GREEN}URL del Webhook para Twilio:${NC}"
echo "  $WEBHOOK_URL"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              PASOS PARA CONFIGURAR EN TWILIO                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo ""
echo "2. En la sección 'Sandbox Configuration':"
echo "   - Campo 'WHEN A MESSAGE COMES IN': Pega esta URL:"
echo "     ${WEBHOOK_URL}"
echo "   - Método HTTP: POST"
echo "   - Click en 'Save'"
echo ""
echo "3. En la misma página, encontrarás tu código de sandbox:"
echo "   - Ejemplo: 'join stone-lamp' o 'join happy-tiger'"
echo ""
echo "4. Desde tu WhatsApp personal:"
echo "   - Envía un mensaje a: +1 415 523 8886"
echo "   - Texto: join [tu-codigo]"
echo "   - Ejemplo: join stone-lamp"
echo ""
echo "5. Una vez configurado, envía un mensaje de prueba:"
echo "   'Hola, necesito cotizar 10 tablarocas antimoho'"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     MONITOREO DEL SISTEMA                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Ver logs en tiempo real:"
echo "  tail -f /var/log/supervisor/backend.out.log"
echo ""
echo "Dashboard web:"
echo "  http://localhost:3000"
echo ""
echo "Estado de ngrok:"
echo "  http://localhost:4040"
echo ""
echo "Verificar webhook:"
echo "  curl ${NGROK_URL}/api/health"
echo ""
echo -e "${GREEN}✅ Sistema listo para recibir mensajes de WhatsApp${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Ngrok gratis se desconecta cada 2 horas${NC}"
echo "   Para mantenerlo activo, ejecuta este script nuevamente."
echo ""
echo "Presiona Ctrl+C para salir del monitoreo de logs..."
echo ""

# Mostrar logs en tiempo real
tail -f /var/log/supervisor/backend.out.log
