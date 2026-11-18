import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { evento } from '@/lib/evento';

const WA_VENTAS = '528130850381';
const EJEMPLO = `buenas tardes inge, le encargo esta coti para la obra:
30 codos galv 1/2 x 90
20 niples galv 3/4 x 7
6 valvulas check columpio 1 1/2
4 bridas slip on 150 de 4
100 mts tubo pvc ced 40 de 2
urge pa mañana antes de las 12`;

const PASOS = [
  ['📲', 'Tu cliente escribe como siempre', 'Manda su pedido por WhatsApp o correo, con abreviaturas, faltas de ortografía o una foto de su lista. Le escribe a su vendedor de siempre.'],
  ['⚡', 'Tu vendedor lo pega o lo reenvía', 'CotizaBot lo lee, lo busca en tu catálogo con tus precios y arma la cotización con IVA, folio y PDF en segundos.'],
  ['✅', 'El vendedor revisa y la manda', 'Corrige lo que haga falta y la envía con su nombre. Tu cliente nunca habla con un robot.'],
];

const BENEFICIOS = [
  ['Cotizaciones en segundos, no en horas', 'Responde antes que la competencia, aunque el pedido traiga 40 renglones.'],
  ['Entiende cómo escriben tus clientes', '"codos galv 1/2 x 90", "valbulas check", "tonillo pitufo": se aprende la jerga de tu giro y la de tu catálogo.'],
  ['Tus precios, tu catálogo', 'Carga tu lista en Excel, aunque tenga miles de productos. Sin conectar tu sistema para empezar.'],
  ['Todos tus vendedores igual de rápidos', 'El nuevo cotiza como el de 15 años. Menos errores de precio y de captura.'],
];

const PARA_QUIEN = ['Acero y perfiles', 'Tubería y conexiones', 'Material eléctrico', 'Tablaroca y plafones', 'Ferretería industrial', 'Materiales de construcción', 'Plomería e hidráulico', 'Protección contra incendio'];

const FAQS = [
  ['¿Mis clientes van a hablar con un bot?', 'No. CotizaBot trabaja para tu vendedor. El cliente le escribe a su vendedor como siempre y recibe la cotización de él.'],
  ['¿Tengo que conectar mi sistema (CONTPAQi, Aspel, SAP)?', 'No para empezar. Basta con tu lista de precios en Excel. Si después quieres conectarlo, lo vemos contigo.'],
  ['¿Qué pasa si no reconoce un producto?', 'Lo deja marcado para que el vendedor lo elija. Con el uso aprende cómo le dicen tus clientes a cada producto.'],
  ['¿Cuánto cuesta?', 'Depende de cuántos vendedores lo usen. Te damos el precio en la demo, con la instalación de tu catálogo incluida.'],
];

export default function Distribuidoras() {
  const [pedido, setPedido] = useState('');
  const [empresa, setEmpresa] = useState('');

  const mandarPedido = () => {
    const texto = `Hola Alejandro, soy de ${empresa || '(mi empresa)'}. Quiero ver cómo CotizaBot cotiza este pedido real:\n\n${(pedido || EJEMPLO).slice(0, 1500)}`;
    evento('distribuidora_demo');
    if (window.fbq) { try { window.fbq('track', 'Lead'); } catch (e) {} }
    if (window.gtag) {
      try {
        window.gtag('event', 'conversion', { send_to: 'AW-18501694620/NDzpCJ-lgbsdEJzppfZE' });
        window.gtag('event', 'generate_lead', { method: 'whatsapp_demo' });
      } catch (e) {}
    }
    window.open(`https://wa.me/${WA_VENTAS}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>CotizaBot para distribuidoras — Tus vendedores cotizan en segundos</title>
        <meta name="description" content="Para distribuidoras de acero, tubería, eléctrico y ferretería industrial: tus vendedores pegan el pedido de WhatsApp y sale la cotización con tus precios, IVA y PDF en segundos. Tu cliente no habla con un robot." />
        <link rel="canonical" href="https://cotizaexpress.com/distribuidoras" />
      </Helmet>

      <nav className="border-b border-slate-200 bg-white/95 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-lg text-slate-900">CotizaBot <span className="text-xs font-normal text-slate-500">para distribuidoras</span></Link>
          <a href="#demo"><Button className="bg-emerald-600 hover:bg-emerald-700">Pide tu demo</Button></a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-bold text-emerald-300 mb-3">PARA DISTRIBUIDORAS CON VENDEDORES</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
              Tus vendedores cotizan en <span className="text-emerald-300">segundos</span>, no en horas.
            </h1>
            <p className="text-lg text-slate-200 mb-7 max-w-xl">
              Tu cliente manda su pedido por WhatsApp como siempre. Tu vendedor lo pega y sale la cotización con <strong>tus precios, IVA y PDF</strong>. La revisa y la manda con su nombre. <strong>Nadie habla con un robot.</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#demo"><Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-lg px-7 py-6 font-bold">Mándanos un pedido real →</Button></a>
              <Link to="/registro?plan=cotizador&utm_source=distribuidoras"><Button size="lg" variant="outline" className="text-lg px-7 py-6 bg-transparent text-white border-white/40 hover:bg-white/10">Pruébalo con tu catálogo</Button></Link>
            </div>
            <p className="text-sm text-slate-400 mt-3">Te regresamos la cotización armada con tus precios. Sin compromiso.</p>
          </div>
          <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-2xl max-w-md mx-auto w-full">
            <p className="text-xs font-bold text-slate-500 mb-2">📲 Pedido que llegó por WhatsApp</p>
            <pre className="whitespace-pre-wrap text-xs bg-[#DCF8C6] rounded-xl p-3 mb-3 font-sans">{EJEMPLO}</pre>
            <p className="text-center text-emerald-600 text-xl mb-2">⬇ 8 segundos</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-100 px-3 py-1.5 font-semibold text-slate-600"><span className="col-span-2">Producto</span><span className="text-center">Cant.</span><span className="text-right">Importe</span></div>
              {[['Codo galvanizado 1/2" x 90°', '30', '$1,185'], ['Niple galvanizado 3/4" x 7"', '20', '$1,240'], ['Válvula check columpio 1 1/2"', '6', '$5,370'], ['Brida slip-on 150 lb 4"', '4', '$2,960'], ['Tubo PVC ced. 40 de 2"', '100 m', '$9,800']].map(([p, c, i]) => (
                <div key={p} className="grid grid-cols-4 px-3 py-1.5 border-t"><span className="col-span-2">{p}</span><span className="text-center">{c}</span><span className="text-right">{i}</span></div>
              ))}
              <div className="flex justify-between px-3 py-2 border-t bg-emerald-600 text-white font-bold"><span>TOTAL (IVA inc.)</span><span>$23,843.80</span></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">Ejemplo ilustrativo · el vendedor revisa antes de enviar</p>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-10">Cómo funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PASOS.map(([ic, t, d], i) => (
            <div key={t} className="rounded-2xl border border-slate-200 p-6">
              <p className="text-3xl mb-2">{ic}</p>
              <p className="text-xs font-bold text-emerald-700 mb-1">PASO {i + 1}</p>
              <p className="font-bold text-slate-900 mb-2">{t}</p>
              <p className="text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-6">
          {BENEFICIOS.map(([t, d]) => (
            <div key={t} className="bg-white rounded-2xl p-6 border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">✅ {t}</p>
              <p className="text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-5">Hecho para distribuidoras de</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {PARA_QUIEN.map(p => <span key={p} className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-4 py-1.5 text-sm font-medium">{p}</span>)}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 className="text-3xl font-extrabold mb-2 text-center">Mándanos un pedido real</h2>
          <p className="text-emerald-100 text-center mb-6">Pega un pedido tal como te llegó (o usa el ejemplo). Te lo regresamos cotizado con tus precios por WhatsApp.</p>
          <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-3">
            <input value={empresa} onChange={e => setEmpresa(e.target.value.slice(0, 80))} placeholder="Nombre de tu empresa" className="w-full border border-slate-300 rounded-xl px-4 py-3" />
            <textarea value={pedido} onChange={e => setPedido(e.target.value)} rows={7} placeholder={EJEMPLO} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm" />
            <Button onClick={mandarPedido} size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-lg py-6 font-bold">📲 Mandar por WhatsApp para que me lo coticen</Button>
            <p className="text-xs text-slate-500 text-center">Se abre WhatsApp con tu pedido listo para enviar a Alejandro, de CotizaBot (81 3085 0381).</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="border border-slate-200 rounded-xl p-4">
              <summary className="font-semibold text-slate-900 cursor-pointer">{q}</summary>
              <p className="text-sm text-slate-600 mt-2">{a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="#demo"><Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6 text-lg font-bold">Quiero ver mi pedido cotizado →</Button></a>
          <p className="text-sm text-slate-500 mt-4">¿Eres contratista u oficio? <Link to="/generador-de-cotizaciones" className="underline">Haz tu cotización aquí</Link>.</p>
        </div>
      </section>
    </div>
  );
}
