import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const FAQS = [
  { q: '¿Las plantillas de cotización son gratis?', a: 'Sí, 100% gratis y sin registro. Descarga la versión Excel o Word, ponle el nombre y logo de tu negocio, y úsala las veces que quieras.' },
  { q: '¿La plantilla de Excel calcula el IVA automáticamente?', a: 'Sí. La plantilla de Excel trae fórmulas: capturas cantidad y precio unitario, y calcula importes, subtotal, IVA al 16% y total automáticamente.' },
  { q: '¿Qué debe llevar una cotización formal?', a: 'Datos de tu negocio, datos del cliente, fecha y vigencia, detalle de productos con cantidades y precios, subtotal, IVA desglosado, total y folio. Ambas plantillas incluyen todos estos campos.' },
  { q: '¿Hay una forma más rápida que llenar plantillas?', a: 'Sí. Si haces cotizaciones a diario, CotizaBot las genera automáticamente en WhatsApp: tu cliente manda su lista de productos y recibe la cotización en PDF con IVA en 3 segundos, sin que tú llenes nada.' },
];

export default function PlantillasCotizacion() {
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
        <title>Plantilla de Cotización en Excel y Word — Descarga Gratis | CotizaExpress</title>
        <meta name="description" content="Descarga gratis nuestra plantilla de cotización en Excel (con fórmulas de IVA automáticas) y Word. Formato profesional listo para tu negocio en México." />
        <link rel="canonical" href="https://cotizaexpress.com/plantillas/cotizacion" />
        <meta property="og:title" content="Plantilla de Cotización Excel y Word — Gratis" />
        <meta property="og:description" content="Formato de cotización profesional con IVA. Descarga gratis en Excel o Word." />
        <meta property="og:url" content="https://cotizaexpress.com/plantillas/cotizacion" />
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
              <Link to="/generador-de-cotizaciones" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Generador Online</Link>
              <Link to="/blog" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Blog</Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Plantilla de Cotización Gratis (Excel y Word)</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">Formato profesional de cotización para negocios mexicanos: con folio, vigencia, desglose de IVA al 16% y campos listos para tu logo. Descarga la versión que prefieras — sin registro.</p>

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <Card className="border-2 border-emerald-100">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📊</div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Plantilla Excel</h2>
              <p className="text-sm text-slate-600 mb-4">Con fórmulas automáticas: captura cantidades y precios, el subtotal, IVA y total se calculan solos.</p>
              <a href="/plantillas/plantilla-cotizacion-cotizaexpress.xlsx" download>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">⬇ Descargar Excel (.xlsx)</Button>
              </a>
            </CardContent>
          </Card>
          <Card className="border-2 border-sky-100">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">📄</div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Plantilla Word</h2>
              <p className="text-sm text-slate-600 mb-4">Formato editable para personalizar con tu logo y colores. Ideal para imprimir o guardar como PDF.</p>
              <a href="/plantillas/plantilla-cotizacion-cotizaexpress.docx" download>
                <Button className="w-full bg-sky-600 hover:bg-sky-700">⬇ Descargar Word (.docx)</Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center mb-14">
          <p className="text-white font-bold text-lg mb-1">¿Y si ya no tuvieras que llenar plantillas?</p>
          <p className="text-emerald-100 text-sm mb-4">CotizaBot genera la cotización solo: tu cliente manda su lista por WhatsApp y recibe el PDF con IVA en 3 segundos, 24/7.</p>
          <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">Ver la demo en WhatsApp</Button>
          </a>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Cómo usar la plantilla</h2>
          <p className="text-slate-600 mb-3 max-w-3xl">Descarga el archivo, reemplaza "Nombre de tu negocio" con tus datos y tu logo, y captura los productos de tu cliente con cantidades y precios. En la versión Excel el IVA al 16% y el total se calculan solos; en Word solo edita los montos. Guarda como PDF y envíala por WhatsApp o correo.</p>
          <p className="text-slate-600 max-w-3xl">Consejo: usa un folio consecutivo (COT-001, COT-002…) y una vigencia de 7 a 15 días — los precios cambian y una cotización sin vigencia te puede obligar a respetar precios viejos.</p>
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
          También te puede servir: <Link to="/generador-de-cotizaciones" className="text-emerald-600 font-medium">Generador de cotizaciones online</Link> · <Link to="/calculadora-iva" className="text-emerald-600 font-medium">Calculadora de IVA</Link> · <Link to="/blog/como-hacer-cotizacion-formal-con-iva" className="text-emerald-600 font-medium">Cómo hacer una cotización formal</Link>
        </p>
      </main>
    </div>
  );
}
