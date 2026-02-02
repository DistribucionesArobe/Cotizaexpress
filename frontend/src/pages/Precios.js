import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, X, CreditCard, Building2, Bell, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Precios() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleUpgrade = async (planId) => {
    if (!isAuthenticated) {
      toast.info('Primero necesitas crear una cuenta');
      return;
    }

    try {
      setLoading(planId);
      
      const response = await axios.post(`${API}/pagos/crear-checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creando checkout:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setLoading(null);
    }
  };

  const planActual = user?.empresa?.plan || user?.usuario?.plan || 'gratis';

  const planes = [
    {
      id: 'gratis',
      nombre: 'Plan Gratis',
      precio: 0,
      precioIVA: 0,
      descripcion: 'Para probar',
      features: [
        { texto: '5 cotizaciones incluidas', incluido: true },
        { texto: 'Dashboard básico', incluido: true },
        { texto: 'Carga de productos Excel', incluido: true },
        { texto: 'WhatsApp integrado', incluido: false },
        { texto: 'Cobros automáticos', incluido: false },
      ],
      popular: false,
      btnTexto: 'Comenzar Gratis',
    },
    {
      id: 'completo',
      nombre: 'Plan Completo',
      precio: 1000,
      precioIVA: 1160,
      descripcion: 'Para empresas en crecimiento',
      features: [
        { texto: 'Cotizaciones ilimitadas', incluido: true },
        { texto: 'WhatsApp Business integrado', incluido: true },
        { texto: 'Código QR y link propio', incluido: true },
        { texto: 'Dashboard completo', incluido: true },
        { texto: 'Soporte prioritario', incluido: true },
        { texto: 'Cobros automáticos', incluido: false, nota: 'Disponible en Plan Pro' },
      ],
      popular: true,
      btnTexto: 'Empezar Ahora',
    },
    {
      id: 'pro',
      nombre: 'Plan Pro',
      precio: 2000,
      precioIVA: 2320,
      descripcion: '¡Cobra directamente por WhatsApp!',
      badge: '💰 COBRA A TUS CLIENTES',
      features: [
        { texto: 'Todo del Plan Completo', incluido: true },
        { texto: 'Link de pago Mercado Pago', incluido: true, destacado: true },
        { texto: 'Datos SPEI automáticos', incluido: true, destacado: true },
        { texto: 'Notificaciones de pago', incluido: true, destacado: true },
        { texto: 'Configura tu CLABE', incluido: true },
        { texto: 'Recibe pagos 24/7', incluido: true },
      ],
      popular: false,
      btnTexto: 'Quiero Cobrar',
      destacado: true,
    },
  ];

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

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Precios Simples y Transparentes
            </h1>
            <p className="text-lg sm:text-xl text-slate-600">
              Empieza gratis. Escala cuando crezcas. <strong>Cobra a tus clientes</strong> con Plan Pro.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {planes.map((plan) => {
              const esActual = planActual === plan.id;
              const esDestacado = plan.destacado;
              const esPopular = plan.popular;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    esDestacado 
                      ? 'border-2 border-amber-400 shadow-xl shadow-amber-100 scale-105' 
                      : esActual 
                        ? 'border-2 border-emerald-400 bg-emerald-50' 
                        : esPopular 
                          ? 'border-2 border-emerald-300'
                          : 'border border-slate-200'
                  }`}
                  data-testid={`plan-${plan.id}-card`}
                >
                  {/* Badge superior */}
                  {esActual && (
                    <div className="bg-emerald-500 text-white text-center py-1 text-sm font-medium">
                      Tu plan actual
                    </div>
                  )}
                  {!esActual && esPopular && (
                    <div className="bg-emerald-500 text-white text-center py-1 text-sm font-medium">
                      Recomendado
                    </div>
                  )}
                  {!esActual && esDestacado && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 text-sm font-bold">
                      {plan.badge}
                    </div>
                  )}

                  <CardContent className="pt-6 pb-8">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.nombre}</h3>
                      <p className="text-sm text-slate-500 mb-4">{plan.descripcion}</p>
                      
                      <div className={`text-4xl font-bold mb-1 ${esDestacado ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ${plan.precio.toLocaleString()}
                      </div>
                      {plan.precio > 0 ? (
                        <>
                          <p className="text-sm text-slate-500">MXN/mes + IVA</p>
                          <p className="text-xs text-slate-400 mb-6">Total: ${plan.precioIVA.toLocaleString()} MXN</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 mb-6">Para siempre</p>
                      )}

                      {/* Features */}
                      <ul className="text-left space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            {feature.incluido ? (
                              <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.destacado ? 'text-amber-500' : 'text-emerald-500'}`} />
                            ) : (
                              <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={`text-sm ${
                              feature.incluido 
                                ? feature.destacado 
                                  ? 'text-amber-700 font-medium' 
                                  : 'text-slate-700'
                                : 'text-slate-400'
                            }`}>
                              {feature.texto}
                              {feature.nota && (
                                <span className="block text-xs text-slate-400">{feature.nota}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Botón */}
                      {esActual ? (
                        <Button variant="outline" className="w-full" disabled>
                          Plan Activo
                        </Button>
                      ) : plan.id === 'gratis' ? (
                        !isAuthenticated && (
                          <Link to="/registro" className="block">
                            <Button variant="outline" className="w-full">
                              {plan.btnTexto}
                            </Button>
                          </Link>
                        )
                      ) : (
                        isAuthenticated ? (
                          <Button 
                            className={`w-full ${esDestacado ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={loading === plan.id}
                            data-testid={`btn-upgrade-${plan.id}`}
                          >
                            {loading === plan.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Procesando...
                              </>
                            ) : (
                              <>
                                {plan.btnTexto} - ${plan.precioIVA.toLocaleString()}
                              </>
                            )}
                          </Button>
                        ) : (
                          <Link to="/registro" className="block">
                            <Button className={`w-full ${esDestacado ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                              {plan.btnTexto}
                            </Button>
                          </Link>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Plan Pro Highlight */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <CardContent className="py-8">
                <div className="text-center mb-6">
                  <Badge className="bg-amber-500 text-white mb-3">PLAN PRO</Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    ¡Cobra a tus clientes directamente por WhatsApp!
                  </h2>
                  <p className="text-slate-600">
                    Configura tus datos bancarios y recibe pagos automáticamente
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Mercado Pago</h4>
                    <p className="text-sm text-slate-600">
                      Genera links de pago automáticos y recibe con tarjeta
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">SPEI / Transferencia</h4>
                    <p className="text-sm text-slate-600">
                      Envía tu CLABE automáticamente al confirmar cotización
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Notificaciones</h4>
                    <p className="text-sm text-slate-600">
                      Recibe aviso cuando te paguen a tu WhatsApp o email
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
              Comparación Detallada
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">Característica</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-slate-500">Gratis</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-emerald-600">Completo</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-amber-600">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-700">Cotizaciones</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">5</td>
                    <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">Ilimitadas</td>
                    <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">Ilimitadas</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">WhatsApp integrado</td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-amber-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-700">QR y Link propio</td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-amber-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">Cobros Mercado Pago</td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-amber-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">Cobros SPEI</td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-amber-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">Notificaciones de pago</td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><X className="w-5 h-5 text-slate-300 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Check className="w-5 h-5 text-amber-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-700">Soporte</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500">Email</td>
                    <td className="px-4 py-3 text-center text-sm text-emerald-600">Prioritario</td>
                    <td className="px-4 py-3 text-center text-sm text-amber-600">VIP</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="px-4 py-3 text-sm text-slate-900 font-bold">Precio mensual</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-600">$0</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">$1,160</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-amber-600">$2,320</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-12 text-center">
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

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <h3 className="font-bold text-slate-900 mb-2">¿El precio incluye IVA?</h3>
                  <p className="text-sm text-slate-600">
                    Los precios mostrados son + 16% IVA. Plan Completo: $1,000 + IVA = $1,160. Plan Pro: $2,000 + IVA = $2,320.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <h3 className="font-bold text-slate-900 mb-2">¿Cómo funciona el cobro con Plan Pro?</h3>
                  <p className="text-sm text-slate-600">
                    Configuras tu CLABE y/o Mercado Pago en tu panel. Cuando confirmas una cotización, el bot envía automáticamente los datos de pago a tu cliente.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <h3 className="font-bold text-slate-900 mb-2">¿Recibo notificación cuando me pagan?</h3>
                  <p className="text-sm text-slate-600">
                    Sí, con Plan Pro puedes configurar un número de WhatsApp o email para recibir alertas de pago.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          {!isAuthenticated && (
            <div className="mt-16 text-center">
              <Link to="/registro">
                <Button size="lg" className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700">
                  Comenzar con 5 Cotizaciones Gratis
                </Button>
              </Link>
              <p className="text-sm text-slate-500 mt-4">
                Sin tarjeta de crédito • Cancela cuando quieras
              </p>
            </div>
          )}
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
