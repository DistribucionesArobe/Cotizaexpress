import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, CheckCircle, Clock, Phone } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConfiguracionWhatsApp() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ciudades, setCiudades] = useState([]);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [miNumero, setMiNumero] = useState(null);
  const [miSolicitud, setMiSolicitud] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar ciudades disponibles
      const ciudadesRes = await axios.get(`${API}/twilio/ciudades`);
      setCiudades(ciudadesRes.data.ciudades);
      
      // Verificar si ya tiene número
      const miNumeroRes = await axios.get(`${API}/twilio/mi-numero`);
      setMiNumero(miNumeroRes.data);
      
      // Verificar si tiene solicitud pendiente
      const miSolicitudRes = await axios.get(`${API}/twilio/mi-solicitud`);
      setMiSolicitud(miSolicitudRes.data);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      if (error.response?.status === 403) {
        toast.error('Necesitas el Plan Completo para acceder a esta función');
      }
    } finally {
      setLoading(false);
    }
  };

  const solicitarNumero = async () => {
    if (!ciudadSeleccionada) {
      toast.error('Selecciona una ciudad primero');
      return;
    }

    try {
      setEnviando(true);
      
      const response = await axios.post(`${API}/twilio/solicitar-numero`, {
        ciudad: ciudadSeleccionada
      });
      
      if (response.data.success) {
        toast.success(response.data.mensaje);
        
        // Actualizar estado con el número obtenido
        setMiNumero({
          has_number: true,
          phone_number: response.data.phone_number,
          whatsapp_configured: response.data.whatsapp_configured
        });
      }
      
    } catch (error) {
      console.error('Error obteniendo número:', error);
      const errorMsg = error.response?.data?.detail || 'Error al obtener el número';
      toast.error(errorMsg);
    } finally {
      setEnviando(false);
    }
  };

  // Verificar si el usuario tiene plan completo
  const planCompleto = user?.empresa?.plan === 'completo' || user?.usuario?.plan === 'completo';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Si no tiene plan completo, mostrar mensaje
  if (!planCompleto) {
    return (
      <div className="space-y-6" data-testid="configuracion-whatsapp-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración de WhatsApp</h1>
            <p className="text-slate-600">Configura tu número de WhatsApp Business</p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Plan Completo Requerido
                </h3>
                <p className="text-amber-700 mb-4">
                  Para obtener tu propio número de WhatsApp Business necesitas actualizar al Plan Completo.
                  Con el Plan Completo obtienes:
                </p>
                <ul className="text-amber-700 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Cotizaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Tu propio número de WhatsApp Business (¡sin costo adicional!)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Bot de IA respondiendo 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Soporte prioritario
                  </li>
                </ul>
                <Link to="/precios">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="btn-ver-precios">
                    Ver Plan Completo - $1,000 MXN/mes
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si ya tiene número asignado
  if (miNumero?.has_number) {
    return (
      <div className="space-y-6" data-testid="configuracion-whatsapp-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tu Número de WhatsApp</h1>
            <p className="text-slate-600">Configuración de tu línea de WhatsApp Business</p>
          </div>
        </div>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-1" data-testid="mi-numero">
                  {miNumero.phone_number}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  {miNumero.whatsapp_configured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      WhatsApp Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      Configurando...
                    </span>
                  )}
                </div>
                
                {miNumero.whatsapp_configured ? (
                  <p className="text-emerald-700">
                    ¡Tu bot está activo! Los clientes pueden escribir a este número 
                    y el bot responderá automáticamente con cotizaciones.
                  </p>
                ) : (
                  <p className="text-emerald-700">
                    Tu número está siendo configurado para WhatsApp Business. 
                    Te notificaremos cuando esté listo.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Tu cliente escribe</h4>
                  <p className="text-slate-600 text-sm">El cliente envía un mensaje a tu número de WhatsApp preguntando por precios.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">CotizaBot responde</h4>
                  <p className="text-slate-600 text-sm">Nuestro bot de IA interpreta el mensaje y genera una cotización con tus productos y precios.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Cotización enviada</h4>
                  <p className="text-slate-600 text-sm">El cliente recibe la cotización con precios, IVA y total en segundos.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si tiene solicitud pendiente
  if (miSolicitud?.tiene_solicitud && miSolicitud.solicitud?.estado === 'pendiente') {
    return (
      <div className="space-y-6" data-testid="configuracion-whatsapp-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Solicitud en Proceso</h1>
            <p className="text-slate-600">Tu número de WhatsApp está siendo configurado</p>
          </div>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">
                  Procesando tu solicitud
                </h3>
                <p className="text-blue-700 mb-4">
                  Estamos configurando tu número de WhatsApp de <strong>{miSolicitud.solicitud.ciudad}</strong>.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-slate-600 text-sm">
                    <strong>Tiempo estimado:</strong> 24-48 horas hábiles
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Te enviaremos un correo electrónico cuando tu número esté listo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Qué sigue?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-slate-600">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                <span className="line-through">Solicitud enviada</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm animate-pulse">2</span>
                <span>Configurando número y WhatsApp Business</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-sm">3</span>
                <span className="text-slate-400">Activación completada</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista para solicitar número (nuevo flujo simplificado)
  return (
    <div className="space-y-6" data-testid="configuracion-whatsapp-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicita tu Número de WhatsApp</h1>
          <p className="text-slate-600">Selecciona tu ciudad y nosotros nos encargamos del resto</p>
        </div>
      </div>

      {/* Info destacada */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold text-emerald-800">¡Sin costo adicional!</span>
          </div>
          <p className="text-emerald-700">
            Tu número de WhatsApp Business está incluido en tu Plan Completo. 
            No tienes que pagar nada extra.
          </p>
        </CardContent>
      </Card>

      {/* Selector de ciudad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            ¿De qué ciudad quieres tu número?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm mb-4">
            Selecciona la ciudad que mejor represente a tu negocio. Tus clientes verán este código de área.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ciudades.map((ciudad) => (
              <button
                key={ciudad.key}
                onClick={() => setCiudadSeleccionada(ciudad.key)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  ciudadSeleccionada === ciudad.key
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 hover:border-emerald-300 text-slate-700'
                }`}
                data-testid={`btn-ciudad-${ciudad.key}`}
              >
                {ciudad.nombre}
              </button>
            ))}
          </div>
          
          {/* Notas opcionales */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="¿Alguna preferencia o comentario? Ej: Prefiero número que termine en 00"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={2}
              data-testid="input-notas"
            />
          </div>
          
          <div className="mt-6">
            <Button
              onClick={solicitarNumero}
              disabled={!ciudadSeleccionada || enviando}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base"
              data-testid="btn-solicitar-numero"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando solicitud...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Solicitar mi número de WhatsApp
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info adicional */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Selecciona tu ciudad</h4>
                <p className="text-slate-600 text-sm">Elige la ciudad de donde quieres tu número telefónico.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Nosotros lo configuramos</h4>
                <p className="text-slate-600 text-sm">Nuestro equipo compra y configura tu número de WhatsApp Business en 24-48 horas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">¡Listo para vender!</h4>
                <p className="text-slate-600 text-sm">Te notificamos cuando tu bot esté activo y puedas empezar a recibir cotizaciones automáticas.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
