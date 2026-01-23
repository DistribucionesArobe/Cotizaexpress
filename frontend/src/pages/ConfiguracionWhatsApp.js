import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConfiguracionWhatsApp() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ciudades, setCiudades] = useState([]);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [numerosDisponibles, setNumerosDisponibles] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [miNumero, setMiNumero] = useState(null);

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
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      if (error.response?.status === 403) {
        toast.error('Necesitas el Plan Completo para acceder a esta función');
      }
    } finally {
      setLoading(false);
    }
  };

  const buscarNumeros = async () => {
    if (!ciudadSeleccionada) {
      toast.error('Selecciona una ciudad primero');
      return;
    }

    try {
      setBuscando(true);
      setNumerosDisponibles([]);
      
      const response = await axios.post(`${API}/twilio/buscar-numeros`, {
        ciudad: ciudadSeleccionada
      });
      
      setNumerosDisponibles(response.data);
      
      if (response.data.length === 0) {
        toast.info('No hay números disponibles en esta ciudad. Intenta con otra.');
      }
      
    } catch (error) {
      console.error('Error buscando números:', error);
      toast.error(error.response?.data?.detail || 'Error al buscar números');
    } finally {
      setBuscando(false);
    }
  };

  const comprarNumero = async (phoneNumber) => {
    if (!confirm(`¿Estás seguro de que quieres adquirir el número ${phoneNumber}? Este número será configurado para tu cuenta de WhatsApp Business.`)) {
      return;
    }

    try {
      setComprando(true);
      
      const response = await axios.post(`${API}/twilio/comprar-numero`, {
        phone_number: phoneNumber
      });
      
      toast.success(response.data.mensaje);
      
      // Actualizar estado
      setMiNumero({
        has_number: true,
        phone_number: response.data.phone_number,
        whatsapp_configured: false
      });
      setNumerosDisponibles([]);
      
    } catch (error) {
      console.error('Error comprando número:', error);
      toast.error(error.response?.data?.detail || 'Error al comprar número');
    } finally {
      setComprando(false);
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
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
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
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cotizaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tu propio número de WhatsApp Business
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Bot de IA respondiendo 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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

  // Si ya tiene número
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
                <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-1">
                  {miNumero.phone_number}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  {miNumero.whatsapp_configured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      WhatsApp Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-sm">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Configurando WhatsApp...
                    </span>
                  )}
                </div>
                
                {!miNumero.whatsapp_configured && (
                  <p className="text-emerald-700">
                    Tu número está siendo configurado para WhatsApp Business. 
                    Recibirás una notificación cuando esté listo (24-48 horas).
                  </p>
                )}
                
                {miNumero.whatsapp_configured && (
                  <p className="text-emerald-700">
                    ¡Tu bot está activo! Los clientes pueden escribir a este número 
                    y el bot responderá automáticamente con cotizaciones.
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

  // Vista para comprar número
  return (
    <div className="space-y-6" data-testid="configuracion-whatsapp-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Obtén tu Número de WhatsApp</h1>
          <p className="text-slate-600">Selecciona una ciudad y elige tu número de WhatsApp Business</p>
        </div>
      </div>

      {/* Selector de ciudad */}
      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Selecciona tu ciudad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ciudades.map((ciudad) => (
              <button
                key={ciudad.key}
                onClick={() => setCiudadSeleccionada(ciudad.key)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  ciudadSeleccionada === ciudad.key
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:border-emerald-300 text-slate-700'
                }`}
                data-testid={`btn-ciudad-${ciudad.key}`}
              >
                {ciudad.nombre}
              </button>
            ))}
          </div>
          
          <div className="mt-6">
            <Button
              onClick={buscarNumeros}
              disabled={!ciudadSeleccionada || buscando}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-buscar-numeros"
            >
              {buscando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Buscando números...
                </>
              ) : (
                'Buscar Números Disponibles'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de números disponibles */}
      {numerosDisponibles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Selecciona tu número</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {numerosDisponibles.map((numero, index) => (
                <div
                  key={numero.phone_number}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-all"
                  data-testid={`numero-disponible-${index}`}
                >
                  <div>
                    <p className="text-lg font-mono font-semibold text-slate-900">
                      {numero.friendly_name || numero.phone_number}
                    </p>
                    <p className="text-sm text-slate-500">
                      {numero.locality}, {numero.region}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {numero.capabilities?.voice && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Voz</span>
                      )}
                      {numero.capabilities?.sms && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">SMS</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => comprarNumero(numero.phone_number)}
                    disabled={comprando}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid={`btn-comprar-${index}`}
                  >
                    {comprando ? 'Procesando...' : 'Seleccionar'}
                  </Button>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-slate-500 mt-4">
              * El número será configurado para WhatsApp Business en las próximas 24-48 horas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si no hay números */}
      {numerosDisponibles.length === 0 && ciudadSeleccionada && !buscando && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-700 text-center">
              No encontramos números disponibles para esta ciudad. 
              Intenta buscar en otra ciudad cercana.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
