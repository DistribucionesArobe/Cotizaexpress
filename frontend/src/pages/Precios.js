import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Precios() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast.info('Primero necesitas crear una cuenta');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API}/pagos/crear-checkout`, {
        plan_id: 'completo',
        origin_url: window.location.origin
      });

      // Redirigir a Stripe Checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creando checkout:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const planActual = user?.empresa?.plan || user?.usuario?.plan || 'gratis';
  const esPlanCompleto = planActual === 'completo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <img 
                src="/logo-cotizaexpress.png" 
                alt="CotizaBot by CotizaExpress.com" 
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-900">CotizaBot</span>
                <span className="text-xs text-slate-500 block -mt-1">by CotizaExpress.com</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Ir al Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-slate-600">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/registro">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Probar Gratis
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Precios Simples y Transparentes
            </h1>
            <p className="text-lg sm:text-xl text-slate-600">
              Empieza gratis con 5 cotizaciones. Sin tarjeta de crédito.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratis */}
            <Card className={`border-2 ${planActual === 'gratis' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`} data-testid="plan-gratis-card">
              {planActual === 'gratis' && (
                <div className="bg-emerald-500 text-white text-center py-1 text-sm font-medium">
                  Tu plan actual
                </div>
              )}
              <CardContent className="pt-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Gratis</h3>
                  <div className="text-5xl font-bold text-slate-600 mb-2">
                    $0
                  </div>
                  <p className="text-sm text-slate-500 mb-8">Para siempre</p>

                  <ul className="text-left space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700"><strong>5 cotizaciones</strong> incluidas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">Dashboard básico</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">Carga de productos desde Excel</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-slate-400">Sin WhatsApp integrado</span>
                    </li>
                  </ul>

                  {!isAuthenticated ? (
                    <Link to="/registro">
                      <Button variant="outline" className="w-full" size="lg" data-testid="btn-plan-gratis">
                        Comenzar Gratis
                      </Button>
                    </Link>
                  ) : planActual === 'gratis' ? (
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      Plan Actual
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Plan Completo */}
            <Card className={`border-2 relative overflow-hidden shadow-xl ${esPlanCompleto ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-500'}`} data-testid="plan-completo-card">
              <div className={`absolute top-0 right-0 ${esPlanCompleto ? 'bg-emerald-600' : 'bg-emerald-500'} text-white px-4 py-1 text-sm font-medium`}>
                {esPlanCompleto ? 'Tu plan actual' : 'Recomendado'}
              </div>
              <CardContent className="pt-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Completo</h3>
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    $1,000
                  </div>
                  <p className="text-sm text-slate-500 mb-1">MXN/mes + IVA</p>
                  <p className="text-xs text-slate-400 mb-8">Total: $1,160 MXN</p>

                  <ul className="text-left space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700"><strong>Cotizaciones ilimitadas</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">WhatsApp Business API integrado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700"><strong>Tu propio número de WhatsApp</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">Soporte técnico prioritario</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">Capacitación incluida</span>
                    </li>
                  </ul>

                  {esPlanCompleto ? (
                    <Button className="w-full bg-emerald-600" size="lg" disabled>
                      Plan Activo
                    </Button>
                  ) : isAuthenticated ? (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700" 
                      size="lg" 
                      onClick={handleUpgrade}
                      disabled={loading}
                      data-testid="btn-upgrade-completo"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          Actualizar Ahora - $1,160 MXN
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link to="/registro">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg" data-testid="btn-plan-completo">
                        Empezar Ahora
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Métodos de pago aceptados</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#1A1F71"/>
                  <text x="4" y="16" fill="white" fontSize="8" fontWeight="bold">VISA</text>
                </svg>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#EB001B"/>
                  <circle cx="9" cy="12" r="5" fill="#EB001B"/>
                  <circle cx="15" cy="12" r="5" fill="#F79E1B"/>
                </svg>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#006FCF"/>
                  <text x="2" y="15" fill="white" fontSize="6" fontWeight="bold">AMEX</text>
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Pagos seguros procesados por Stripe</p>
          </div>

          {/* Comparison Table */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
              Comparación Detallada
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Característica</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Gratis</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-600">Completo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">Cotizaciones</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">5 totales</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600 font-medium">Ilimitadas</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-700">WhatsApp integrado</td>
                    <td className="px-6 py-4 text-center">
                      <svg className="w-5 h-5 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <svg className="w-5 h-5 text-emerald-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">Número de WhatsApp propio</td>
                    <td className="px-6 py-4 text-center">
                      <svg className="w-5 h-5 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <svg className="w-5 h-5 text-emerald-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-700">Soporte técnico</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">Email</td>
                    <td className="px-6 py-4 text-center text-sm text-emerald-600 font-medium">Prioritario</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">¿El precio incluye IVA?</h3>
                  <p className="text-slate-600">
                    El precio es $1,000 MXN + 16% IVA = $1,160 MXN/mes total. Te enviamos factura electrónica (CFDI) automáticamente.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">¿Puedo cancelar cuando quiera?</h3>
                  <p className="text-slate-600">
                    Sí, puedes cancelar tu suscripción en cualquier momento. No hay contratos ni penalizaciones.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">¿Cómo funciona el pago?</h3>
                  <p className="text-slate-600">
                    Aceptamos todas las tarjetas de crédito y débito. El pago se procesa de forma segura a través de Stripe.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            {!isAuthenticated && (
              <>
                <Link to="/registro">
                  <Button size="lg" className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700" data-testid="final-cta-btn">
                    Comenzar con 5 Cotizaciones Gratis
                  </Button>
                </Link>
                <p className="text-sm text-slate-500 mt-4">
                  Sin tarjeta de crédito • Cancela cuando quieras
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo-cotizaexpress.png" 
                alt="CotizaBot" 
                className="h-8 w-auto brightness-0 invert"
              />
              <span className="text-white font-semibold">CotizaBot</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="tel:+528130783171" className="hover:text-white">+52 81 3078 3171</a>
              <a href="mailto:contacto@arobegroup.com" className="hover:text-white">contacto@arobegroup.com</a>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-slate-500 text-xs">
              © 2026 CotizaExpress.com - CotizaBot by CotizaExpress.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
