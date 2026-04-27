import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  MessageCircle, CheckCircle, Phone, 
  Zap, Copy, ExternalLink, QrCode,
  Smartphone, Send, Share2, RefreshCw,
  Settings, Users, BarChart3, Edit2, X, Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConfiguracionWhatsApp() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(false);
  const [config, setConfig] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRegenerarModal, setShowRegenerarModal] = useState(false);
  const [nuevoCodigoInput, setNuevoCodigoInput] = useState('');
  const [regenerando, setRegenerando] = useState(false);
  
  // Estados para edición de configuración
  const [editConfig, setEditConfig] = useState({
    welcome_message: '',
    ai_tone: 'profesional'
  });
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/whatsapp/configuracion`);
      setConfig(response.data);
      setEditConfig({
        welcome_message: response.data.configuracion?.welcome_message || '',
        ai_tone: response.data.configuracion?.ai_tone || 'profesional'
      });
    } catch (error) {
      console.error('Error cargando config:', error);
      setConfig({ configurado: false });
    } finally {
      setLoading(false);
    }
  };

  const activarWhatsApp = async () => {
    try {
      setActivando(true);
      const response = await axios.post(`${API}/whatsapp/activar`, {});
      
      toast.success(response.data.mensaje || '¡WhatsApp activado!');
      await cargarConfig(); // Recargar configuración
      
    } catch (error) {
      console.error('Error activando WhatsApp:', error);
      toast.error(error.response?.data?.detail || 'Error al activar WhatsApp');
    } finally {
      setActivando(false);
    }
  };

  const regenerarCodigo = async () => {
    try {
      setRegenerando(true);
      const response = await axios.post(`${API}/whatsapp/regenerar-codigo`, {
        nuevo_codigo: nuevoCodigoInput || null
      });
      
      toast.success(response.data.mensaje);
      setShowRegenerarModal(false);
      setNuevoCodigoInput('');
      await cargarConfig();
      
    } catch (error) {
      console.error('Error regenerando código:', error);
      toast.error(error.response?.data?.detail || 'Error al regenerar código');
    } finally {
      setRegenerando(false);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      setGuardandoConfig(true);
      await axios.put(`${API}/whatsapp/configuracion`, editConfig);
      toast.success('Configuración guardada');
      setShowConfigModal(false);
      await cargarConfig();
    } catch (error) {
      console.error('Error guardando config:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const copiarTexto = (texto) => {
    // Usar método fallback directamente (más compatible)
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Copiado al portapapeles');
      } else {
        toast.info('No se pudo copiar automáticamente');
        prompt('Copia este texto (Ctrl+C):', texto);
      }
    } catch (err) {
      document.body.removeChild(textArea);
      toast.info('Copia manual:');
      prompt('Copia este texto (Ctrl+C):', texto);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="whatsapp-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isConfigured = config?.configurado;
  const whatsapp = config?.whatsapp || {};
  const empresa = config?.empresa || {};

  return (
    <div className="space-y-6" data-testid="configuracion-whatsapp-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">WhatsApp Business</h2>
          <p className="text-slate-600">Recibe cotizaciones automáticas por WhatsApp</p>
        </div>
      </div>

      {/* Número de CotizaBot */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm text-emerald-700">Número de atención</p>
              <p className="text-lg font-bold text-emerald-900">{config?.numero_cotizabot}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConfigured ? (
        /* WhatsApp Configurado - Mostrar Assets */
        <>
          {/* Código y Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código único */}
            <Card className="border-2 border-blue-200" data-testid="card-codigo">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge className="bg-blue-600 text-lg px-3 py-1">{whatsapp.codigo}</Badge>
                  <span className="text-slate-600 font-normal">Tu código único</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Tus clientes envían este código para conectarse contigo automáticamente.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copiarTexto(whatsapp.codigo)}
                    data-testid="btn-copiar-codigo"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenerarModal(true)}
                    data-testid="btn-regenerar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Link de WhatsApp */}
            <Card className="border-2 border-emerald-200" data-testid="card-link">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  Link directo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Comparte este link en tu sitio web, redes sociales o tarjetas.
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => copiarTexto(whatsapp.link)}
                    data-testid="btn-copiar-link"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(whatsapp.link, '_blank')}
                    data-testid="btn-probar-link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code */}
          <Card data-testid="card-qr">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-slate-700" />
                Código QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div 
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowQRModal(true)}
                >
                  <img 
                    src={whatsapp.qr_url} 
                    alt="QR Code WhatsApp" 
                    className="w-40 h-40 rounded-lg border-2 border-slate-200"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-medium text-slate-900 mb-2">Imprime y comparte</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Coloca este QR en tu local, tarjetas de presentación, facturas o donde tus clientes puedan escanearlo.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Button
                      variant="outline"
                      onClick={() => setShowQRModal(true)}
                      data-testid="btn-ver-qr-grande"
                    >
                      Ver en grande
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = whatsapp.qr_url;
                        link.download = `qr-whatsapp-${empresa.nombre?.replace(/\s+/g, '-')}.png`;
                        link.click();
                      }}
                      data-testid="btn-descargar-qr"
                    >
                      Descargar QR
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones para clientes */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                Instrucciones para tus clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {whatsapp.instrucciones}
                </pre>
              </div>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => copiarTexto(whatsapp.instrucciones)}
                data-testid="btn-copiar-instrucciones"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar texto
              </Button>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setShowConfigModal(true)}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Personalizar respuestas</h4>
                    <p className="text-sm text-slate-600">Mensaje de bienvenida y tono de la IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:border-emerald-300 transition-colors" onClick={cargarConfig}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Estadísticas</h4>
                    <p className="text-sm text-slate-600">
                      {config?.estadisticas?.conversaciones || 0} conversaciones
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* WhatsApp No Configurado */
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Activa WhatsApp para tu empresa
              </h3>
              
              <p className="text-slate-600 mb-6">
                Tus clientes podrán solicitar cotizaciones automáticas 24/7. 
                Obtendrás un código único, link y QR para compartir.
              </p>

              <div className="bg-emerald-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-emerald-800 mb-2">¿Qué obtienes?</h4>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Código único para tu empresa (ej: FERRESOL)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Link directo para compartir en redes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Código QR para imprimir
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Atención automatizada 24/7
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={activarWhatsApp}
                disabled={activando}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="btn-activar-whatsapp"
              >
                {activando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Activar WhatsApp Gratis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cómo funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo funciona el enrutamiento?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">1. Cliente escanea QR</h4>
              <p className="text-xs text-slate-600">
                O usa el link con tu código
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">2. Envía mensaje</h4>
              <p className="text-xs text-slate-600">
                Con tu código automáticamente
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">3. CotizaBot identifica</h4>
              <p className="text-xs text-slate-600">
                Conecta al cliente con tu empresa
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">4. Cotización enviada</h4>
              <p className="text-xs text-slate-600">
                Con TU catálogo y precios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Número propio (opcional) */}
      {isConfigured && (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-medium text-slate-900">¿Quieres tu propio número de WhatsApp?</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Conecta un número dedicado para que tus clientes te escriban directo sin código.
                  Necesitas un número que <strong>no tenga WhatsApp instalado</strong>.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/onboarding'}
                className="flex-shrink-0"
              >
                Conectar número propio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal QR Grande */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR - {empresa.nombre}</DialogTitle>
            <DialogDescription>
              Escanea o descarga este código para compartir
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <img 
              src={whatsapp.qr_url} 
              alt="QR Code WhatsApp" 
              className="w-72 h-72 rounded-lg border-2 border-slate-200"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQRModal(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                const link = document.createElement('a');
                link.href = whatsapp.qr_url;
                link.download = `qr-whatsapp-${empresa.nombre?.replace(/\s+/g, '-')}.png`;
                link.click();
              }}
            >
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Configuración */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Personalizar respuestas</DialogTitle>
            <DialogDescription>
              Configura cómo responde CotizaBot a tus clientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Mensaje de bienvenida</label>
              <Textarea
                placeholder="¡Hola! Soy el asistente de [tu empresa]. ¿En qué puedo ayudarte?"
                value={editConfig.welcome_message}
                onChange={(e) => setEditConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">
                Este mensaje se envía cuando un cliente nuevo se conecta.
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Tono de la IA</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['profesional', 'amigable', 'formal', 'casual'].map(tono => (
                  <Button
                    key={tono}
                    type="button"
                    variant={editConfig.ai_tone === tono ? 'default' : 'outline'}
                    className="capitalize"
                    onClick={() => setEditConfig(prev => ({ ...prev, ai_tone: tono }))}
                  >
                    {tono}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={guardarConfiguracion}
              disabled={guardandoConfig}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {guardandoConfig ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Regenerar Código */}
      <Dialog open={showRegenerarModal} onOpenChange={setShowRegenerarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerar código</DialogTitle>
            <DialogDescription>
              ⚠️ El código actual dejará de funcionar. Los links y QR anteriores ya no servirán.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700">
              Nuevo código (opcional)
            </label>
            <Input
              placeholder="Ej: FERRESOL, ACEROMX"
              value={nuevoCodigoInput}
              onChange={(e) => setNuevoCodigoInput(e.target.value.toUpperCase())}
              className="mt-1"
              maxLength={10}
            />
            <p className="text-xs text-slate-500 mt-1">
              Deja vacío para generar uno automático. Máximo 10 caracteres, sin espacios.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerarModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={regenerarCodigo}
              disabled={regenerando}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {regenerando ? 'Regenerando...' : 'Regenerar código'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
