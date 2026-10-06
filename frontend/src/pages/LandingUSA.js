import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const OFICIOS_US = ['Roofing', 'Landscaping', 'Painting', 'Remodeling', 'Drywall', 'Flooring', 'Handyman', 'Cleaning', 'Concrete', 'Fencing'];
const OFICIOS_CON_PAGINA = { Roofing: 'roofing', Landscaping: 'landscaping', Painting: 'painting', Remodeling: 'remodeling', Drywall: 'drywall', Handyman: 'handyman' };

const FAQ_USA = [
  ['¿Cómo hago un estimate en español en Estados Unidos?', 'Con CotizaBot escribes el trabajo en tus palabras — "pintar sala y 2 cuartos con material" — y CotizaBot lo convierte en un estimate profesional en dólares, con tax, labor y materiales separados y PDF con tu logo. Todo en español, desde tu celular.'],
  ['¿El estimate sale en dólares y con tax?', 'Sí. Eliges modo USA 🇺🇸 y pones la tasa de sales tax que aplica a tu caso — el tax varía por estado, localidad y tipo de trabajo (en Texas, por ejemplo, los trabajos residenciales y comerciales se manejan distinto) — o la dejas en cero. El total sale exacto en USD.'],
  ['¿Cuánto cuesta la app para hacer estimates?', 'El primer estimate es gratis y sin tarjeta. Después son $15 USD al mes con estimates ilimitados, tu logo, PDF y link para compartir.'],
  ['¿Sirve para roofing, landscaping, painting o handyman?', 'Sí, está hecha para contratistas hispanos: roofing, landscaping, painting, remodeling, drywall, flooring, handyman, cleaning, concrete y fencing. Separas labor y materiales como lo piden los clientes y los contratistas generales.'],
  ['¿Necesito computadora o saber inglés?', 'No. Todo es en español y desde tu celular — se instala como app. El estimate que recibe el cliente se ve profesional, con números en formato de USA.'],
  ['¿Me dice cuánto le gano a cada trabajo?', 'Te muestra tu ganancia estimada: activas "¿Cuánto me queda?", pones lo que a ti te cuesta cada renglón (material, cuadrilla, gasolina) y ves tu margen antes de mandar el estimate — calculado sobre la venta antes de tax y tan exacto como los costos que captures. Te avisa si vas abajo del 20%. Tu cliente nunca lo ve.'],
  ['¿La IA inventa los precios?', 'No. Tú guardas tus precios una vez (por sqft, por hora, por servicio o por producto) y CotizaBot los usa para armar cada estimate. Tú siempre tienes la última palabra: puedes editar cualquier línea antes de generar el PDF.'],
  ['¿Puedo entregar el estimate en inglés?', 'Sí. Tú trabajas en español y eliges el idioma del PDF: español o inglés (ESTIMATE, Qty, Unit Price, Total). Así tu cliente americano lo recibe en su idioma.'],
  ['¿Y si mis clientes me escriben mucho por WhatsApp?', 'Ese es el paso 2: CotizaBot conecta tu WhatsApp y contesta solo — lee lo que pide el cliente, busca en tus precios y responde el estimate con PDF en segundos, 24/7, aunque andes trabajando. Es el mismo sistema que ya usan negocios en México.'],
  ['¿Cómo le mando el estimate a mi cliente?', 'Cada estimate genera un PDF y un link: lo mandas por mensaje de texto, WhatsApp o email directo desde tu celular, en el momento, antes que la competencia.'],
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
    description: 'App en español para hacer estimates profesionales en dólares: describe el trabajo y CotizaBot genera el estimate con tax, labor, materiales y PDF con tu logo.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_USA.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

export default function LandingUSA() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % 2), 7000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Estimates Profesionales en Español — App para Contratistas Hispanos en USA | CotizaBot</title>
        <meta name="description" content="Haz tus estimates en dólares desde tu celular, en español: describe el trabajo y CotizaBot lo cotiza con tax y PDF profesional. Para roofing, landscaping, painting, remodeling. $15 USD/mes, el primero gratis." />
        <link rel="canonical" href="https://cotizaexpress.com/usa" />
        <meta property="og:title" content="Estimates profesionales en español — para contratistas hispanos en USA" />
        <meta property="og:description" content="Describe el trabajo y CotizaBot te arma el estimate en dólares con tax y PDF. Desde tu celular. $15 USD/mes." />
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

      {/* Hero — carrusel de 2 productos (como México) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-sm font-medium">
              🇺🇸 Para contratistas hispanos en Estados Unidos 🇲🇽
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Texto del slide */}
            <div className="text-center lg:text-left order-1">
              {slide === 0 ? (
                <>
                  <p className="text-sm font-bold text-emerald-700 mb-2">✨ MANDA ESTIMATES</p>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
                    Manda estimates como los grandes,<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">en español y en 2 minutos</span>
                  </h1>
                  <p className="text-lg text-slate-600 mb-7 max-w-xl mx-auto lg:mx-0">
                    Describe el trabajo y <strong className="text-emerald-700">CotizaBot</strong> arma el estimate en dólares con tus precios — tax, PDF con tu logo, listo para mandar.
                  </p>
                  <Link to="/registro?utm_source=usa">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-extrabold px-8 py-6 shadow-xl">
                      Hacer mi primer estimate GRATIS →
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-500 mt-3">$15 USD/mes después del primero · sin tarjeta · cancela cuando quieras</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-green-700 mb-2">🤖 TU WHATSAPP CONTESTA SOLO</p>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
                    Tu cliente pregunta precio.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Tu WhatsApp cotiza solo.</span>
                  </h1>
                  <p className="text-lg text-slate-600 mb-7 max-w-xl mx-auto lg:mx-0">
                    CotizaBot conecta tu número: lee lo que pide el cliente, usa tus precios y responde el estimate con PDF en 5 segundos — 24/7, aunque andes en el trabajo.
                  </p>
                  <Link to="/registro?utm_source=usa_bot">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg font-extrabold px-8 py-6 shadow-xl">
                      Quiero que conteste solo →
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-500 mt-3">$49 USD/mes · empieza con el plan de $15 y súbete cuando quieras</p>
                </>
              )}
            </div>

            {/* Mockup del slide */}
            <div className="order-2">
              {slide === 0 ? (
                <div className="max-w-[300px] sm:max-w-sm mx-auto bg-white rounded-3xl p-5 shadow-2xl border border-emerald-100 text-left">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 mb-3">"Pintar sala y 2 cuartos, 850 sqft, con material, 2 manos"</div>
                  <div className="text-center text-emerald-500 text-xl mb-3">⬇</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs text-slate-700">
                    <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 border-b"><span className="font-extrabold text-slate-800">García Painting LLC</span><span className="text-emerald-700 font-bold">ESTIMATE · CX-7K2M4</span></div>
                    <div className="grid grid-cols-3 px-3 py-1.5"><span>Paint & materials</span><span className="text-center">1</span><span className="text-right">$380.00</span></div>
                    <div className="grid grid-cols-3 px-3 py-1.5 border-t bg-slate-50"><span>👷 Labor — 850 sqft</span><span className="text-center">1</span><span className="text-right">$1,100.00</span></div>
                    <div className="flex justify-between px-3 py-2 border-t bg-emerald-600 text-white font-bold"><span>TOTAL (USD, tax inc.)</span><span>$1,598.40</span></div>
                  </div>
                  <p className="text-center text-[11px] text-slate-500 mt-3">📄 PDF en español o inglés · por texto, WhatsApp o email · también lee fotos 📷</p>
                </div>
              ) : (
                <div className="max-w-[300px] sm:max-w-sm mx-auto bg-[#ECE5DD] rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-200">
                  <div className="bg-[#075E54] text-white rounded-t-2xl px-4 py-2 text-sm font-semibold flex items-center gap-2">🤖 García Painting LLC</div>
                  <div className="space-y-2 p-3">
                    <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 text-sm shadow-sm max-w-[85%]">¿Cuánto por pintar sala y 2 cuartos con material?</div>
                    <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-3 py-2 text-sm shadow-sm ml-auto max-w-[90%]">
                      ✅ <strong>Estimate CX-7K2M4</strong><br/>
                      Paint & materials — $380.00<br/>
                      Labor 850 sqft — $1,100.00<br/>
                      <strong>TOTAL (USD, tax inc.): $1,598.40</strong><br/>
                      📄 PDF adjunto
                    </div>
                    <p className="text-center text-[11px] text-slate-500">⚡ contestó solo en 5 segundos — 9:47 PM</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles del carrusel */}
          <div className="flex justify-center gap-3 mt-10">
            <button onClick={() => setSlide(0)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${slide === 0 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}>✨ Manda estimates</button>
            <button onClick={() => setSlide(1)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${slide === 1 ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}>🤖 WhatsApp que contesta solo</button>
          </div>

          {/* 3 puntos, una línea cada uno */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-600">
            <span>💵 Dólares, con el tax de tu área</span>
            <span>🔒 Tus precios — CotizaBot no inventa</span>
            <span>📲 Vive en tu celular, en español</span>
            <span>💰 Te dice cuánto te queda de ganancia</span>
          </div>
        </div>
      </section>

      {/* Precio + CTA */}
      <section className="py-14 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">$15 dólares al mes</h2>
          <p className="text-slate-600 mb-6">Estimates ilimitados con tu logo, labor + materiales y PDF. <strong>El primero es gratis, sin tarjeta.</strong></p>
          <Link to="/registro?utm_source=usa">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg font-bold px-8 py-6">Empezar gratis ahora →</Button>
          </Link>
        </div>
      </section>

      {/* Paso 2: el bot */}
      <section className="py-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-4">🤖 El paso 2, cuando tengas muchos clientes</div>
          <h2 className="text-3xl font-extrabold mb-3">Que tu WhatsApp conteste y cotice solo</h2>
          <div className="max-w-xs mx-auto bg-white rounded-2xl p-4 text-left text-sm mb-6">
            <div className="bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 text-slate-800 mb-2">"¿Cuánto por pintar 2 cuartos?"</div>
            <div className="bg-slate-100 rounded-xl rounded-tl-none px-3 py-2 text-slate-800">🤖 Aquí está tu estimate CX-7K2M4 por $1,598.40 USD 📄 — CotizaBot contesta solo, en 5 segundos, 24/7.</div>
          </div>
          <Link to="/registro?utm_source=usa_bot">
            <Button size="lg" className="bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold px-8 py-6">Quiero que conteste solo →</Button>
          </Link>
          <p className="text-sm text-emerald-100 mt-3">$49 USD/mes (o $99 con cobros automáticos).</p>
        </div>
      </section>

      {/* Footer: oficios + FAQ compactos (SEO) */}
      <section className="py-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {OFICIOS_US.map(o => OFICIOS_CON_PAGINA[o] ? (
              <Link key={o} to={`/usa/${OFICIOS_CON_PAGINA[o]}`} className="bg-white hover:bg-emerald-50 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-medium border border-emerald-200">{o} →</Link>
            ) : (
              <span key={o} className="bg-white text-slate-500 rounded-full px-3 py-1.5 text-xs border border-slate-200">{o}</span>
            ))}
          </div>
          <h2 className="text-base font-bold text-slate-700 mb-3 text-center">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {FAQ_USA.map(([q, a]) => (
              <details key={q} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                <summary className="text-sm font-medium text-slate-700 cursor-pointer">{q}</summary>
                <p className="text-sm text-slate-600 mt-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
