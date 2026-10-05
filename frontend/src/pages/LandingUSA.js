import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const OFICIOS_US = ['Roofing', 'Landscaping', 'Painting', 'Remodeling', 'Drywall', 'Flooring', 'Handyman', 'Cleaning', 'Concrete', 'Fencing'];

export default function LandingUSA() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Estimates Profesionales en Español — App para Paisanos Contratistas en USA | CotizaBot</title>
        <meta name="description" content="Haz tus estimates en dólares desde tu celular, en español: describe el jale, la IA lo cotiza con tax y PDF profesional. Para roofing, landscaping, painting, remodeling. $15 USD/mes, el primero gratis." />
        <link rel="canonical" href="https://cotizaexpress.com/usa" />
        <meta property="og:title" content="Estimates profesionales en español — para paisanos contratistas en USA" />
        <meta property="og:description" content="Describe el jale y la IA te arma el estimate en dólares con tax y PDF. Desde tu celular. $15 USD/mes." />
        <meta property="og:url" content="https://cotizaexpress.com/usa" />
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 flex-shrink-0">🤖</div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CotizaBot</span>
          </Link>
          <Link to="/login"><Button variant="ghost" className="text-slate-600">Entrar</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            🇺🇸 Para paisanos que andan en el jale en USA 🇲🇽
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Manda estimates como los grandes,<br className="hidden sm:block"/> <span className="text-yellow-300">en español y en 2 minutos</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-7">
            Describe el jale — "pintar 2 cuartos con material" — y la IA te arma el estimate en dólares,
            con tax y PDF profesional con tu logo. Listo para mandarlo por WhatsApp o texto antes que la competencia.
          </p>
          <Link to="/registro?utm_source=usa">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-lg font-extrabold px-8 py-6 shadow-xl">
              Hacer mi primer estimate GRATIS →
            </Button>
          </Link>
          <p className="text-sm text-blue-200 mt-3">$15 USD al mes después del primero · se instala como app en tu cel 📲 · cancela cuando quieras</p>

          {/* Mockup */}
          <div className="max-w-sm mx-auto mt-10 bg-white rounded-3xl p-5 shadow-2xl text-left">
            <p className="text-xs font-bold text-blue-700 mb-2">✨ Tu estimate</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 mb-3">"Pintar sala y 2 cuartos, 850 sqft, con material, 2 manos"</div>
            <div className="text-center text-blue-500 text-xl mb-3">⬇</div>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs text-slate-700">
              <div className="grid grid-cols-3 px-3 py-1.5 border-t"><span>Paint & materials</span><span className="text-center">1</span><span className="text-right">$380.00</span></div>
              <div className="grid grid-cols-3 px-3 py-1.5 border-t bg-slate-50"><span>👷 Labor — 850 sqft</span><span className="text-center">1</span><span className="text-right">$1,100.00</span></div>
              <div className="flex justify-between px-3 py-2 border-t bg-blue-700 text-white font-bold"><span>TOTAL (USD, tax inc.)</span><span>$1,598.40</span></div>
            </div>
            <p className="text-center text-[11px] text-slate-500 mt-3">📄 PDF con tu logo · folio · listo para WhatsApp o text</p>
          </div>
        </div>
      </section>

      {/* Oficios */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Hecho para tu jale</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {OFICIOS_US.map(o => (
              <span key={o} className="bg-slate-100 text-slate-700 font-medium rounded-full px-4 py-2 text-sm">{o}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
          {[
            ['💵', 'En dólares, con tax', 'Pones el tax de tu estado (o sin tax) y el total sale exacto. Separa labor y materiales.'],
            ['🏃', 'El primero que manda precio, gana', 'El customer pidió estimate a 3. Mándalo desde la troca antes de arrancar — te ves pro y cierras.'],
            ['📲', 'Vive en tu celular', 'Se instala como app, en español. Nada de programas raros ni computadora.'],
          ].map(([e, t, d]) => (
            <div key={t} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-3xl mb-2">{e}</p>
              <p className="font-bold text-slate-900 mb-1">{t}</p>
              <p className="text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precio */}
      <section className="py-14 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">$15 dólares al mes</h2>
          <p className="text-slate-600 mb-6">Menos que una comida. Estimates ilimitados, con tu logo, labor + materiales, PDF y link para compartir. <strong>El primero es gratis, sin tarjeta.</strong></p>
          <Link to="/registro?utm_source=usa">
            <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg font-bold px-8 py-6">Empezar gratis ahora →</Button>
          </Link>
          <p className="text-xs text-slate-400 mt-4">¿Tienes negocio con WhatsApp de clientes? Pregunta por CotizaBot: contesta y cotiza solo, 24/7.</p>
        </div>
      </section>
    </div>
  );
}
