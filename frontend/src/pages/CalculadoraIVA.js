import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const fmt = (n) => (isNaN(n) ? '—' : n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));

const FAQS = [
  { q: '¿Cómo se calcula el IVA del 16% en México?', a: 'Para agregar IVA a un precio: multiplica el monto por 0.16 y súmalo (o multiplica directo por 1.16). Ejemplo: $1,000 × 1.16 = $1,160. Para desglosar el IVA de un precio que ya lo incluye: divide entre 1.16. Ejemplo: $1,160 ÷ 1.16 = $1,000 de subtotal y $160 de IVA.' },
  { q: '¿Cuál es la tasa de IVA en la frontera?', a: 'En la región fronteriza norte y sur de México aplica una tasa reducida del 8% como estímulo fiscal, siempre que el contribuyente esté inscrito en el padrón correspondiente. La tasa general en el resto del país es 16%.' },
  { q: '¿Cómo saco el precio sin IVA de un ticket?', a: 'Divide el total del ticket entre 1.16. El resultado es el subtotal sin IVA; la diferencia es el IVA pagado. Con tasa del 8% divide entre 1.08.' },
  { q: '¿Las cotizaciones deben incluir IVA?', a: 'No es obligatorio, pero es muy recomendable indicar claramente si los precios incluyen IVA o no, y desglosarlo. Evita malentendidos con el cliente y facilita la facturación posterior.' },
];

export default function CalculadoraIVA() {
  const [monto, setMonto] = useState('');
  const [tasa, setTasa] = useState(16);

  const m = parseFloat(monto) || 0;
  const factor = 1 + tasa / 100;
  // Agregar IVA
  const ivaAgregar = m * (tasa / 100);
  const totalConIva = m * factor;
  // Desglosar IVA
  const subtotalSin = m / factor;
  const ivaDesglosado = m - subtotalSin;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Calculadora de IVA 16% México — Agregar y Desglosar IVA Gratis | CotizaExpress</title>
        <meta name="description" content="Calculadora de IVA gratis para México: agrega el 16% a un precio o desglosa el IVA de un total. Incluye tasa fronteriza del 8%. Rápida y sin registro." />
        <link rel="canonical" href="https://cotizaexpress.com/calculadora-iva" />
        <meta property="og:title" content="Calculadora de IVA 16% México — Gratis" />
        <meta property="og:description" content="Agrega o desglosa el IVA de cualquier monto al instante. Tasa 16% general y 8% frontera." />
        <meta property="og:url" content="https://cotizaexpress.com/calculadora-iva" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-14 w-auto" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-900">CotizaBot</span>
                <span className="text-xs text-slate-500 block -mt-1">by CotizaExpress.com</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/generador-de-cotizaciones" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Generador de Cotizaciones</Link>
              <Link to="/blog" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Blog</Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Calculadora de IVA (México)</h1>
        <p className="text-slate-600 mb-8">Agrega el IVA a un precio o desglósalo de un total que ya lo incluye. Gratis, al instante y sin registro.</p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Monto en pesos (MXN)</label>
                <Input
                  type="number" inputMode="decimal" placeholder="Ej. 1000"
                  value={monto} onChange={e => setMonto(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tasa de IVA</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTasa(16)}
                    className={`flex-1 h-10 rounded-md border font-semibold text-sm ${tasa === 16 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    16% General
                  </button>
                  <button type="button" onClick={() => setTasa(8)}
                    className={`flex-1 h-10 rounded-md border font-semibold text-sm ${tasa === 8 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    8% Frontera
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">Agregar IVA al monto</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium">{fmt(m)}</span></div>
                  <div className="flex justify-between"><span>IVA ({tasa}%):</span><span className="font-medium">{fmt(ivaAgregar)}</span></div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-emerald-200"><span>Total:</span><span>{fmt(totalConIva)}</span></div>
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-3">Desglosar IVA del monto</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Total (con IVA):</span><span className="font-medium">{fmt(m)}</span></div>
                  <div className="flex justify-between"><span>IVA incluido:</span><span className="font-medium">{fmt(ivaDesglosado)}</span></div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-sky-200"><span>Subtotal sin IVA:</span><span>{fmt(subtotalSin)}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center mb-12">
          <p className="text-white font-bold text-lg mb-1">¿Haces cotizaciones con IVA todos los días?</p>
          <p className="text-emerald-100 text-sm mb-4">CotizaBot las hace por ti en WhatsApp: el cliente manda su lista y recibe cotización con IVA en 3 segundos.</p>
          <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">Probar Demo Gratis</Button>
          </a>
        </div>

        {/* Contenido SEO */}
        <section className="prose-sm mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Cómo calcular el IVA en México</h2>
          <p className="text-slate-600 mb-3">La tasa general del IVA en México es del <strong>16%</strong>. Para <strong>agregar</strong> el IVA a un precio, multiplica el monto por 1.16. Para <strong>desglosar</strong> el IVA de un precio que ya lo incluye, divide el total entre 1.16.</p>
          <p className="text-slate-600 mb-3">Ejemplo: un producto de $500 pesos más IVA cuesta $500 × 1.16 = <strong>$580</strong>. Y si un ticket dice $580 con IVA incluido, el subtotal es $580 ÷ 1.16 = <strong>$500</strong>, con $80 de IVA.</p>
          <p className="text-slate-600 mb-3">En la región fronteriza aplica la tasa reducida del <strong>8%</strong> para contribuyentes inscritos en el estímulo fiscal: las mismas fórmulas con 1.08 en lugar de 1.16.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <h3 className="font-bold text-slate-900 mb-1">{f.q}</h3>
                  <p className="text-slate-600 text-sm">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-sm text-slate-500">
          También te puede servir: <Link to="/generador-de-cotizaciones" className="text-emerald-600 font-medium">Generador de cotizaciones gratis</Link> · <Link to="/blog/como-hacer-cotizacion-formal-con-iva" className="text-emerald-600 font-medium">Cómo hacer una cotización formal con IVA</Link>
        </p>
      </main>
    </div>
  );
}
