import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const OFICIOS_US = ['Roofing', 'Landscaping', 'Painting', 'Remodeling', 'Drywall', 'Flooring', 'Handyman', 'Cleaning', 'Concrete', 'Fencing'];
const OFICIOS_CON_PAGINA = { Roofing: 'roofing', Landscaping: 'landscaping', Painting: 'painting', Remodeling: 'remodeling', Drywall: 'drywall', Handyman: 'handyman' };

const FAQ_USA = [
  ['¿Cómo hago un estimate en español en Estados Unidos?', 'Con CotizaBot escribes el trabajo en tus palabras — "pintar sala y 2 cuartos con material" — y la IA lo convierte en un estimate profesional en dólares, con tax, labor y materiales separados y PDF con tu logo. Todo en español, desde tu celular.'],
  ['¿El estimate sale en dólares y con tax?', 'Sí. Eliges modo USA 🇺🇸 y pones la tasa de sales tax que aplica a tu caso — el tax varía por estado, localidad y tipo de trabajo (en Texas, por ejemplo, los trabajos residenciales y comerciales se manejan distinto) — o la dejas en cero. El total sale exacto en USD.'],
  ['¿Cuánto cuesta la app para hacer estimates?', 'El primer estimate es gratis y sin tarjeta. Después son $15 USD al mes con estimates ilimitados, tu logo, PDF y link para compartir.'],
  ['¿Sirve para roofing, landscaping, painting o handyman?', 'Sí, está hecha para contratistas hispanos: roofing, landscaping, painting, remodeling, drywall, flooring, handyman, cleaning, concrete y fencing. Separas labor y materiales como lo piden los customers y los GCs.'],
  ['¿Necesito computadora o saber inglés?', 'No. Todo es en español y desde tu celular — se instala como app. El estimate que recibe el customer se ve profesional, con números en formato de USA.'],
  ['¿La IA inventa los precios?', 'No. Tú guardas tus precios una vez (por sqft, por hora, por servicio o por producto) y la IA los usa para armar cada estimate. Tú siempre tienes la última palabra: puedes editar cualquier línea antes de generar el PDF.'],
  ['¿Puedo entregar el estimate en inglés?', 'Sí. Tú trabajas en español y eliges el idioma del PDF: español o inglés (ESTIMATE, Qty, Unit Price, Total). Así tu customer americano lo recibe en su idioma.'],
  ['¿Cómo le mando el estimate al customer?', 'Cada estimate genera un PDF y un link: lo mandas por mensaje de texto, WhatsApp o email directo desde tu celular, en el momento, antes que la competencia.'],
];

const JSONLD_USA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CotizaBot — Estimates en español para contratistas hispanos en USA',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    inLanguage: 'es',
    offers: { '@type': 'Offer', price: '15', priceCurrency: 'USD' },
    audience: { '@type': 'Audience', audienceType: 'Contratistas hispanos y latinos en Estados Unidos: roofing, landscaping, painting, remodeling, drywall, handyman' },
    areaServed: 'US',
    url: 'https://cotizaexpress.com/usa',
    description: 'App en español para hacer estimates profesionales en dólares: describe el trabajo y la IA genera el estimate con tax, labor, materiales y PDF con tu logo.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_USA.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

export default function LandingUSA() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Estimates Profesionales en Español — App para Contratistas Hispanos en USA | CotizaBot</title>
        <meta name="description" content="Haz tus estimates en dólares desde tu celular, en español: describe el trabajo, la IA lo cotiza con tax y PDF profesional. Para roofing, landscaping, painting, remodeling. $15 USD/mes, el primero gratis." />
        <link rel="canonical" href="https://cotizaexpress.com/usa" />
        <meta property="og:title" content="Estimates profesionales en español — para contratistas hispanos en USA" />
        <meta property="og:description" content="Describe el trabajo y la IA te arma el estimate en dólares con tax y PDF. Desde tu celular. $15 USD/mes." />
        <meta property="og:url" content="https://cotizaexpress.com/usa" />
        <script type="application/ld+json">{JSON.stringify(JSONLD_USA)}</script>
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
            🇺🇸 Para contratistas hispanos en Estados Unidos 🇲🇽
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Manda estimates como los grandes,<br className="hidden sm:block"/> <span className="text-yellow-300">en español y en 2 minutos</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-7">
            Describe el trabajo — "pintar 2 cuartos con material" — y la IA te arma el estimate en dólares
            <strong className="text-white">con tus precios</strong> (los guardas una vez), con tax y PDF profesional con tu logo.
            Listo para mandarlo por texto o WhatsApp antes que la competencia.
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
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Hecho para tu oficio</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {OFICIOS_US.map(o => OFICIOS_CON_PAGINA[o] ? (
              <Link key={o} to={`/usa/${OFICIOS_CON_PAGINA[o]}`} className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded-full px-4 py-2 text-sm border border-blue-200">{o} →</Link>
            ) : (
              <span key={o} className="bg-slate-100 text-slate-700 font-medium rounded-full px-4 py-2 text-sm">{o}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona — demo visual */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Así funciona 🤖</h2>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-700 mb-2">1 · Describe el trabajo</div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-left">
                <div className="bg-[#DCF8C6] rounded-xl px-3 py-2 text-sm text-slate-800">"Pintar sala y 2 cuartos, 850 sqft, con material, 2 manos"</div>
                <p className="text-xs text-slate-400 mt-2">En tus palabras, en español — o súbele una foto 📷 de tu lista y la IA la lee.</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-700 mb-2">2 · La IA lo arma con TUS precios</div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-left text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between"><span>🎨 Paint &amp; materials</span><span className="font-semibold">$380.00</span></div>
                <div className="flex justify-between"><span>👷 Labor — 850 sqft × $1.29</span><span className="font-semibold">$1,100.00</span></div>
                <div className="flex justify-between text-slate-400"><span>Tax (tu tasa: 8%)</span><span>$118.40</span></div>
                <p className="text-[11px] text-slate-400 pt-1">Tus tarifas se guardan una vez. Puedes editar cualquier línea.</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-700 mb-2">3 · Mandas el PDF</div>
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-md text-left text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-slate-800">García Painting LLC</span>
                  <span className="text-right text-blue-700 font-bold">ESTIMATE<br/><span className="text-slate-400 font-normal">CX-7K2M4</span></span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 text-slate-600">
                  <div className="flex justify-between py-0.5"><span>Paint &amp; materials</span><span>$380.00</span></div>
                  <div className="flex justify-between py-0.5"><span>Labor — 850 sqft</span><span>$1,100.00</span></div>
                </div>
                <div className="flex justify-between bg-blue-700 text-white font-bold rounded px-2 py-1.5 mt-1.5"><span>TOTAL (USD, tax incl.)</span><span>$1,598.40</span></div>
                <p className="text-[11px] text-slate-400 mt-2">En español o inglés — como lo quiera tu customer. Por texto, WhatsApp o email.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
          {[
            ['💵', 'En dólares, con tax', 'Pones la tasa de tax que aplica a tu trabajo — varía por estado, localidad y tipo de servicio — o la dejas en cero. Separa labor y materiales.'],
            ['🏃', 'El primero que manda precio, gana', 'Tu cliente pidió precio a varios. Manda el tuyo desde tu teléfono antes de salir del lugar — te ves profesional y cierras.'],
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

      {/* FAQ (SEO + respuestas de IA) */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQ_USA.map(([q, a]) => (
              <details key={q} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <summary className="font-semibold text-slate-800 cursor-pointer">{q}</summary>
                <p className="text-sm text-slate-600 mt-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">$15 dólares al mes</h2>
          <p className="text-slate-600 mb-6">Estimates ilimitados, con tu logo, labor + materiales, PDF y link para compartir. <strong>El primero es gratis, sin tarjeta.</strong></p>
          <Link to="/registro?utm_source=usa">
            <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg font-bold px-8 py-6">Empezar gratis ahora →</Button>
          </Link>
          <p className="text-xs text-slate-400 mt-4">¿Tienes negocio con WhatsApp de clientes? Pregunta por CotizaBot: contesta y cotiza solo, 24/7.</p>
        </div>
      </section>
    </div>
  );
}
