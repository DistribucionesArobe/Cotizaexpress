import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, CheckCircle, Clock, Phone, Crown, 
  Zap, Users, ArrowRight, Copy, ExternalLink, AlertTriangle,
  Smartphone, Send
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConfiguracionWhatsApp() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [config, setConfig] = useState(null);
  const [instrucciones, setInstrucciones] = useState(null);

  const planActual = user?.empresa?.plan || user?.usuario?.plan || 'gratis';
  const esPlanCompleto = planActual === 'completo';

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      setLoading(true);
      const [configRes, instruccionesRes] = await Promise.all([
        axios.get(`${API}/whatsapp/config`),
        axios.get(`${API}/whatsapp/instrucciones-sandbox`)
      ]);
      setConfig(configRes.data);
      setInstrucciones(instruccionesRes.data);
    } catch (error) {
      console.error('Error cargando config:', error);
      // Si falla, mostrar estado no configurado
      setConfig({ configured: false, mode: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const activarWhatsApp = async () => {
    try {
      setActivando(true);
      const response = await axios.post(`${API}/whatsapp/activar`, {});
      
      toast.success(response.data.mensaje || '¡WhatsApp activado!');
      setConfig(prev => ({
        ...prev,
        configured: true,
        mode: 'shared',
        phone_number: response.data.phone_number,
        numero_info: {
          phone_number: response.data.phone_number,
          type: 'shared',
          is_sandbox: response.data.is_sandbox,
          sandbox_code: response.data.sandbox_code
        }
      }));
      
    } catch (error) {
      console.error('Error activando WhatsApp:', error);
      toast.error(error.response?.data?.detail || 'Error al activar WhatsApp');
    } finally {
      setActivando(false);
    }
  };

  const migrarADedicado = async () => {
    try {
      setMigrando(true);
      const response = await axios.post(`${API}/whatsapp/migrar-dedicado`, {});
      
      toast.success(response.data.mensaje || '¡Número dedicado activado!');
      setConfig(prev => ({
        ...prev,
        mode: 'dedicated',
        phone_number: response.data.phone_number,
        numero_info: {
          phone_number: response.data.phone_number,
          type: 'dedicated',
          is_sandbox: false
        }
      }));
      
    } catch (error) {
      console.error('Error migrando:', error);
      toast.error(error.response?.data?.detail || 'Error al obtener número dedicado');
    } finally {
      setMigrando(false);
    }
  };

  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isConfigured = config?.configured;
  const isShared = config?.mode === 'shared';
  const isDedicated = config?.mode === 'dedicated';
  const isSandbox = config?.numero_info?.is_sandbox;

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

      {/* Estado actual */}
      {isConfigured ? (
        <Card className={`border-2 ${isDedicated ? 'border-emerald-300 bg-emerald-50' : 'border-blue-300 bg-blue-50'}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDedicated ? 'bg-emerald-200' : 'bg-blue-200'}`}>
                  <Phone className={`w-7 h-7 ${isDedicated ? 'text-emerald-700' : 'text-blue-700'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-slate-900">{config?.phone_number}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copiarTexto(config?.phone_number)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isDedicated ? 'default' : 'secondary'}>
                      {isDedicated ? '🔒 Número Dedicado' : '👥 Número Compartido'}
                    </Badge>
                    {isSandbox && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        ⚠️ Modo Demo
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-emerald-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>
              
              {isShared && esPlanCompleto && (
                <Button 
                  onClick={migrarADedicado}
                  disabled={migrando}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {migrando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Obteniendo número...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Obtener Número Dedicado
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No configurado - Mostrar opciones */
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                WhatsApp no configurado
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Activa WhatsApp para que tus clientes puedan solicitar cotizaciones 
                automáticamente las 24 horas.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={activarWhatsApp}
                disabled={activando}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {activando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Activar WhatsApp (Demo)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones de Sandbox (solo si está en modo demo) */}
      {isConfigured && isSandbox && instrucciones && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              {instrucciones.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Para probar, tus clientes deben:</p>
                <ol className="space-y-2">
                  {instrucciones.pasos?.map((paso, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="font-bold text-amber-600">{i + 1}.</span>
                      <span>{paso.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Código para conectarse:</p>
                  <p className="text-lg font-mono font-bold text-amber-700">{instrucciones.codigo}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarTexto(instrucciones.codigo)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-xs text-amber-700 space-y-1">
                {instrucciones.notas?.map((nota, i) => (
                  <p key={i}>• {nota}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparativa de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Número Compartido */}
        <Card className={`${isShared ? 'border-2 border-blue-300' : ''}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Número Compartido
              {isShared && <Badge className="ml-2">Actual</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Activación inmediata
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Ideal para probar el sistema
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Sin costo adicional
              </li>
              <li className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Máximo 10 empresas por número
              </li>
              <li className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Número de CotizaExpress
              </li>
            </ul>
            
            {!isConfigured && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={activarWhatsApp}
                disabled={activando}
              >
                Usar número compartido
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Número Dedicado */}
        <Card className={`${isDedicated ? 'border-2 border-emerald-300' : ''}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-5 h-5 text-emerald-600" />
              Número Dedicado
              {isDedicated && <Badge className="bg-emerald-600 ml-2">Actual</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Número exclusivo para tu empresa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Sin límite de conversaciones
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Tu marca en el perfil de WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Historial completo y privado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Templates personalizados
              </li>
            </ul>
            
            {!isDedicated && (
              esPlanCompleto ? (
                <Button 
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={migrarADedicado}
                  disabled={migrando}
                >
                  {migrando ? 'Obteniendo...' : 'Obtener número dedicado'}
                </Button>
              ) : (
                <Link to="/precios">
                  <Button variant="outline" className="w-full mt-4">
                    Requiere Plan Completo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cómo funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">1. Cliente escribe</h4>
              <p className="text-sm text-slate-600">
                Tu cliente envía un mensaje pidiendo cotización
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">2. IA procesa</h4>
              <p className="text-sm text-slate-600">
                CotizaBot entiende la solicitud y busca productos
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">3. Cotización enviada</h4>
              <p className="text-sm text-slate-600">
                El cliente recibe su cotización en segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
