import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  MessageCircle, CheckCircle,
  Settings, BarChart3
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
  const [config, setConfig] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

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

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="whatsapp-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isConnected = config?.wa_phone_number_id;
  const empresa = config?.empresa || {};

  return (
    <div className="space-y-6" data-testid="configuracion-whatsapp-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">WhatsApp Business</h2>
            {isConnected && (
              <Badge className="bg-emerald-500 text-white">Conectado</Badge>
            )}
          </div>
          <p className="text-slate-600 mt-1">
            {isConnected
              ? 'Recibe cotizaciones automáticas por WhatsApp'
              : 'Conecta tu número para recibir cotizaciones automáticas'
            }
          </p>
        </div>
      </div>

      {!isConnected ? (
        /* State 1: WhatsApp NOT connected */
        <>
          {/* Main benefits card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="py-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-slate-900 mb-4">¿Qué obtienes?</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Cotizaciones automáticas 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Su propio número de WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Respuestas inteligentes con IA</span>
                  </li>
                </ul>

                <Button
                  onClick={() => window.location.href = '/onboarding'}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mb-6"
                >
                  Conectar mi WhatsApp
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* Antes de conectar */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">Antes de conectar, prepara tu número</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Consigue un número dedicado para el bot</p>
                    <p className="text-xs text-slate-600">Compra un chip prepago (~$50 MXN). Este número será exclusivo para tu CotizaBot.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">NO le instales WhatsApp al chip</p>
                    <p className="text-xs text-slate-600">El número debe estar limpio — sin WhatsApp ni WhatsApp Business instalado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">¿Ya tiene WhatsApp Business? Desconéctalo primero</p>
                    <p className="text-xs text-slate-600">Abre WhatsApp Business → Ajustes → Cuenta → Eliminar cuenta. Espera 3 minutos y luego conecta aquí.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>¿Necesitas ayuda?</strong> Nuestro equipo te guía por videollamada para configurarlo en 15 minutos. Escríbenos por WhatsApp al botón de contacto.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo link */}
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-slate-600 mb-3">
                  ¿Quieres probar primero cómo funciona?
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/demo'}
                >
                  Prueba el demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* State 2: WhatsApp IS connected */
        <>
          {/* Connected phone number */}
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Número conectado</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    {config?.phone_number_display || config?.wa_phone_number_id}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customize responses card */}
          <Card
            className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
            onClick={() => setShowConfigModal(true)}
          >
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">Personalizar respuestas</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Configura el mensaje de bienvenida y tono de la IA</p>
                </div>
                <div className="text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics card */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">Estadísticas</h4>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {config?.estadisticas?.conversaciones || 0} conversaciones
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
    </div>
  );
}
