import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Precios() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Precios Simples y Transparentes
          </h1>
          <p className="text-xl text-slate-600">
            Todo incluido. Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plan Demo */}
          <Card className="border-2 border-slate-200">
            <CardContent className="pt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Demo</h3>
                <div className="text-5xl font-bold text-slate-600 mb-2">
                  Gratis
                </div>
                <p className="text-sm text-slate-500 mb-8">Por 7 días</p>

                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">50 cotizaciones incluidas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Dashboard completo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">WhatsApp integrado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-slate-400">Sin soporte prioritario</span>
                  </li>
                </ul>

                <Link to="/registro">
                  <Button variant="outline" className="w-full" size="lg">
                    Probar Gratis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plan Pagado */}
          <Card className="border-2 border-emerald-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-sm font-medium">
              Recomendado
            </div>
            <CardContent className="pt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan Completo</h3>
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                  $1,000
                </div>
                <p className="text-sm text-slate-500 mb-8">MXN/mes + IVA</p>

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
                    <span className="text-slate-700">Dashboard completo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">WhatsApp Business API</span>
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
                    <span className="text-slate-700">Actualizaciones automáticas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Capacitación incluida</span>
                  </li>
                </ul>

                <Link to="/registro">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                    Empezar Ahora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 mb-2">¿Puedo cambiar de plan después?</h3>
                <p className="text-slate-600">
                  Sí, puedes actualizar del plan Demo al plan Completo en cualquier momento. Solo pagas la diferencia prorrateada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 mb-2">¿Qué incluye el IVA?</h3>
                <p className="text-slate-600">
                  El precio es $1,000 MXN + 16% IVA = $1,160 MXN/mes total. Te enviamos factura electrónica automáticamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 mb-2">¿Cuándo se cobra?</h3>
                <p className="text-slate-600">
                  El cobro es mensual. Después de los 7 días de prueba gratis, se hace el primer cargo. Puedes cancelar en cualquier momento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-slate-900 mb-2">¿Necesito tarjeta para el demo?</h3>
                <p className="text-slate-600">
                  No. El plan Demo es completamente gratis por 7 días sin necesidad de tarjeta de crédito.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Link to="/registro">
            <Button size="lg" className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700">
              Comenzar Prueba Gratuita
            </Button>
          </Link>
          <p className="text-sm text-slate-500 mt-4">
            Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}
