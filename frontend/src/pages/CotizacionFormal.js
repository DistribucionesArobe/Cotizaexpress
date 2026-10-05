import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FAQS = [
  { q: '¿Qué debe llevar una cotización formal?', a: 'Ocho datos: (1) datos del negocio que cotiza (nombre, teléfono, RFC si facturas), (2) datos del cliente, (3) folio único, (4) fecha, (5) lista de productos o servicios con cantidad, unidad y precio unitario, (6) subtotal, IVA al 16% desglosado y total, (7) vigencia de la cotización, y (8) condiciones (anticipo, tiempo de entrega, forma de pago).' },
  { q: '¿Cómo se calcula el IVA en una cotización?', a: 'Suma todos los renglones para obtener el subtotal y multiplícalo por 0.16: ese es el IVA. El total es subtotal + IVA. Si tus precios ya incluyen IVA, divide el total entre 1.16 para obtener el subtotal y la diferencia es el IVA desglosado.' },
  { q: '¿Una cotización formal es lo mismo que una factura?', a: 'No. La cotización es una propuesta de precio sin valor fiscal; la factura (CFDI) se emite cuando la venta se concreta. Pero una cotización bien hecha, con folio y desglose, facilita emitir la factura después.' },
  { q: '¿Cuánto tiempo de vigencia debe tener?', a: 'Lo común en México es de 3 a 15 días por la variación de precios de materiales. Ponerlo por escrito ("vigencia 72 horas / precios sujetos a cambio") te protege y mete urgencia sana al cliente.' },
];

export default function CotizacionFormal() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Cotización Formal: Ejemplo Real + Qué Debe Llevar (y Generador Gratis)</title>
        <meta name="description" content="Ejemplo de cotización formal con IVA lista para copiar, los 8 datos que debe llevar, y un generador gratuito para hacer la tuya en 2 minutos con folio y PDF." />
        <link rel="canonical" href="https://cotizaexpress.com/cotizacion-formal" />
        <meta property="og:title" content="Cotización Formal: ejemplo + generador gratis" />
        <meta property="og:description" content="Los 8 datos que debe llevar una cotización formal, ejemplo real con IVA y generador gratuito con PDF." />
        <meta property="og:url" content="https://cotizaexpress.com/cotizacion-formal" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* Nav mínima */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-12 w-auto" />
            <span className="font-bold text-slate-900">CotizaBot</span>
          </Link>
          <Link to="/generador-de-cotizaciones">
            <Button className="bg-emerald-600 hover:bg-emerald-700">Generador gratis</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Cotización formal: ejemplo real y qué debe llevar</h1>
        <p className="text-lg text-slate-600 mb-8">
          Una cotización formal convierte un "¿cuánto me cobras?" en una venta seria: te hace ver profesional,
          evita malentendidos de precio y acelera el "sí". Aquí tienes el formato correcto, un ejemplo
          y un <Link to="/generador-de-cotizaciones" className="text-emerald-600 underline font-medium">generador gratuito</Link> para hacer la tuya en 2 minutos.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Los 8 datos que no pueden faltar</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-700 mb-10">
          <li><strong>Tus datos:</strong> nombre del negocio, teléfono/WhatsApp y RFC si facturas.</li>
          <li><strong>Datos del cliente:</strong> nombre o empresa a quien cotizas.</li>
          <li><strong>Folio único</strong> (ej. CX-00123) para darle seguimiento.</li>
          <li><strong>Fecha de emisión.</strong></li>
          <li><strong>Conceptos:</strong> cada producto/servicio con cantidad, unidad y precio unitario.</li>
          <li><strong>Subtotal, IVA al 16% desglosado y TOTAL.</strong></li>
          <li><strong>Vigencia</strong> (ej. 72 horas — los precios cambian).</li>
          <li><strong>Condiciones:</strong> anticipo, entrega y forma de pago.</li>
        </ol>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ejemplo de cotización formal</h2>
        <div className="border-2 border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm">
          <div className="bg-emerald-700 text-white px-5 py-3 flex justify-between items-center">
            <div>
              <p className="font-bold">Ferretería La Esperanza</p>
              <p className="text-xs text-emerald-100">Tel. 833 123 4567 · RFC FLE850101XXX</p>
            </div>
            <div className="text-right">
              <p className="text-xs">COTIZACIÓN</p>
              <p className="font-bold">CX-00457</p>
              <p className="text-xs text-emerald-100">05/10/2026 · Cliente: Constructora Díaz</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr><th className="text-left px-4 py-2">Concepto</th><th className="px-2 py-2">Cant.</th><th className="px-2 py-2">Unidad</th><th className="px-2 py-2 text-right">P. Unit.</th><th className="px-4 py-2 text-right">Importe</th></tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t"><td className="px-4 py-2">Cemento gris 50 kg</td><td className="text-center">10</td><td className="text-center">Bulto</td><td className="text-right">$245.00</td><td className="px-4 text-right">$2,450.00</td></tr>
              <tr className="border-t bg-slate-50"><td className="px-4 py-2">Varilla 3/8"</td><td className="text-center">20</td><td className="text-center">Pieza</td><td className="text-right">$168.00</td><td className="px-4 text-right">$3,360.00</td></tr>
              <tr className="border-t"><td className="px-4 py-2">Block 15x20x40</td><td className="text-center">200</td><td className="text-center">Pieza</td><td className="text-right">$18.50</td><td className="px-4 text-right">$3,700.00</td></tr>
            </tbody>
          </table>
          <div className="px-5 py-3 text-sm text-slate-700 border-t bg-white">
            <div className="flex justify-end gap-8"><span>Subtotal:</span><span className="w-28 text-right">$9,510.00</span></div>
            <div className="flex justify-end gap-8"><span>IVA 16%:</span><span className="w-28 text-right">$1,521.60</span></div>
            <div className="flex justify-end gap-8 font-bold text-slate-900"><span>TOTAL:</span><span className="w-28 text-right">$11,031.60</span></div>
          </div>
          <p className="px-5 pb-3 text-xs text-slate-500 bg-white">Vigencia: 72 horas · Precios sujetos a cambio · Anticipo 50% · Entrega en 2 días hábiles</p>
        </div>
        <p className="text-sm text-slate-500 mb-10">Así de simple: encabezado con folio, tabla de conceptos, IVA desglosado y condiciones.</p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-10 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Haz la tuya en 2 minutos — gratis</h2>
          <p className="text-slate-600 mb-4">Sin registro: captura tus conceptos y descarga tu cotización con folio lista para enviar.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/generador-de-cotizaciones"><Button className="bg-emerald-600 hover:bg-emerald-700">Abrir el generador gratis</Button></Link>
            <Link to="/plantillas/cotizacion"><Button variant="outline">Descargar plantilla Excel/Word</Button></Link>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Preguntas frecuentes</h2>
        <div className="space-y-4 mb-12">
          {FAQS.map((f, i) => (
            <details key={i} className="border border-slate-200 rounded-lg px-4 py-3">
              <summary className="font-medium text-slate-800 cursor-pointer">{f.q}</summary>
              <p className="text-slate-600 mt-2 text-sm">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="border-t pt-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">¿Y si las cotizaciones se hicieran solas?</h2>
          <p className="text-slate-600 mb-4 max-w-xl mx-auto">
            Si tu negocio cotiza por WhatsApp todos los días, CotizaBot responde por ti: el cliente manda su lista
            y recibe una cotización formal como la de arriba — con IVA, folio y PDF — en 5 segundos, 24/7.
          </p>
          <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe57]">Pruébalo en tu WhatsApp — gratis</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
