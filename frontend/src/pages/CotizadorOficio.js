import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const OFICIOS = {
  'cotizador-para-contratistas': {
    nombre: 'contratistas',
    h1: 'Cotizador instantáneo para contratistas',
    sub: 'Convierte "pintar 2 recámaras y resanar muros" en una cotización formal con folio, IVA y total — en tu celular, en 2 minutos, gratis.',
    ejemplo: 'Demolición de muro 12 m², retiro de escombro, muro nuevo de block con castillos y aplanado',
    metaTitle: 'Cotizador Instantáneo para Contratistas — Gratis, con IVA y Folio',
    metaDesc: 'Haz cotizaciones profesionales de obra en 2 minutos desde tu celular: conceptos, IVA al 16%, folio y PDF para enviar por WhatsApp. Gratis, sin registro.',
    bullets: ['Cotiza desde la obra, en el celular', 'IVA desglosado y total automático', 'Folio y formato profesional que cierra trabajos'],
  },
  'cotizador-para-techadores': {
    nombre: 'techadores',
    h1: 'Cotizador instantáneo para techadores',
    sub: 'Lámina, polines, caballete, tornillería y mano de obra — todo en una cotización formal con IVA que mandas por WhatsApp antes de bajarte del techo.',
    ejemplo: 'Techo de lámina galvanizada cal 26, 8x6 m, con estructura de PTR y caballete',
    metaTitle: 'Cotizador Instantáneo para Techadores — Gratis, con IVA y Folio',
    metaDesc: 'Cotiza techos en minutos: materiales y mano de obra con IVA al 16%, folio y PDF listo para WhatsApp. Herramienta gratuita para techadores en México.',
    bullets: ['Materiales + mano de obra en un solo total', 'El primero que manda precio formal gana el techo', 'Gratis y sin registro'],
  },
  'cotizador-para-pintores': {
    nombre: 'pintores',
    h1: 'Cotizador instantáneo para pintores',
    sub: 'Metros cuadrados, pintura, sellador y mano de obra en una cotización profesional con IVA — lista para enviar por WhatsApp al cliente.',
    ejemplo: 'Pintar fachada 80 m² con sellador y 2 manos de vinílica, incluye material',
    metaTitle: 'Cotizador Instantáneo para Pintores — Gratis, con IVA y Folio',
    metaDesc: 'Haz cotizaciones de pintura en 2 minutos: conceptos por m², IVA desglosado, folio y PDF para WhatsApp. Herramienta gratuita para pintores en México.',
    bullets: ['Cotiza por m² con material incluido o sin él', 'Formato profesional con folio', 'Gratis, desde el celular'],
  },
};

export default function CotizadorOficio({ slug }) {
  const o = OFICIOS[slug];
  if (!o) return <Navigate to="/generador-de-cotizaciones" replace />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: o.h1,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
    url: `https://cotizaexpress.com/${slug}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Helmet>
        <title>{o.metaTitle} | CotizaExpress</title>
        <meta name="description" content={o.metaDesc} />
        <link rel="canonical" href={`https://cotizaexpress.com/${slug}`} />
        <meta property="og:title" content={o.metaTitle} />
        <meta property="og:description" content={o.metaDesc} />
        <meta property="og:url" content={`https://cotizaexpress.com/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-12 w-auto" />
            <span className="font-bold text-slate-900">CotizaBot</span>
          </Link>
          <Link to="/cotizacion-formal" className="text-sm text-slate-600 hover:text-emerald-600">¿Qué lleva una cotización formal?</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">{o.h1}</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">{o.sub}</p>

        <div className="max-w-md mx-auto mb-8 text-left">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-sm text-slate-800">"{o.ejemplo}"</div>
          <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm text-slate-800 mt-2">
            ✅ Cotización formal lista: conceptos, IVA y total con folio. <span className="text-emerald-600 font-semibold">Para enviar por WhatsApp.</span>
          </div>
        </div>

        <Link to="/registro">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">Hacer mi cotización gratis →</Button>
        </Link>
        <p className="text-sm text-slate-400 mt-3">1 cotización gratis · sin tarjeta · se instala como app en tu celular 📲</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 text-sm text-amber-900 max-w-xl mx-auto">
          👷 <strong>Separa mano de obra y materiales</strong> en la misma cotización — tu cliente ve el desglose claro y tú cierras sin regateos.
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
          {o.bullets.map((b, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700">✅ {b}</div>
          ))}
        </div>

        <div className="mt-14 bg-white border-2 border-emerald-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">¿Vendes materiales y te cotizan a ti?</h2>
          <p className="text-slate-600 mb-4">
            Si eres el proveedor al que los {o.nombre} le piden precios por WhatsApp, CotizaBot contesta por ti:
            lee la lista, busca en tu catálogo y responde la cotización con IVA y PDF en 5 segundos, 24/7.
          </p>
          <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#25D366] hover:bg-[#1ebe57]">Ver el demo en WhatsApp</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
