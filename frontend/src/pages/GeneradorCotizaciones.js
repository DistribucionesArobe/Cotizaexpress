import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const fmt = (n) => (isNaN(n) ? '$0.00' : n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
const hoy = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
const genFolio = () => 'COT-' + Math.random().toString(36).slice(2, 8).toUpperCase();

const FAQS = [
  { q: '¿Este generador de cotizaciones es gratis?', a: 'Sí, totalmente gratis y sin registro. Llenas los datos, agregas tus productos y descargas o imprimes tu cotización en PDF al momento.' },
  { q: '¿Qué debe llevar una cotización?', a: 'Los datos de tu negocio, los del cliente, la fecha, el detalle de productos con cantidades y precios, el subtotal, el IVA desglosado, el total y una vigencia. Este generador incluye todo eso automáticamente.' },
  { q: '¿Cómo descargo la cotización en PDF?', a: 'Haz clic en "Descargar PDF". Se abre la vista de impresión de tu navegador: elige "Guardar como PDF" como destino y listo.' },
  { q: '¿Puedo automatizar mis cotizaciones por WhatsApp?', a: 'Sí. Si haces cotizaciones todos los días, CotizaBot las genera automáticamente en tu WhatsApp: el cliente manda su lista y recibe la cotización con IVA y PDF en 3 segundos, las 24 horas.' },
];

const emptyItem = { desc: '', qty: 1, precio: '' };

export default function GeneradorCotizaciones() {
  const [showUpsell, setShowUpsell] = useState(false);
  const [negocio, setNegocio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cliente, setCliente] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [conIva, setConIva] = useState(true);
  const [folio] = useState(genFolio);

  const setItem = (i, field, value) => {
    const next = items.slice();
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };
  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : items);

  const lineas = items
    .map(it => ({ ...it, qtyN: parseFloat(it.qty) || 0, precioN: parseFloat(it.precio) || 0 }))
    .map(it => ({ ...it, importe: it.qtyN * it.precioN }));
  const subtotal = lineas.reduce((s, it) => s + it.importe, 0);
  const iva = conIva ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Generador de Cotizaciones Gratis',
    url: 'https://cotizaexpress.com/generador-de-cotizaciones',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Generador de Cotizaciones Gratis con IVA — Online y sin registro | CotizaExpress</title>
        <meta name="description" content="Crea cotizaciones profesionales gratis: agrega tus productos, calcula IVA al 16% automáticamente y descarga el PDF. Sin registro, desde tu celular o computadora." />
        <link rel="canonical" href="https://cotizaexpress.com/generador-de-cotizaciones" />
        <meta property="og:title" content="Generador de Cotizaciones Gratis con IVA" />
        <meta property="og:description" content="Crea una cotización profesional con IVA y descárgala en PDF. Gratis y sin registro." />
        <meta property="og:url" content="https://cotizaexpress.com/generador-de-cotizaciones" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(appJsonLd)}</script>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #cotizacion-preview, #cotizacion-preview * { visibility: visible; }
            #cotizacion-preview { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          }
        `}</style>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 flex-shrink-0">🤖</div>
              <div className="hidden sm:block">
                <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CotizaBot</span>
                <span className="text-xs text-slate-500 block -mt-1">by CotizaExpress.com</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/calculadora-iva" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Calculadora de IVA</Link>
              <Link to="/blog" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Blog</Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero para tráfico de anuncios */}
      <section className="print:hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            ⚡ 100% gratis · sin registro · sin tarjeta
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Haz una cotización profesional<br className="hidden sm:block"/> en <span className="text-yellow-300">2 minutos</span>
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto mb-6">
            Con IVA calculado solo, lista para imprimir o mandar por WhatsApp. Deja de batallar con Excel.
          </p>
          <a href="#herramienta">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg font-bold px-8 py-6 shadow-xl">
              Empezar mi cotización ↓
            </Button>
          </a>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-emerald-100">
            <span>✅ IVA al 16% automático</span>
            <span>✅ Se ve profesional</span>
            <span>✅ Imprime o guarda en PDF</span>
          </div>
        </div>
      </section>

      {showUpsell && (
        <div className="print:hidden fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setShowUpsell(false)}>
          <div className="bg-white rounded-3xl p-7 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-2xl font-extrabold text-slate-900 mb-2">¡Tu cotización está lista!</p>
            <p className="text-slate-600 mb-5">
              Esto lo capturaste a mano. Con tu cuenta <strong>gratis</strong>, solo pegas la lista de tu cliente
              y <strong>la IA la cotiza por ti</strong> — con folio, tu logo y PDF de verdad, lista para WhatsApp.
            </p>
            <a href="/registro?utm_source=generador">
              <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-bold py-6 mb-3">
                Crear mi cuenta gratis → (30 segundos)
              </Button>
            </a>
            <button
              onClick={() => { setShowUpsell(false); setTimeout(() => window.print(), 200); }}
              className="text-sm text-slate-400 underline hover:text-slate-600"
            >
              Solo quiero descargar mi PDF
            </button>
          </div>
        </div>
      )}

      <main id="herramienta" className="max-w-5xl mx-auto px-4 py-12">
        <div className="print:hidden text-center mb-8">
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Paso 1 · Llena tus datos — la vista previa se arma sola 👉</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="print:hidden">
            <Card className="shadow-xl border-2 border-emerald-100 rounded-2xl">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Tu negocio</label>
                    <Input value={negocio} onChange={e => setNegocio(e.target.value)} placeholder="Ferretería El Martillo" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Teléfono</label>
                    <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="834 123 4567" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Cliente</label>
                  <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente o empresa" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Productos / servicios</label>
                  <div className="space-y-2">
                    {items.map((it, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input className="flex-1" value={it.desc} onChange={e => setItem(i, 'desc', e.target.value)} placeholder="Descripción" />
                        <Input className="w-16" type="number" min="0" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} placeholder="Cant" />
                        <Input className="w-24" type="number" min="0" value={it.precio} onChange={e => setItem(i, 'precio', e.target.value)} placeholder="Precio" />
                        <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500 px-1 text-lg">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addItem} className="mt-2 text-sm text-emerald-600 font-medium hover:text-emerald-700">+ Agregar renglón</button>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={conIva} onChange={e => setConIva(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  Agregar IVA (16%)
                </label>

                <Button onClick={() => setShowUpsell(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6">
                  📄 Descargar mi cotización
                </Button>
              </CardContent>
            </Card>

            <div className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center">
              <p className="text-white font-bold mb-1">¿Cotizas varias veces al día?</p>
              <p className="text-emerald-100 text-sm mb-4">CotizaBot lo hace solo en tu WhatsApp: tu cliente manda su lista y recibe esta misma cotización en 3 segundos, 24/7.</p>
              <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50">Ver cómo funciona</Button>
              </a>
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 print:hidden">Vista previa</p>
            <div id="cotizacion-preview" className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 ring-4 ring-emerald-100/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{negocio || 'Nombre de tu negocio'}</h2>
                  {telefono && <p className="text-sm text-slate-500">Tel: {telefono}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">COTIZACIÓN</p>
                  <p className="text-xs text-slate-500">Folio: {folio}</p>
                  <p className="text-xs text-slate-500">{hoy()}</p>
                </div>
              </div>
              {cliente && <p className="text-sm text-slate-600 mb-4"><span className="font-semibold">Cliente:</span> {cliente}</p>}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-left text-xs text-slate-500 uppercase">
                    <th className="py-2">Descripción</th>
                    <th className="py-2 text-center w-14">Cant.</th>
                    <th className="py-2 text-right w-24">P. Unit.</th>
                    <th className="py-2 text-right w-24">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.filter(it => it.desc || it.importe > 0).map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{it.desc || '—'}</td>
                      <td className="py-2 text-center text-slate-700">{it.qtyN}</td>
                      <td className="py-2 text-right text-slate-700">{fmt(it.precioN)}</td>
                      <td className="py-2 text-right font-medium text-slate-900">{fmt(it.importe)}</td>
                    </tr>
                  ))}
                  {lineas.filter(it => it.desc || it.importe > 0).length === 0 && (
                    <tr><td colSpan="4" className="py-6 text-center text-slate-400">Agrega productos para verlos aquí</td></tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
                  {conIva && <div className="flex justify-between text-slate-600"><span>IVA (16%):</span><span>{fmt(iva)}</span></div>}
                  <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2"><span>Total:</span><span>{fmt(total)}</span></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-8 text-center">Cotización generada gratis en cotizaexpress.com · Vigencia sugerida: 15 días</p>
            </div>
          </div>
        </div>

        {/* Contenido SEO */}
        <details className="mt-16 print:hidden text-slate-400">
          <summary className="text-xs cursor-pointer hover:text-slate-500">Más información sobre cotizaciones ▾</summary>
        <section className="mt-6 text-slate-500">
          <h2 className="text-2xl font-bold text-slate-700 mb-3">Cómo hacer una cotización profesional</h2>
          <p className="text-slate-600 mb-3 max-w-3xl">Una buena cotización incluye los datos de tu negocio, los del cliente, el detalle de productos con precios, el subtotal, el IVA desglosado al 16% y el total. Este generador arma todo automáticamente: tú solo capturas los productos y descargas el PDF listo para enviar por WhatsApp o correo.</p>
          <p className="text-slate-600 mb-8 max-w-3xl">¿Necesitas desglosar o agregar IVA a un monto suelto? Usa nuestra <Link to="/calculadora-iva" className="text-emerald-600 font-medium">calculadora de IVA gratis</Link>. Y si tu negocio cotiza todos los días, <Link to="/" className="text-emerald-600 font-medium">CotizaBot</Link> lo automatiza por WhatsApp.</p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">Preguntas frecuentes</h2>
          <div className="space-y-4 max-w-3xl">
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
        </details>
      </main>
    </div>
  );
}
