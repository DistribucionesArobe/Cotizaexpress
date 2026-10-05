import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const OFICIOS_USA = {
  roofing: {
    nombre: 'roofing',
    emoji: '🏠',
    h1: 'Estimates de roofing en español',
    sub: 'Shingles, underlayment, flashing y labor — todo en un estimate profesional en dólares, con tax, listo para mandarlo por texto antes de bajarte del techo.',
    ejemplo: 'Reemplazo de techo 22 squares, shingles arquitectónicos, incluye tear-off y disposal',
    metaTitle: 'Estimates de Roofing en Español — App para Roofers Hispanos en USA',
    metaDesc: 'Haz estimates de roofing en dólares desde tu celular, en español: materiales, labor y tax de tu estado en un PDF profesional. $15/mes, el primero gratis.',
    bullets: ['Cotiza por square con material y labor separados', 'Tax de tu estado configurable', 'PDF con tu logo que te hace ver como compañía grande'],
    faq: [
      ['¿Cómo hago un estimate de roofing en español?', 'Escribe el jale en tus palabras — "reemplazo de techo 22 squares con tear-off" — y la IA lo convierte en un estimate en dólares con labor, materiales, tax y PDF profesional, todo en español.'],
      ['¿Puedo separar labor y materiales en el estimate?', 'Sí. Cada línea se marca como material o labor (mano de obra) y el PDF muestra el desglose, que es lo que el customer y las aseguranzas quieren ver.'],
      ['¿Sirve para trabajos de aseguranza (insurance claims)?', 'El PDF trae folio, desglose de conceptos y totales con tax — el formato que piden los adjusters. Tú pones los precios de tu área.'],
    ],
  },
  landscaping: {
    nombre: 'landscaping',
    emoji: '🌳',
    h1: 'Estimates de landscaping en español',
    sub: 'Mowing, mulch, sod, irrigación y labor — manda el estimate en dólares desde la troca, en español, antes que los otros landscapers.',
    ejemplo: 'Instalar sod 1,200 sqft, 5 yardas de mulch, recortar 3 árboles, limpieza general',
    metaTitle: 'Estimates de Landscaping en Español — App para Landscapers Hispanos en USA',
    metaDesc: 'Haz estimates de landscaping y lawn care en dólares desde tu celular, en español: sod, mulch, labor y tax en un PDF profesional. $15/mes, el primero gratis.',
    bullets: ['Cotiza por sqft, por yarda o por servicio', 'Estimates recurrentes en segundos (mowing semanal)', 'El primero que manda precio se queda el yard'],
    faq: [
      ['¿Cómo hago un estimate de landscaping en español?', 'Describe el trabajo — "instalar sod 1,200 sqft y 5 yardas de mulch" — y la IA arma el estimate en dólares con materiales, labor y tax, en español y con PDF profesional.'],
      ['¿Puedo cotizar servicios recurrentes como mowing?', 'Sí, guardas tus precios una vez (por corte, por sqft, por visita) y cada estimate nuevo sale en segundos desde tu celular.'],
      ['¿El estimate sale en dólares con tax?', 'Sí, todo en USD y tú pones el sales tax de tu estado (o lo dejas en cero si tu servicio no lleva tax).'],
    ],
  },
  painting: {
    nombre: 'painting',
    emoji: '🎨',
    h1: 'Estimates de painting en español',
    sub: 'Por sqft o por cuarto, con pintura y labor desglosados — un estimate en dólares con tu logo, en español, en 2 minutos.',
    ejemplo: 'Pintar interior 1,800 sqft, 2 manos, incluye primer y material, paredes y techos',
    metaTitle: 'Estimates de Painting en Español — App para Pintores Hispanos en USA',
    metaDesc: 'Haz estimates de pintura en dólares desde tu celular, en español: sqft, pintura, labor y tax en un PDF profesional. $15/mes, el primero gratis.',
    bullets: ['Cotiza por sqft con material incluido o sin él', 'Labor y pintura separados, como lo pide el customer', 'PDF profesional que gana contra el estimate escrito a mano'],
    faq: [
      ['¿Cómo hago un estimate de pintura en español?', 'Escribe el jale — "pintar interior 1,800 sqft, 2 manos con material" — y la IA lo convierte en estimate en dólares con desglose, tax y PDF en español.'],
      ['¿Cuánto cobrar por pintar en USA?', 'Los precios varían por ciudad y estado; tú guardas TUS precios por sqft o por cuarto una vez, y la app los usa en cada estimate nuevo.'],
      ['¿Puedo mandar el estimate por texto o WhatsApp?', 'Sí, cada estimate genera un link y un PDF que mandas por mensaje de texto, WhatsApp o email desde tu celular.'],
    ],
  },
  remodeling: {
    nombre: 'remodeling',
    emoji: '🔨',
    h1: 'Estimates de remodeling en español',
    sub: 'Kitchen, baño, basement o la casa entera — estimates en dólares con materiales y labor desglosados, en español y con PDF profesional.',
    ejemplo: 'Remodelación de baño completo: demolición, tile 120 sqft, vanity, plomería y labor',
    metaTitle: 'Estimates de Remodeling en Español — App para Remodeladores Hispanos en USA',
    metaDesc: 'Haz estimates de remodelación en dólares desde tu celular, en español: demolición, materiales, labor y tax en un PDF profesional. $15/mes, el primero gratis.',
    bullets: ['Proyectos grandes con muchos conceptos, sin batallar', 'Desglose claro = menos regateo del customer', 'Te ves como general contractor aunque andes empezando'],
    faq: [
      ['¿Cómo hago un estimate de remodelación en español?', 'Pega la lista del proyecto — demolición, tile, vanity, labor — y la IA arma el estimate completo en dólares con tax y PDF profesional en español.'],
      ['¿Sirve para proyectos grandes con muchas líneas?', 'Sí, puedes meter todas las líneas que necesites, editarlas en una tabla y marcar cada una como material o labor antes de generar el PDF.'],
      ['¿El customer puede ver el estimate en su teléfono?', 'Sí, le mandas un link o el PDF directo por texto, WhatsApp o email — se ve profesional en cualquier teléfono.'],
    ],
  },
  handyman: {
    nombre: 'handyman',
    emoji: '🔧',
    h1: 'Estimates de handyman en español',
    sub: 'Jales chicos, muchos al día — haz cada estimate en 2 minutos en dólares, con tax, y mándalo antes de llegar al siguiente trabajo.',
    ejemplo: 'Instalar ceiling fan, reparar drywall 2 hoyos, pintar puerta, cambiar llave de cocina',
    metaTitle: 'Estimates de Handyman en Español — App para Handymen Hispanos en USA',
    metaDesc: 'Haz estimates de handyman en dólares desde tu celular, en español: lista de trabajos, labor, tax y PDF profesional en 2 minutos. $15/mes, el primero gratis.',
    bullets: ['Varios jales en un mismo estimate', 'Rápido: lo haces entre trabajo y trabajo', 'Precio formal por escrito = te pagan lo justo'],
    faq: [
      ['¿Cómo hago un estimate de handyman en español?', 'Escribe la lista de trabajos — "instalar ceiling fan, reparar drywall, cambiar llave" — y la IA arma el estimate en dólares con cada concepto, tax y PDF en español.'],
      ['¿Me sirve si cobro por hora?', 'Sí, agregas una línea de labor con tus horas y tu rate, y el total con tax sale solo.'],
      ['¿Necesito computadora?', 'No, todo es desde tu celular y se instala como app. En español y sin programas raros.'],
    ],
  },
  drywall: {
    nombre: 'drywall',
    emoji: '🧱',
    h1: 'Estimates de drywall en español',
    sub: 'Hanging, taping, texture y labor por sqft — el estimate en dólares con tax sale en 2 minutos desde tu celular, en español.',
    ejemplo: 'Hang y finish de drywall 2,400 sqft, nivel 4, incluye material y texture knockdown',
    metaTitle: 'Estimates de Drywall en Español — App para Drywalleros Hispanos en USA',
    metaDesc: 'Haz estimates de drywall en dólares desde tu celular, en español: sqft, material, labor y tax en un PDF profesional. $15/mes, el primero gratis.',
    bullets: ['Cotiza por sqft o por board', 'Hanging, taping y texture como líneas separadas', 'PDF con folio para builders y GCs'],
    faq: [
      ['¿Cómo hago un estimate de drywall en español?', 'Describe el jale — "hang y finish 2,400 sqft nivel 4 con texture" — y la IA lo convierte en estimate en dólares con desglose, tax y PDF profesional.'],
      ['¿Sirve para trabajar con builders y general contractors?', 'Sí, el PDF con folio y desglose por concepto es el formato que los GCs esperan — te toman más en serio que con un número hablado.'],
      ['¿Puedo cotizar solo labor sin material?', 'Sí, marcas cada línea como labor o material; si el GC pone el material, tu estimate sale solo con labor.'],
    ],
  },
};

export default function OficioUSA({ slug }) {
  const o = OFICIOS_USA[slug];
  if (!o) return <Navigate to="/usa" replace />;
  const url = `https://cotizaexpress.com/usa/${slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: o.h1,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      inLanguage: 'es',
      offers: { '@type': 'Offer', price: '15', priceCurrency: 'USD' },
      audience: { '@type': 'Audience', audienceType: `Contratistas hispanos de ${o.nombre} en Estados Unidos` },
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: o.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <Helmet>
        <title>{o.metaTitle} | CotizaBot</title>
        <meta name="description" content={o.metaDesc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={o.metaTitle} />
        <meta property="og:description" content={o.metaDesc} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/usa" className="flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 flex-shrink-0">🤖</div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CotizaBot</span>
          </Link>
          <Link to="/usa" className="text-sm text-slate-600 hover:text-blue-700">🇺🇸 Para paisanos en USA</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-14 text-center">
        <p className="text-4xl mb-3">{o.emoji}</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">{o.h1}</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">{o.sub}</p>

        <div className="max-w-md mx-auto mb-8 text-left">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-sm text-slate-800">"{o.ejemplo}"</div>
          <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm text-slate-800 mt-2">
            ✅ Estimate listo en USD: conceptos, labor, tax y PDF con folio. <span className="text-blue-700 font-semibold">Para mandarlo por texto o WhatsApp.</span>
          </div>
        </div>

        <Link to={`/registro?utm_source=usa_${slug}`}>
          <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6">Hacer mi primer estimate GRATIS →</Button>
        </Link>
        <p className="text-sm text-slate-400 mt-3">$15 USD/mes después del primero · en español · se instala como app 📲</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 text-sm text-amber-900 max-w-xl mx-auto">
          👷 <strong>Labor y materiales separados</strong> en el mismo estimate — el customer ve el desglose claro y tú cierras el jale sin regateos.
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
          {o.bullets.map((b, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700">✅ {b}</div>
          ))}
        </div>

        {/* FAQ visible (SEO + GEO) */}
        <section className="mt-14 text-left">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 text-center">Preguntas de otros paisanos</h2>
          <div className="space-y-3">
            {o.faq.map(([q, a]) => (
              <details key={q} className="bg-white border border-slate-200 rounded-xl p-4">
                <summary className="font-semibold text-slate-800 cursor-pointer">{q}</summary>
                <p className="text-sm text-slate-600 mt-2">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links a los demás oficios */}
        <div className="mt-12">
          <p className="text-sm text-slate-500 mb-3">También hacemos estimates de:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(OFICIOS_USA).filter(([s]) => s !== slug).map(([s, x]) => (
              <Link key={s} to={`/usa/${s}`} className="bg-slate-100 hover:bg-blue-100 text-slate-700 text-sm font-medium rounded-full px-4 py-2">
                {x.emoji} {x.nombre.charAt(0).toUpperCase() + x.nombre.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
