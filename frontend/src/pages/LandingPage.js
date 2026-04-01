import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen" data-testid="landing-page">
      <Helmet>
        <title>CotizaBot - Cotizaciones Automaticas por WhatsApp para Ferreterias | CotizaExpress</title>
        <meta name="description" content="Responde cotizaciones en 3 segundos por WhatsApp con IA. CotizaBot genera cotizaciones con IVA 24/7 para ferreterias, materiales de construccion y distribuidoras en Mexico. Desde $1,000 MXN/mes." />
        <link rel="canonical" href="https://cotizaexpress.com/" />
        <meta property="og:title" content="CotizaBot - Tu ferreteria cotiza sola por WhatsApp" />
        <meta property="og:description" content="Tus clientes preguntan precio por WhatsApp y reciben cotizacion con IVA en 3 segundos. Sin empleado. Sin errores. 24/7." />
        <meta property="og:url" content="https://cotizaexpress.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://cotizaexpress.com/og-cotizabot.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:site_name" content="CotizaExpress" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CotizaBot - Cotizaciones automaticas por WhatsApp" />
        <meta name="twitter:description" content="Tu ferreteria cotiza sola. Respuestas en 3 segundos con IA." />
        <meta name="twitter:image" content="https://cotizaexpress.com/og-cotizabot.png" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "CotizaBot",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web, WhatsApp",
            "description": "Sistema de IA que automatiza cotizaciones por WhatsApp para ferreterias y distribuidoras en Mexico",
            "url": "https://cotizaexpress.com",
            "offers": [
              {
                "@type": "Offer",
                "name": "Plan Completo",
                "price": "1000",
                "priceCurrency": "MXN",
                "priceValidUntil": "2027-12-31",
                "availability": "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                "name": "Plan Pro",
                "price": "2000",
                "priceCurrency": "MXN",
                "priceValidUntil": "2027-12-31",
                "availability": "https://schema.org/InStock"
              }
            ],
            "provider": {
              "@type": "Organization",
              "name": "CotizaExpress",
              "url": "https://cotizaexpress.com",
              "logo": "https://cotizaexpress.com/logo-cotizabot.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "sales",
                "availableLanguage": "Spanish"
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "12"
            }
          }
        `}</script>
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Como funciona CotizaBot para ferreterias?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Subes tu catalogo de productos, compartes tu link de WhatsApp con tus clientes, y CotizaBot responde automaticamente con precios y cotizaciones con IVA en 3 segundos."
                }
              },
              {
                "@type": "Question",
                "name": "Necesito verificar mi numero con Meta o WhatsApp?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. CotizaBot usa un numero centralizado ya verificado. Solo compartes tu codigo unico con tus clientes."
                }
              },
              {
                "@type": "Question",
                "name": "Puedo cobrar a mis clientes por WhatsApp?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Si, con el Plan Pro puedes enviar links de pago de Mercado Pago o datos de transferencia SPEI automaticamente."
                }
              },
              {
                "@type": "Question",
                "name": "Cuanto cuesta CotizaBot?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "El Plan Completo cuesta $1,000 MXN/mes + IVA con cotizaciones ilimitadas y WhatsApp integrado. El Plan Pro cuesta $2,000 MXN/mes + IVA e incluye cobros automaticos."
                }
              }
            ]
          }
        `}</script>
      </Helmet>

      {/* Navigation */}
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
              <Link to="/ferreterias" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Ferreterías</Link>
              <Link to="/demo" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Demo</Link>
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600">Iniciar Sesión</Button>
              </Link>
              <Link to="/registro">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Usado por ferreterías y distribuidoras en México
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Tu cliente pregunta precio.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Cotiza en 3 segundos.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 mb-4 max-w-3xl mx-auto">
              CotizaBot es el asistente de IA que responde por WhatsApp con precios, IVA y cotización profesional. <strong>Sin empleado. Sin errores. 24/7.</strong>
            </p>
            <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto">
              Mientras tú duermes, tu negocio sigue cotizando. Ideal para ferreterías, materiales de construcción y distribuidoras.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://wa.me/5218344291628?text=DEMO" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 shadow-xl">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Ver Demo en WhatsApp
                </Button>
              </a>
              <Link to="/precios">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">Ver Planes desde $1,000/mes</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500">
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><span className="text-sm">IVA automático</span></div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><span className="text-sm">Precios en MXN</span></div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><span className="text-sm">Soporte en español</span></div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><span className="text-sm">Factura CFDI</span></div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-1">3s</div>
              <p className="text-emerald-100 text-sm">Tiempo promedio de respuesta</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-1">24/7</div>
              <p className="text-emerald-100 text-sm">Disponibilidad sin pausas</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-1">500+</div>
              <p className="text-emerald-100 text-sm">Productos por catálogo</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold mb-1">16%</div>
              <p className="text-emerald-100 text-sm">IVA calculado automático</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-slate-50" id="beneficios">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Beneficios de CotizaBot</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">Automatiza tu proceso de ventas y cotizaciones por WhatsApp</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg"><CardContent className="pt-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Respuestas en 3 segundos</h3>
              <p className="text-slate-600">Tu cliente pregunta precio, el bot responde al instante. No pierdas ventas por tardarte.</p>
            </CardContent></Card>

            <Card className="border-0 shadow-lg"><CardContent className="pt-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Disponible 24/7</h3>
              <p className="text-slate-600">Atiende clientes a las 3am, domingos o festivos. Sin descanso, sin errores.</p>
            </CardContent></Card>

            <Card className="border-0 shadow-lg"><CardContent className="pt-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">IVA y totales exactos</h3>
              <p className="text-slate-600">Cotizaciones profesionales con cálculos correctos. Sin errores de dedo.</p>
            </CardContent></Card>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 bg-white" id="como-funciona">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">¿Cómo funciona CotizaBot?</h2>
          <p className="text-center text-slate-600 mb-12">En 3 simples pasos automatizas tu negocio</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Sube tu catálogo</h3>
              <p className="text-slate-600">Carga tus productos desde Excel o agrégalos manualmente. Precios, stock y SKU.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Comparte tu link</h3>
              <p className="text-slate-600">Recibe un código único y link de WhatsApp para compartir con tus clientes.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">El bot cotiza por ti</h3>
              <p className="text-slate-600">Cuando un cliente escribe, CotizaBot responde con precios y genera la cotización.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="py-20 bg-slate-50" id="casos-de-uso">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">¿Para qué negocios es CotizaBot?</h2>
          <p className="text-center text-slate-600 mb-12">Diseñado para PYMEs mexicanas que venden materiales y productos</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/ferreterias" className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Ferreterías</h3>
              <p className="text-sm text-slate-600">Cotiza herramientas, tornillería, pinturas</p>
            </Link>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Materiales de Construcción</h3>
              <p className="text-sm text-slate-600">Cemento, varilla, block, tablaroca</p>
            </div>

            <Link to="/refaccionarias" className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Refaccionarias</h3>
              <p className="text-sm text-slate-600">Autopartes, refacciones, aceites</p>
            </Link>

            <Link to="/servicios-tecnicos" className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Servicios Técnicos</h3>
              <p className="text-sm text-slate-600">Plomería, electricidad, instalaciones</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Precios resumen */}
      <section className="py-20 bg-white" id="planes">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Planes y Precios</h2>
          <p className="text-center text-slate-600 mb-12">Elige el plan que mejor se adapte a tu negocio</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-slate-200">
              <CardContent className="pt-8 pb-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Plan Completo</h3>
                <div className="text-5xl font-bold text-slate-700 mb-2">$1,000</div>
                <p className="text-slate-500 mb-6">MXN/mes + IVA</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Cotizaciones ilimitadas</li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>WhatsApp Business integrado</li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Dashboard completo</li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Soporte prioritario</li>
                </ul>
                <Link to="/registro"><Button variant="outline" className="w-full" size="lg">Comenzar</Button></Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-sm font-medium">Recomendado</div>
              <CardContent className="pt-8 pb-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
                <div className="text-5xl font-bold text-emerald-600 mb-2">$2,000</div>
                <p className="text-slate-500 mb-6">MXN/mes + IVA</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Todo del Plan Completo</li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><strong>Cobra por WhatsApp</strong></li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Mercado Pago y SPEI</li>
                  <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Notificaciones de pago</li>
                </ul>
                <Link to="/registro"><Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">Empezar con Pro</Button></Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-slate-500 mt-6"><Link to="/precios" className="text-emerald-600 hover:underline">Ver todos los planes y comparativa completa →</Link></p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50" id="faq">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Preguntas Frecuentes</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-slate-900 mb-2">¿Necesito verificar mi número con Meta/WhatsApp?</h3>
              <p className="text-slate-600">No. CotizaBot usa un número centralizado ya verificado. Solo compartes tu código único con tus clientes.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-slate-900 mb-2">¿Cómo subo mis productos?</h3>
              <p className="text-slate-600">Puedes cargar un archivo Excel con tus productos o agregarlos manualmente desde el dashboard.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-slate-900 mb-2">¿El bot calcula el IVA correctamente?</h3>
              <p className="text-slate-600">Sí. CotizaBot calcula automáticamente el 16% de IVA en todas las cotizaciones.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-slate-900 mb-2">¿Puedo cobrar a mis clientes por WhatsApp?</h3>
              <p className="text-slate-600">Sí, con el Plan Pro puedes enviar links de pago de Mercado Pago o datos de transferencia SPEI automáticamente.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-slate-900 mb-2">¿Puedo ver un demo antes de contratar?</h3>
              <p className="text-slate-600">Sí. Envía "DEMO" a nuestro WhatsApp y prueba cómo funciona CotizaBot con un catálogo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">¿Listo para automatizar tu negocio?</h2>
          <p className="text-xl text-emerald-50 mb-10">Envía "DEMO" por WhatsApp y ve CotizaBot en acción</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/5218344291628?text=DEMO" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-emerald-600 hover:bg-slate-50">Probar Demo en WhatsApp</Button>
            </a>
            <Link to="/registro">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">Crear Cuenta</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-14 w-auto brightness-0 invert"/>
                <div>
                  <span className="text-lg font-bold text-white">CotizaBot</span>
                  <span className="text-xs text-slate-400 block">by CotizaExpress.com</span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm max-w-md">Sistema de IA para automatizar cotizaciones y ventas por WhatsApp. Diseñado para PYMEs mexicanas.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/precios" className="text-slate-400 hover:text-white">Precios</Link></li>
                <li><Link to="/demo" className="text-slate-400 hover:text-white">Demo</Link></li>
                <li><Link to="/ferreterias" className="text-slate-400 hover:text-white">Para Ferreterías</Link></li>
                <li><Link to="/refaccionarias" className="text-slate-400 hover:text-white">Para Refaccionarias</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacidad" className="text-slate-400 hover:text-white">Aviso de Privacidad</Link></li>
                <li><Link to="/terminos" className="text-slate-400 hover:text-white">Términos y Condiciones</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 text-sm">© 2026 CotizaExpress.com - CotizaBot. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
