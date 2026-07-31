import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useParams, Navigate } from 'react-router-dom';
import GIROS_SEO from '../data/girosSEO';

const Check = () => (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
  </svg>
);

const WA_LINK = 'https://wa.me/5218342472640?text=DEMO';

export default function GiroSEO({ slug }) {
  const { giroSlug } = useParams();
  const g = GIROS_SEO[slug || giroSlug];

  if (!g) return <Navigate to="/" replace />;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: g.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `CotizaBot para ${g.nombre}`,
    description: g.metaDesc,
    provider: { '@type': 'Organization', name: 'CotizaExpress', url: 'https://cotizaexpress.com' },
    areaServed: { '@type': 'Country', name: 'México' },
    offers: { '@type': 'Offer', price: '1000', priceCurrency: 'MXN' },
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{g.metaTitle}</title>
        <meta name="description" content={g.metaDesc} />
        <link rel="canonical" href={`https://cotizaexpress.com/${g.slug}`} />
        <meta property="og:title" content={g.metaTitle} />
        <meta property="og:description" content={g.metaDesc} />
        <meta property="og:url" content={`https://cotizaexpress.com/${g.slug}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
      </Helmet>

      {/* Nav */}
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
              <Link to="/precios" className="text-slate-600 hover:text-emerald-600 font-medium hidden sm:block">Precios</Link>
              <Link to="/demo" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Demo</Link>
              <Link to="/blog" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Blog</Link>
              <Link to="/login"><Button variant="ghost" className="text-slate-600">Iniciar Sesión</Button></Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              {g.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {g.h1a}<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{g.h1b}</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">{g.subtitle}</p>

            {/* Ejemplo de mensaje */}
            <div className="max-w-md mx-auto mb-8 text-left">
              <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-sm text-slate-800">
                "{g.ejemploCliente}"
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm text-slate-800 mt-2">
                ✅ Cotización lista — total con IVA + PDF con folio. <span className="text-emerald-600 font-semibold">En 3 segundos.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe57] text-lg px-8 py-6 w-full sm:w-auto">Probar Demo Gratis</Button>
              </a>
              <Link to="/registro">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">Crear Cuenta</Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 justify-center">
              <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">IVA al 16% incluido</span></div>
              <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">PDF con folio</span></div>
              <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">Desde $1,000/mes</span></div>
            </div>
          </div>
        </section>

        {/* Pains */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-16">¿Te suena familiar?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {g.pains.map((pain, i) => (
                <Card key={i} className="border-2 border-red-100 bg-red-50/30">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-3">{pain.emoji}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{pain.title}</h3>
                    <p className="text-slate-600">{pain.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Cómo funciona CotizaBot</h2>
            <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">En 3 pasos tu negocio cotiza solo</p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                ['Sube tu catálogo', 'Carga tus productos desde Excel o agrégalos manualmente. Precios, unidades y SKU.'],
                ['Comparte tu WhatsApp', 'Dale a tus clientes tu número de siempre. CotizaBot responde automáticamente.'],
                ['Cobra y entrega', 'El bot genera la cotización con IVA y manda datos de pago. Tú solo preparas el pedido.'],
              ].map(([title, text], i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-16">Lo que CotizaBot hace por tu negocio</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                ['3 seg', 'Tiempo de respuesta promedio. Tu cliente recibe precio al instante.'],
                ['24/7', 'Cotiza noches, domingos y días festivos. Nunca pierdas una venta.'],
                ['0 errores', 'IVA al 16% calculado automáticamente. Sin errores humanos.'],
                ['1 día', 'Es lo que tarda ponerlo a funcionar con tu catálogo.'],
              ].map(([num, text], i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{num}</div>
                  <p className="text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-16">Preguntas frecuentes</h2>
            <div className="space-y-6">
              {g.faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Deja de perder ventas por no contestar a tiempo
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              Prueba CotizaBot gratis hoy — manda "DEMO" a nuestro WhatsApp y cotiza como lo haría tu cliente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 w-full sm:w-auto">Probar Demo en WhatsApp</Button>
              </a>
              <Link to="/registro">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 w-full sm:w-auto">Crear mi cuenta</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Otros giros — internal linking */}
        <section className="py-12 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 text-center">CotizaBot para otros giros</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/ferreterias" className="text-sm text-slate-500 hover:text-emerald-600">Ferreterías</Link>
              <Link to="/refaccionarias" className="text-sm text-slate-500 hover:text-emerald-600">Refaccionarias</Link>
              <Link to="/servicios-tecnicos" className="text-sm text-slate-500 hover:text-emerald-600">Servicios Técnicos</Link>
              {Object.values(GIROS_SEO).filter(x => x.slug !== g.slug).map(x => (
                <Link key={x.slug} to={`/${x.slug}`} className="text-sm text-slate-500 hover:text-emerald-600">{x.nombre}</Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
